import {useCallback,useEffect,useState} from 'react';
import {competitionError} from '../../services/students.js';
export function useCompetition(client){
 const [competition,setCompetition]=useState(null),[error,setError]=useState('');
 const apply=useCallback(value=>setCompetition(old=>!old||value.generation>old.generation?value:old),[]);
 const refresh=useCallback(async()=>{
  if(!client)return;
  try{
   const {data,error}=await client.from('competition_state').select('competition_id,generation,reset_at').eq('id',true).single();
   if(error)throw error;
   apply(data);setError('');return data;
  }catch(error){setError(competitionError(error));}
 },[client,apply]);
 useEffect(()=>{
  if(!client)return;
  let active=true;
  const load=async()=>{if(active)await refresh();};
  void load();
  const channel=client.channel('school-competition').on('postgres_changes',{event:'UPDATE',schema:'public',table:'competition_state'},payload=>{if(active){apply(payload.new);void load();}}).subscribe(status=>{if(status==='SUBSCRIBED')void load();});
  const timer=setInterval(load,5000);
  window.addEventListener('online',load);window.addEventListener('focus',load);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('online',load);window.removeEventListener('focus',load);void client.removeChannel(channel);};
 },[client,refresh,apply]);
 return {competition,error,refresh,apply};
}
