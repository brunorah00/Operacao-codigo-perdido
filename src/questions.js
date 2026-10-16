export const LEVEL_INFO = [
  {name:'O arquivo desaparecido', theme:'forest', place:'Floresta dos arquivos', size:20, topic:'Álgebra e funções', color:'#8ce5c0', intro:'O sistema do instituto foi apagado. Siga as pistas no arquivo para descobrir quem acessou o servidor.', reveal:'O acesso veio do laboratório. Uma rotina automática, e não uma pessoa, iniciou o apagão.'},
  {name:'As medidas do mistério', theme:'rock', place:'Lajedo das medidas', size:24, topic:'Geometria e medidas', color:'#9cbcff', intro:'As pistas levam ao laboratório. Reconstrua as medidas do experimento para localizar o sinal perdido.', reveal:'O sinal aponta para o observatório. A rotina estava protegendo uma descoberta importante.'},
  {name:'A última coordenada', theme:'water', place:'Águas do observatório', size:28, topic:'Probabilidade e estatística', color:'#e6bbff', intro:'O código está no observatório. Analise os dados e recupere a chave que pode restaurar o instituto.', reveal:'A chave parcial foi encontrada. Siga até o núcleo de lava e restaure a fábrica.'},
 {theme:'lava',name:'O núcleo em chamas',place:'Fase da lava',size:24,topic:'Razões e temperatura',color:'#ff9554',intro:'Atravesse as passarelas do vulcão e estabilize o núcleo.',reveal:'Núcleo estabilizado. A fábrica pode ser reativada.'},
 {theme:'factory',name:'As máquinas silenciosas',place:'Fábrica abandonada',size:24,topic:'Produção e lógica',color:'#edc762',intro:'Reconstrua os cálculos das máquinas e localize o sinal misterioso.',reveal:'O último sinal vem da ala assombrada.'},
 {theme:'horror',name:'O último espectro',place:'Fase de terror',size:28,topic:'Enigmas e sequências',color:'#b6a0ea',intro:'Entre na ala assombrada e decifre a chave final entre lápides e teias.',reveal:'Os fantasmas eram projeções de segurança! Código recuperado e instituto restaurado.'}

];
const q=(id,title,prompt,answer,hint,explanation,clue)=>({id,title,prompt,answer,hint,explanation,clue});
export const DEFAULT_QUESTIONS = [
 [
  q('a1','A senha do arquivo','A primeira gaveta tem uma senha: 3x + 7 = 28. Qual é o valor de x?','7','Primeiro, subtraia 7 dos dois lados. Depois, divida por 3.','3x = 28 − 7 = 21. Logo, x = 21 ÷ 3 = 7.','O registro de entrada foi alterado às 07h.'),
  q('a2','O sensor de presença','Um sensor usa a função f(x) = 2x + 5. Qual é a leitura f(6)?','17','Substitua x por 6 na expressão.','f(6) = 2 × 6 + 5 = 12 + 5 = 17.','A porta foi aberta pelo sensor 17.'),
  q('a3','Uma sequência suspeita','Os arquivos estão numerados em uma PA: 4, 9, 14, … Qual é o 8º termo?','39','Use aₙ = a₁ + (n − 1)r, com razão r = 5.','a₈ = 4 + (8 − 1) × 5 = 4 + 35 = 39.','O arquivo 39 contém uma trilha de acesso.'),
  q('a4','Bateria de emergência','Uma bateria de 240 Wh perdeu 25% da carga. Quantos Wh ainda restam?','180','Se perdeu 25%, restaram 75% da carga inicial.','240 × 0,75 = 180 Wh.','Houve energia suficiente para uma transferência.'),
  q('a5','Dois terminais','Dois terminais enviaram x + y = 14 pacotes. Sabe-se que x − y = 4. Quantos pacotes enviou o terminal x?','9','Some as duas equações para eliminar y.','(x + y) + (x − y) = 14 + 4 → 2x = 18 → x = 9.','O terminal 9 enviou os dados ao laboratório.'),
  q("a7","O backup diário","Um backup tinha 80 arquivos e recebeu mais 15%. Quantos arquivos passou a ter?","92","Calcule 15% de 80 e some ao total inicial.","80 × 0,15 = 12. Portanto, 80 + 12 = 92 arquivos.","O backup registrou uma mudança automática."),
  q("a8","A leitura invertida","A função do leitor é f(x) = 4x − 3. Se f(x) = 25, qual é x?","7","Some 3 aos dois lados e divida por 4.","4x = 28; logo, x = 7.","O leitor reconheceu a credencial da rotina."),
  q("a9","Pacotes em dobro","Uma sequência de pacotes é 2, 6, 18, … Qual é o próximo termo?","54","Cada termo é o anterior multiplicado por 3.","18 × 3 = 54 pacotes.","A transmissão seguiu um padrão programado."),
  q("a10","O saldo do servidor","O servidor tinha 150 GB livres. Cada cópia ocupa 12 GB. Após 5 cópias, quantos GB ficam livres?","90","Subtraia de 150 o espaço ocupado por cinco cópias.","150 − 5 × 12 = 90 GB.","Havia espaço para preservar os documentos."),
  q("a11","A igualdade dos sensores","Dois sensores produzem 5x + 2 e 3x + 14. Para qual x suas leituras são iguais?","6","Iguale as expressões e agrupe os termos com x.","5x + 2 = 3x + 14; 2x = 12; x = 6.","Os sensores foram sincronizados antes do apagão."),
  q("a12","O ponto de encontro","A posição de um arquivo é dada por f(x) = x² − 4. Qual é f(5)?","21","Eleve 5 ao quadrado e depois subtraia 4.","f(5) = 25 − 4 = 21.","A coordenada encontrada confirma a rota do laboratório."),
  q('a6','A chave de saída','A fechadura aceita a maior raiz da equação x² − 5x + 6 = 0. Qual é essa raiz?','3','Fatore como (x − 2)(x − 3) = 0.','As raízes são 2 e 3. A maior é 3.','O apagão foi acionado por uma rotina automática.')
 ],
 [
  q('g1','O cabo cortado','Um cabo liga os cantos opostos de um retângulo de 6 m por 8 m. Qual é o comprimento do cabo, em metros?','10','A diagonal é a hipotenusa. Use d² = 6² + 8².','d = √(36 + 64) = √100 = 10 m.','O cabo foi desconectado por um mecanismo interno.'),
  q('g2','A marca triangular','Uma marca triangular tem base de 12 cm e altura de 7 cm. Qual é sua área, em cm²?','42','A área do triângulo é base × altura ÷ 2.','A = 12 × 7 ÷ 2 = 42 cm².','A marca coincide com o símbolo do projeto 42.'),
  q('g3','O disco de dados','Um disco circular tem raio de 5 cm. Use π = 3,14. Qual é a área, em cm²?','78.5','A = πr². Você pode usar vírgula na resposta.','A = 3,14 × 25 = 78,5 cm².','O disco guardava uma cópia parcial do código.'),
  q('g4','O recipiente vazio','Um recipiente retangular mede 4 cm × 5 cm × 9 cm. Qual é seu volume, em cm³?','180','Multiplique as três dimensões.','V = 4 × 5 × 9 = 180 cm³.','O recipiente estava vazio antes do apagão.'),
  q('g5','A planta do instituto','Uma planta está na escala 1:200. Um corredor mede 6 cm no desenho. Qual é o comprimento real, em metros?','12','Multiplique 6 por 200 e converta centímetros para metros.','6 × 200 = 1.200 cm = 12 m.','O corredor real termina no observatório.'),
  q("g7","A moldura do painel","Um painel retangular mede 9 m por 4 m. Qual é seu perímetro, em metros?","26","Some os quatro lados do retângulo.","P = 2 × (9 + 4) = 26 m.","O painel cercava o mecanismo de proteção."),
  q("g8","O tanque cilíndrico","Um tanque cilíndrico tem raio de 2 cm e altura de 5 cm. Use π = 3,14. Qual é seu volume, em cm³?","62.8","Use V = πr²h.","V = 3,14 × 4 × 5 = 62,8 cm³.","O tanque alimentava o sistema de emergência."),
  q("g9","O corredor inclinado","Um triângulo retângulo tem hipotenusa de 13 m e um cateto de 5 m. Quanto mede o outro cateto, em metros?","12","Use o teorema de Pitágoras e isole o cateto desconhecido.","b² = 13² − 5² = 169 − 25 = 144; b = 12 m.","O corredor leva ao emissor de segurança."),
  q("g10","A conversão do frasco","Um frasco contém 2,5 litros. Quantos mililitros isso representa?","2500","Cada litro corresponde a 1.000 mililitros.","2,5 × 1.000 = 2.500 mL.","O frasco tinha a medida prevista no protocolo."),
  q("g11","A placa ampliada","Dois triângulos são semelhantes. Um lado de 3 cm no menor corresponde a 9 cm no maior. Quanto mede, no maior, o lado correspondente a 5 cm?","15","A razão de ampliação é 9 ÷ 3.","A razão é 3. Portanto, 5 × 3 = 15 cm.","A placa ampliada revela o símbolo do observatório."),
  q("g12","O piso do laboratório","Um piso quadrado tem área de 64 m². Quanto mede cada lado, em metros?","8","O lado é a raiz quadrada da área.","Como 8 × 8 = 64, cada lado mede 8 m.","A planta confirma onde o sinal foi emitido."),
  q('g6','O sinal no teto','Uma rampa de 10 m forma um ângulo de 30° com o chão. Sabendo que sen(30°) = 0,5, qual é sua altura, em metros?','5','sen(30°) = altura ÷ comprimento da rampa.','altura = 10 × 0,5 = 5 m.','O sinal partiu de um emissor a 5 metros do chão.')
 ],
 [
  q('p1','O relatório de leituras','As leituras do emissor foram 12, 15, 18, 20 e 25. Qual é a média aritmética?','18','Some os cinco valores e divida por 5.','(12 + 15 + 18 + 20 + 25) ÷ 5 = 90 ÷ 5 = 18.','Os dados têm o mesmo padrão do protocolo de segurança.'),
  q('p2','O valor central','Os tempos de resposta ordenados são 3, 5, 8, 11 e 14 ms. Qual é a mediana, em ms?','8','Em cinco valores ordenados, procure o terceiro.','O valor central da sequência é 8 ms.','O protocolo reagiu a uma falha, não a uma invasão.'),
  q('p3','Um evento provável','Um dado comum de 6 faces é lançado. Qual é a probabilidade de sair um número par? Responda em porcentagem, sem o símbolo %.','50','Há três números pares entre os seis resultados possíveis.','P = 3 ÷ 6 = 0,5 = 50%.','Metade dos canais ficou ativa para preservar os dados.'),
  q('p4','A equipe de recuperação','Há 5 pesquisadores. Quantas duplas diferentes podem ser formadas, sem considerar a ordem?','10','Use C(5,2) = 5 × 4 ÷ 2.','C(5,2) = 5! ÷ (2! × 3!) = 10 duplas.','Dez registros confirmam a mesma sequência de eventos.'),
  q('p5','A cópia que cresceu','Uma cópia começa com 3 blocos e dobra a cada minuto. Quantos blocos terá após 4 minutos?','48','Use 3 × 2⁴. O instante inicial é o minuto zero.','3 × 2⁴ = 3 × 16 = 48 blocos.','A cópia de segurança está completa e pode ser restaurada.'),
  q("p7","O valor mais frequente","As leituras foram 4, 6, 6, 8, 9 e 6. Qual é a moda?","6","Procure o valor que aparece mais vezes.","O número 6 aparece três vezes; os demais, uma vez. A moda é 6.","A leitura mais frequente indica estabilidade do emissor."),
  q("p8","A diferença das leituras","As temperaturas foram 14, 18, 21 e 26 °C. Qual é a amplitude, em °C?","12","Subtraia a menor temperatura da maior.","26 − 14 = 12 °C.","A variação térmica acionou a proteção automática."),
  q("p9","O sorteio dos canais","Uma caixa contém 3 fichas azuis e 2 vermelhas. Qual é a probabilidade de retirar uma azul? Responda em porcentagem, sem %.","60","Divida a quantidade de fichas azuis pelo total.","3 ÷ 5 = 0,6 = 60%.","Os canais azuis foram priorizados na recuperação."),
  q("p10","A ordem das chaves","Três chaves diferentes podem ser organizadas em uma fila de quantas maneiras?","6","Use 3 × 2 × 1.","3! = 3 × 2 × 1 = 6 maneiras.","A ordem correta das chaves está registrada no sistema."),
  q("p11","A média dos grupos","Um grupo de 2 sensores tem média 10 e outro de 3 sensores tem média 20. Qual é a média dos 5 sensores?","16","Some os totais dos dois grupos e divida por 5.","(2 × 10 + 3 × 20) ÷ 5 = 80 ÷ 5 = 16.","Os dois grupos confirmam a mesma origem da falha."),
  q("p12","A reserva de dados","Uma reserva começa com 160 blocos e perde metade a cada minuto. Quantos blocos restam após 3 minutos?","20","Divida por 2 três vezes.","160 ÷ 2³ = 160 ÷ 8 = 20 blocos.","A reserva restante permite verificar a chave de restauração."),
  q('p6','O código perdido','A última chave é x = log₂(64). Qual é o valor de x?','6','Pergunte: 2 elevado a qual número resulta em 64?','Como 2⁶ = 64, então log₂(64) = 6.','Chave recuperada. A restauração do instituto foi autorizada!')
 ]
];
DEFAULT_QUESTIONS.push(
 [
 q('l1','Calor crescente','A lava estava a 700 °C e aqueceu 50 °C por hora durante 3 horas. Qual é a temperatura final?','850','Some três aumentos de 50.','700 + 3 × 50 = 850 °C.','O primeiro sensor voltou a funcionar.'),
 q('l2','O resfriamento','Um duto de 120 metros foi dividido em 8 partes iguais. Quantos metros mede cada parte?','15','Divida 120 por 8.','120 ÷ 8 = 15 metros.','Os dutos resfriam o núcleo.'),
 q('l3','Energia do núcleo','O núcleo tem 240 unidades de energia. Foram usadas 25%. Quantas restam?','180','Restaram 75% da energia.','240 × 0,75 = 180.','A energia restante alimenta a fábrica.')
 ],
 [
 q('f1','Linha de montagem','Uma máquina produz 18 peças por minuto. Quantas produz em 7 minutos?','126','Multiplique a produção pelo tempo.','18 × 7 = 126 peças.','A linha de montagem foi restaurada.'),
 q('f2','Engrenagens','Uma engrenagem dá 4 voltas enquanto outra dá 12. Se a primeira der 9 voltas, quantas dará a segunda?','27','A segunda gira três vezes mais.','9 × 3 = 27 voltas.','As engrenagens abriram uma porta oculta.'),
 q('f3','Lote defeituoso','Em um lote de 200 peças, 10 apresentam defeito. Qual é a porcentagem de peças defeituosas?','5','Divida 10 por 200 e multiplique por 100.','10 ÷ 200 × 100 = 5%.','O último sinal vem da ala assombrada.')
 ],
 [
 q('h1','As badaladas','O sino toca 3, 6, 12 e 24 vezes em noites consecutivas. Quantas vezes tocará na próxima noite?','48','Cada quantidade é o dobro da anterior.','24 × 2 = 48 badaladas.','As badaladas seguem um programa.'),
 q('h2','Sombras no corredor','Quatro projetores criam 7 sombras cada um. Quantas sombras aparecem ao todo?','28','Multiplique o número de projetores por 7.','4 × 7 = 28 sombras.','As sombras são projeções de segurança.'),
 q('h3','Cadeado espectral','O cadeado abre com x na equação 3x − 9 = 18. Qual é x?','9','Some 9 aos dois lados e divida por 3.','3x = 27; x = 9.','Código final recuperado. O instituto está seguro!')
 ]
);
export function numeric(value){
 const s=String(value).trim().replace(',','.');
 if (/^[+-]?\d+(?:\.\d+)?$/.test(s)) return Number(s);
 const fraction=s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
 return fraction && Number(fraction[2])!==0 ? Number(fraction[1])/Number(fraction[2]) : NaN;
}
export function validateQuestions(data){
 if(!Array.isArray(data)||![3,LEVEL_INFO.length].includes(data.length)) throw Error('O banco precisa conter os seis mapas.');
 if(data.length===3)data=[...data,...structuredClone(DEFAULT_QUESTIONS.slice(3))];
 const ids=new Set();
 return data.map((level,i)=>{
  if(!Array.isArray(level)||level.length<3||level.length>12) throw Error(`O mapa ${i+1} precisa ter de 3 a 12 desafios.`);
  return level.map((item,j)=>{
   const entry={};
   for(const key of ['id','title','prompt','answer','hint','explanation','clue']){
    if(typeof item?.[key]!=='string'||!item[key].trim()||item[key].length>1200) throw Error(`Preencha todos os campos do desafio ${j+1} do mapa ${i+1} (máximo de 1.200 caracteres).`);
    entry[key]=item[key].trim();
   }
   if(ids.has(entry.id)) throw Error('Cada desafio precisa ter um identificador único.');
   if(!Number.isFinite(numeric(entry.answer))) throw Error('As respostas devem ser números ou frações válidas.');
   ids.add(entry.id); return entry;
  });
 });
}
