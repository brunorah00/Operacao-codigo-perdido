export const HIT_PENALTY=30;
export const HIT_ANIMATION_MS=1200;
export const ENEMY_TYPES={
 forest:{name:'Vespa',color:'#edbd38',mode:'diagonal',period:1},
 rock:{name:'Golem',color:'#969ca7',mode:'vertical',period:3},
 water:{name:'Medusa',color:'#70deed',mode:'vertical',period:2},
 lava:{name:'Ígneo',color:'#ff743e',mode:'diagonal',period:2},
 factory:{name:'Drone',color:'#e66778',mode:'vertical',period:1},
 horror:{name:'Espectro',color:'#b8a1eb',mode:'diagonal',period:3}
};
export const inArena=(map,x,y)=>map.arenas.some(room=>x>=room.x&&x<room.x+room.width&&y>=room.y&&y<room.y+room.height);
const safe=(map,x,y)=>inArena(map,x,y)&&map.grid[y]?.[x]===0&&!(x<=4&&y<=3)&&!map.clues.some(c=>c.x===x&&c.y===y)&&!(map.exit.x===x&&map.exit.y===y);
export function spawnEnemies(map,seed){
 let value=seed>>>0;const random=()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};
 const candidates=[];const type=ENEMY_TYPES[map.theme];
 for(let y=1;y<map.size-1;y++)for(let x=1;x<map.size-1;x++){
  const dx=type.mode==='diagonal'?1:0;
  if(safe(map,x,y)&&safe(map,x+dx,y+1)&&(dx===0||(safe(map,x+dx,y)&&safe(map,x,y+1))))candidates.push({x,y});
 }
 const enemies=[];
 while(candidates.length&&enemies.length<4){
  const room=map.arenas[enemies.length];
  const positions=candidates.filter(c=>c.x>=room.x&&c.x<room.x+room.width&&c.y>=room.y&&c.y<room.y+room.height);
  if(!positions.length)break;
  const cell=positions[Math.floor(random()*positions.length)];
  candidates.splice(candidates.indexOf(cell),1);
  enemies.push({...cell,id:enemies.length,dx:type.mode==='diagonal'?1:0,dy:1});
 }
 return enemies;
}
export function advanceEnemies(map,run){
 const tick=(run.enemyTick||0)+1,type=ENEMY_TYPES[map.theme],occupied=new Set();
 const enemies=(run.enemies||[]).map(enemy=>{
  let next={...enemy};
  const canMove=(dx,dy)=>safe(map,enemy.x+dx,enemy.y+dy)&&(!dx||(safe(map,enemy.x+dx,enemy.y)&&safe(map,enemy.x,enemy.y+dy)))&&!occupied.has((enemy.x+dx)+','+(enemy.y+dy));
  if(tick%type.period===0){
   if(!canMove(next.dx,next.dy)){next.dx=-next.dx;next.dy=-next.dy;}
   if(canMove(next.dx,next.dy)){next.x+=next.dx;next.y+=next.dy;}
  }
  occupied.add(next.x+','+next.y);return next;
 });
 return {...run,enemies,enemyTick:tick,invulnerable:Math.max(0,(run.invulnerable||0)-1)};
}
export function checkEnemyHit(map,run){
 if(run.invulnerable>0||!run.enemies?.some(e=>e.x===run.player.x&&e.y===run.player.y))return run;
 return {...run,impact:{...run.player,id:(run.hits||0)+1},player:{x:1,y:1,dir:1},hits:(run.hits||0)+1,enemyPenalty:(run.enemyPenalty||0)+HIT_PENALTY,invulnerable:4};
}
export function restoreEnemies(map,run,fallback){
 const valid=Array.isArray(run.enemies)&&run.enemies.length<=4&&run.enemies.every(e=>Number.isInteger(e.x)&&Number.isInteger(e.y)&&safe(map,e.x,e.y)&&[-1,0,1].includes(e.dx)&&[-1,1].includes(e.dy));
 return {enemies:valid?run.enemies:fallback.enemies,enemyTick:Number.isInteger(run.enemyTick)&&run.enemyTick>=0?run.enemyTick:0,hits:Number.isInteger(run.hits)&&run.hits>=0?run.hits:0,enemyPenalty:Number.isInteger(run.enemyPenalty)&&run.enemyPenalty>=0?run.enemyPenalty:0,invulnerable:4};
}
