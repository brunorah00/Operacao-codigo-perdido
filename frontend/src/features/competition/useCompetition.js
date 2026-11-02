import {useCallback,useEffect,useRef,useState} from 'react';
import {competitionError} from '../../services/students.js';
export function useCompetition(client,roomId){
 const [competition,setCompetition]=useState(null),[error,setError]=useState(''),[missing,setMissing]=useState(false);
 const currentRoom=useRef(roomId);currentRoom.current=roomId;
 const apply=useCallback(value=>{
  if(value?.id!==currentRoom.current)return;
  setCompetition(old=>!old||old.id!==value.id||Number(value.generation)>Number(old.generation)?value:old);
 },[]);
 const refresh=useCallback(async()=>{
  if(!client||!roomId)return;
  try{
   const {data,error}=await client.from('school_rooms').select('id,name,competition_id,generation').eq('id',roomId).maybeSingle();
   if(currentRoom.current!==roomId)return;
   if(error)throw error;
   setMissing(!data);if(data)apply(data);setError('');return data;
  }catch(error){if(currentRoom.current===roomId)setError(competitionError(error));}
 },[client,roomId,apply]);
 useEffect(()=>{
  setCompetition(null);setMissing(false);setError('');
  if(!client||!roomId)return;
  let active=true;const load=()=>{if(active)void refresh();};load();
  const channel=client.channel(`school-room:${roomId}`).on('postgres_changes',{event:'*',schema:'public',table:'school_rooms'},payload=>{if(active){if(payload.new?.id===roomId)apply(payload.new);load();}}).subscribe(status=>{if(status==='SUBSCRIBED')load();});
  const timer=setInterval(load,5000);window.addEventListener('online',load);window.addEventListener('focus',load);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('online',load);window.removeEventListener('focus',load);void client.removeChannel(channel);};
 },[client,roomId,refresh,apply]);
 return {competition:competition?.id===roomId?competition:null,error,missing,refresh,apply};
}
