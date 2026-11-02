# Publicar no Render

O frontend é um Static Site. O banco e a autenticação continuam no Supabase.
O arquivo `render.yaml` configura a compilação e a hospedagem. Execute os comandos na raiz do repositório: o npm workspace compila `frontend/` e gera `dist/` na raiz, preservando a configuração existente do Render. A pasta `backend/` é executada pelo Supabase e não é publicada como conteúdo estático.

## Publicação com Blueprint

1. Envie para a branch `main` do GitHub a versão que deseja publicar, incluindo `render.yaml`, `package.json` e `package-lock.json`. Não envie `.env` nem `node_modules` ou `dist`.
2. Acesse https://dashboard.render.com e escolha **New > Blueprint**.
3. Conecte o repositório `https://github.com/brunorah00/Operacao-codigo-perdido` e selecione `main`.
4. Confira o serviço `operacao-codigo-perdido` e preencha as variáveis solicitadas com os valores do seu projeto Supabase:
   - `VITE_SUPABASE_URL`: Project URL, como `https://SEU-PROJETO.supabase.co`.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável (ou anon), nunca `service_role` ou secret.
5. Confirme a criação do Blueprint e aguarde o deploy terminar. Abra a URL `https://…onrender.com` exibida pelo Render.

As variáveis `VITE_` são incorporadas ao JavaScript público durante a compilação. Ao alterá-las, faça um novo deploy. Use URL e chave do mesmo projeto Supabase, ativo e acessível.

## Alternativa: criação manual

Em **New > Static Site**, conecte o mesmo repositório e use:

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| Root Directory | deixe vazio |
| Build Command | `npm ci --include=dev && npm run build` |
| Publish Directory | `dist` |

Em **Environment**, adicione `NODE_VERSION=24` e as duas variáveis do Supabase acima antes de compilar. Em **Redirects/Rewrites**, adicione origem `/*`, destino `/index.html`, ação **Rewrite**.

## Supabase e verificação

1. Confira em [backend/README.md](backend/README.md) as migrações necessárias. A publicação do frontend não executa migrações no banco.
2. No Supabase, em **Authentication > URL Configuration**, configure **Site URL** com a URL final do Render. Adicione também as URLs de retorno utilizadas pelo seu fluxo de autenticação em **Redirect URLs**.
3. Abra o site publicado e teste cadastro e entrada de aluno, login de professor e acesso administrativo com contas de teste.
4. Recarregue a página e confira se o site continua abrindo.

O progresso da campanha continua no navegador. Para ativar as salas, execute `backend/supabase/migrations/202611020003_school_rooms.sql` após as migrações anteriores, conforme [backend/README.md](backend/README.md). Essa migração limpa os alunos e o ranking da competição global anterior e preserva as contas dos professores. Depois do deploy, professores criam salas e alunos entram por código. As variáveis do Render não mudam.

Com o deploy automático habilitado, novos pushes na branch vinculada geram novas publicações.

Documentação: https://render.com/docs/blueprint-spec e https://vite.dev/guide/static-deploy#render.
