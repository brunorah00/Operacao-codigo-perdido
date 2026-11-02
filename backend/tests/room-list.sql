-- Somente em PostgreSQL vazio e descartável; inclui os testes anteriores.
-- psql -v ON_ERROR_STOP=1 -f backend/tests/room-list.sql DATABASE
\ir rooms.sql
-- Fixture anterior à migração: sala e resultado existentes devem ser preservados.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000021','room-list@example.com','{"name":"Professora Ana","role":"teacher"}');
update public.profiles set status='active' where id='00000000-0000-4000-8000-000000000021';
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000021';
set role authenticated;
do $$
begin
 perform set_config('test.list_room',public.create_school_room('Sala da lista')::text,false);
end;
$$;
reset role;
set role anon;
do $$
declare student jsonb;
begin
 student:=public.enter_competition_student('Aluno',current_setting('test.list_room')::jsonb->>'join_code');
 perform set_config('test.list_student',student::text,false);
 perform public.submit_leaderboard((student->>'id')::uuid,repeat('a',64),3,100,2,1,0,(student->>'competition_id')::uuid,student->>'ranking_token');
end;
$$;
reset role;
\ir ../supabase/migrations/202611020004_room_list_entry.sql
begin;
set local role anon;
do $$
declare room jsonb:=current_setting('test.list_room')::jsonb; old_student jsonb:=current_setting('test.list_student')::jsonb; student jsonb; list jsonb;
begin
 list:=public.available_school_rooms();
 if jsonb_array_length(list)<>1 or list->0->>'name'<>'Sala da lista' or list->0->>'teacher_name'<>'Professora Ana' then raise exception 'Room list incorrect'; end if;
 if (list->0)?'join_code' or (list->0)?'email' or (list->0)?'owner_id' then raise exception 'Public room list exposed private fields'; end if;
 student:=public.join_school_room((room->>'id')::uuid,'Aluno');
 if student->>'id'<>old_student->>'id' then raise exception 'Existing student was not preserved'; end if;
 if (select max(score) from public.leaderboard)<>100 then raise exception 'Migration changed existing scores'; end if;
 begin
  perform public.join_school_room(gen_random_uuid(),'Aluno');raise exception 'Nonexistent room accepted';
 exception when raise_exception then if SQLERRM='Nonexistent room accepted' then raise; end if; end;
 begin
  perform public.join_school_room(null,'Aluno');raise exception 'Missing room accepted';
 exception when raise_exception then if SQLERRM='Missing room accepted' then raise; end if; end;
end;
$$;
reset role;
set local role authenticated;
select public.delete_school_room((current_setting('test.list_room')::jsonb->>'id')::uuid);
reset role;
set local role anon;
do $$
begin
 if jsonb_array_length(public.available_school_rooms())<>0 then raise exception 'Deleted room still listed'; end if;
 begin
  perform public.join_school_room((current_setting('test.list_room')::jsonb->>'id')::uuid,'Aluno');raise exception 'Deleted room accepted';
 exception when raise_exception then if SQLERRM='Deleted room accepted' then raise; end if; end;
end;
$$;
rollback;
