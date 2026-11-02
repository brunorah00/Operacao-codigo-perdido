import test from 'node:test';
import assert from 'node:assert/strict';
import {createMap,freshGame,gameReducer,sectorScore,saveGame,loadGame} from '../src/engine.js';
import {spawnEnemies,advanceEnemies,checkEnemyHit,ENEMY_TYPES,inArena} from '../src/enemies.js';
import {LEVEL_INFO} from '../src/questions.js';
import {gameSoundEvents} from '../src/audio/sound.js';

test('All themes spawn reproducible patrols in open areas and stay inside walkable cells',()=>{
 for(let level=0;level<LEVEL_INFO.length;level++){
  const map=createMap(level,12),type=ENEMY_TYPES[map.theme];
  assert.deepEqual(spawnEnemies(map,42),spawnEnemies(map,42));
  assert.notDeepEqual(spawnEnemies(map,42),spawnEnemies(map,123));
  let run={enemies:spawnEnemies(map,42),enemyTick:0};
  assert.equal(run.enemies.length,4);
  const initial=structuredClone(run.enemies);
  for(let tick=0;tick<100;tick++){
   const before=run;run=advanceEnemies(map,run);
   for(const e of run.enemies){
    assert.equal(map.grid[e.y][e.x],0);assert(inArena(map,e.x,e.y));
    assert(!(e.x<=4&&e.y<=3));
    const old=before.enemies.find(p=>p.id===e.id),dx=e.x-old.x,dy=e.y-old.y;
    assert(Math.abs(dy)<=1);
    assert(type.mode==='vertical'?dx===0:Math.abs(dx)===Math.abs(dy));
    if(dx){assert.equal(map.grid[old.y][e.x],0);assert.equal(map.grid[e.y][old.x],0);}
   }
  }
  assert.notDeepEqual(run.enemies,initial);
  assert(map.grid.some((row,y)=>row.some((cell,x)=>x>0&&y>3&&cell===0&&row[x+1]===0&&map.grid[y+1]?.[x]===0&&map.grid[y+1]?.[x+1]===0)));
 }
});
test('Contact from a robot step costs 30 points, resets position and clears execution',()=>{
 let s=freshGame(),r=s.runs[0];r.invulnerable=0;r.awards={a1:100};r.solved=['a1'];
 r.enemies=[{id:0,x:2,y:1,dx:0,dy:1}];
 s=gameReducer(s,{type:'ADD',command:'forward',repeat:3});
 s=gameReducer(s,{type:'START'});
 const before=s;s=gameReducer(s,{type:'TICK'});
 assert.deepEqual(s.runs[0].player,{x:1,y:1,dir:1});
 assert.equal(s.runs[0].hits,1);assert.equal(s.runs[0].enemyPenalty,30);
 assert.equal(sectorScore(s.runs[0]).score,69);
 assert.deepEqual(s.runs[0].solved,['a1']);
 assert.equal(s.running,false);assert.equal(s.queue.length,0);
 assert(gameSoundEvents(before,s).includes('enemy-hit'));
 const map=createMap(0);assert.strictEqual(checkEnemyHit(map,s.runs[0]),s.runs[0]);
});
test('Moving enemies hit the robot; cards and completed stages pause patrols',()=>{
 let s=freshGame(),r=s.runs[0];r.invulnerable=0;
 const map=createMap(0),enemy=spawnEnemies(map,42)[0];
 r.enemies=[enemy];r.player={x:enemy.x+enemy.dx,y:enemy.y+enemy.dy,dir:1};
 s=gameReducer(s,{type:'ENEMY_TICK'});
 assert.equal(s.runs[0].hits,1);
 const paused={...s,active:'a1'};assert.strictEqual(gameReducer(paused,{type:'ENEMY_TICK'}),paused);
 const done=structuredClone(s);done.runs[0].completed=true;
 assert.strictEqual(gameReducer(done,{type:'ENEMY_TICK'}),done);
 r.enemyPenalty=300;r.awards={};assert.equal(sectorScore(r).score,0);
});
test('Patrol state and penalties survive saving; damaged enemies are regenerated',()=>{
 const s=freshGame();s.runs[0].enemyPenalty=60;s.runs[0].hits=2;
 let data;const storage={setItem:(k,v)=>data=v,getItem:()=>data};
 saveGame(storage,s);let restored=loadGame(storage);
 assert.deepEqual(restored.runs[0].enemies,s.runs[0].enemies);
 assert.equal(restored.runs[0].enemyPenalty,60);
 const broken=JSON.parse(data);broken.runs[0].enemies=[{x:-1,y:-1}];data=JSON.stringify(broken);
 restored=loadGame(storage);assert.equal(restored.runs[0].enemies.length,4);
});

test('All maps alternate narrow corridors and four separate patrol rooms',()=>{
 for(let level=0;level<LEVEL_INFO.length;level++){
  const map=createMap(level,12);
  assert.equal(map.arenas.length,4);
  let narrow=0;
  for(let y=2;y<map.size-2;y++)for(let x=2;x<map.size-2;x++){
   if(map.grid[y][x]||inArena(map,x,y))continue;
   if((map.grid[y][x-1]&&map.grid[y][x+1])||(map.grid[y-1][x]&&map.grid[y+1][x]))narrow++;
  }
  assert(narrow>=10,'preserve substantial narrow passages');
  const enemies=spawnEnemies(map,99);
  for(const room of map.arenas){
   assert(enemies.some(e=>e.x>=room.x&&e.x<room.x+room.width&&e.y>=room.y&&e.y<room.y+room.height));
   for(let y=room.y;y<room.y+room.height;y++)for(let x=room.x;x<room.x+room.width;x++)assert.equal(map.grid[y][x],0);
  }
 }
});

test('Hit animation records contact, freezes play, and releases only its matching completion',()=>{
 let s=freshGame();s.runs[0].invulnerable=0;
 s.runs[0].enemies=[{id:0,x:2,y:1,dx:0,dy:1}];
 s=gameReducer(s,{type:'ADD',command:'forward'});
 s=gameReducer(s,{type:'STEP'});
 assert.deepEqual(s.runs[0].impact,{x:2,y:1,dir:1,id:1});
 for(const type of ['ENEMY_TICK','STEP','START','ADD','LEVEL']){
  assert.strictEqual(gameReducer(s,{type,command:'forward',level:0}),s);
 }
 assert.strictEqual(gameReducer(s,{type:'FINISH_HIT',id:99}),s);
 const finished=gameReducer(s,{type:'FINISH_HIT',id:1});
 assert.equal(finished.runs[0].impact,null);
 assert.deepEqual(finished.runs[0].player,{x:1,y:1,dir:1});
 assert.equal(finished.runs[0].enemyPenalty,30);
 assert.equal(finished.runs[0].invulnerable,4);
 let saved;saveGame({setItem:(k,v)=>saved=v},s);
 const restored=loadGame({getItem:()=>saved});
 assert.equal(restored.runs[0].impact,null,'loading cannot trap the player in an animation');
 assert.equal(restored.runs[0].enemyPenalty,30);
});
