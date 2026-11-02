-- SOMENTE em PostgreSQL vazio e descartável. Inclui o bootstrap e os testes anteriores.
-- psql -v ON_ERROR_STOP=1 -f backend/tests/competition.sql DATABASE
\ir leaderboard.sql
\ir ../supabase/migrations/202611020002_nickname_competitions.sql
begin;
set local role anon;
do $$
declare student jsonb; same_student jsonb; current_id uuid;
begin
 select competition_id into current_id from public.competition_state where id;
 student:=public.enter_competition_student('  Robo   Azul  ');
 same_student:=public.enter_competition_student('robo azul');
 if student->>'id'<>same_student->>'id' or student->>'name'<>'Robo Azul' then raise exception 'Nickname normalization failed'; end if;
 perform set_config('test.student',student::text,true);
 if public.get_competition_student((student->>'id')::uuid,student->>'ranking_token',current_id)->>'id'<>student->>'id' then raise exception 'Resume failed'; end if;
 perform public.submit_leaderboard((student->>'id')::uuid,repeat('a',64),3,200,5,2,0,current_id,student->>'ranking_token');
 if (select count(*) from public.leaderboard)<>1 then raise exception 'Missing shared record'; end if;
 begin
  perform public.enter_competition_student('x');raise exception 'Accepted short nickname';
 exception when raise_exception then if SQLERRM='Accepted short nickname' then raise; end if;
 end;
 begin
  perform public.enter_student('Old','old@example.com',true);raise exception 'Old email endpoint still exposed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.reset_competition(current_id);raise exception 'Anonymous reset allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.competition_state set generation=99;raise exception 'Direct round edit allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.get_competition_student((student->>'id')::uuid,'forged',current_id);raise exception 'Forged session allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000002','reset-teacher@example.com','{"name":"Professor","role":"teacher"}'),
 ('00000000-0000-4000-8000-000000000003','student-auth@example.com','{"name":"Aluno antigo","role":"student"}');
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
set local role authenticated;
do $$
begin
 begin
  perform public.reset_competition((select competition_id from public.competition_state where id));raise exception 'Auth student reset allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$
begin
 begin
  perform public.reset_competition((select competition_id from public.competition_state where id));raise exception 'Pending teacher reset allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
update public.profiles set status='active' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$
declare current_id uuid; result jsonb;
begin
 select competition_id into current_id from public.competition_state where id;
 result:=public.reset_competition(current_id);
 if (result->>'competition_id')::uuid=current_id or (result->>'generation')::int<>2 then raise exception 'Round not advanced'; end if;
 if exists(select 1 from public.leaderboard) then raise exception 'Old ranking survived'; end if;
 begin
  perform public.submit_leaderboard('00000000-0000-4000-8000-000000000002',repeat('a',64),3,999,1,1,0,current_id);
  raise exception 'Old teacher tab republished a record';
 exception when insufficient_privilege then null; end;
 begin
  perform public.reset_competition(current_id);raise exception 'Duplicate reset advanced round twice';
 exception when raise_exception then if SQLERRM='Duplicate reset advanced round twice' then raise; end if;
 end;
end;
$$;
reset role;
do $$
begin
 if exists(select 1 from public.competition_students) or exists(select 1 from public.student_ranking_sessions) then raise exception 'Student data survived reset'; end if;
 if not exists(select 1 from public.profiles where id='00000000-0000-4000-8000-000000000002' and status='active') then raise exception 'Teacher registration lost'; end if;
end;
$$;
set local role anon;
do $$
declare old_student jsonb:=current_setting('test.student')::jsonb; new_student jsonb;
begin
 begin
  perform public.submit_leaderboard((old_student->>'id')::uuid,repeat('a',64),3,999,1,1,0,(old_student->>'competition_id')::uuid,old_student->>'ranking_token');
  raise exception 'Offline student republished an old record';
 exception when insufficient_privilege then null; end;
 begin
  perform public.get_competition_student((old_student->>'id')::uuid,old_student->>'ranking_token',(old_student->>'competition_id')::uuid);
  raise exception 'Old student session resumed';
 exception when insufficient_privilege then null; end;
 new_student:=public.enter_competition_student('Robo Azul');
 if old_student->>'id'=new_student->>'id' then raise exception 'Nickname retained the previous identity'; end if;
 perform public.submit_leaderboard((new_student->>'id')::uuid,repeat('a',64),3,0,0,0,0,(new_student->>'competition_id')::uuid,new_student->>'ranking_token');
 if (select max(score) from public.leaderboard)<>0 then raise exception 'New player did not start from zero'; end if;
end;
$$;
reset role;
update public.profiles set status='revoked' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$
begin
 begin
  perform public.reset_competition((select competition_id from public.competition_state where id));
  raise exception 'Revoked teacher reset allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
rollback;
