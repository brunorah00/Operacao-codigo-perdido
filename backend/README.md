# Backend — Supabase

Esta pasta contém o código executado no Supabase: esquema do banco, funções RPC, políticas de acesso e publicação Realtime em `supabase/migrations/`. Os testes SQL ficam em `tests/`. Não há dependências Node ou um servidor HTTP para iniciar nesta pasta; o frontend consome as APIs do Supabase. Os comandos npm abaixo são executados na raiz do repositório.

A reorganização apenas move os arquivos existentes. Preserve os nomes e a ordem das migrações já aplicadas; não as execute novamente por terem mudado de pasta. As credenciais públicas usadas pelo navegador ficam em `frontend/.env`; nenhuma credencial administrativa deve ser adicionada ao frontend.

Esta etapa adiciona autenticação Supabase, cadastro de aluno/professor, status de aprovação e painel administrativo. O progresso da campanha continua local por conta; o ranking passa a ser compartilhado após aplicar a migração descrita abaixo. Não publicar como competição oficial: os gabaritos e as regras ainda estão no frontend.

## Ranking compartilhado ao vivo

Com as duas migrações anteriores já aplicadas, execute **somente** `backend/supabase/migrations/202611020001_live_leaderboard.sql` no SQL Editor do Supabase. Execute o arquivo inteiro uma única vez. Ele cria a tabela de recordes, as permissões, a publicação Realtime e a sessão de envio para alunos sem senha. Não execute novamente as migrações antigas.

Após o deploy do site, alunos que já estavam conectados devem **sair e entrar novamente** para receber a sessão do ranking. O acesso continua por e-mail, sem senha. A sessão permite publicar por 90 dias; depois disso, basta entrar novamente. Professores usam a sessão normal do Supabase Auth.

O jogo envia a melhor pontuação disponível na conta deste navegador assim que o jogador entra e publica novos recordes em aproximadamente um segundo, enquanto houver conexão. Outros jogadores recebem as mudanças pelo Supabase Realtime sem recarregar a página. Há também uma consulta de recuperação a cada 10 segundos, ao reconectar e ao voltar à janela. O painel informa falhas de conexão, ausência da migração ou necessidade de entrar novamente. Recordes locais pendentes são reenviados enquanto a página estiver aberta ou quando a conta for aberta novamente neste navegador.

O banco mantém uma linha por jogador, banco de desafios e versão de pontuação. O melhor resultado vence; em empate, menos comandos vence. Reinícios e envios concorrentes não reduzem o recorde. Bancos de desafios diferentes têm classificações distintas. Cada jogador precisa abrir a versão atualizada do site para enviar seus resultados anteriores; não há como consultar o localStorage de outros dispositivos remotamente. O progresso da campanha não é sincronizado entre dispositivos.

A leitura do ranking disponibiliza nomes e resultados aos visitantes do projeto, sem e-mails ou tokens. Escritas diretas são bloqueadas. A função de envio confere a sessão e obtém o nome no servidor. Como o jogo ainda calcula pontos no frontend e o acesso do aluno é didático, os resultados não têm validação antifraude no servidor.

### Verificação após publicar

1. Entre com dois alunos distintos em navegadores ou dispositivos diferentes, saindo e entrando novamente se necessário.
2. Abra o ranking no segundo dispositivo e resolva uma pista no primeiro. A pontuação e a posição devem mudar sem recarregar a página.
3. Reinicie a partida: o recorde deve permanecer. Em uma nova tentativa, só um resultado melhor substitui a marca.
4. Desconecte temporariamente um dispositivo, melhore sua pontuação e reconecte. Confira o reenvio e a atualização no outro dispositivo.
5. Confira no Supabase que `public.leaderboard` está na publicação `supabase_realtime`, configurada pela migração. Se o WebSocket não conectar, o painel indica reconexão e consulta a classificação a cada 10 segundos.

Os testes de SQL em `backend/tests/leaderboard.sql` executam as migrações e verificam recordes, desempates, isolamento por desafios, permissões e sessões em um PostgreSQL vazio e descartável. **Não execute esse arquivo no Supabase de produção.**

## Configuração

1. Crie um projeto Supabase.
2. Execute `backend/supabase/migrations/202610140001_profiles.sql` no SQL Editor do projeto.
3. Na raiz do repositório, copie `frontend/.env.example` para `frontend/.env` e preencha URL e chave **publicável** (ou anon). Nunca use service_role/secret em variáveis VITE.
4. Em Authentication, configure a URL do site, as URLs de redirecionamento e a política de confirmação de e-mail. Configure senha mínima de 8 caracteres também no servidor.
5. Execute `npm install` e `npm run dev`.

## Falha de conexão ao entrar

Se o console mostrar `ERR_NAME_NOT_RESOLVED` na chamada ao Supabase, confira se o projeto está ativo e copie novamente sua Project URL e chave publicável para `frontend/.env`. Os dois valores precisam pertencer ao mesmo projeto. Reinicie `npm run dev` após alterar o arquivo; em uma publicação, gere e publique um novo build. Se a URL estiver correta, verifique o DNS e a conexão local. Esse erro acontece antes de o banco receber a chamada e não é corrigido alterando senhas ou executando migrações.

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

A migração ainda precisa ser executada e validada em PostgreSQL/Supabase. Os testes locais não substituem essas verificações. O arquivo `backend/supabase/authorization-checks.sql` automatiza as principais negativas de acesso de aluno em um projeto de teste, dentro de uma transação com rollback.

## Próximas etapas

1. Mover perguntas/gabaritos e validação de ações para o backend.
2. Criar partidas versionadas, gravação atômica e proteção contra reenvios/conflitos.
3. Ampliar notificações em tempo real além do ranking compartilhado.
4. Criar turmas, painel pedagógico e exportação/backup.
5. Implementar recuperação de senha e testes de navegador/carga.

Não importar pontuações locais como resultados oficiais. A recuperação completa de senha e a persistência online da campanha ainda não estão implementadas.

## Acesso simplificado de alunos (atualização)

Execute **somente a nova migração** `backend/supabase/migrations/202610140002_students_without_password.sql` no SQL Editor, após a primeira migração já aplicada.

- Cadastro do aluno: nome e e-mail, sem senha ou envio de confirmação. Após cadastrar, volta ao login.
- Login do aluno: e-mail; recupera o cadastro sem duplicar ou alterar o nome existente.
- Perfil lembrado neste navegador até sair. Esse perfil local não concede permissões de professor/administrador.
- Alunos da versão anterior também podem entrar sem senha, preservando o identificador.
- Professores e administrador continuam usando Supabase Auth e senha, com aprovação de professores.
- E-mails são normalizados e o banco serializa cadastros concorrentes para impedir duplicação entre os novos alunos e contas Auth.
- Acesso sem verificação de identidade é uma regra didática: conhecer o e-mail permite retomar o perfil. A tabela de alunos não é pública; a função retorna apenas o perfil consultado, sem e-mail.
- O progresso continua local. O ranking compartilhado requer a migração adicional da seção “Ranking compartilhado ao vivo”.

Valide no Supabase: cadastrar aluno, repetir e-mail com maiúsculas, retomar aluno antigo, tentar usar e-mail de professor no acesso de aluno e tentar cadastrar professor com e-mail já usado por aluno. Não execute novamente a migração inicial.
