begin;

-- A sessão didática identifica o aluno sem publicar e-mail ou permitir que
-- qualquer pessoa escreva no ranking apenas conhecendo um UUID público.
create table public.student_ranking_sessions (
 token_hash text primary key,
 player_id uuid not null,
 expires_at timestamptz not null default now() + interval '90 days'
);
alter table public.student_ranking_sessions enable row level security;
revoke all on public.student_ranking_sessions from public, anon, authenticated;

alter function public.enter_student(text,text,boolean) rename to enter_student_without_ranking;
revoke all on function public.enter_student_without_ranking(text,text,boolean) from public, anon, authenticated;

create function public.enter_student(student_name text, student_email text, create_account boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 profile jsonb;
 session_token text := gen_random_uuid()::text || gen_random_uuid()::text;
begin
 profile := public.enter_student_without_ranking(student_name,student_email,create_account);
 delete from public.student_ranking_sessions where expires_at <= now();
 insert into public.student_ranking_sessions(token_hash,player_id)
 values(encode(sha256(convert_to(session_token,'UTF8')),'hex'),(profile->>'id')::uuid);
 return profile || jsonb_build_object('ranking_token',session_token);
end;
$$;
revoke all on function public.enter_student(text,text,boolean) from public;
grant execute on function public.enter_student(text,text,boolean) to anon, authenticated;

create table public.leaderboard (
 player_id uuid not null,
 bank_key text not null check (bank_key ~ '^[a-f0-9]{64}$'),
 scoring_version integer not null check (scoring_version = 3),
 name text not null check (char_length(trim(name)) between 2 and 120),
 score integer not null check (score between 0 and 1000000),
 commands integer not null check (commands between 0 and 10000000),
 clues integer not null check (clues between 0 and 10000),
 completed integer not null check (completed between 0 and 100),
 updated_at timestamptz not null default now(),
 primary key (bank_key,scoring_version,player_id)
);
alter table public.leaderboard enable row level security;
revoke all on public.leaderboard from public, anon, authenticated;
grant select on public.leaderboard to anon, authenticated;
create policy leaderboard_read on public.leaderboard for select to anon, authenticated using (true);
create index leaderboard_order on public.leaderboard(bank_key,scoring_version,score desc,commands,player_id);

-- A identidade e o nome são conferidos no servidor. O upsert atômico impede
-- que abas concorrentes ou tentativas antigas reduzam o recorde do jogador.
create function public.submit_leaderboard(
 p_player_id uuid, p_bank_key text, p_scoring_version integer,
 p_score integer, p_commands integer, p_clues integer, p_completed integer,
 p_student_token text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare player_name text;
begin
 if p_student_token is not null and exists(
  select 1 from public.student_ranking_sessions
  where player_id=p_player_id and expires_at>now()
   and token_hash=encode(sha256(convert_to(p_student_token,'UTF8')),'hex')
 ) then
  select name into player_name from public.classroom_students where id=p_player_id;
  if player_name is null then
   select name into player_name from public.profiles
   where id=p_player_id and role='student' and status='active';
  end if;
 elsif auth.uid()=p_player_id then
  select name into player_name from public.profiles where id=p_player_id and status='active';
 end if;
 if player_name is null then
  raise exception 'Sua sessão do ranking expirou. Saia e entre novamente.' using errcode='42501';
 end if;
 insert into public.leaderboard as existing
  (player_id,bank_key,scoring_version,name,score,commands,clues,completed)
 values(p_player_id,p_bank_key,p_scoring_version,player_name,p_score,p_commands,p_clues,p_completed)
 on conflict (bank_key,scoring_version,player_id) do update
 set name=excluded.name, score=excluded.score, commands=excluded.commands,
     clues=excluded.clues, completed=excluded.completed, updated_at=now()
 where excluded.score>existing.score
    or (excluded.score=existing.score and excluded.commands<existing.commands);
end;
$$;
revoke all on function public.submit_leaderboard(uuid,text,integer,integer,integer,integer,integer,text) from public;
grant execute on function public.submit_leaderboard(uuid,text,integer,integer,integer,integer,integer,text) to anon, authenticated;

do $$
begin
 if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
  create publication supabase_realtime;
 end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='leaderboard') then
  alter publication supabase_realtime add table public.leaderboard;
 end if;
end;
$$;
commit;
