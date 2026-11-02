# Operação: Código Perdido

Jogo educacional em React para explorar labirintos, programar um robô e resolver desafios de matemática. A aplicação é publicada no Render; autenticação, aprovação de professores e ranking compartilhado usam Supabase.

## Organização

```text
frontend/
  src/                 Interface, motor do jogo e clientes do Supabase
  public/              Imagens e favicon
  tests/               Testes JavaScript
  .env.example         Modelo das variáveis públicas
  index.html           Entrada da aplicação
  package.json         Dependências e comandos do frontend
  vite.config.js       Compilação e preview
backend/
  supabase/
    migrations/        Tabelas, funções SQL, permissões e Realtime
    authorization-checks.sql
  tests/               Testes SQL em banco descartável
  README.md            Configuração e operação do Supabase
package.json           Comandos na raiz e workspace do frontend
package-lock.json      Lockfile único das dependências
render.yaml            Publicação no Render
```

O frontend chama o Supabase pelos clientes em `frontend/src/services/`. O backend é executado no Supabase: não há um servidor Node adicional. As permissões, a identidade dos jogadores e a gravação dos recordes são tratadas pelas funções e políticas SQL. As regras do jogo e os gabaritos continuam no navegador; a separação de pastas não transfere essa validação para o servidor.

## Executar

Use Node.js 24 e npm. Na raiz do repositório:

```sh
npm ci
cp frontend/.env.example frontend/.env
```

Preencha `frontend/.env` com a URL e a chave publicável do projeto Supabase, depois execute:

```sh
npm run dev
```

Para testes e produção:

```sh
npm test
npm run build
npm run preview
```

Os comandos são encaminhados ao workspace `frontend`. O build gera `dist/` na raiz, mantendo o diretório já publicado no Render. Consulte [COMO-EXECUTAR.md](COMO-EXECUTAR.md), [frontend/README.md](frontend/README.md) e [DEPLOY-RENDER.md](DEPLOY-RENDER.md).

## Backend e dados

Configure o Supabase conforme [backend/README.md](backend/README.md). Não repita as migrações já aplicadas. A entrada por apelido e o reset global exigem a nova migração `202611020002_nickname_competitions.sql`, que inicia uma rodada nova e limpa o ranking anterior. As variáveis cadastradas no Render continuam iguais.

Alunos entram apenas com um apelido, salvo no servidor, sem e-mail, senha ou cadastro separado. Professores usam senha e aprovação administrativa. O ranking compartilha o melhor resultado entre jogadores com o mesmo banco de desafios e versão de pontuação; empates são resolvidos pelo menor número de comandos. Resultados idênticos compartilham posição.

Professores aprovados e administradores podem usar **Reiniciar competição** para apagar o ranking, remover os participantes e iniciar uma nova rodada para todas as salas. As contas dos professores são preservadas; abas antigas não podem reenviar resultados da rodada anterior. Veja a ativação da migração `202611020002_nickname_competitions.sql` em [backend/README.md](backend/README.md).

O progresso da campanha e as perguntas personalizadas ficam no navegador, separados por rodada. Publicar o site ou sincronizar o ranking não transfere a campanha entre dispositivos. Os recordes ainda são calculados pelo frontend.

## Jogo

Monte uma sequência de avanços, giros, condições e repetições. Execute a sequência ou teste um passo por vez. Resolva as pistas e alcance o terminal para liberar o próximo setor. As seis fases têm temas e inimigos próprios.

Cada pista vale inicialmente 100 pontos. Erros descontam 15 e dicas descontam 20, até o mínimo de 40 pontos por pista. Concluir o setor acrescenta 200 pontos. Cada comando executado desconta 1 ponto e cada ataque desconta 30, com saldo mínimo de zero por setor. Reiniciar preserva o recorde.

No celular, o mapa abre ampliado com controles de toque. O menu permite acessar pistas, ranking e configurações. A tela cheia é usada quando o navegador oferece suporte.

### Apoios para aprender

- O tutorial jogável aparece para jogadores sem movimentos anteriores e pode ser reaberto em **Como jogar → Praticar no tutorial**. Os quatro treinos apresentam avanço, giro, repetição e condição; podem ser pulados e não alteram campanha ou ranking.
- O painel destaca o último comando executado e explica o movimento, giro, colisão ou condição ignorada. A fila identifica separadamente o comando que vem a seguir. **Passo** executa uma ação por vez, inclusive dentro de uma repetição.
- O editor permite escolher a posição de inserção, mover blocos pelas setas, remover e limpar. **Desfazer edição** (também Ctrl/Cmd+Z fora de campos de texto) restaura a fila; não desfaz movimentos nem devolve pontos. O histórico de edições é descartado ao executar uma ação, sofrer um ataque ou trocar de setor.
- **Sua evolução** compara a quantidade de comandos entre conclusões do mesmo setor e banco de desafios. Aparece no painel, no menu do modo ampliado e ao concluir o setor. O histórico é individual e local, preservado ao reiniciar e separado do ranking. Tentativas abandonadas não entram nessa comparação; alterar o banco de desafios inicia uma nova referência.

## Validação

`npm test` verifica o motor do jogo, persistência local, pontuação, inimigos, áudio, exibição e clientes de cadastro e ranking. Os testes SQL em `backend/tests/competition.sql` verificam migrações e autorizações em PostgreSQL vazio e descartável. Não execute esse arquivo de testes no Supabase de produção.
