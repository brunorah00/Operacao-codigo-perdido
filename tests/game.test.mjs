import test from 'node:test';
import assert from 'node:assert/strict';
import {canSee,createMap,DIRS,freshGame,gameReducer,loadGame,moveRobot,newRun,saveGame,SAVE_KEY,sectorScore,totalScore} from '../src/engine.js';
import {DEFAULT_QUESTIONS,LEVEL_INFO,numeric,validateQuestions} from '../src/questions.js';

function walk(state,path,onClue){
 for(let j=1;j<path.length;j++){
  const run=state.runs[state.level],[x,y]=path[j],direction=DIRS.findIndex(([dx,dy])=>run.player.x+dx===x&&run.player.y+dy===y);
  assert.notEqual(direction,-1,'path must be adjacent');
  let delta=(direction-run.player.dir+4)%4;
  for(let k=0;k<(delta===3?1:delta);k++){
   state=gameReducer(state,{type:'ADD',command:delta===3?'left':'right'});
   state=gameReducer(state,{type:'STEP'});
  }
  state=gameReducer(state,{type:'ADD',command:'forward'});
  state=gameReducer(state,{type:'STEP'});
  assert.equal(state.runs[state.level].player.x,x);
  assert.equal(state.runs[state.level].player.y,y);
  if(state.active)state=onClue(state);
 }
 return state;
}
function answerCorrectly(state){
 const question=state.questions[state.level].find(q=>q.id===state.active);
 state=gameReducer(state,{type:'ANSWER',value:question.answer});
 assert.equal(state.feedback,'correct');
 return gameReducer(state,{type:'CLOSE_CARD'});
}
test('Every map is enclosed, connected, deterministic, and all 3–12 clues lie on a solvable route',()=>{
 for(let level=0;level<3;level++)for(let count=3;count<=12;count++){
  const m=createMap(level,count);
  assert.equal(m.size,LEVEL_INFO[level].size);
  assert.deepEqual(m,createMap(level,count));
  assert(m.grid[0].every(Boolean)&&m.grid.at(-1).every(Boolean));
  assert(m.grid.every(r=>r[0]===1&&r.at(-1)===1));
  assert.equal(new Set(m.clues.map(c=>`${c.x},${c.y}`)).size,count);
  assert(m.clues.every(c=>m.grid[c.y][c.x]===0&&m.route.some(([x,y])=>x===c.x&&y===c.y)));
  assert(!m.clues.some(c=>c.x===m.exit.x&&c.y===m.exit.y));
  const visited=new Set(['1,1']),queue=[[1,1]];
  for(const [x,y] of queue)for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(m.grid[ny]?.[nx]===0&&!visited.has(k)){visited.add(k);queue.push([nx,ny]);}}
  assert.equal(visited.size,m.grid.flat().filter(n=>n===0).length);
 }
});
test('Complete campaign: 36 cards, correct feedback, unlocks, terminal rewards, and final score',()=>{
 let state=freshGame(),cards=0;
 assert.strictEqual(gameReducer(state,{type:'LEVEL',level:2}),state,'locked stages cannot open');
 for(let level=0;level<3;level++){
  state=gameReducer(state,{type:'LEVEL',level});
  state=walk(state,createMap(level).route,s=>{cards++;assert.equal(s.running,false);return answerCorrectly(s);});
  assert.equal(state.runs[level].completed,true);
  assert.equal(state.runs[level].solved.length,12);
  assert.equal(state.unlocked,Math.min(2,level+1));
  assert.equal(state.runs[level].commands,[139,162,255][level]);
  assert.equal(totalScore(state),[1261,2499,3644][level]);
 }
 assert.equal(cards,36);
 assert.equal(totalScore(state),3644);
 assert(state.runs.every(r=>r.completed));
 const before=totalScore(state);state=gameReducer(state,{type:'ANSWER',value:'6'});assert.equal(totalScore(state),before);
});
test('Wrong answers, invalid input, hints, minimum points, and duplicate rewards',()=>{
 let state=freshGame();const m=createMap(0),first=m.clues[0],idx=m.route.findIndex(([x,y])=>x===first.x&&y===first.y);
 state=walk(state,m.route.slice(0,idx+1),s=>s);
 assert(state.active);const id=state.active;
 state=gameReducer(state,{type:'ANSWER',value:'alert(1)'});assert.equal(state.feedback,'invalid');assert.equal(state.runs[0].attempts[id],undefined);
 for(let k=0;k<9;k++)state=gameReducer(state,{type:'ANSWER',value:'-9999'});
 state=gameReducer(state,{type:'HINT'});state=gameReducer(state,{type:'HINT'});assert.equal(state.runs[0].hints.length,1);
 state=gameReducer(state,{type:'ANSWER',value:state.questions[0][0].answer});assert.equal(state.runs[0].awards[id],40);
 state=gameReducer(state,{type:'ANSWER',value:state.questions[0][0].answer});assert.equal(totalScore(state),37);assert.equal(state.runs[0].solved.length,1);
});
test('Execution pauses on cards and keeps remaining loop commands for manual resume',()=>{
 let state=freshGame();state.runs[0].player={x:1,y:1,dir:1};
 state=gameReducer(state,{type:'ADD',command:'forward',repeat:8});state=gameReducer(state,{type:'ADD',command:'right'});state=gameReducer(state,{type:'START'});
 while(state.running)state=gameReducer(state,{type:'TICK'});
 const run=state.runs[0];
 assert.equal(run.moves,3);assert.equal(state.active,state.questions[0][0].id);assert.equal(state.queue.length,2);assert.equal(state.queue[0].repeat,5);
 const old=state;assert.strictEqual(gameReducer(state,{type:'TICK'}),old);state=answerCorrectly(state);assert.equal(state.running,false);assert.equal(state.queue[0].repeat,5);
 state=gameReducer(state,{type:'START'});state=gameReducer(state,{type:'TICK'});assert.equal(state.runs[0].moves,4);assert.equal(state.queue[0].repeat,4);
 const m=createMap(0),c=m.clues[0];state=freshGame();state.runs[0].player={x:c.x,y:c.y,dir:1};state=gameReducer(state,{type:'OPEN_CARD'});
 assert.equal(state.active,state.questions[0][0].id);
});
test('Collision halts the program; a false condition skips safely; turns and repetition consume one action at a time',()=>{
 let state=freshGame();state.runs[0].player.dir=3;
 state=gameReducer(state,{type:'ADD',command:'forward'});state=gameReducer(state,{type:'ADD',command:'right'});state=gameReducer(state,{type:'START'});state=gameReducer(state,{type:'TICK'});
 assert.equal(state.running,false);assert.equal(state.runs[0].collisions,1);assert.equal(state.queue.length,1);assert.equal(state.runs[0].player.x,1);
 state=gameReducer(state,{type:'CLEAR'});state=gameReducer(state,{type:'ADD',command:'if'});state=gameReducer(state,{type:'ADD',command:'right',repeat:2});state=gameReducer(state,{type:'START'});state=gameReducer(state,{type:'TICK'});
 assert.equal(state.running,true);assert.equal(state.runs[0].collisions,1);
 state=gameReducer(state,{type:'TICK'});assert.equal(state.runs[0].player.dir,0);assert.equal(state.queue[0].repeat,1);
 state=gameReducer(state,{type:'TICK'});assert.equal(state.runs[0].player.dir,1);assert.equal(state.queue.length,0);assert.equal(state.running,false);
 const turn=moveRobot(createMap(0),newRun(createMap(0)),'left');assert.equal(turn.run.moves,0);assert.equal(turn.run.player.dir,0);
});
test('Exit remains locked if clues have not been solved',()=>{
 let state=freshGame();const map=createMap(0),end=map.route.at(-1),before=map.route.at(-2);
 const dir=DIRS.findIndex(([dx,dy])=>before[0]+dx===end[0]&&before[1]+dy===end[1]);
 state.runs[0].player={x:before[0],y:before[1],dir};state=gameReducer(state,{type:'ADD',command:'forward'});state=gameReducer(state,{type:'STEP'});
 assert.equal(state.runs[0].completed,false);assert.equal(state.unlocked,0);assert.match(state.message,/bloqueado/);
});
test('Lantern is directional, occluded by walls, finite, and remembers visited areas',()=>{
 const grid=Array.from({length:20},()=>Array(20).fill(0));const map={grid,size:20},p={x:7,y:7,dir:1};
 assert.equal(canSee(map,p,12,7),true);assert.equal(canSee(map,p,2,7),false);assert.equal(canSee(map,p,14,7),false);
 grid[7][9]=1;assert.equal(canSee(map,p,9,7),true);assert.equal(canSee(map,p,10,7),false);
 let r=newRun(createMap(0));const seen=Object.keys(r.seen);r=moveRobot(createMap(0),r,'forward').run;assert(seen.every(k=>r.seen[k]));
});
test('Save/resume preserves the campaign and tolerates malformed or unavailable browser storage',()=>{
 const storage={data:new Map(),getItem(k){return this.data.get(k)||null;},setItem(k,v){this.data.set(k,v);}};
 let state=walk(freshGame(),createMap(0).route,answerCorrectly);state=gameReducer(state,{type:'LEVEL',level:1});
 assert.equal(saveGame(storage,state),true);const restored=loadGame(storage);
 assert.equal(restored.level,1);assert.equal(restored.unlocked,1);assert.equal(totalScore(restored),1261);assert.deepEqual(restored.runs,state.runs);assert.equal(restored.running,false);
 storage.setItem(SAVE_KEY,'broken');assert.equal(loadGame(storage).level,0);
 storage.setItem(SAVE_KEY,JSON.stringify({...state,runs:[{player:{x:-99,y:1,dir:1}},...state.runs.slice(1)]}));assert.equal(totalScore(loadGame(storage)),0);
 assert.equal(saveGame({setItem(){throw Error('quota');}},state),false);assert.equal(loadGame({getItem(){throw Error('denied');}}).level,0);
});
test('Teacher data validation, import/export round-trip, added/removed cards, and reset behavior',()=>{
 const qs=structuredClone(DEFAULT_QUESTIONS).map(level=>level.slice(0,6));qs[0].push({...qs[0][0],id:'custom-test',title:'Pergunta extra',answer:'1/2'});
 const checked=validateQuestions(JSON.parse(JSON.stringify(qs)));assert.equal(checked[0].length,7);assert.equal(createMap(0,7).clues.length,7);
 let state=gameReducer(freshGame(),{type:'QUESTIONS',questions:checked});state=walk(state,createMap(0,7).route,answerCorrectly);assert.equal(state.runs[0].solved.length,7);assert.equal(totalScore(state),761);
 state=gameReducer(state,{type:'RESTART'});assert.equal(totalScore(state),0);assert.equal(state.unlocked,0);assert.equal(state.questions[0].length,7);
 assert.throws(()=>validateQuestions([[],[],[]]));assert.throws(()=>validateQuestions([[...qs[0],qs[0][0]],qs[1],qs[2]]));
 qs[0][0].answer='NaN';assert.throws(()=>validateQuestions(qs));
});
test('Accepted numbers include decimals and fractions; malformed numeric answers are rejected',()=>{
 assert.equal(numeric(' 78,5 '),78.5);assert.equal(numeric('1/2'),.5);assert.equal(numeric('-4.5'),-4.5);
 for(const v of ['','2foo','1/0','<script>','1+2','Infinity','0x10'])assert(Number.isNaN(numeric(v)));
 assert.equal(validateQuestions(DEFAULT_QUESTIONS).flat().length,36);
});

test('The same objective pays less when the player executes more commands',()=>{
 function firstClue(detour){let s=freshGame();for(let n=0;n<detour;n++){s=gameReducer(s,{type:'ADD',command:'right'});s=gameReducer(s,{type:'STEP'});}s=gameReducer(s,{type:'ADD',command:'forward',repeat:3});s=gameReducer(s,{type:'START'});while(s.running)s=gameReducer(s,{type:'TICK'});assert.equal(s.active,'a1');return answerCorrectly(s);}
 const direct=firstClue(0),long=firstClue(4);
 assert.equal(direct.runs[0].awards.a1,100);assert.equal(long.runs[0].awards.a1,100);
 assert.equal(direct.runs[0].commands,3);assert.equal(long.runs[0].commands,7);
 assert.equal(totalScore(direct),97);assert.equal(totalScore(long),93);
});
test('Only executed actions cost points, with expanded loops, conditions and failed wall attempts counted',()=>{
 let s=freshGame();s.runs[0].solved=['a1'];s.runs[0].awards={a1:100};
 s=gameReducer(s,{type:'ADD',command:'left'});s=gameReducer(s,{type:'CLEAR'});assert.equal(totalScore(s),100);assert.equal(s.runs[0].commands,0);
 s=gameReducer(s,{type:'ADD',command:'left'});s=gameReducer(s,{type:'STEP'}); // north, against a boundary
 s=gameReducer(s,{type:'ADD',command:'if'});s=gameReducer(s,{type:'STEP'});
 s=gameReducer(s,{type:'ADD',command:'forward'});s=gameReducer(s,{type:'STEP'});
 assert.equal(s.runs[0].commands,3);assert.equal(s.runs[0].moves,0);assert.equal(s.runs[0].collisions,1);assert.equal(totalScore(s),97);
 s=gameReducer(s,{type:'ADD',command:'right'});s=gameReducer(s,{type:'STEP'});
 s=gameReducer(s,{type:'ADD',command:'forward',repeat:3});s=gameReducer(s,{type:'START'});while(s.running)s=gameReducer(s,{type:'TICK'});
 assert.equal(s.runs[0].commands,7);assert.equal(s.runs[0].moves,3);assert.equal(totalScore(s),93);
});
test('The command discount never makes a sector negative and does not consume points from other sectors',()=>{
 const s=freshGame();s.runs[0].awards={a1:100};s.runs[0].commands=150;s.runs[1].awards={g1:100};s.runs[1].commands=20;
 assert.deepEqual(sectorScore(s.runs[0]),{earned:100,commandCost:150,score:0});assert.equal(totalScore(s),80);
 s.runs[0].completed=true;assert.equal(sectorScore(s.runs[0]).score,150);assert.equal(totalScore(s),230);
});
