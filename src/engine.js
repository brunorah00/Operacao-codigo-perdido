import {DEFAULT_QUESTIONS, LEVEL_INFO, numeric, validateQuestions} from './questions.js';
export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const DIR_NAMES=['Norte','Leste','Sul','Oeste'];
export const SAVE_KEY='codigo-perdido-v1';
export const SCORING_VERSION=2;
export const COMMAND_POINT_COST=1;
export const key=(x,y)=>`${x},${y}`;
function random(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function createMap(level,count=6){
 const size=LEVEL_INFO[level].size, grid=Array.from({length:size},()=>Array(size).fill(1));
 const rand=random(703+level*821),stack=[[1,1]];grid[1][1]=0;
 while(stack.length){
  const [x,y]=stack.at(-1), options=DIRS.map(([dx,dy])=>[x+dx*2,y+dy*2,dx,dy]).filter(([nx,ny])=>nx>0&&ny>0&&nx<size-1&&ny<size-1&&grid[ny][nx]===1);
  if(!options.length){stack.pop();continue;}
  const [nx,ny,dx,dy]=options[Math.floor(rand()*options.length)];grid[y+dy][x+dx]=0;grid[ny][nx]=0;stack.push([nx,ny]);
 }
 // A short, readable entrance teaches the first program before the maze opens up.
 for(let x=1;x<=7;x++) grid[1][x]=0;
 const queue=[[1,1]],parents=new Map([[key(1,1),null]]);let far=[1,1];
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];far=[x,y];
  for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(grid[ny]?.[nx]===0&&!parents.has(k)){parents.set(k,[x,y]);queue.push([nx,ny]);}}
 }
 const route=[];let cur=far;while(cur){route.unshift(cur);cur=parents.get(key(...cur));}
 const clues=Array.from({length:count},(_,i)=>{const p=route[Math.round(3+i*(route.length-7)/Math.max(1,count-1))];return {x:p[0],y:p[1],index:i};});
 return {size,grid,clues,exit:{x:far[0],y:far[1]},route};
}
export function canSee(map,player,x,y){
 const dx=x-player.x,dy=y-player.y,distance=Math.hypot(dx,dy),forward=DIRS[player.dir];
 const dot=distance ? (dx*forward[0]+dy*forward[1])/distance:1;
 if(distance>2.5 && (distance>5.5||dot<0.57))return false;
 const steps=Math.ceil(distance*5);
 for(let t=1;t<steps;t++){
  const sx=Math.round(player.x+dx*t/steps),sy=Math.round(player.y+dy*t/steps);
  if(sx===x&&sy===y)break;
  if(map.grid[sy]?.[sx]===1)return false;
 }
 return true;
}
export function reveal(map,run){
 const seen={...run.seen};
 for(let y=Math.max(0,run.player.y-6);y<Math.min(map.size,run.player.y+7);y++)
  for(let x=Math.max(0,run.player.x-6);x<Math.min(map.size,run.player.x+7);x++)if(canSee(map,run.player,x,y))seen[key(x,y)]=true;
 return {...run,seen};
}
export function newRun(map){return reveal(map,{player:{x:1,y:1,dir:1},seen:{},solved:[],awards:{},attempts:{},hints:[],moves:0,commands:0,collisions:0,completed:false});}
export function freshGame(questions=DEFAULT_QUESTIONS){
 return {version:1,questions,level:0,unlocked:0,runs:questions.map((q,i)=>newRun(createMap(i,q.length))),queue:[],running:false,active:null,feedback:null,message:'A investigação começou. Programe seu primeiro movimento.'};
}
export function sectorScore(run){
 const earned=Object.values(run.awards).reduce((a,b)=>a+b,0)+(run.completed?200:0),commandCost=run.commands*COMMAND_POINT_COST;
 return {earned,commandCost,score:Math.max(0,earned-commandCost)};
}
export function totalScore(state){return state.runs.reduce((sum,run)=>sum+sectorScore(run).score,0);}
export function moveRobot(map,run,type){
 let next={...run,player:{...run.player},commands:run.commands+1},event='ok';
 if(type==='left')next.player.dir=(next.player.dir+3)%4;
 else if(type==='right')next.player.dir=(next.player.dir+1)%4;
 else if(type==='forward'||type==='if'){
  const [dx,dy]=DIRS[next.player.dir],nx=next.player.x+dx,ny=next.player.y+dy;
  if(map.grid[ny]?.[nx]!==0){event=type==='if'?'skipped':'collision';if(event==='collision')next.collisions++;}
  else {next.player.x=nx;next.player.y=ny;next.moves++;}
 }
 return {run:reveal(map,next),event};
}
export function gameReducer(state,action){
 const i=state.level,map=createMap(i,state.questions[i].length),run=state.runs[i];
 const withRun=(r,extra={})=>({...state,runs:state.runs.map((old,j)=>j===i?r:old),...extra});
 if(action.type==='ADD')return state.running||state.active||run.completed?state:{...state,queue:state.queue.length>=30?state.queue:[...state.queue,{type:action.command,repeat:Math.max(1,Math.min(8,Number(action.repeat)||1))}],message:'Comando adicionado. Pronto para executar.'};
 if(action.type==='REMOVE')return state.running?state:{...state,queue:state.queue.filter((_,j)=>j!==action.index)};
 if(action.type==='CLEAR')return {...state,queue:[],running:false,message:'Sequência limpa. Monte um novo caminho.'};
 if(action.type==='START')return state.active||run.completed?state:{...state,running:state.queue.length>0,feedback:null,message:state.queue.length?'Executando sua sequência…':'Adicione pelo menos um comando.'};
 if(action.type==='STOP')return {...state,running:false,message:'Programa pausado. Você pode ajustar os próximos comandos.'};
 if(action.type==='TICK'||action.type==='STEP'){
  if(state.active||run.completed||!state.queue.length||(action.type==='TICK'&&!state.running))return state;
  const block=state.queue[0],result=moveRobot(map,run,block.type);
  const queue=block.repeat>1?[{...block,repeat:block.repeat-1},...state.queue.slice(1)]:state.queue.slice(1);
  let next=result.run,active=null,running=action.type==='TICK'&&queue.length>0,message='Comando executado.';
  if(result.event==='collision'){running=false;message='Parede à frente! Revise a sequência e tente outra direção.';}
  if(result.event==='skipped')message='Condição falsa: há uma parede. O avanço foi ignorado.';
  const clue=map.clues.find(c=>c.x===next.player.x&&c.y===next.player.y);
  if(clue&&!next.solved.includes(state.questions[i][clue.index].id)){active=state.questions[i][clue.index].id;running=false;message='Pista encontrada. Resolva o desafio para decifrá-la.';}
  if(next.player.x===map.exit.x&&next.player.y===map.exit.y){
   if(next.solved.length===state.questions[i].length){next={...next,completed:true};running=false;message='Mapa concluído! Bônus de 200 pontos antes do desconto dos comandos.';}
   else{running=false;message=`O terminal está bloqueado. Resolva as ${state.questions[i].length} pistas deste mapa.`;}
  }
  return withRun(next,{queue,running,active,feedback:null,message,unlocked:next.completed?Math.max(state.unlocked,Math.min(2,i+1)):state.unlocked});
 }
 if(action.type==='ANSWER'){
  const q=state.questions[i].find(q=>q.id===state.active);if(!q||run.solved.includes(q.id))return state;
  const answer=numeric(action.value);if(!Number.isFinite(answer))return {...state,feedback:'invalid'};
  if(Math.abs(answer-numeric(q.answer))>1e-7)return withRun({...run,attempts:{...run.attempts,[q.id]:(run.attempts[q.id]||0)+1}},{feedback:'wrong'});
  const points=Math.max(40,100-(run.attempts[q.id]||0)*15-(run.hints.includes(q.id)?20:0));
  const awarded=withRun({...run,solved:[...run.solved,q.id],awards:{...run.awards,[q.id]:points}},{feedback:'correct'});
  return {...awarded,message:`Pista decifrada! +${totalScore(awarded)-totalScore(state)} pontos no saldo, após o desconto dos comandos.`};
 }
 if(action.type==='HINT')return !state.active||run.hints.includes(state.active)||run.solved.includes(state.active)?state:withRun({...run,hints:[...run.hints,state.active]});
 if(action.type==='CLOSE_CARD')return {...state,active:null,feedback:null,running:false};
 if(action.type==='OPEN_CARD'){
  const c=map.clues.find(c=>c.x===run.player.x&&c.y===run.player.y);return c?{...state,active:state.questions[i][c.index].id,running:false,feedback:run.solved.includes(state.questions[i][c.index].id)?'correct':null}:state;
 }
 if(action.type==='LEVEL'){
  if(!Number.isInteger(action.level)||action.level<0||action.level>state.unlocked)return state;
  return {...state,level:action.level,queue:[],running:false,active:null,feedback:null,message:'Explore o mapa e reúna todas as pistas.'};
 }
 if(action.type==='RESTART')return {...state,runs:state.runs.map((r,j)=>j<i?r:newRun(createMap(j,state.questions[j].length))),unlocked:i,queue:[],running:false,active:null,feedback:null,message:'Mapa reiniciado. Um novo caminho começa agora.'};
 if(action.type==='RESET')return freshGame(state.questions);
 if(action.type==='QUESTIONS')return freshGame(validateQuestions(action.questions));
 return state;
}
export function saveGame(storage,state){
 const {version,questions,level,unlocked,runs}=state;
 try{storage.setItem(SAVE_KEY,JSON.stringify({version,questions,level,unlocked,runs}));return true;}catch{return false;}
}
export function loadGame(storage){
 try{
  const raw=storage.getItem(SAVE_KEY);if(!raw)return freshGame();const d=JSON.parse(raw);
  if(d.version!==1) return freshGame();
  const qs=validateQuestions(d.questions),base=freshGame(qs);
  if(!Array.isArray(d.runs)||d.runs.length!==3)return base;
  const runs=d.runs.map((r,i)=>{
   const m=createMap(i,qs[i].length),p=r.player,ids=qs[i].map(q=>q.id);
   if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||m.grid[p.y]?.[p.x]!==0||![0,1,2,3].includes(p.dir))throw Error('Invalid save');
   for(const k of ['moves','commands','collisions'])if(!Number.isInteger(r[k])||r[k]<0)throw Error('Invalid counters');
   if(!Array.isArray(r.solved)||!Array.isArray(r.hints)||new Set(r.solved).size!==r.solved.length||r.solved.some(id=>!ids.includes(id))||r.hints.some(id=>!ids.includes(id)))throw Error('Invalid clues');
   if(!r.awards||r.solved.some(id=>!Number.isFinite(r.awards[id])||r.awards[id]<40||r.awards[id]>100)||Object.keys(r.awards).some(id=>!r.solved.includes(id)))throw Error('Invalid score');
   if(!r.attempts||Object.values(r.attempts).some(n=>!Number.isInteger(n)||n<0))throw Error('Invalid attempts');
   const seen={};for(const k of Object.keys(r.seen||{}))if(/^\d+,\d+$/.test(k)){const [x,y]=k.split(',').map(Number);if(x<m.size&&y<m.size)seen[k]=true;}
   return {...r,seen,completed:r.completed===true&&r.solved.length===qs[i].length&&p.x===m.exit.x&&p.y===m.exit.y};
  });
  const unlocked=runs[0].completed?(runs[1].completed?2:1):0;
  return {...base,runs,unlocked,level:Math.min(unlocked,Math.max(0,Number.isInteger(d.level)?d.level:0)),message:'Seu progresso foi recuperado. Continue a investigação.'};
 }catch{return freshGame();}
}
