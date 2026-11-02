-- Execute SOMENTE em PostgreSQL vazio e descartável:
-- psql -v ON_ERROR_STOP=1 -f backend/tests/leaderboard.sql DATABASE
-- O bootstrap falha se auth já existir, evitando uso em um Supabase real.
create schema auth;
create role anon;
create role authenticated;
create table auth.users(id uuid primary key default gen_random_uuid(),email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
\ir ../supabase/migrations/202610140001_profiles.sql
\ir ../supabase/migrations/202610140002_students_without_password.sql
\ir ../supabase/migrations/202611020001_live_leaderboard.sql

begin;
set local role anon;
do $$
declare
 student jsonb;
 other_student jsonb;
 player uuid;
 token text;
 bank text := repeat('a',64);
begin
 student := public.enter_student('Ana Silva','ana-ranking@example.com',true);
 other_student := public.enter_student('Bruno Silva','bruno-ranking@example.com',true);
 player := (student->>'id')::uuid;
 token := student->>'ranking_token';
 if token is null then raise exception 'Missing student session'; end if;
 perform public.submit_leaderboard(player,bank,3,100,10,1,0,token);
 perform public.submit_leaderboard(player,bank,3,80,1,1,0,token);
 if (select score from public.leaderboard where player_id=player and bank_key=bank)<>100 then raise exception 'Record regressed'; end if;
 perform public.submit_leaderboard(player,bank,3,100,5,1,0,token);
 if (select commands from public.leaderboard where player_id=player and bank_key=bank)<>5 then raise exception 'Tie breaker failed'; end if;
 if (select name from public.leaderboard where player_id=player and bank_key=bank)<>'Ana Silva' then raise exception 'Incorrect identity'; end if;
 perform public.submit_leaderboard(player,repeat('b',64),3,50,1,1,0,token);
 if (select count(*) from public.leaderboard where player_id=player)<>2 then raise exception 'Banks mixed'; end if;
 begin
  perform public.submit_leaderboard((other_student->>'id')::uuid,bank,3,999,1,1,0,token);
  raise exception 'Accepted forged identity';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.submit_leaderboard(player,bank,3,999,1,1,0,'invalid');
  raise exception 'Accepted invalid session';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.submit_leaderboard(player,bank,3,-1,1,1,0,token);
  raise exception 'Accepted negative score';
 exception when check_violation then null;
 end;
 begin
  update public.leaderboard set score=999;
  raise exception 'Allowed direct update';
 exception when insufficient_privilege then null;
 end;
 begin
  perform * from public.student_ranking_sessions;
  raise exception 'Exposed session tokens';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.enter_student_without_ranking('','ana-ranking@example.com',false);
  raise exception 'Exposed internal login';
 exception when insufficient_privilege then null;
 end;
end;
$$;
reset role;
insert into auth.users(id,email,raw_user_meta_data)
values('00000000-0000-4000-8000-000000000001','teacher-ranking@example.com','{"name":"Professor Teste","role":"teacher"}');
update public.profiles set status='active' where id='00000000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
set local role authenticated;
select public.submit_leaderboard('00000000-0000-4000-8000-000000000001',repeat('a',64),3,150,2,2,0);
reset role;
update public.profiles set status='revoked' where id='00000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$
begin
 begin
  perform public.submit_leaderboard('00000000-0000-4000-8000-000000000001',repeat('a',64),3,200,2,2,0);
  raise exception 'Allowed revoked teacher';
 exception when insufficient_privilege then null;
 end;
end;
$$;
reset role;
do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='leaderboard') then
  raise exception 'Leaderboard missing from Realtime publication';
 end if;
end;
$$;
rollback;
