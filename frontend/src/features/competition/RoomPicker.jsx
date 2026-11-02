import React,{useEffect,useRef,useState} from 'react';
import {supabase} from '../../services/supabase.js';
import {listStudentRooms} from '../../services/students.js';
import './rooms.css';
export function RoomPicker({value,onChange,onReadyChange,disabled}){
 const [rooms,setRooms]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const selected=useRef(value),change=useRef(onChange),reload=useRef(()=>{});
 selected.current=value;change.current=onChange;
 useEffect(()=>{
  let alive=true,running=false;
  const load=async()=>{
   if(running||!alive)return;running=true;
   try{
    const data=await listStudentRooms(supabase);
    if(alive){setRooms(data);setError('');if(selected.current&&!data.some(room=>room.id===selected.current))change.current('');}
   }catch(error){if(alive)setError(error.message);}finally{running=false;if(alive)setLoading(false);}
  };
  reload.current=load;void load();
  const channel=supabase.channel('student-room-list').on('postgres_changes',{event:'*',schema:'public',table:'school_rooms'},()=>void load()).subscribe(status=>{if(status==='SUBSCRIBED')void load();});
  const timer=setInterval(load,5000),resume=()=>void load();
  window.addEventListener('online',resume);window.addEventListener('focus',resume);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener('online',resume);window.removeEventListener('focus',resume);void supabase.removeChannel(channel);};
 },[]);
 useEffect(()=>{onReadyChange(!loading&&!error&&rooms.some(room=>room.id===value));},[loading,error,rooms,value,onReadyChange]);
 return <div className="room-picker"><label>Sala<select name="roomId" value={value} onChange={event=>onChange(event.target.value)} required disabled={disabled||loading||!rooms.length||!!error}>
  <option value="">{loading?'Carregando salas…':'Selecione sua sala'}</option>
  {rooms.map(room=><option key={room.id} value={room.id}>{room.name} · {room.teacher_name}</option>)}
 </select></label>
 {error?<p role="alert">{error}</p>:!loading&&!rooms.length?<p role="status">Nenhuma sala disponível. Aguarde seu professor criar uma sala.</p>:null}
 <button className="secondary room-list-refresh" type="button" disabled={disabled} onClick={()=>void reload.current()}>Atualizar lista de salas</button>
 </div>;
}
