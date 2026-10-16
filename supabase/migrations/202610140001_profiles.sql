begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 2 and 120),
 email text not null,
 role text not null check (role in ('student','teacher','admin')),
 status text not null check (status in ('active','pending','rejected','revoked')),
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check (role = 'teacher' or status = 'active')
);
alter table public.profiles enable row level security;
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_role text;
begin
 requested_role := coalesce(new.raw_user_meta_data->>'role','student');
 if requested_role not in ('student','teacher') then raise exception 'Tipo de cadastro inválido'; end if;
 insert into public.profiles(id,name,email,role,status)
 values(new.id,trim(new.raw_user_meta_data->>'name'),new.email,requested_role,case when requested_role = 'teacher' then 'pending' else 'active' end);
 return new;
end;
$$;
revoke all on function public.create_profile() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile();
create table public.teacher_reviews (
 id bigint generated always as identity primary key,
 teacher_id uuid not null references public.profiles(id),
 admin_id uuid not null references public.profiles(id),
 status text not null,
 created_at timestamptz not null default now()
);
alter table public.teacher_reviews enable row level security;
revoke all on public.teacher_reviews from anon, authenticated;
grant select on public.teacher_reviews to authenticated;
create policy reviews_read on public.teacher_reviews for select to authenticated using (public.is_admin());
create function public.review_teacher(teacher_id uuid, decision text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_admin() then raise exception 'Acesso restrito ao administrador'; end if;
 if decision not in ('active','rejected','revoked') then raise exception 'Decisão inválida'; end if;
 update public.profiles set status=decision, reviewed_by=auth.uid(), reviewed_at=now() where id=teacher_id and role='teacher';
 if not found then raise exception 'Professor não encontrado'; end if;
 insert into public.teacher_reviews(teacher_id,admin_id,status) values(teacher_id,auth.uid(),decision);
end;
$$;
revoke all on function public.review_teacher(uuid,text) from public;
grant execute on function public.review_teacher(uuid,text) to authenticated;
commit;
