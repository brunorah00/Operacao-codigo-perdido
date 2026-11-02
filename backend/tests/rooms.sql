-- Apenas em PostgreSQL vazio e descartável. Não executar em produção.
-- psql -v ON_ERROR_STOP=1 -f backend/tests/rooms.sql DATABASE
\ir competition.sql
\ir ../supabase/migrations/202611020003_school_rooms.sql
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000011','room-a@example.com','{"name":"Professor A","role":"teacher"}'),
 ('00000000-0000-4000-8000-000000000012','room-b@example.com','{"name":"Professor B","role":"teacher"}');
update public.profiles set status='active' where id in ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';
set local role authenticated;
do $$
declare room jsonb;
begin
 room:=public.create_school_room('Turma A');perform set_config('test.room_a',room::text,true);
 if char_length(room->>'join_code')<>6 then raise exception 'Missing room code'; end if;
end;
$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000012';
set local role authenticated;
do $$
declare room jsonb;
begin
 room:=public.create_school_room('Turma B');perform set_config('test.room_b',room::text,true);
 if jsonb_array_length(public.list_school_rooms())<>1 then raise exception 'Teacher sees another teacher room'; end if;
 begin
  perform public.delete_school_room((current_setting('test.room_a')::jsonb->>'id')::uuid);raise exception 'Deleted another teacher room';
 exception when insufficient_privilege then null; end;
 begin
  perform public.reset_school_room((current_setting('test.room_a')::jsonb->>'id')::uuid,(current_setting('test.room_a')::jsonb->>'competition_id')::uuid);raise exception 'Reset another teacher room';
 exception when insufficient_privilege then null; end;
 begin
  perform public.reset_competition((select competition_id from public.competition_state where id));raise exception 'Old global reset still exposed';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
set local role anon;
do $$
declare a jsonb; b jsonb;
begin
 begin
  perform public.enter_competition_student('Ana','BADCODE');raise exception 'Invalid room accepted';
 exception when raise_exception then if SQLERRM='Invalid room accepted' then raise; end if; end;
 begin
  perform public.enter_competition_student('Ana');raise exception 'Joined without a room';
 exception when undefined_function then null; end;
 begin
  perform public.create_school_room('Forbidden');raise exception 'Student created a room';
 exception when insufficient_privilege then null; end;
 begin
  perform * from public.room_access;raise exception 'Anonymous codes exposed';
 exception when insufficient_privilege then null; end;
 a:=public.enter_competition_student('Ana',current_setting('test.room_a')::jsonb->>'join_code');
 b:=public.enter_competition_student('Ana',lower(current_setting('test.room_b')::jsonb->>'join_code'));
 perform set_config('test.student_a',a::text,true);perform set_config('test.student_b',b::text,true);
 if a->>'id'=b->>'id' then raise exception 'Nicknames collided across rooms'; end if;
 perform public.submit_leaderboard((a->>'id')::uuid,repeat('a',64),3,100,10,1,0,(a->>'competition_id')::uuid,a->>'ranking_token');
 perform public.submit_leaderboard((b->>'id')::uuid,repeat('a',64),3,200,5,2,0,(b->>'competition_id')::uuid,b->>'ranking_token');
 if (select count(*) from public.leaderboard)<>2 then raise exception 'General ranking missing room'; end if;
 if (select score from public.leaderboard where room_id=(a->>'room_id')::uuid)<>100 then raise exception 'Room ranking mixed'; end if;
 begin
  perform public.submit_leaderboard((b->>'id')::uuid,repeat('a',64),3,999,1,1,0,(b->>'competition_id')::uuid,a->>'ranking_token');raise exception 'Cross-room token accepted';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';
set local role authenticated;
do $$
declare room jsonb:=current_setting('test.room_a')::jsonb;
begin
 perform public.reset_school_room((room->>'id')::uuid,(room->>'competition_id')::uuid);
 if (select count(*) from public.leaderboard)<>1 or (select max(room_name) from public.leaderboard)<>'Turma B' then raise exception 'Reset affected another room'; end if;
end;
$$;
reset role;
set local role anon;
do $$
declare old_student jsonb:=current_setting('test.student_a')::jsonb; other_student jsonb:=current_setting('test.student_b')::jsonb;
begin
 begin
  perform public.submit_leaderboard((old_student->>'id')::uuid,repeat('a',64),3,999,1,1,0,(old_student->>'competition_id')::uuid,old_student->>'ranking_token');raise exception 'Old room round restored score';
 exception when insufficient_privilege then null; end;
 perform public.get_competition_student((other_student->>'id')::uuid,other_student->>'ranking_token',(other_student->>'competition_id')::uuid);
end;
$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000012';
set local role authenticated;
select public.delete_school_room((current_setting('test.room_b')::jsonb->>'id')::uuid);
reset role;
set local role anon;
do $$
declare student jsonb:=current_setting('test.student_b')::jsonb;
begin
 if exists(select 1 from public.leaderboard) then raise exception 'Deleted room survived general ranking'; end if;
 begin
  perform public.get_competition_student((student->>'id')::uuid,student->>'ranking_token',(student->>'competition_id')::uuid);raise exception 'Deleted room session resumed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.enter_competition_student('Ana',current_setting('test.room_b')::jsonb->>'join_code');raise exception 'Deleted code accepted';
 exception when raise_exception then if SQLERRM='Deleted code accepted' then raise; end if; end;
 perform public.enter_competition_student('Ana',current_setting('test.room_a')::jsonb->>'join_code');
end;
$$;
reset role;
update public.profiles set status='revoked' where id='00000000-0000-4000-8000-000000000011';
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';
set local role authenticated;
do $$
begin
 begin
  perform public.create_school_room('Forbidden');raise exception 'Revoked teacher created room';
 exception when insufficient_privilege then null; end;
 begin
  perform public.delete_school_room((current_setting('test.room_a')::jsonb->>'id')::uuid);raise exception 'Revoked teacher deleted room';
 exception when insufficient_privilege then null; end;
end;
$$;
rollback;
