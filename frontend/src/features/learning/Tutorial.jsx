import React,{useEffect,useReducer} from 'react';
import {COMMANDS} from '../program/commands.js';
import {tutorialStart,tutorialReducer,TUTORIAL_STEPS} from './tutorial.js';
export const tutorialKey=id=>`codigo-perdido-tutorial-v1:${id}`;
export function readTutorialSeen(id){try{return !!localStorage.getItem(tutorialKey(id));}catch{return false;}}
export function saveTutorialSeen(id){try{localStorage.setItem(tutorialKey(id),'seen');}catch{/* Treino continua disponível sem armazenamento. */}}

export function Tutorial({onDone}){
 const [state,dispatch]=useReducer(tutorialReducer,undefined,()=>tutorialStart());
 const lesson=TUTORIAL_STEPS[state.step];
 useEffect(()=>{if(!state.running)return;const timer=setTimeout(()=>dispatch({type:'TICK'}),650);return()=>clearTimeout(timer);},[state.running,state.queue]);
 return <div className="tutorial">
  <p className="tutorial-step">Treino {state.step+1} de {TUTORIAL_STEPS.length} · sem pontos ou inimigos</p>
  <h3>{lesson.title}</h3><p>{lesson.instruction}</p>
  <svg className="tutorial-map" viewBox="0 0 350 250" role="img" aria-label={`Robô na coluna ${state.player.x}, linha ${state.player.y}. Estrela na coluna ${lesson.target.x}, linha ${lesson.target.y}.`}>
   {Array.from({length:35},(_,i)=>{const x=i%7,y=Math.floor(i/7),wall=x===0||x===6||y===0||y===4||(lesson.wall?.x===x&&lesson.wall?.y===y);return <rect key={i} x={x*50+2} y={y*50+2} width="46" height="46" rx="7" fill={wall?'#284d75':'#e5f3ff'}/>;})}
   <text x={lesson.target.x*50+25} y={lesson.target.y*50+33} textAnchor="middle" fontSize="34" fill="#946000">★</text>
   <g transform={`translate(${state.player.x*50+25},${state.player.y*50+25}) rotate(${state.player.dir*90})`}><circle r="19" fill="#0964bf"/><path d="M0 -14 10 8 0 4 -10 8Z" fill="white"/></g>
  </svg>
  <div className="tutorial-controls">{lesson.commands.map(type=><button className="secondary" key={type} disabled={state.running||state.done||state.queue.length>=12} onClick={()=>dispatch({type:'ADD',command:type})}>{type==='repeat'?'Repetir avanço 3×':COMMANDS[type].label}</button>)}</div>
  <p className="tutorial-program">Sequência: {state.queue.length?state.queue.map(c=>`${COMMANDS[c.type].label}${c.repeat>1?` ×${c.repeat}`:''}`).join(' → '):'adicione comandos acima'}</p>
  {state.last&&<p className="tutorial-last">Executado: <strong>{COMMANDS[state.last].label}</strong></p>}
  <p role="status" aria-live="polite">{state.message}</p>
  <div className="tutorial-controls"><button className="primary" disabled={!state.queue.length||state.done} onClick={()=>dispatch({type:state.running?'STOP':'START'})}>{state.running?'Pausar':'Executar'}</button><button className="secondary" disabled={state.running||!state.queue.length||state.done} onClick={()=>dispatch({type:'STEP'})}>Passo</button><button className="secondary" disabled={state.running||!state.queue.length} onClick={()=>dispatch({type:'CLEAR'})}>Limpar</button><button className="secondary" onClick={()=>dispatch({type:'RESET'})}>Recomeçar treino</button></div>
  <div className="modal-footer"><button className="secondary" onClick={onDone}>Ir para o jogo</button>{state.done&&<button className="primary" onClick={()=>state.step===TUTORIAL_STEPS.length-1?onDone():dispatch({type:'NEXT'})}>{state.step===TUTORIAL_STEPS.length-1?'Concluir tutorial':'Próximo treino'}</button>}</div>
 </div>;
}
