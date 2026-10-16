# Executar o jogo no seu computador

Esta versão corrige o mapa sem altura ao ampliar o jogo, que causava a área totalmente azul. Também mantém a última medida válida do mapa durante redimensionamentos.


## Modo para celular e tela cheia

No celular, após a identificação, o jogo abre com o mapa ampliado e comandos na parte inferior. Toque nos botões para montar a sequência, depois em Executar ou Passo. O botão Painel volta à tela completa. Em computadores, use Ampliar jogo para ativar o mesmo modo.

O ícone de expansão na barra superior ativa a tela cheia do navegador quando disponível. Se o navegador não permitir, o modo ampliado continua funcionando na janela. O menu de pausa mantém acesso a pistas, ranking, desafios, troca de jogador, setores e velocidade. O mapa acompanha a área disponível nas orientações vertical e horizontal.

## Instalação e execução


Este ZIP contém a nova paleta arcade colorida, com interface clara em azul, vermelho e amarelo, terrenos coloridos e robô em azul, amarelo e vermelho. O tema está em src/arcade.css. Também contém o código React atualizado, o robô caminhando, identificação por nome e sobrenome, ranking local e desconto de pontos pela quantidade de comandos executados.

1. Extraia o ZIP e abra a pasta operacao-codigo-perdido no VS Code.
2. Abra um terminal nessa pasta. É necessário Node.js 22.13 ou superior e npm.
3. Execute:

```sh
npm install
npm run dev
```

4. Abra o endereço mostrado no terminal (normalmente http://127.0.0.1:5173).

Cada comando executado desconta 1 ponto da pontuação daquele setor, com saldo mínimo de zero. Giros, condições e tentativas contra paredes também contam. Repetir avanço 3 vezes conta como 3 comandos. Apenas editar a sequência não desconta pontos. Exemplo: 100 pontos conquistados menos 20 comandos resulta em 80 pontos.

O ranking registra o melhor saldo e os comandos utilizados para alcançá-lo. Em empate de pontos, menos comandos dá vantagem. Os recordes da regra anterior são recalculados a partir das partidas atualmente salvas. Nomes, questões e progresso são mantidos.

Antes de jogar, preencha nome e sobrenome. O mesmo nome e sobrenome retoma a partida salva. Use “Trocar jogador” no topo para outra pessoa jogar. Os dados ficam neste navegador, sem sincronização entre computadores. Partidas com bancos de desafios diferentes têm classificações separadas.

Para executar os testes:

```sh
npm test
```

Para gerar e conferir a versão de produção:

```sh
npm run build
npm run preview
```

Este pacote é uma cópia portátil e não inclui a configuração privada de implantação, as dependências instaladas nem nomes, ranking ou progresso do navegador.
