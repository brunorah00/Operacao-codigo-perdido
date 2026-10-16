# Operação: Código Perdido

**Backend em implantação:** a entrada agora usa cadastro e login Supabase, com aprovação administrativa de professores. Consulte [BACKEND.md](BACKEND.md) para configurar banco, variáveis e administrador. As descrições abaixo sobre identificação por nome referem-se à versão local anterior. Progresso e ranking ainda são locais nesta etapa.


Jogo educacional em React e Vite para ensino médio. Esta implementação independente preserva a proposta do robô detetive; o código do projeto anterior não estava disponível na sessão.

## Ambientes e inimigos

Cada uma das seis fases possui um único tema: floresta, lajedo, água, lava, fábrica e terror. A campanha tem 45 desafios iniciais. Os corredores foram ampliados com áreas abertas para desviar das patrulhas.

Vespas, golems, medusas, criaturas de lava, drones e espectros aparecem em posições aleatórias a cada nova partida ou reinício, com animações e sons próprios. Os inimigos patrulham na vertical ou na diagonal, respeitando paredes. Cada ataque desconta 30 pontos do setor, interrompe os comandos e devolve o robô à origem sem apagar pistas resolvidas. O saldo mínimo continua sendo zero. A origem fica protegida e o robô recebe proteção temporária após o ataque. As patrulhas pausam durante desafios, painéis e quando a aba está oculta.

## Jogar

No celular, o jogo abre com o mapa ampliado e os comandos na parte inferior. O botão “Ampliar jogo” ativa esse modo em outras telas. O mapa acompanha o tamanho disponível na vertical e na horizontal. Os botões de avanço, giro, condição, repetição, execução e passo têm alvos maiores para toque. “Painel” volta à tela completa; o menu permite acessar os demais recursos.

O botão de tela cheia do navegador aparece quando a API está disponível. Quando o navegador não oferece ou recusa a tela cheia, o modo ampliado segue funcionando na janela. Os cards e menus ficam dentro do mesmo elemento de tela cheia.


Monte uma sequência de avanços, giros, condições e repetições. Execute a sequência ou teste um passo por vez. O robô pausa ao encontrar um card. Resolva todas as pistas e alcance o terminal para liberar o próximo setor.

- Arquivo central: mapa 20 × 20, álgebra e funções.
- Laboratório: mapa 24 × 24, geometria e medidas.
- Observatório: mapa 28 × 28, probabilidade, estatística e crescimento exponencial.
- 36 desafios iniciais, de 3 a 12 editáveis por setor.
- Lanterna direcional com oclusão por paredes e memória de exploração.
- Paleta arcade com interface clara em azul, vermelho e amarelo, robô colorido e três combinações de terreno. O tema fica em `src/arcade.css`, e as cores do mapa em `src/visuals.jsx`.
- Cada pista vale até 100 pontos; erro reduz 15 e dica reduz 20, até o mínimo de 40. Concluir um mapa acrescenta 200 pontos. Cada comando executado desconta 1 ponto do setor; o saldo mínimo do setor é zero. Avanços, giros, condições e tentativas contra paredes contam. Uma repetição de 3 avanços custa 3 comandos; editar a fila não conta.

Antes de jogar, informe nome e sobrenome. O mesmo nome e sobrenome, ignorando maiúsculas e espaços extras, retoma a partida daquele jogador. O botão “Trocar jogador” volta à identificação. Cada jogador tem progresso próprio. O ranking é atualizado com a melhor pontuação individual, sem somar tentativas repetidas; em empate de pontos, menos comandos dá vantagem; empate também em comandos compartilha a posição. A identificação é um perfil local sem senha.

O banco de desafios permite criar, editar, excluir e importar/exportar JSON. A aplicação usa localStorage para jogadores, ranking, perguntas e progresso; os dados pertencem ao navegador atual e não são sincronizados entre dispositivos. Alterar o banco reinicia a campanha do jogador e uma classificação distinta: apenas bancos idênticos são comparados. Novos jogadores usam o banco selecionado mais recentemente. Não há backend nem dependência de CDN em tempo de execução.

Os recordes da regra anterior são recalculados com base na partida atualmente salva, pois os recordes históricos antigos não registravam os comandos. Nomes, perguntas e progresso são preservados. O progresso da versão sem jogadores é associado ao primeiro jogador que se identificar. A tela de identificação aparece novamente a cada abertura da página.

## Desenvolvimento

```sh
npm install
npm run build
npm test
```

O diretório `dist` contém a versão estática. A hospedagem é privada e tem sua identidade em `.openai/hosting.json`.

## Validação

Os testes percorrem toda a campanha, resolvem os 36 cards, validam a pontuação final de 3.644 pontos (4.200 pontos conquistados menos 556 comandos) e os desbloqueios. Também verificam a conectividade e bordas dos mapas com 3–12 cards, colisões, giros, repetição, condições, bloqueio da saída, dicas, erros, persistência, edição/importação de questões e recuperação de dados inválidos.

Os testes de exibição verificam proporções de mapa em celulares na vertical e na horizontal, além da entrada e saída de tela cheia com APIs simuladas, inclusive quando ausentes ou recusadas. A compilação de produção é verificada. A sessão de criação não tinha o recurso control-browser; a revisão visual e a interação no navegador não puderam ser verificadas nesse ambiente.
