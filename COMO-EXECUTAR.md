# Executar o jogo no seu computador

Use Node.js 24 e npm. Abra um terminal na raiz do projeto, onde estão `package.json` e `render.yaml`.

```sh
npm ci
cp frontend/.env.example frontend/.env
```

Preencha `frontend/.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Configure o banco seguindo [backend/README.md](backend/README.md). Se ele já está configurado, não repita as migrações.

```sh
npm run dev
```

Abra o endereço mostrado no terminal, normalmente http://127.0.0.1:5173.

A aplicação fica em `frontend/`; o banco, as funções e as permissões ficam em `backend/`. Os comandos na raiz usam o workspace do frontend. O arquivo `frontend/.env` é local e não deve ser enviado ao GitHub.

## Testar e compilar

```sh
npm test
npm run build
npm run preview
```

O build gera `dist/` na raiz. O preview serve esse diretório. A configuração atual do Render continua usando `npm ci --include=dev && npm run build`, com Publish Directory `dist` e Root Directory vazio. Veja [DEPLOY-RENDER.md](DEPLOY-RENDER.md).

## Dados e acesso

Alunos entram por e-mail. Professores usam senha e precisam de aprovação. O ranking é compartilhado pelo Supabase Realtime quando a migração correspondente já foi aplicada. Perguntas personalizadas e progresso da campanha continuam no navegador atual.

## Controles

Monte a sequência de comandos e toque em Executar ou Passo. No celular, o jogo abre ampliado; Painel retorna à interface completa. O menu reúne pistas, ranking e configurações. A tela cheia depende do suporte do navegador.
