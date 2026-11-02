import {useEffect,useRef,useState} from 'react';
import {SCORING_VERSION} from './engine.js';
import {supabase} from './services/supabase.js';
import {connectLeaderboard,leaderboardBankKey,rankingError} from './services/leaderboard.js';

export function useLiveLeaderboard(account,player){
 const [result,setResult]=useState({signature:null,rows:[],status:'Conectando ao ranking online…'});
 const connection=useRef(null),latest=useRef(null);
 const signature=player?JSON.stringify(player.campaign.questions):null;
 latest.current=player?.best;
 useEffect(()=>{
  if(!account||!signature||!supabase)return;
  let cancelled=false,sync;
  setResult({signature,rows:[],status:'Conectando ao ranking online…'});
  leaderboardBankKey(JSON.parse(signature)).then(bankKey=>{
   if(cancelled)return;
   sync=connectLeaderboard(supabase,{
    account,bankKey,scoringVersion:SCORING_VERSION,
    onRows:rows=>setResult(old=>({...old,rows})),
    onStatus:status=>setResult(old=>({...old,status}))
   });
   connection.current=sync;
   if(latest.current)sync.update(latest.current);
  }).catch(error=>{if(!cancelled)setResult({signature,rows:[],status:rankingError(error)});});
  return()=>{cancelled=true;sync?.stop();connection.current=null;};
 },[account?.id,account?.ranking_token,signature]);
 useEffect(()=>{if(player?.best)connection.current?.update(player.best);},[player?.best]);
 return result.signature===signature?result:{rows:[],status:'Conectando ao ranking online…'};
}
