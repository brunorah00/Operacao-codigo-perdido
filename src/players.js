import {freshGame,loadGame,SCORING_VERSION,totalScore} from './engine.js';
import {DEFAULT_QUESTIONS,validateQuestions} from './questions.js';

export const PLAYERS_KEY='codigo-perdido-jogadores-v1';
export function normalizeName(value,label='Nome'){
 const clean=String(value??'').normalize('NFC').trim().replace(/\s+/gu,' ');
 if(clean.length<2||clean.length>60||!/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(clean))throw Error(`${label}: use de 2 a 60 caracteres, com letras, espaços, apóstrofos ou hífens.`);
 return clean;
}
const identity=(given,family)=>`${given.toLocaleLowerCase('pt-BR')}\n${family.toLocaleLowerCase('pt-BR')}`;
export function campaignData(state){const {version,questions,level,unlocked,runs}=state;return {version,questions,level,unlocked,runs};}
export function restoreCampaign(data){return loadGame({getItem:()=>JSON.stringify(data)});}
export const bankSignature=questions=>JSON.stringify(questions);
const maximumScore=questions=>questions.flat().length*100+600;
export function emptyPlayers(questions=DEFAULT_QUESTIONS){return {version:1,questions,players:[],pendingLegacy:null};}
function stats(state){return {scoringVersion:SCORING_VERSION,score:totalScore(state),commands:state.runs.reduce((n,r)=>n+r.commands,0),clues:state.runs.reduce((n,r)=>n+r.solved.length,0),completed:state.runs.filter(r=>r.completed).length};}
const better=(candidate,record)=>candidate.score>record.score||(candidate.score===record.score&&candidate.commands<record.commands);
export function readPlayers(storage){
 try{
  const raw=storage.getItem(PLAYERS_KEY);
  if(raw){
   const data=JSON.parse(raw);if(data.version!==1||!Array.isArray(data.players))throw Error('Invalid roster');
   const questions=validateQuestions(data.questions),ids=new Set(),names=new Set(),players=[];
   for(const record of data.players.slice(0,500)){
    try{
     const givenName=normalizeName(record.givenName),familyName=normalizeName(record.familyName,'Sobrenome'),nameKey=identity(givenName,familyName);
     if(typeof record.id!=='string'||!record.id||ids.has(record.id)||names.has(nameKey))continue;
     const state=restoreCampaign(record.campaign),current=stats(state),max=maximumScore(state.questions);
     const validBest=record.best?.scoringVersion===SCORING_VERSION&&Number.isInteger(record.best.commands)&&record.best.commands>=0&&Number.isInteger(record.best.score)&&record.best.score<=max&&record.best.score>=0&&Number.isInteger(record.best.clues)&&record.best.clues>=0&&record.best.clues<=state.questions.flat().length&&Number.isInteger(record.best.completed)&&record.best.completed>=0&&record.best.completed<=3;
     const best=validBest&&!better(current,record.best)?record.best:current;
     players.push({id:record.id,givenName,familyName,campaign:campaignData(state),best});ids.add(record.id);names.add(nameKey);
    }catch{/* Keep other valid players if one entry is damaged. */}
   }
   return {version:1,questions,players,pendingLegacy:!players.length&&data.pendingLegacy?campaignData(restoreCampaign(data.pendingLegacy)):null};
  }
 }catch{/* Fall back to the previous single-player save when available. */}
 let legacy;try{legacy=loadGame(storage);}catch{legacy=freshGame();}
 const played=legacy.runs.some(r=>r.commands>0||r.solved.length>0||r.completed);
 return {...emptyPlayers(legacy.questions),pendingLegacy:played?campaignData(legacy):null};
}
export function joinPlayer(store,given,family){
 const givenName=normalizeName(given),familyName=normalizeName(family,'Sobrenome');
 const found=store.players.find(p=>identity(p.givenName,p.familyName)===identity(givenName,familyName));
 if(found)return {store,playerId:found.id};
 if(store.players.length>=500)throw Error('Este navegador atingiu o limite de 500 jogadores.');
 const state=store.pendingLegacy?restoreCampaign(store.pendingLegacy):freshGame(store.questions);
 const player={id:globalThis.crypto.randomUUID(),givenName,familyName,campaign:campaignData(state),best:stats(state)};
 return {store:{...store,players:[...store.players,player],pendingLegacy:null},playerId:player.id};
}
export function recordProgress(store,playerId,state){
 const player=store.players.find(p=>p.id===playerId);if(!player)return store;
 const current=stats(state),changedBank=bankSignature(player.campaign.questions)!==bankSignature(state.questions);
 const best=changedBank||player.best.scoringVersion!==SCORING_VERSION||better(current,player.best)?current:player.best;
 return {...store,questions:state.questions,players:store.players.map(p=>p.id===playerId?{...p,campaign:campaignData(state),best}:p)};
}
export function rankingRows(store,questions){
 const signature=bankSignature(questions);
 const ordered=store.players.filter(p=>bankSignature(p.campaign.questions)===signature).map(p=>({id:p.id,name:`${p.givenName} ${p.familyName}`,...p.best})).sort((a,b)=>b.score-a.score||a.commands-b.commands||a.name.localeCompare(b.name,'pt-BR'));
 let rank=0;return ordered.map((p,i)=>{if(i===0||p.score!==ordered[i-1].score||p.commands!==ordered[i-1].commands)rank=i+1;return {...p,rank};});
}
export function savePlayers(storage,store){try{storage.setItem(PLAYERS_KEY,JSON.stringify(store));return true;}catch{return false;}}
