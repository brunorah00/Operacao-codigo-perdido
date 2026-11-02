begin;

create table public.competition_state (
 id boolean primary key default true check (id),
 competition_id uuid not null default gen_random_uuid(),
 generation bigint not null default 1,
 reset_at timestamptz not null default now()
);
insert into public.competition_state(id) values(true);
alter table public.competition_state enable row level security;
revoke all on public.competition_state from public,anon,authenticated;
grant select on public.competition_state to anon,authenticated;
create policy competition_read on public.competition_state for select to anon,authenticated using(true);

create table public.competition_students (
 id uuid primary key default gen_random_uuid(),
 competition_id uuid not null,
 name text not null check (char_length(name) between 2 and 30 and name !~ '[[:cntrl:]]'),
 nickname_key text not null,
 created_at timestamptz not null default now(),
 unique(competition_id,nickname_key)
);
alter table public.competition_students enable row level security;
revoke all on public.competition_students from public,anon,authenticated;
alter table public.student_ranking_sessions add column competition_id uuid;
-- Sessões antigas por e-mail não identificam participantes da nova competição.
delete from public.student_ranking_sessions;
delete from public.leaderboard;
alter table public.student_ranking_sessions alter column competition_id set not null;
alter table public.leaderboard add column competition_id uuid not null
 default (gen_random_uuid());
alter table public.leaderboard alter column competition_id drop default;

revoke all on function public.enter_student(text,text,boolean) from public,anon,authenticated;
revoke all on function public.enter_student_without_ranking(text,text,boolean) from public,anon,authenticated;

create function public.enter_competition_student(nickname text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 current_competition uuid;
 clean_name text := regexp_replace(trim(nickname),'[[:space:]]+',' ','g');
 student public.competition_students;
 session_token text := gen_random_uuid()::text || gen_random_uuid()::text;
begin
 if clean_name is null or char_length(clean_name) not between 2 and 30 or nickname ~ '[[:cntrl:]]' then
  raise exception 'Escolha um apelido de 2 a 30 caracteres, sem quebras de linha.';
 end if;
 select competition_id into current_competition from public.competition_state where id for share;
 insert into public.competition_students as existing(competition_id,name,nickname_key)
 values(current_competition,clean_name,lower(clean_name))
 on conflict(competition_id,nickname_key) do update set name=existing.name
 returning * into student;
 delete from public.student_ranking_sessions where expires_at<=now();
 insert into public.student_ranking_sessions(token_hash,player_id,competition_id)
 values(encode(sha256(convert_to(session_token,'UTF8')),'hex'),student.id,current_competition);
 return jsonb_build_object('id',student.id,'name',student.name,'role','student','status','active',
  'competition_id',current_competition,'ranking_token',session_token);
end;
$$;
revoke all on function public.enter_competition_student(text) from public;
grant execute on function public.enter_competition_student(text) to anon,authenticated;

create function public.get_competition_student(p_player_id uuid,p_student_token text,p_competition_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare student public.competition_students;
begin
 perform 1 from public.competition_state where id and competition_id=p_competition_id for share;
 if not found then raise exception 'A competição foi reiniciada. Entre com seu apelido novamente.' using errcode='42501'; end if;
 select s.* into student from public.competition_students s
 join public.student_ranking_sessions t on t.player_id=s.id and t.competition_id=s.competition_id
 where s.id=p_player_id and s.competition_id=p_competition_id and t.expires_at>now()
 and t.token_hash=encode(sha256(convert_to(p_student_token,'UTF8')),'hex');
 if not found then raise exception 'Sua sessão expirou. Entre com seu apelido novamente.' using errcode='42501'; end if;
 return jsonb_build_object('id',student.id,'name',student.name,'role','student','status','active',
  'competition_id',student.competition_id,'ranking_token',p_student_token);
end;
$$;
revoke all on function public.get_competition_student(uuid,text,uuid) from public;
grant execute on function public.get_competition_student(uuid,text,uuid) to anon,authenticated;

-- O identificador da competição é obrigatório: abas antigas, inclusive de
-- professores, não podem repor os recordes apagados após um reset.
drop function public.submit_leaderboard(uuid,text,integer,integer,integer,integer,integer,text);
create function public.submit_leaderboard(
 p_player_id uuid,p_bank_key text,p_scoring_version integer,
 p_score integer,p_commands integer,p_clues integer,p_completed integer,
 p_competition_id uuid,p_student_token text default null
) returns void language plpgsql security definer set search_path='' as $$
declare player_name text;
begin
 perform 1 from public.competition_state where id and competition_id=p_competition_id for share;
 if not found then raise exception 'A competição foi reiniciada. Entre novamente.' using errcode='42501'; end if;
 if p_student_token is not null and exists(
  select 1 from public.student_ranking_sessions where player_id=p_player_id
  and competition_id=p_competition_id and expires_at>now()
  and token_hash=encode(sha256(convert_to(p_student_token,'UTF8')),'hex')
 ) then
  select name into player_name from public.competition_students
  where id=p_player_id and competition_id=p_competition_id;
 elsif auth.uid()=p_player_id then
  select name into player_name from public.profiles
  where id=p_player_id and role in ('teacher','admin') and status='active';
 end if;
 if player_name is null then raise exception 'Sua sessão expirou. Entre novamente.' using errcode='42501'; end if;
 insert into public.leaderboard as existing
 (player_id,bank_key,scoring_version,name,score,commands,clues,completed,competition_id)
 values(p_player_id,p_bank_key,p_scoring_version,player_name,p_score,p_commands,p_clues,p_completed,p_competition_id)
 on conflict(bank_key,scoring_version,player_id) do update
 set name=excluded.name,score=excluded.score,commands=excluded.commands,
 clues=excluded.clues,completed=excluded.completed,updated_at=now(),competition_id=excluded.competition_id
 where excluded.score>existing.score or (excluded.score=existing.score and excluded.commands<existing.commands);
end;
$$;
revoke all on function public.submit_leaderboard(uuid,text,integer,integer,integer,integer,integer,uuid,text) from public;
grant execute on function public.submit_leaderboard(uuid,text,integer,integer,integer,integer,integer,uuid,text) to anon,authenticated;

create function public.reset_competition(expected_competition_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_competition uuid; result jsonb;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin') and status='active') then
  raise exception 'Somente professores aprovados podem reiniciar a competição.' using errcode='42501';
 end if;
 select competition_id into current_competition from public.competition_state where id for update;
 if expected_competition_id is distinct from current_competition then
  raise exception 'A competição já foi reiniciada. Atualize a página antes de tentar novamente.';
 end if;
 delete from public.leaderboard;
 delete from public.student_ranking_sessions;
 delete from public.competition_students;
 update public.competition_state set competition_id=gen_random_uuid(),generation=generation+1,reset_at=now() where id;
 select to_jsonb(s) into result from public.competition_state s where id;
 return result;
end;
$$;
revoke all on function public.reset_competition(uuid) from public,anon;
grant execute on function public.reset_competition(uuid) to authenticated;

alter publication supabase_realtime add table public.competition_state;
commit;
