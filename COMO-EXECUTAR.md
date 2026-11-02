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

No primeiro acesso de um jogador sem movimentos anteriores, o tutorial apresenta quatro treinos. É possível pulá-lo ou reabri-lo em Como jogar → Praticar no tutorial.

No editor, escolha onde inserir um comando e use as setas da lista para reorganizar a sequência. Desfazer edição restaura a fila sem alterar a posição ou os pontos do robô. O destaque amarelo explica o comando realizado; “A seguir” indica o próximo da fila.

O quadro Sua evolução compara comandos entre conclusões do mesmo setor, neste navegador. No modo ampliado, ele também está no menu e no resumo de conclusão.
