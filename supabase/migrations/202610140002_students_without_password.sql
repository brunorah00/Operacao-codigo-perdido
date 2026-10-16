begin;
-- Alunos didáticos não precisam de usuários no Supabase Auth.
create table public.classroom_students (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 2 and 120),
 email text not null check (email = lower(trim(email)) and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 created_at timestamptz not null default now(),
 unique(email)
);
alter table public.classroom_students enable row level security;
revoke all on public.classroom_students from anon, authenticated;

-- Serializa cadastros concorrentes com o mesmo e-mail, inclusive professores.
create function public.guard_classroom_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(lower(trim(new.email)),0));
 if exists(select 1 from public.classroom_students where email=lower(trim(new.email))) then
  raise exception 'Este e-mail já pertence a um aluno.';
 end if;
 return new;
end;
$$;
revoke all on function public.guard_classroom_email() from public;
create trigger classroom_email_guard before insert or update of email on auth.users
for each row execute function public.guard_classroom_email();

create function public.enter_student(student_name text, student_email text, create_account boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 normalized_email text := lower(trim(student_email));
 normalized_name text := trim(student_name);
 found_id uuid;
 found_name text;
 existing_role text;
begin
 if normalized_email is null or char_length(normalized_email)>254 or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  raise exception 'Informe um e-mail válido.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(normalized_email,0));
 select p.id,p.name,p.role into found_id,found_name,existing_role
 from auth.users u left join public.profiles p on p.id=u.id where lower(trim(u.email))=normalized_email;
 if found then
  if existing_role is distinct from 'student' then raise exception 'Este e-mail pertence a uma conta com senha. Use o acesso de professor ou administrador.'; end if;
 else
  select id,name into found_id,found_name from public.classroom_students where email=normalized_email;
  if not found then
   if create_account is not true then raise exception 'Aluno não encontrado. Escolha Cadastrar aluno.'; end if;
   if normalized_name is null or char_length(normalized_name) not between 2 and 120 then raise exception 'Informe um nome de 2 a 120 caracteres.'; end if;
   insert into public.classroom_students(name,email) values(normalized_name,normalized_email) returning id,name into found_id,found_name;
  end if;
 end if;
 return jsonb_build_object('id',found_id,'name',found_name,'role','student','status','active');
end;
$$;
revoke all on function public.enter_student(text,text,boolean) from public;
grant execute on function public.enter_student(text,text,boolean) to anon,authenticated;
commit;
