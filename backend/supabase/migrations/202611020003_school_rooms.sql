begin;

create table public.school_rooms (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 2 and 80),
 competition_id uuid not null unique default gen_random_uuid(),
 generation bigint not null default 1,
 created_at timestamptz not null default now()
);
alter table public.school_rooms enable row level security;
revoke all on public.school_rooms from public,anon,authenticated;
grant select on public.school_rooms to anon,authenticated;
create policy room_status_read on public.school_rooms for select to anon,authenticated using(true);
create table public.room_access (
 room_id uuid primary key references public.school_rooms(id) on delete cascade,
 join_code text not null unique
);
alter table public.room_access enable row level security;
revoke all on public.room_access from public,anon,authenticated;

-- Os participantes da competição global anterior não pertencem a uma sala.
delete from public.leaderboard;
delete from public.student_ranking_sessions;
delete from public.competition_students;
alter table public.competition_students drop constraint competition_students_name_check;
alter table public.competition_students add constraint competition_students_name_check check(char_length(name) between 2 and 120 and name !~ '[[:cntrl:]]');
alter table public.competition_students add column room_id uuid not null references public.school_rooms(id) on delete cascade;
alter table public.student_ranking_sessions add column room_id uuid not null references public.school_rooms(id) on delete cascade;
alter table public.leaderboard add column room_id uuid not null references public.school_rooms(id) on delete cascade;
alter table public.leaderboard add column room_name text not null;
alter table public.leaderboard drop constraint leaderboard_pkey;
alter table public.leaderboard add primary key(room_id,bank_key,scoring_version,player_id);
create index leaderboard_room on public.leaderboard(room_id,bank_key,scoring_version);

create function public.can_manage_room(p_room_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.school_rooms r join public.profiles p on p.id=auth.uid()
 where r.id=p_room_id and p.status='active' and (p.role='admin' or (p.role='teacher' and r.owner_id=p.id)));
$$;
revoke all on function public.can_manage_room(uuid) from public,anon,authenticated;

create function public.create_school_room(room_name text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare room public.school_rooms; code text;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('teacher','admin')) then
  raise exception 'Somente professores aprovados podem criar salas.' using errcode='42501';
 end if;
 if room_name is null or char_length(trim(room_name)) not between 2 and 80 then raise exception 'Informe um nome de sala com 2 a 80 caracteres.'; end if;
 insert into public.school_rooms(owner_id,name) values(auth.uid(),trim(room_name)) returning * into room;
 loop
  code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  begin
   insert into public.room_access(room_id,join_code) values(room.id,code);exit;
  exception when unique_violation then null;
  end;
 end loop;
 return to_jsonb(room)||jsonb_build_object('join_code',code);
end;
$$;
revoke all on function public.create_school_room(text) from public,anon;
grant execute on function public.create_school_room(text) to authenticated;

create function public.list_school_rooms() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and status='active' and role in ('teacher','admin')) then
  raise exception 'Acesso restrito a professores aprovados.' using errcode='42501';
 end if;
 select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('join_code',a.join_code) order by r.created_at desc),'[]'::jsonb)
 into result from public.school_rooms r join public.room_access a on a.room_id=r.id
 where r.owner_id=auth.uid() or public.is_admin();
 return result;
end;
$$;
revoke all on function public.list_school_rooms() from public,anon;
grant execute on function public.list_school_rooms() to authenticated;

create function public.delete_school_room(p_room_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.school_rooms where id=p_room_id for update;
 if not public.can_manage_room(p_room_id) then raise exception 'Você não pode excluir esta sala.' using errcode='42501'; end if;
 delete from public.school_rooms where id=p_room_id;
end;
$$;
revoke all on function public.delete_school_room(uuid) from public,anon;
grant execute on function public.delete_school_room(uuid) to authenticated;

revoke all on function public.reset_competition(uuid) from public,anon,authenticated;
create function public.reset_school_room(p_room_id uuid,expected_competition_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare room public.school_rooms;
begin
 select * into room from public.school_rooms where id=p_room_id for update;
 if not public.can_manage_room(p_room_id) then raise exception 'Você não pode reiniciar esta sala.' using errcode='42501'; end if;
 if room.competition_id is distinct from expected_competition_id then raise exception 'Esta sala já foi reiniciada. Atualize a página.'; end if;
 delete from public.leaderboard where room_id=p_room_id;
 delete from public.student_ranking_sessions where room_id=p_room_id;
 delete from public.competition_students where room_id=p_room_id;
 update public.school_rooms set competition_id=gen_random_uuid(),generation=generation+1 where id=p_room_id returning * into room;
 return to_jsonb(room);
end;
$$;
revoke all on function public.reset_school_room(uuid,uuid) from public,anon;
grant execute on function public.reset_school_room(uuid,uuid) to authenticated;

drop function public.enter_competition_student(text);
create function public.enter_competition_student(nickname text,room_code text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare room public.school_rooms; student public.competition_students;
 clean_name text:=regexp_replace(trim(nickname),'[[:space:]]+',' ','g');
 token text:=gen_random_uuid()::text||gen_random_uuid()::text;
begin
 if clean_name is null or char_length(clean_name) not between 2 and 120 or nickname~'[[:cntrl:]]' then raise exception 'Informe um nome ou apelido de 2 a 120 caracteres.'; end if;
 select r.* into room from public.school_rooms r join public.room_access a on a.room_id=r.id
 where a.join_code=upper(trim(room_code)) for share of r;
 if not found then raise exception 'Sala não encontrada. Confira o código com seu professor.'; end if;
 insert into public.competition_students as existing(competition_id,room_id,name,nickname_key)
 values(room.competition_id,room.id,clean_name,lower(clean_name))
 on conflict(competition_id,nickname_key) do update set name=existing.name returning * into student;
 delete from public.student_ranking_sessions where expires_at<=now();
 insert into public.student_ranking_sessions(token_hash,player_id,competition_id,room_id)
 values(encode(sha256(convert_to(token,'UTF8')),'hex'),student.id,room.competition_id,room.id);
 return jsonb_build_object('id',student.id,'name',student.name,'role','student','status','active',
 'competition_id',room.competition_id,'room_id',room.id,'room_name',room.name,'ranking_token',token);
end;
$$;
revoke all on function public.enter_competition_student(text,text) from public;
grant execute on function public.enter_competition_student(text,text) to anon,authenticated;

create or replace function public.get_competition_student(p_player_id uuid,p_student_token text,p_competition_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare room public.school_rooms; student public.competition_students;
begin
 select r.* into room from public.school_rooms r join public.competition_students s on s.room_id=r.id
 where s.id=p_player_id and r.competition_id=p_competition_id for share of r;
 if not found then raise exception 'Sua sala foi excluída ou reiniciada. Entre novamente.' using errcode='42501'; end if;
 select s.* into student from public.competition_students s join public.student_ranking_sessions t on t.player_id=s.id
 where s.id=p_player_id and s.room_id=room.id and s.competition_id=room.competition_id
 and t.room_id=room.id and t.competition_id=room.competition_id and t.expires_at>now()
 and t.token_hash=encode(sha256(convert_to(p_student_token,'UTF8')),'hex');
 if not found then raise exception 'Sua sessão expirou. Entre na sala novamente.' using errcode='42501'; end if;
 return jsonb_build_object('id',student.id,'name',student.name,'role','student','status','active',
 'competition_id',room.competition_id,'room_id',room.id,'room_name',room.name,'ranking_token',p_student_token);
end;
$$;

create or replace function public.submit_leaderboard(
 p_player_id uuid,p_bank_key text,p_scoring_version integer,p_score integer,p_commands integer,p_clues integer,p_completed integer,
 p_competition_id uuid,p_student_token text default null
) returns void language plpgsql security definer set search_path='' as $$
declare room public.school_rooms; player_name text;
begin
 select r.* into room from public.school_rooms r join public.competition_students s on s.room_id=r.id
 where s.id=p_player_id and r.competition_id=p_competition_id for share of r;
 if not found then raise exception 'Sua sala foi excluída ou reiniciada. Entre novamente.' using errcode='42501'; end if;
 select s.name into player_name from public.competition_students s join public.student_ranking_sessions t on t.player_id=s.id
 where s.id=p_player_id and s.room_id=room.id and s.competition_id=room.competition_id
 and t.room_id=room.id and t.competition_id=room.competition_id and t.expires_at>now()
 and t.token_hash=encode(sha256(convert_to(p_student_token,'UTF8')),'hex');
 if player_name is null then raise exception 'Entre na sala novamente para enviar seu resultado.' using errcode='42501'; end if;
 insert into public.leaderboard as existing
 (player_id,room_id,room_name,bank_key,scoring_version,name,score,commands,clues,completed,competition_id)
 values(p_player_id,room.id,room.name,p_bank_key,p_scoring_version,player_name,p_score,p_commands,p_clues,p_completed,room.competition_id)
 on conflict(room_id,bank_key,scoring_version,player_id) do update
 set score=excluded.score,commands=excluded.commands,clues=excluded.clues,completed=excluded.completed,updated_at=now()
 where excluded.score>existing.score or (excluded.score=existing.score and excluded.commands<existing.commands);
end;
$$;
alter publication supabase_realtime add table public.school_rooms;
commit;
