import React,{useCallback,useEffect,useId,useRef,useState} from 'react';
import {supabase} from '../../services/supabase.js';
import {competitionError} from '../../services/students.js';
import './rooms.css';
export function RoomDashboard({profile,onEnter,onLogout,children}){
 const [rooms,setRooms]=useState([]),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
 const [deleting,setDeleting]=useState(null),[confirmation,setConfirmation]=useState('');
 const dialog=useRef(null),titleId=useId();
 const load=useCallback(async()=>{
  try{const {data,error}=await supabase.rpc('list_school_rooms');if(error)throw error;setRooms(data||[]);setLoaded(true);setError('');}catch(error){setError(competitionError(error));}
 },[]);
 useEffect(()=>{void load();const timer=setInterval(load,10000);return()=>clearInterval(timer);},[load]);
 useEffect(()=>{if(deleting){dialog.current.showModal();return()=>dialog.current?.close();}},[deleting]);
 const create=async event=>{
  event.preventDefault();if(busy)return;setBusy(true);setError('');
  try{const {error}=await supabase.rpc('create_school_room',{room_name:name.trim()});if(error)throw error;setName('');await load();}catch(error){setError(competitionError(error));}finally{setBusy(false);}
 };
 const remove=async()=>{
  if(busy||confirmation!=='EXCLUIR')return;setBusy(true);setError('');
  try{const {error}=await supabase.rpc('delete_school_room',{p_room_id:deleting.id});if(error)throw error;setDeleting(null);await load();}catch(error){setError(competitionError(error));}finally{setBusy(false);}
 };
 return <div className="room-dashboard"><h1>{profile.role==='admin'?'Gerenciar salas':'Minhas salas'}</h1><p>Crie uma sala para ela aparecer na lista de entrada dos alunos. Cada sala tem seu ranking e seus participantes também aparecem no ranking geral.</p>
  <form className="room-create" onSubmit={create}><label>Nome da sala<input name="roomName" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: 2º ano A · Matemática" minLength={2} maxLength={80} required/></label><button className="primary" disabled={busy}>Criar sala</button></form>
  {error&&<p role="alert" className="feedback wrong">{error}</p>}
  <button className="secondary" onClick={load} disabled={busy}>Atualizar salas</button>
  {loaded&&!rooms.length&&<p>Nenhuma sala criada. Crie a primeira para liberar a entrada dos alunos.</p>}
  <div className="room-list">{rooms.map(room=><article key={room.id} className="room-card"><h2>{room.name}</h2><p>Código de entrada: <strong className="room-code">{room.join_code}</strong></p><div className="room-actions"><button className="primary" onClick={()=>onEnter(room)}>Abrir sala</button><button className="secondary" onClick={()=>{setConfirmation('');setDeleting(room);}} disabled={busy} aria-label={`Excluir sala ${room.name}`}>Excluir sala</button></div></article>)}</div>
  {children}<button className="secondary" onClick={onLogout}>Sair da conta</button>
  {deleting&&<dialog ref={dialog} className="modal competition-confirm" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)setDeleting(null);}}><h2 id={titleId}>Excluir {deleting.name}?</h2><p>Os participantes desta sala serão desconectados. Seus resultados serão removidos do ranking da sala e do ranking geral. As outras salas serão mantidas. Esta ação não pode ser desfeita.</p><label>Digite EXCLUIR para confirmar<input autoFocus value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></label>{error&&<p role="alert">{error}</p>}<div className="modal-footer"><button className="secondary" disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button><button className="primary" disabled={busy||confirmation!=='EXCLUIR'} onClick={remove}>{busy?'Excluindo…':'Excluir definitivamente'}</button></div></dialog>}
 </div>;
}
