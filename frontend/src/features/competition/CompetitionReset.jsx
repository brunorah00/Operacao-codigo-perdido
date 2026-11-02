import React,{useEffect,useRef,useState} from 'react';
import {supabase} from '../../services/supabase.js';
import {competitionError} from '../../services/students.js';
export function CompetitionReset({competitionId,roomId,onReset,onOpenChange}){
 const [open,setOpen]=useState(false),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dialog=useRef(null);
 useEffect(()=>{if(open){dialog.current.showModal();return()=>dialog.current?.close();}},[open]);
 const close=()=>{setOpen(false);onOpenChange?.(false);};
 const reset=async()=>{
  if(confirmation!=='REINICIAR'||busy)return;
  setBusy(true);setError('');
  try{
   const {data,error}=await supabase.rpc('reset_school_room',{p_room_id:roomId,expected_competition_id:competitionId});
   if(error)throw error;
   close();onReset(data);
  }catch(error){setError(competitionError(error));}finally{setBusy(false);}
 };
 return <><button type="button" className="secondary competition-reset" onClick={()=>{setConfirmation('');setError('');setOpen(true);onOpenChange?.(true);}}>Reiniciar sala</button>
  {open&&<dialog className="modal competition-confirm" ref={dialog} aria-labelledby="competition-reset-title" onCancel={event=>{event.preventDefault();if(!busy)close();}}>
   <h2 id="competition-reset-title">Reiniciar os jogadores desta sala?</h2>
   <p>Os resultados desta sala sairão do ranking da sala e do ranking geral. Seus alunos começarão do início e precisarão entrar novamente. As outras salas serão preservadas.</p>
   <p>Os cadastros e as aprovações dos professores serão mantidos. Esta ação não pode ser desfeita.</p>
   <label>Digite REINICIAR para confirmar<input autoFocus value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy} autoComplete="off"/></label>
   {error&&<p role="alert">{error}</p>}
   <div className="modal-footer"><button className="secondary" disabled={busy} onClick={close}>Cancelar</button><button className="primary" disabled={busy||confirmation!=='REINICIAR'} onClick={reset}>{busy?'Reiniciando…':'Reiniciar esta sala'}</button></div>
  </dialog>}
 </>;
}
