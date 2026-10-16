-- Executar APENAS em projeto de teste após a migração.
-- Requer ao menos um aluno criado pelo formulário.
-- Simula permissões do aluno e desfaz tudo ao terminar.
begin;
create temporary table test_identity as select id from public.profiles where role='student' limit 1;
do $$ begin if not exists(select 1 from test_identity) then raise exception 'Cadastre um aluno antes do teste'; end if; end $$;
select set_config('request.jwt.claim.sub',(select id::text from test_identity),true);
set local role authenticated;
do $$
begin
 if public.is_admin() then raise exception 'Aluno recebeu privilégio administrativo'; end if;
 if (select count(*) from public.profiles) <> 1 then raise exception 'Leitura de perfil incorreta'; end if;
 begin
  update public.profiles set role='admin' where id=auth.uid();
  raise exception 'UPDATE deveria ter sido negado';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.review_teacher(auth.uid(),'active');
  raise exception 'RPC deveria ter sido negada';
 exception when raise_exception then
  if sqlerrm <> 'Acesso restrito ao administrador' then raise; end if;
 end;
 if exists(select 1 from public.teacher_reviews) then raise exception 'Aluno leu auditoria'; end if;
end $$;
reset role;
rollback;
