import {DIRS} from '../../engine.js';

export const TUTORIAL_STEPS=[
 {title:'Avance até a estrela',instruction:'O robô olha para a direita. Adicione dois avanços e toque em Executar ou Passo.',start:{x:1,y:1,dir:1},target:{x:3,y:1},commands:['forward']},
 {title:'Girar muda a direção',instruction:'Chegue à estrela acima do corredor. Combine avanços e um giro à esquerda. Girar muda a direção, sem sair da casa.',start:{x:1,y:2,dir:1},target:{x:3,y:1},commands:['forward','left','right'],needs:'turn'},
 {title:'Um bloco, três avanços',instruction:'Adicione Repetir avanço 3× e execute. Um bloco de repetição executa vários movimentos.',start:{x:1,y:1,dir:1},target:{x:4,y:1},commands:['forward','repeat'],needs:'repeat'},
 {title:'Observe antes de avançar',instruction:'Primeiro execute Se livre diante da parede. Depois gire à direita e avance até a estrela. A condição evita a colisão.',start:{x:1,y:1,dir:1},target:{x:1,y:2},commands:['if','right','forward'],needs:'condition',wall:{x:2,y:1}}
];
export function tutorialStart(step=0){return {step,player:{...TUTORIAL_STEPS[step].start},queue:[],running:false,done:false,used:[],message:'Este treino não altera pontos, campanha ou ranking.',last:null};}
export function tutorialReducer(state,action){
 const lesson=TUTORIAL_STEPS[state.step];
 if(action.type==='RESET')return tutorialStart(state.step);
 if(action.type==='NEXT')return state.done&&state.step<TUTORIAL_STEPS.length-1?tutorialStart(state.step+1):state;
 if(action.type==='STOP')return {...state,running:false};
 if(action.type==='ADD'){
  if(state.running||state.done||state.queue.length>=12||!lesson.commands.includes(action.command))return state;
  return {...state,queue:[...state.queue,{type:action.command==='repeat'?'forward':action.command,repeat:action.command==='repeat'?3:1}],last:null};
 }
 if(action.type==='CLEAR')return state.running?state:{...state,queue:[],last:null};
 if(action.type==='START')return {...state,running:!state.done&&state.queue.length>0};
 if(action.type!=='STEP'&&action.type!=='TICK')return state;
 if(state.done||!state.queue.length||(action.type==='TICK'&&!state.running))return state;
 const command=state.queue[0],player={...state.player},used=[...state.used];
 let message='',collision=false;
 if(command.repeat>1&&!used.includes('repeat'))used.push('repeat');
 if(command.type==='left'||command.type==='right'){
  player.dir=(player.dir+(command.type==='left'?3:1))%4;used.push('turn');message='O robô girou na mesma casa.';
 }else{
  const [dx,dy]=DIRS[player.dir],x=player.x+dx,y=player.y+dy;
  const wall=x<1||x>5||y<1||y>3||(lesson.wall?.x===x&&lesson.wall?.y===y);
  if(wall){
   if(command.type==='if'){used.push('condition');message='Condição falsa: há uma parede. O robô ficou na mesma casa.';}
   else{collision=true;message='Encontrou uma parede. Experimente girar ou reinicie este treino.';}
  }else{player.x=x;player.y=y;message='O robô avançou uma casa.';}
 }
 const queue=command.repeat>1?[{...command,repeat:command.repeat-1},...state.queue.slice(1)]:state.queue.slice(1);
 const atGoal=player.x===lesson.target.x&&player.y===lesson.target.y;
 const done=atGoal&&(!lesson.needs||used.includes(lesson.needs));
 if(atGoal&&!done)message=lesson.needs==='repeat'?'Você chegou! Reinicie e tente usando Repetir avanço 3×.':'Chegou à estrela! Para concluir, pratique o comando pedido nesta etapa.';
 return {...state,player,queue,running:action.type==='TICK'&&queue.length>0&&!done&&!collision,used,done,last:command.type,message:done?'Conseguiu! Você aplicou o comando e chegou à estrela.':message};
}
