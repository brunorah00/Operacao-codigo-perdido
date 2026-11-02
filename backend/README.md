# Backend — Supabase

O backend é executado no Supabase. Esta pasta contém tabelas, funções RPC, políticas de acesso, publicação Realtime e testes SQL. Não há servidor Node adicional. Execute os comandos npm na raiz do repositório.

## Ativar a lista de salas

Com as migrações anteriores, inclusive `202611020003_school_rooms.sql`, já aplicadas, execute **somente** `backend/supabase/migrations/202611020004_room_list_entry.sql` no SQL Editor, inteiro e uma única vez.

Essa atualização preserva as salas, os alunos, as sessões e os resultados existentes. A entrada do aluno passa a usar uma lista, sem digitar código. A lista mostra o nome da sala e do professor, atualiza por Realtime e consulta de recuperação a cada 5 segundos, e oferece atualização manual. Sem salas, a entrada fica bloqueada com uma orientação para aguardar o professor.

A migração anterior (`202611020003_school_rooms.sql`) é a que converte a competição global em salas e limpa os dados antigos sem sala. Não a execute novamente se já foi aplicada.

Não repita migrações já aplicadas. Em um projeto novo, execute todas na ordem:

1. `202610140001_profiles.sql`
2. `202610140002_students_without_password.sql`
3. `202611020001_live_leaderboard.sql`
4. `202611020002_nickname_competitions.sql`
5. `202611020003_school_rooms.sql`
6. `202611020004_room_list_entry.sql`

Os arquivos estão em `backend/supabase/migrations/`. Aplique a migração e publique o frontend atualizado. As variáveis do Render permanecem iguais.

## Professores e salas

Professores usam e-mail, senha e aprovação administrativa. Após entrar, o painel **Minhas salas** permite criar uma sala com nome para que apareça na lista dos alunos. **Abrir sala** abre o jogo, os rankings e os controles daquela sala. **Minhas salas** retorna ao painel sem encerrar a sessão do professor.

Cada professor lista e gerencia apenas suas próprias salas. O administrador pode gerenciar todas e continua aprovando professores. As funções de criação, exclusão e reset verificam o perfil ativo e a propriedade da sala no servidor. Professores pendentes ou revogados e alunos não possuem essas permissões.

O nome e o estado das salas são públicos para acompanhamento e classificação. A função `available_school_rooms` disponibiliza apenas identificador, nome da sala e nome do professor, sem e-mails ou códigos. `join_school_room` valida a sala escolhida e reutiliza a entrada protegida contra exclusão/reset concorrentes. Os códigos internos continuam funcionando para compatibilidade, mas não são necessários nem expostos na lista dos alunos.

## Alunos

O aluno seleciona **Sala** na lista e informa **Nome ou apelido**, sem cadastro, e-mail ou senha. O servidor cria ou retoma uma identificação naquela sala. Nomes têm 2 a 120 caracteres; espaços extras e diferenças de maiúsculas são normalizados. Oriente os alunos a usar nomes ou apelidos exclusivos dentro da sala.

O mesmo nome em salas diferentes identifica participantes distintos. Dentro da mesma sala e rodada, ele retoma a identificação existente. O acesso é didático: escolher a sala e conhecer o nome permite retomar essa identificação, sem comprovação de identidade.

O nome e os recordes ficam no servidor. A sessão é lembrada no navegador e validada no servidor. O progresso da campanha e a evolução pessoal continuam locais, separados por rodada; não são sincronizados entre dispositivos.

## Rankings da sala e geral

O painel possui duas opções:

- **Ranking da sala:** apenas os alunos da sala atual.
- **Ranking geral:** alunos de todas as salas existentes, com a sala identificada ao lado de cada nome.

Ambos comparam somente partidas com banco de desafios e versão de pontuação iguais. O melhor saldo vence; em empate, menos comandos vence. Resultados idênticos compartilham posição. Professores podem testar o jogo, mas não enviam resultados para a classificação dos alunos.

Uma única tabela guarda os recordes e identifica a sala de cada participante. As escritas conferem sessão, sala e rodada no servidor; o cliente não escolhe a sala atribuída ao resultado. As atualizações chegam por Realtime, com consulta de recuperação a cada 10 segundos e ao voltar à janela/rede.

Nomes, salas e resultados da classificação são públicos; códigos, e-mails e tokens não fazem parte dos registros públicos do ranking. Pontos ainda são calculados no frontend, sem validação antifraude das ações no servidor.

## Excluir e reiniciar

**Excluir sala** fica no painel de salas. Exige digitar `EXCLUIR` e confirmar. Remove permanentemente a sala, seu código, alunos, sessões e resultados dos dois rankings. Os participantes são devolvidos à entrada; a sala desaparece da lista e deixa de aceitar entradas. Não afeta outras salas nem as contas dos professores.

**Reiniciar sala** fica dentro da sala, na barra lateral ou no menu do modo ampliado. Exige digitar `REINICIAR`. Preserva a sala na lista, mas limpa seus participantes e resultados, inclusive no ranking geral, e cria uma rodada nova. Todos os participantes daquela sala começam do início. O antigo reset global fica desativado.

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

## Recuperação de senha dos professores

Em **Professor / admin → Esqueci minha senha**, o professor informa o e-mail cadastrado. O Supabase envia um link que abre **Defina sua nova senha**. Basta informar uma senha de pelo menos 8 caracteres, usar Mostrar senha se desejar e salvar. A recuperação também atende o administrador; não altera o papel nem a aprovação da conta.

Não há nova migração SQL. Em **Authentication → URL Configuration**:

- Confira **Site URL** com a URL pública do Render.
- Adicione em **Redirect URLs** a URL exata `https://SEU-SITE.onrender.com/?recuperar=1`, substituindo pelo domínio real.
- Para testes locais, adicione `http://127.0.0.1:5173/?recuperar=1` ou a porta usada pelo Vite.

O envio usa `resetPasswordForEmail`; a sessão recebida pelo link é usada para `updateUser({password})`. O formulário de nova senha tem prioridade sobre o painel e continua acessível se a página for recarregada. Links expirados ou já usados oferecem uma nova solicitação. A resposta de envio não informa se o e-mail existe.

O envio real depende da configuração de e-mail do projeto Supabase. Se não chegar, confira spam, os registros de Auth, limites de envio, o provedor SMTP e o template Reset Password (o padrão com `{{ .ConfirmationURL }}` é compatível). Os testes automatizados simulam o e-mail; valide uma entrega real com uma conta de professor após o deploy.

Referências: [recuperação de senha](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [URLs autorizadas](https://supabase.com/docs/guides/auth/redirect-urls).

## Validação

Após publicar, crie duas salas, entre com alunos em dispositivos diferentes e confira os dois rankings. Exclua uma sala e confira que os seus alunos voltam à entrada e seus resultados somem do ranking geral, sem afetar a outra sala. Confira também um dispositivo que estava offline e a tentativa de um professor gerenciar a sala de outro.

Os testes em `backend/tests/room-list.sql` executam todas as migrações e testes anteriores em PostgreSQL vazio e descartável:

```sh
psql -v ON_ERROR_STOP=1 -f backend/tests/room-list.sql DATABASE
```

**Não execute esse arquivo de testes no Supabase de produção.** Ele verifica listagem sem dados privados, entrada por sala selecionada, preservação de resultados existentes, exclusão e rejeição de salas inválidas, além das verificações anteriores de rankings, propriedade e sessões.

Se aparecer `ERR_NAME_NOT_RESOLVED`, confira a Project URL, a chave publicável, o projeto ativo, DNS e conexão. Reinicie o Vite ou publique um novo build após mudar variáveis.
