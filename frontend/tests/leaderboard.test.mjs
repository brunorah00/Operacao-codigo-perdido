import test from 'node:test';
import assert from 'node:assert/strict';
import {connectLeaderboard,leaderboardBankKey,orderLeaderboard} from '../src/services/leaderboard.js';

const settle=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const rows=[{player_id:'a',name:'Ana',score:100,commands:2}],writes=[],timers=new Map();
 let changed,subscription,removed=false,failWrite=false,failRead=false;
 const query={select(){return this;},eq(){return this;},order(){return this;},async range(){return failRead?{error:{message:'offline'}}:{data:structuredClone(rows)};}};
 const channel={on(_type,filter,callback){assert.equal(filter.table,'leaderboard');changed=callback;return this;},subscribe(callback){subscription=callback;return this;}};
 const client={from(name){assert.equal(name,'leaderboard');return query;},channel(){return channel;},removeChannel(){removed=true;},async rpc(name,args){assert.equal(name,'submit_leaderboard');writes.push(args);return failWrite?{error:{message:'offline'}}:{};}};
 const scheduler={setInterval(fn,ms){timers.set(ms,fn);return ms;},clearInterval(ms){timers.delete(ms);}};
 const observed=[],statuses=[];
 const sync=connectLeaderboard(client,{account:{id:'a',competition_id:'round-1',ranking_token:'private-session'},bankKey:'abc',scoringVersion:3,onRows:value=>observed.push(value),onStatus:value=>statuses.push(value)},scheduler);
 return {sync,rows,writes,observed,statuses,timers,change:()=>changed(),subscribe:value=>subscription(value),setFailWrite:value=>{failWrite=value;},setFailRead:value=>{failRead=value;},removed:()=>removed};
}
const best=score=>({scoringVersion:3,score,commands:2,clues:1,completed:0});

test('challenge banks have stable hashes and different banks remain separate',async()=>{
 const a=await leaderboardBankKey([[{prompt:'A'}]]);
 assert.match(a,/^[a-f0-9]{64}$/);
 assert.equal(a,await leaderboardBankKey([[{prompt:'A'}]]));
 assert.notEqual(a,await leaderboardBankKey([[{prompt:'B'}]]));
});
test('ranking orders by points and commands with shared positions for ties',()=>{
 const rows=orderLeaderboard([{player_id:'c',name:'Carlos',score:80,commands:1},{player_id:'b',name:'Bruno',score:100,commands:5},{player_id:'a',name:'Ana',score:100,commands:5},{player_id:'d',name:'Dora',score:100,commands:3}]);
 assert.deepEqual(rows.map(row=>[row.id,row.rank]),[['d',1],['a',2],['b',2],['c',4]]);
});
test('another player appears from a realtime event without reloading',async()=>{
 const f=fixture();await settle();
 f.subscribe('SUBSCRIBED');await settle();
 f.rows.push({player_id:'b',name:'Bruno',score:200,commands:3});f.change();await settle();
 assert.deepEqual(f.observed.at(-1).map(row=>row.id),['b','a']);
 assert.match(f.statuses.at(-1),/ao vivo/);
 f.sync.stop();assert.equal(f.removed(),true);assert.equal(f.timers.size,0);
 const before=f.observed.length;f.change();await settle();assert.equal(f.observed.length,before);
});
test('publishing coalesces rapid progress and retries after a network failure',async()=>{
 const f=fixture();await settle();
 f.sync.update(best(100));f.sync.update(best(200));f.setFailWrite(true);
 f.timers.get(1000)();await settle();
 assert.equal(f.writes.at(-1).p_score,200);assert.equal(f.writes.at(-1).p_student_token,'private-session');assert.equal(f.writes.at(-1).p_competition_id,'round-1');
 assert.match(f.statuses.at(-1),/conexão/);
 f.setFailWrite(false);f.timers.get(1000)();await settle();
 assert.equal(f.writes.length,2);
 f.sync.update(best(200));f.timers.get(1000)();await settle();assert.equal(f.writes.length,2);
 f.sync.stop();
});
test('polling recovers missed events and reconnect refreshes immediately',async()=>{
 const f=fixture();await settle();f.setFailRead(true);f.change();await settle();
 assert.match(f.statuses.at(-1),/conexão/);
 f.rows[0].score=300;f.setFailRead(false);f.timers.get(10000)();await settle();
 assert.equal(f.observed.at(-1)[0].score,300);
 f.rows[0].score=400;f.subscribe('SUBSCRIBED');await settle();assert.equal(f.observed.at(-1)[0].score,400);
 f.sync.stop();
});
