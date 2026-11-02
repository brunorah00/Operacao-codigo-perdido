# Frontend

Aplicação React e Vite executada no navegador.

- `src/`: interface, motor do jogo, áudio e persistência local da campanha.
- `src/features/competition/`: painel de salas, lista de entrada dos alunos, acompanhamento da rodada, exclusão e reset por professor.
- `src/features/program/`: editor compartilhado entre computador e celular, comandos e feedback de execução.
- `src/features/learning/`: tutorial isolado da campanha e histórico de evolução individual.
- `src/services/`: clientes HTTP/Realtime do Supabase; apenas URL e chave publicável são usadas aqui.
- `public/`: imagens e favicon.
- `tests/`: testes JavaScript do jogo e dos clientes de integração.
- `.env.example`: modelo das variáveis públicas de compilação.

Na raiz do repositório, instale as dependências com `npm ci`, copie `frontend/.env.example` para `frontend/.env` e preencha os valores do Supabase. Execute `npm run dev`.

Os comandos `npm test`, `npm run build` e `npm run preview` na raiz encaminham para este workspace. Também é possível executá-los nesta pasta após a instalação feita na raiz. O lockfile e as dependências são gerenciados pelo npm workspace na raiz.

O build gera `dist/` na raiz do repositório para manter o serviço atual do Render. O preview usa esse mesmo diretório. As variáveis locais são lidas de `frontend/.env`; no Render, continuam cadastradas em Environment.

Permissões, funções SQL, autenticação e dados compartilhados ficam no [backend](../backend/README.md). Os clientes em `src/services/` fazem parte do frontend: não devem receber credenciais administrativas. As regras atuais do jogo e os gabaritos ainda são executados no navegador; esta reorganização não altera esse comportamento.
