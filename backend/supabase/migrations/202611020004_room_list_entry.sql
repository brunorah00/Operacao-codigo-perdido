begin;

-- A lista pública mostra somente sala e professor, sem códigos ou e-mails.
create function public.available_school_rooms() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'teacher_name',p.name)
 order by r.name,p.name,r.created_at),'[]'::jsonb)
 from public.school_rooms r join public.profiles p on p.id=r.owner_id;
$$;
revoke all on function public.available_school_rooms() from public;
grant execute on function public.available_school_rooms() to anon,authenticated;

-- Reutiliza a entrada existente e sua trava contra exclusão/reset concorrentes.
-- O código é resolvido exclusivamente no servidor, nunca enviado ao navegador.
create function public.join_school_room(p_room_id uuid,nickname text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare code text;
begin
 select join_code into code from public.room_access where room_id=p_room_id;
 if not found then raise exception 'Esta sala não está mais disponível. Escolha outra sala na lista.'; end if;
 return public.enter_competition_student(nickname,code);
end;
$$;
revoke all on function public.join_school_room(uuid,text) from public;
grant execute on function public.join_school_room(uuid,text) to anon,authenticated;
commit;
