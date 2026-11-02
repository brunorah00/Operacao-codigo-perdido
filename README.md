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

Configure o Supabase conforme [backend/README.md](backend/README.md). As migrações existentes apenas mudaram de pasta: se já foram aplicadas, não as execute novamente. Esta reorganização não exige migração de dados nem alteração das variáveis cadastradas no Render.

Alunos entram por e-mail, sem senha, no fluxo didático. Professores usam senha e aprovação administrativa. O ranking compartilha o melhor resultado entre jogadores com o mesmo banco de desafios e versão de pontuação; empates são resolvidos pelo menor número de comandos. Resultados idênticos compartilham posição.

O progresso da campanha e as perguntas personalizadas ficam no navegador. Publicar o site ou sincronizar o ranking não transfere a campanha entre dispositivos. Os recordes ainda são calculados pelo frontend.

## Jogo

Monte uma sequência de avanços, giros, condições e repetições. Execute a sequência ou teste um passo por vez. Resolva as pistas e alcance o terminal para liberar o próximo setor. As seis fases têm temas e inimigos próprios.

Cada pista vale inicialmente 100 pontos. Erros descontam 15 e dicas descontam 20, até o mínimo de 40 pontos por pista. Concluir o setor acrescenta 200 pontos. Cada comando executado desconta 1 ponto e cada ataque desconta 30, com saldo mínimo de zero por setor. Reiniciar preserva o recorde.

No celular, o mapa abre ampliado com controles de toque. O menu permite acessar pistas, ranking e configurações. A tela cheia é usada quando o navegador oferece suporte.

## Validação

`npm test` verifica o motor do jogo, persistência local, pontuação, inimigos, áudio, exibição e clientes de cadastro e ranking. Os testes SQL em `backend/tests/leaderboard.sql` verificam migrações e autorizações em PostgreSQL vazio e descartável. Não execute esse arquivo de testes no Supabase de produção.
