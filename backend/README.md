# Backend — Supabase

O backend é executado no Supabase. Esta pasta contém tabelas, funções RPC, políticas de acesso, publicação Realtime e testes SQL. Não há servidor Node adicional. Execute os comandos npm na raiz do repositório.

## Ativar salas

Com as migrações anteriores já aplicadas, execute **somente** `backend/supabase/migrations/202611020003_school_rooms.sql` no SQL Editor, inteiro e uma única vez.

**A migração limpa o ranking e os participantes da competição global anterior**, que não estavam associados a salas. Mantém as contas e aprovações de professores e administradores. Depois do deploy, cada professor cria suas salas e compartilha os códigos. Não há entrada de aluno sem uma sala válida.

Não repita migrações já aplicadas. Em um projeto novo, execute todas na ordem:

1. `202610140001_profiles.sql`
2. `202610140002_students_without_password.sql`
3. `202611020001_live_leaderboard.sql`
4. `202611020002_nickname_competitions.sql`
5. `202611020003_school_rooms.sql`

Os arquivos estão em `backend/supabase/migrations/`. Aplique a migração e publique o frontend atualizado. As variáveis do Render permanecem iguais.

## Professores e salas

Professores usam e-mail, senha e aprovação administrativa. Após entrar, o painel **Minhas salas** permite criar uma sala com nome e obter um código de seis caracteres. **Abrir sala** abre o jogo, os rankings e os controles daquela sala. **Minhas salas** retorna ao painel sem encerrar a sessão do professor.

Cada professor lista e gerencia apenas suas próprias salas. O administrador pode gerenciar todas e continua aprovando professores. As funções de criação, exclusão e reset verificam o perfil ativo e a propriedade da sala no servidor. Professores pendentes ou revogados e alunos não possuem essas permissões.

O nome e o estado das salas são públicos para acompanhamento e classificação. Os códigos de entrada ficam em uma tabela sem acesso direto de clientes; o professor recebe os seus códigos por funções autorizadas. O aluno informa um código para ingressar.

## Alunos

O aluno informa **Código da sala** e **Nome ou apelido**, sem cadastro, e-mail ou senha. O servidor cria ou retoma uma identificação naquela sala. Nomes têm 2 a 120 caracteres; espaços extras e diferenças de maiúsculas são normalizados. Oriente os alunos a usar nomes ou apelidos exclusivos dentro da sala.

O mesmo nome em salas diferentes identifica participantes distintos. Dentro da mesma sala e rodada, ele retoma a identificação existente. O acesso é didático: conhecer o nome e o código permite retomar essa identificação, sem comprovação de identidade.

O nome e os recordes ficam no servidor. A sessão é lembrada no navegador e validada no servidor. O progresso da campanha e a evolução pessoal continuam locais, separados por rodada; não são sincronizados entre dispositivos.

## Rankings da sala e geral

O painel possui duas opções:

- **Ranking da sala:** apenas os alunos da sala atual.
- **Ranking geral:** alunos de todas as salas existentes, com a sala identificada ao lado de cada nome.

Ambos comparam somente partidas com banco de desafios e versão de pontuação iguais. O melhor saldo vence; em empate, menos comandos vence. Resultados idênticos compartilham posição. Professores podem testar o jogo, mas não enviam resultados para a classificação dos alunos.

Uma única tabela guarda os recordes e identifica a sala de cada participante. As escritas conferem sessão, sala e rodada no servidor; o cliente não escolhe a sala atribuída ao resultado. As atualizações chegam por Realtime, com consulta de recuperação a cada 10 segundos e ao voltar à janela/rede.

Nomes, salas e resultados da classificação são públicos; códigos, e-mails e tokens não fazem parte dos registros públicos do ranking. Pontos ainda são calculados no frontend, sem validação antifraude das ações no servidor.

## Excluir e reiniciar

**Excluir sala** fica no painel de salas. Exige digitar `EXCLUIR` e confirmar. Remove permanentemente a sala, seu código, alunos, sessões e resultados dos dois rankings. Os participantes são devolvidos à entrada; o código deixa de funcionar. Não afeta outras salas nem as contas dos professores.

**Reiniciar sala** fica dentro da sala, na barra lateral ou no menu do modo ampliado. Exige digitar `REINICIAR`. Preserva a sala e seu código, mas limpa seus participantes e resultados, inclusive no ranking geral, e cria uma rodada nova. Todos os participantes daquela sala começam do início. O antigo reset global fica desativado.

As operações usam bloqueios no registro da sala. Uma gravação concorrente termina antes da exclusão/reset ou é recusada depois deles; abas antigas e dispositivos offline não conseguem repor resultados removidos. A mudança de sala é acompanhada por Realtime e consultas a cada 5 segundos. Após reconectar, o aluno precisa entrar na sala e rodada válidas.

## Configuração local e administrador

Na raiz, copie `frontend/.env.example` para `frontend/.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do mesmo projeto ativo. Nunca use service_role/secret em variáveis VITE. Execute `npm ci` e `npm run dev`.

No Supabase Authentication, configure a URL final do site, as URLs de redirecionamento e a confirmação de e-mail para professores. Configure senha mínima de 8 caracteres no servidor. No Render, mantenha as duas variáveis públicas em Environment e faça um novo build ao alterá-las.

Crie o administrador em Authentication > Users com e-mail confirmado e metadados `{"name":"Administrador","role":"teacher"}`. Depois execute, substituindo o UUID:

```sql
update public.profiles
set role = 'admin', status = 'active'
where id = 'UUID-DO-USUARIO';
```

Não há cadastro público de administrador. Não coloque senhas nos arquivos do projeto.

## Validação

Após publicar, crie duas salas, entre com alunos em dispositivos diferentes e confira os dois rankings. Exclua uma sala e confira que os seus alunos voltam à entrada e seus resultados somem do ranking geral, sem afetar a outra sala. Confira também um dispositivo que estava offline e a tentativa de um professor gerenciar a sala de outro.

Os testes em `backend/tests/rooms.sql` executam todas as migrações e testes anteriores em PostgreSQL vazio e descartável:

```sh
psql -v ON_ERROR_STOP=1 -f backend/tests/rooms.sql DATABASE
```

**Não execute esse arquivo de testes no Supabase de produção.** Ele verifica entrada obrigatória por sala, códigos, identidades separadas, rankings, propriedade das salas, exclusão, reset e rejeição de sessões antigas.

Se aparecer `ERR_NAME_NOT_RESOLVED`, confira a Project URL, a chave publicável, o projeto ativo, DNS e conexão. Reinicie o Vite ou publique um novo build após mudar variáveis.
