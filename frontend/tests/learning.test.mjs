import test from 'node:test';
import assert from 'node:assert/strict';
import {createMap,freshGame,gameReducer,totalScore} from '../src/engine.js';
import {tutorialStart,tutorialReducer,TUTORIAL_STEPS} from '../src/features/learning/tutorial.js';
import {readLearning,recordLearning,learningMessage} from '../src/features/learning/progress.js';
import {emptyPlayers,joinPlayer,recordProgress,readPlayers,savePlayers} from '../src/players.js';

const reduce=(state,...actions)=>actions.reduce(gameReducer,state);
const add=command=>({type:'ADD',command});
test('insert, reorder, remove and undo only edit the remaining program',()=>{
 const initial=freshGame();
 let state=reduce(initial,add('forward'),add('right'),{type:'INSERT_AT',index:1},add('left'));
 assert.deepEqual(state.queue.map(c=>c.type),['forward','left','right']);
 state=gameReducer(state,{type:'MOVE_COMMAND',index:2,to:0});
 assert.deepEqual(state.queue.map(c=>c.type),['right','forward','left']);
 state=gameReducer(state,{type:'UNDO_QUEUE'});
 assert.deepEqual(state.queue.map(c=>c.type),['forward','left','right']);
 state=reduce(state,{type:'REMOVE',index:1},{type:'UNDO_QUEUE'},{type:'CLEAR'},{type:'UNDO_QUEUE'});
 assert.deepEqual(state.queue.map(c=>c.type),['forward','left','right']);
 assert.equal(state.runs,initial.runs);assert.equal(totalScore(state),0);
});
test('executing clears edit history; undo cannot refund commands or move the robot',()=>{
 let state=reduce(freshGame(),{type:'ADD',command:'forward',repeat:2},{type:'STEP'});
 const executed=state;
 state=gameReducer(state,{type:'UNDO_QUEUE'});assert.equal(state,executed);
 assert.equal(state.runs[0].commands,1);assert.equal(state.runs[0].player.x,2);
 assert.deepEqual(state.lastExecution,{type:'forward',number:1,from:{x:1,y:1,dir:1},to:{x:2,y:1,dir:1},event:'ok',remaining:1});
 state=reduce(state,add('right'),{type:'UNDO_QUEUE'});
 assert.equal(state.runs,executed.runs);assert.equal(state.queue[0].repeat,1);
 const started=gameReducer(state,{type:'START'});
 for(const action of [{type:'MOVE_COMMAND',index:0,to:1},{type:'REMOVE',index:0},{type:'UNDO_QUEUE'},{type:'CLEAR'},add('left')])assert.equal(gameReducer(started,action),started);
});
test('invalid edits are ignored and history stays bounded',()=>{
 let state=freshGame();
 for(const action of [add('unknown'),{type:'INSERT_AT',index:-1},{type:'MOVE_COMMAND',index:0,to:2},{type:'REMOVE',index:9}])assert.equal(gameReducer(state,action),state);
 for(let i=0;i<60;i++)state=reduce(state,add('left'),{type:'CLEAR'});
 assert.equal(state.queueHistory.length,40);
});
test('execution feedback identifies turns, walls and skipped conditions',()=>{
 let state=reduce(freshGame(),add('left'),add('forward'),{type:'STEP'});
 assert.equal(state.lastExecution.type,'left');assert.equal(state.lastExecution.to.dir,0);
 state=gameReducer(state,{type:'STEP'});
 assert.equal(state.lastExecution.event,'collision');assert.deepEqual(state.lastExecution.from,state.lastExecution.to);
 state=reduce(state,add('if'),{type:'STEP'});
 assert.equal(state.lastExecution.event,'skipped');assert.equal(state.lastExecution.number,3);
 state=gameReducer(state,add('right'));
 assert.equal(state.lastExecution.event,'skipped','editing keeps the explanation of the last executed command');
});
test('all tutorial stages are playable and require the lesson skill',()=>{
 const solutions=[['forward','forward'],['forward','forward','left','forward'],['repeat'],['if','right','forward']];
 let state=tutorialStart();
 for(let step=0;step<TUTORIAL_STEPS.length;step++){
  assert.equal(state.step,step);
  for(const command of solutions[step])state=tutorialReducer(state,{type:'ADD',command});
  let safety=20;while(state.queue.length&&!state.done&&safety--)state=tutorialReducer(state,{type:'STEP'});
  assert(state.done,`Lesson ${step+1}`);assert.equal(state.player.x,TUTORIAL_STEPS[step].target.x);assert.equal(state.player.y,TUTORIAL_STEPS[step].target.y);
  state=tutorialReducer(state,{type:'NEXT'});
 }
 let repeated=tutorialStart(2);
 for(let i=0;i<3;i++)repeated=tutorialReducer(repeated,{type:'ADD',command:'forward'});
 while(repeated.queue.length)repeated=tutorialReducer(repeated,{type:'STEP'});
 assert.equal(repeated.done,false);assert.match(repeated.message,/Repetir/);
 assert.equal(tutorialReducer(repeated,{type:'RESET'}).player.x,1);
});
test('tutorial pause and walls never execute extra commands',()=>{
 let state=tutorialStart(3);state=tutorialReducer(state,{type:'ADD',command:'forward'});state=tutorialReducer(state,{type:'START'});state=tutorialReducer(state,{type:'TICK'});
 assert.equal(state.player.x,1);assert.equal(state.running,false);assert.match(state.message,/parede/);
 state=tutorialReducer(state,{type:'ADD',command:'right'});
 const paused=tutorialReducer(state,{type:'STOP'});assert.equal(tutorialReducer(paused,{type:'TICK'}),paused);
});
test('personal evolution counts completions once and compares only completed attempts',()=>{
 const incomplete=[{completed:false,commands:20}],completed=[{completed:true,commands:100}];
 let records=recordLearning([],incomplete,completed);
 assert.equal(records[0].attempts,1);assert.equal(records[0].previousCommands,null);
 assert.deepEqual(recordLearning(records,completed,completed),records);
 records=recordLearning(records,incomplete,[{completed:true,commands:92}]);
 assert.equal(records[0].attempts,2);assert.equal(records[0].bestCommands,92);
 assert.match(learningMessage(records[0],{completed:true,commands:92}),/8 comandos a menos/);
 assert.match(learningMessage(records[0],{completed:false,commands:1}),/Última conclusão: 92/);
 records=recordLearning(records,incomplete,[{completed:true,commands:105}]);
 assert.equal(records[0].bestCommands,92);assert.match(learningMessage(records[0],{completed:true,commands:105}),/anterior foram 92/);
 assert.deepEqual(readLearning([{attempts:-1}],1),[null]);
});
test('personal records survive storage and restart, and reset on challenge bank change',()=>{
 let {store,playerId}=joinPlayer(emptyPlayers(),'Ana','Silva');
 let state=freshGame();state.runs[0]={...state.runs[0],completed:true,commands:100};
 store=recordProgress(store,playerId,state);assert.equal(store.players[0].learning[0].lastCommands,100);
 store=recordProgress(store,playerId,state);assert.equal(store.players[0].learning[0].attempts,1);
 const storage={value:null,setItem(_key,value){this.value=value;},getItem(){return this.value;}};
 savePlayers(storage,store);store=readPlayers(storage);assert.equal(store.players[0].learning[0].lastCommands,100);
 state=gameReducer(state,{type:'RESTART'});store=recordProgress(store,playerId,state);assert.equal(store.players[0].learning[0].attempts,1);
 state.questions=structuredClone(state.questions);state.questions[0][0].prompt+=' Nova versão';
 store=recordProgress(store,playerId,state);assert.equal(store.players[0].learning[0],null);
});
test('older saved completions become a personal baseline without losing the campaign',()=>{
 let {store,playerId}=joinPlayer(emptyPlayers(),'Ana','Silva');
 const state=freshGame(),questions=state.questions[0],map=createMap(0,questions.length);
 state.runs[0]={...state.runs[0],completed:true,commands:150,solved:questions.map(q=>q.id),awards:Object.fromEntries(questions.map(q=>[q.id,100])),player:{...map.exit,dir:1}};
 store=recordProgress(store,playerId,state);delete store.players[0].learning;
 const storage={value:null,setItem(_key,value){this.value=value;},getItem(){return this.value;}};
 savePlayers(storage,store);const restored=readPlayers(storage);
 assert.equal(restored.players[0].campaign.runs[0].completed,true);
 assert.equal(restored.players[0].learning[0].lastCommands,150);
 assert.equal(restored.players[0].learning[0].attempts,1);
});
