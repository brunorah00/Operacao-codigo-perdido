import test from 'node:test';
import assert from 'node:assert/strict';
import {freshGame,gameReducer,SAVE_KEY} from '../src/engine.js';
import {DEFAULT_QUESTIONS} from '../src/questions.js';
import {bankSignature,campaignData,emptyPlayers,joinPlayer,normalizeName,PLAYERS_KEY,rankingRows,readPlayers,recordProgress,restoreCampaign,savePlayers} from '../src/players.js';

function storage(){return {data:new Map(),getItem(k){return this.data.get(k)||null;},setItem(k,v){this.data.set(k,v);}};}
function scored(points=100){const state=freshGame();state.runs[0].solved=['a1'];state.runs[0].awards={a1:points};return state;}
test('Identification requires name and surname, accepts Brazilian names, and resumes case-insensitively',()=>{
 assert.equal(normalizeName('  João   Pedro  '),'João Pedro');assert.equal(normalizeName("D’Ávila"),'D’Ávila');assert.equal(normalizeName('Ana-Clara'),'Ana-Clara');
 for(const name of ['', ' ', 'A','123','<img src=x>','--','a'.repeat(61)])assert.throws(()=>normalizeName(name));
 let result=joinPlayer(emptyPlayers(),' João  Pedro ','D’Ávila');const id=result.playerId;
 result=joinPlayer(result.store,'joão pedro','d’ávila');assert.equal(result.playerId,id);assert.equal(result.store.players.length,1);
 assert.throws(()=>joinPlayer(result.store,'Bruno',' '));
});
test('Two players have separate saved games and matching names resume only the correct campaign',()=>{
 let {store,playerId:ana}=joinPlayer(emptyPlayers(),'Ana','Silva');store=recordProgress(store,ana,scored(85));
 let result=joinPlayer(store,'Bruno','Souza');store=result.store;const bruno=result.playerId;
 assert.equal(restoreCampaign(store.players.find(p=>p.id===bruno).campaign).runs[0].solved.length,0);
 store=recordProgress(store,bruno,scored(100));
 const same=joinPlayer(store,'ANA','SILVA');assert.equal(same.playerId,ana);assert.equal(same.store.players.find(p=>p.id===ana).best.score,85);
 const rows=rankingRows(store,DEFAULT_QUESTIONS);assert.equal(rows[0].id,bruno);assert.equal(rows[1].id,ana);assert.deepEqual(rows.map(p=>p.score),[100,85]);
});
test('Rankings keep personal bests across restarts, avoid duplicate accumulation, and share tied positions',()=>{
 let store=emptyPlayers(),ids=[];
 for(const name of ['Carlos','Ana','Bruno']){const result=joinPlayer(store,name,'Silva');store=result.store;ids.push(result.playerId);store=recordProgress(store,result.playerId,scored(name==='Bruno'?85:100));}
 store=recordProgress(store,ids[0],scored(100));store=recordProgress(store,ids[0],gameReducer(scored(100),{type:'RESTART'}));
 assert.equal(store.players.find(p=>p.id===ids[0]).best.score,100);
 assert.deepEqual(rankingRows(store,DEFAULT_QUESTIONS).map(p=>[p.name,p.score,p.rank]),[['Ana Silva',100,1],['Carlos Silva',100,1],['Bruno Silva',85,3]]);
});
test('Only identical challenge banks are compared; a new player receives the currently selected bank',()=>{
 let {store,playerId}=joinPlayer(emptyPlayers(),'Ana','Silva');store=recordProgress(store,playerId,scored(100));
 const custom=structuredClone(DEFAULT_QUESTIONS);custom[0][0].prompt='Nova pergunta';const next=freshGame(custom);store=recordProgress(store,playerId,next);
 assert.equal(rankingRows(store,DEFAULT_QUESTIONS).length,0);assert.equal(rankingRows(store,custom)[0].score,0);
 const joined=joinPlayer(store,'Bruno','Souza');assert.equal(bankSignature(joined.store.players[1].campaign.questions),bankSignature(custom));
});
test('Roster persists and restores both personal best and current progress; legacy progress is claimed once',()=>{
 const mem=storage();mem.setItem(SAVE_KEY,JSON.stringify(campaignData(scored(85))));let store=readPlayers(mem);assert(store.pendingLegacy);
 let joined=joinPlayer(store,'Ana','Silva');store=joined.store;const ana=joined.playerId;assert.equal(store.players[0].best.score,85);assert.equal(store.pendingLegacy,null);
 joined=joinPlayer(store,'Bruno','Souza');store=joined.store;assert.equal(store.players[1].best.score,0);
 store=recordProgress(store,ana,freshGame());assert.equal(savePlayers(mem,store),true);const loaded=readPlayers(mem);
 assert.equal(loaded.players.length,2);assert.equal(loaded.players[0].best.score,85);assert.equal(loaded.players[0].campaign.runs[0].solved.length,0);
 assert.equal(savePlayers({setItem(){throw Error('denied');}},store),false);
 mem.setItem(PLAYERS_KEY,'bad json');assert.equal(readPlayers(mem).players.length,0);
 const damaged=structuredClone(store);damaged.players.push({...damaged.players[0],id:'bad',givenName:'<script>'});mem.setItem(PLAYERS_KEY,JSON.stringify(damaged));assert.equal(readPlayers(mem).players.length,2);
});

test('Rankings use net points and fewer commands break point ties',()=>{
 let store=emptyPlayers();
 for(const [name,points,commands] of [['Ana',100,20],['Bruno',85,5],['Carlos',85,5]]){let joined=joinPlayer(store,name,'Silva');store=joined.store;const state=scored(points);state.runs[0].commands=commands;store=recordProgress(store,joined.playerId,state);}
 assert.deepEqual(rankingRows(store,DEFAULT_QUESTIONS).map(p=>[p.name,p.score,p.commands,p.rank]),[['Bruno Silva',80,5,1],['Carlos Silva',80,5,1],['Ana Silva',80,20,3]]);
});
test('Scores from the prior rule are recomputed from saved commands without losing player progress',()=>{
 const mem=storage();let {store,playerId}=joinPlayer(emptyPlayers(),'Ana','Silva');const state=scored(100);state.runs[0].commands=20;store=recordProgress(store,playerId,state);
 store.players[0].best={score:100,clues:1,completed:0};mem.setItem(PLAYERS_KEY,JSON.stringify(store));const migrated=readPlayers(mem);
 assert.equal(migrated.players[0].best.score,80);assert.equal(migrated.players[0].best.commands,20);assert.equal(migrated.players[0].givenName,'Ana');assert.deepEqual(migrated.players[0].campaign.runs[0].solved,['a1']);
 assert.equal(savePlayers(mem,migrated),true);assert.equal(readPlayers(mem).players[0].best.score,80);
});
