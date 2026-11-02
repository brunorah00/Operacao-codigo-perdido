# Backend — Supabase

O backend é executado no Supabase. Esta pasta contém tabelas, funções RPC, políticas de acesso, publicação Realtime e testes SQL. Não há servidor Node adicional para iniciar. Os comandos npm são executados na raiz do repositório.

## Ativar apelidos e reset da competição

Se as três migrações anteriores já foram aplicadas, execute **somente** `backend/supabase/migrations/202611020002_nickname_competitions.sql` no SQL Editor do Supabase, inteiro e uma única vez.

**Essa migração inicia uma competição nova e limpa o ranking e as sessões de alunos anteriores.** A entrada de alunos por e-mail é desativada. Cadastros, senhas e aprovações de professores e administradores são preservados. Após o deploy, alunos entram novamente usando apenas um apelido.

O frontend e essa migração precisam estar atualizados. Sem a migração, a tela de entrada mostra o nome do arquivo necessário. Não repita migrações antigas.

## Instalação em projeto novo

1. Crie um projeto Supabase e execute os arquivos abaixo em ordem:
   1. `backend/supabase/migrations/202610140001_profiles.sql`
   2. `backend/supabase/migrations/202610140002_students_without_password.sql`
   3. `backend/supabase/migrations/202611020001_live_leaderboard.sql`
   4. `backend/supabase/migrations/202611020002_nickname_competitions.sql`
2. Na raiz do repositório, copie `frontend/.env.example` para `frontend/.env` e preencha URL e chave publicável do projeto. Nunca use service_role/secret em variáveis VITE.
3. Em Authentication, configure a URL final do site, as URLs de redirecionamento e a confirmação de e-mail para professores. Configure senha mínima de 8 caracteres no servidor.
4. Execute `npm ci` e `npm run dev` na raiz. No Render, mantenha as duas variáveis públicas em Environment e faça um novo build após alterá-las.

## Alunos: apenas apelido

A função `enter_competition_student` cria ou retoma uma identificação no servidor, sem e-mail, senha ou cadastro separado. Apelidos têm 2 a 30 caracteres. Espaços extras e diferenças de maiúsculas são normalizados; o mesmo apelido na mesma rodada identifica o mesmo jogador. Oriente a turma a usar apelidos exclusivos.

O apelido e os recordes ficam no servidor. A sessão é lembrada no navegador e validada no servidor antes de abrir o jogo. Por ser um acesso didático sem senha, conhecer um apelido permite retomar aquela identificação. A campanha continua salva localmente, sem sincronização de posição entre dispositivos.

A identidade do aluno não concede permissões de professor. Tabelas de participantes e tokens não têm leitura ou escrita direta liberada para os clientes. As funções conferem a sessão e o identificador da competição.

## Reiniciar todos os jogadores

Um **professor aprovado** encontra **Reiniciar competição** na barra lateral do painel ou no menu do modo ampliado. O administrador também possui o botão em seu painel. É necessário digitar `REINICIAR` e confirmar **Apagar e reiniciar todos**.

O reset é global para este projeto Supabase, incluindo todas as salas que o usam:

- Apaga todos os recordes, apelidos e sessões da competição atual.
- Cria uma rodada nova e exige uma nova entrada dos alunos.
- Faz alunos e professores começarem a campanha e a evolução individual do início, usando salvamentos separados por rodada.
- Mantém as contas e aprovações dos professores e administradores.

A ação não pode ser desfeita. Para competições simultâneas independentes por turma, seria necessário adicionar salas; o reset atual é único e global.

A função `reset_competition` verifica a autorização no servidor. Alunos, visitantes e professores pendentes ou revogados não podem executá-la. A rodada esperada evita resets duplicados. Reset, entrada de alunos e gravação de recordes usam bloqueios no mesmo registro, evitando corridas: envios de abas antigas e dispositivos offline são recusados após o reset, mesmo que ainda possuam pontuações locais.

A mudança é recebida por Realtime; uma consulta a cada 5 segundos e a recuperação ao voltar à janela/rede cobrem eventos perdidos. Quando um aluno offline reconecta, precisa entrar na rodada atual. Os salvamentos locais anteriores ficam fora da rodada ativa e não são importados para o novo ranking.

## Ranking ao vivo

A tabela `leaderboard` guarda o melhor saldo por jogador, banco de desafios e versão de pontuação, apenas na rodada atual. Pontuação maior vence; em empate, menos comandos vence. Resultados idênticos compartilham posição. O upsert atômico impede que envios atrasados reduzam o recorde.

Novos recordes são publicados em aproximadamente um segundo com conexão. Outros dispositivos recebem mudanças por Supabase Realtime; consultas a cada 10 segundos recuperam eventos perdidos. `leaderboard` e `competition_state` são incluídas na publicação `supabase_realtime` pelas migrações.

Nomes e resultados do ranking são públicos para os visitantes do projeto; e-mails e tokens não fazem parte da tabela. Pontos ainda são calculados no frontend: a competição didática não possui validação antifraude das ações no servidor.

## Administrador

Crie o usuário em Authentication > Users com e-mail confirmado e metadados `{"name":"Administrador","role":"teacher"}`. Depois execute no SQL Editor, substituindo o UUID:

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = 'UUID-DO-USUARIO';
```

Não há cadastro público de administrador. Não coloque senhas em arquivos do projeto. Professores se cadastram pela tela própria e aguardam aprovação no painel administrativo.

## Verificação após publicar

1. Entre com dois alunos usando apelidos distintos, em navegadores diferentes, sem informar e-mail ou senha.
2. Resolva uma pista e confira a atualização do ranking no outro navegador.
3. Entre com um professor aprovado e clique em Reiniciar competição. Confira a confirmação antes de executar.
4. Verifique se os dois alunos voltam à entrada e se o mesmo apelido inicia uma campanha e um ranking zerados na nova rodada.
5. Confira que a conta do professor permanece ativa e que abas antigas não conseguem repor recordes.
6. Repita com um aluno offline; ao reconectar, sua rodada anterior deve ser invalidada.

## Testes locais do banco

`backend/tests/competition.sql` executa todas as migrações em um PostgreSQL vazio e descartável e verifica apelidos, sessões, ranking, aprovação de professores, reset global e bloqueio de resultados da rodada anterior:

```sh
psql -v ON_ERROR_STOP=1 -f backend/tests/competition.sql DATABASE
```

**Não execute esse arquivo de testes no Supabase de produção.** Ele inclui o bootstrap dos testes anteriores (`leaderboard.sql`). `backend/supabase/authorization-checks.sql` contém verificações da autorização de alunos Auth da etapa anterior; o acesso atual dos alunos usa sessões de apelido.

## Falha de conexão

Se aparecer `ERR_NAME_NOT_RESOLVED`, confira se o projeto está ativo e copie sua Project URL e chave publicável para `frontend/.env`, ambas do mesmo projeto. Reinicie o Vite ou faça um novo build no Render após alterar variáveis. Verifique também o DNS e a conexão local.
