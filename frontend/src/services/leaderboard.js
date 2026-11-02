export async function leaderboardBankKey(questions){
 const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(questions)));
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

export function orderLeaderboard(rows){
 const ordered=rows.map(row=>({...row,id:row.player_id})).sort((a,b)=>b.score-a.score||a.commands-b.commands||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
 let rank=0;
 return ordered.map((row,index)=>{
  if(index===0||row.score!==ordered[index-1].score||row.commands!==ordered[index-1].commands)rank=index+1;
  return {...row,rank};
 });
}

export function rankingError(error){
 if(['PGRST202','PGRST205','42P01','42883'].includes(error?.code))return 'Ranking online indisponível: aplique a migração 202611020002_nickname_competitions.sql no Supabase.';
 if(error?.code==='42501')return 'Para sincronizar seu ranking, saia da conta e entre novamente.';
 return 'Não foi possível sincronizar o ranking. Tentaremos novamente quando a conexão voltar.';
}

// Mantém somente a publicação mais recente na fila e repete falhas sem perder
// o recorde local. Realtime atualiza os leitores; a consulta periódica recupera
// eventos perdidos durante desconexões ou suspensão da aba.
export function connectLeaderboard(client,{account,bankKey,scoringVersion,onRows,onStatus},scheduler=globalThis){
 let stopped=false,reading=false,readAgain=false,writing=false,pending=null,lastSent='',connected=false,readError='',writeError='';
 const status=()=>{if(!stopped)onStatus(readError||writeError||(connected?'Ranking ao vivo entre jogadores.':'Reconectando o ranking; atualização automática a cada 10 segundos.'));};
 const refresh=async()=>{
  if(stopped)return;
  if(reading){readAgain=true;return;}
  reading=true;
  try{
   const rows=[];
   for(let start=0;;start+=1000){
    const {data,error}=await client.from('leaderboard').select('player_id,name,score,commands,clues,completed')
     .eq('bank_key',bankKey).eq('scoring_version',scoringVersion).eq('competition_id',account.competition_id)
     .order('score',{ascending:false}).order('commands').order('player_id').range(start,start+999);
    if(error)throw error;
    rows.push(...data);
    if(data.length<1000)break;
   }
   if(!stopped){readError='';onRows(orderLeaderboard(rows));status();}
  }catch(error){readError=rankingError(error);status();}
  finally{reading=false;if(readAgain&&!stopped){readAgain=false;void refresh();}}
 };
 const publish=async()=>{
  if(stopped||writing||!pending)return;
  const best=pending,key=JSON.stringify(best);
  writing=true;
  try{
   const {error}=await client.rpc('submit_leaderboard',{
    p_player_id:account.id,p_competition_id:account.competition_id,p_bank_key:bankKey,p_scoring_version:scoringVersion,
    p_score:best.score,p_commands:best.commands,p_clues:best.clues,p_completed:best.completed,
    p_student_token:account.ranking_token||null
   });
   if(error)throw error;
   lastSent=key;if(JSON.stringify(pending)===key)pending=null;
   writeError='';status();void refresh();
  }catch(error){writeError=rankingError(error);status();}
  finally{writing=false;}
 };
 const channel=client.channel(`leaderboard:${bankKey}:${account.id}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'leaderboard',filter:`bank_key=eq.${bankKey}`},()=>void refresh())
  .subscribe(value=>{
   connected=value==='SUBSCRIBED';status();
   if(connected){void refresh();void publish();}
  });
 void refresh();
 const writeTimer=scheduler.setInterval(()=>void publish(),1000);
 const readTimer=scheduler.setInterval(()=>{void refresh();void publish();},10000);
 const resume=()=>{void refresh();void publish();};
 globalThis.addEventListener?.('online',resume);
 globalThis.addEventListener?.('focus',resume);
 return {
  update(best){if(best.scoringVersion===scoringVersion&&JSON.stringify(best)!==lastSent)pending={...best};},
  stop(){stopped=true;scheduler.clearInterval(writeTimer);scheduler.clearInterval(readTimer);globalThis.removeEventListener?.('online',resume);globalThis.removeEventListener?.('focus',resume);void client.removeChannel(channel);}
 };
}
