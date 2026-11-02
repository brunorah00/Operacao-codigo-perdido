import React,{useEffect,useRef} from 'react';
import {Icon} from '../../visuals.jsx';
import {DIR_NAMES} from '../../engine.js';
import {COMMANDS} from './commands.js';
import './program.css';

export function ExecutionFeedback({execution,running}){
 if(!execution)return <p className="execution-feedback" role="status">{running?'Preparando o primeiro comando…':'Use Passo para observar um comando de cada vez.'}</p>;
 const {type,from,to,event,number,remaining}=execution;
 const effect=event==='collision'?'Parede à frente: o robô não avançou.':event==='skipped'?'Há uma parede: a condição evitou o avanço.':event==='enemy'?'Contato com inimigo: retorno à origem.':type==='left'||type==='right'?`Agora o robô olha para ${DIR_NAMES[to.dir]}.`:`De (${from.x+1}, ${from.y+1}) para (${to.x+1}, ${to.y+1}).`;
 return <div className="execution-feedback executed" role="status" aria-live="polite"><strong><Icon name={COMMANDS[type].icon} size={17}/>Executado #{number}: {COMMANDS[type].label}</strong><span>{effect}{remaining>0?` Restam ${remaining} neste bloco.`:''}</span></div>;
}

export function SequenceEditor({state,dispatch,compact=false}){
 const listRef=useRef(null),run=state.runs[state.level],blocked=state.running||!!state.active||run.completed||!!run.impact;
 useEffect(()=>{if(state.running&&listRef.current)listRef.current.scrollTop=0;},[state.queue,state.running]);
 return <div className={`sequence-editor${compact?' compact-editor':''}`}>
  <div className="sequence-edit-tools"><label>Inserir comando<select aria-label="Posição para inserir comando" disabled={blocked} value={state.editCursor??state.queue.length} onChange={e=>dispatch({type:'INSERT_AT',index:Number(e.target.value)})}>
   {Array.from({length:state.queue.length+1},(_,index)=><option key={index} value={index}>{index===state.queue.length?'No final':`Antes do comando ${index+1}`}</option>)}
  </select></label><button className="secondary" disabled={blocked||!state.queueHistory?.length} onClick={()=>dispatch({type:'UNDO_QUEUE'})}>Desfazer edição</button><button className="secondary" disabled={blocked||!state.queue.length} onClick={()=>dispatch({type:'CLEAR'})} aria-label="Limpar sequência de comandos"><Icon name="trash" size={16}/></button></div>
  <ExecutionFeedback execution={state.lastExecution} running={state.running}/>
  <ol className="sequence-list editable-sequence" ref={listRef} aria-label="Comandos na ordem de execução">
   {state.queue.map((command,index)=><li key={index} className={state.running&&index===0?'next-command':''} aria-current={state.running&&index===0?'step':undefined}>
    <span className="sequence-index">{index+1}</span><Icon name={COMMANDS[command.type].icon} size={16}/><span className="command-name">{COMMANDS[command.type].label}{state.running&&index===0&&<small>A seguir</small>}</span>{command.repeat>1&&<b>×{command.repeat}</b>}
    <span className="command-edit-actions"><button disabled={blocked||index===0} onClick={()=>dispatch({type:'MOVE_COMMAND',index,to:index-1})} aria-label={`Mover comando ${index+1} para antes`} title="Mover para antes">↑</button><button disabled={blocked||index===state.queue.length-1} onClick={()=>dispatch({type:'MOVE_COMMAND',index,to:index+1})} aria-label={`Mover comando ${index+1} para depois`} title="Mover para depois">↓</button><button disabled={blocked} onClick={()=>dispatch({type:'REMOVE',index})} aria-label={`Remover comando ${index+1}`}><Icon name="close" size={16}/></button></span>
   </li>)}
   {!state.queue.length&&<li className="sequence-empty"><strong>Monte seu caminho</strong><p>Escolha uma posição e adicione comandos. Use as setas da lista para reordenar.</p></li>}
  </ol>
 </div>;
}
