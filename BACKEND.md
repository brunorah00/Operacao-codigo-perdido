# Backend — primeira etapa

Esta etapa adiciona autenticação Supabase, cadastro de aluno/professor, status de aprovação e painel administrativo. O jogo ainda usa progresso e ranking locais por conta. Não publicar como competição oficial: os gabaritos e as regras ainda estão no frontend.

## Configuração

1. Crie um projeto Supabase.
2. Execute `supabase/migrations/202610140001_profiles.sql` no SQL Editor do projeto.
3. Copie `.env.example` para `.env` e preencha URL e chave **publicável** (ou anon). Nunca use service_role/secret em variáveis VITE.
4. Em Authentication, configure a URL do site, as URLs de redirecionamento e a política de confirmação de e-mail. Configure senha mínima de 8 caracteres também no servidor.
5. Execute `npm install` e `npm run dev`.

## Administrador previamente cadastrado

Crie o usuário administrativo em Authentication > Users com e-mail confirmado e metadados `{"name":"Administrador","role":"student"}`. Depois execute no SQL Editor, substituindo o UUID pelo identificador desse usuário:

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = 'UUID-DO-USUARIO';
```

Essa operação é exclusiva da configuração confiável no servidor. Não há cadastro público de administrador. Não coloque a senha em arquivos do projeto. Usuários já existentes antes da migração precisam de perfil criado manualmente.

## Verificação em um projeto de teste

- Cadastrar aluno e professor com e-mails distintos; confirmar e-mail se habilitado.
- Aluno entra no jogo; professor recebe status pendente.
- Entrar como administrador, aprovar professor e verificar liberação (a tela consulta o status a cada 15 segundos).
- Recusar outro professor e revogar um aprovado; confirmar bloqueio após atualização.
- Usando token de aluno, tentar UPDATE em profiles e RPC review_teacher: ambos devem falhar.
- Alterar user_metadata para role=admin: o perfil e as permissões devem permanecer iguais.
- Conferir que um aluno só consulta o próprio perfil e não pode ler teacher_reviews.

A migração ainda precisa ser executada e validada em PostgreSQL/Supabase. Os testes locais não substituem essas verificações. O arquivo `supabase/authorization-checks.sql` automatiza as principais negativas de acesso de aluno em um projeto de teste, dentro de uma transação com rollback.

## Próximas etapas

1. Mover perguntas/gabaritos e validação de ações para o backend.
2. Criar partidas versionadas, gravação atômica e proteção contra reenvios/conflitos.
3. Implementar ranking compartilhado e notificações em tempo real.
4. Criar turmas, painel pedagógico e exportação/backup.
5. Implementar recuperação de senha e testes de navegador/carga.

Não importar pontuações locais como resultados oficiais. A recuperação completa de senha e a persistência online da campanha ainda não estão implementadas.

## Acesso simplificado de alunos (atualização)

Execute **somente a nova migração** `supabase/migrations/202610140002_students_without_password.sql` no SQL Editor, após a primeira migração já aplicada.

- Cadastro do aluno: nome e e-mail, sem senha ou envio de confirmação. Após cadastrar, volta ao login.
- Login do aluno: e-mail; recupera o cadastro sem duplicar ou alterar o nome existente.
- Perfil lembrado neste navegador até sair. Esse perfil local não concede permissões de professor/administrador.
- Alunos da versão anterior também podem entrar sem senha, preservando o identificador.
- Professores e administrador continuam usando Supabase Auth e senha, com aprovação de professores.
- E-mails são normalizados e o banco serializa cadastros concorrentes para impedir duplicação entre os novos alunos e contas Auth.
- Acesso sem verificação de identidade é uma regra didática: conhecer o e-mail permite retomar o perfil. A tabela de alunos não é pública; a função retorna apenas o perfil consultado, sem e-mail.
- Ranking e progresso continuam locais nesta etapa; o ranking compartilhado ainda precisa ser implementado.

Valide no Supabase: cadastrar aluno, repetir e-mail com maiúsculas, retomar aluno antigo, tentar usar e-mail de professor no acesso de aluno e tentar cadastrar professor com e-mail já usado por aluno. Não execute novamente a migração inicial.
