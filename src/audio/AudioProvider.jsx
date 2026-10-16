import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {createSoundSystem,gameSoundEvents} from './sound.js';
import './audio.css';
const AudioContext=createContext(null);
const SETTINGS_KEY='codigo-perdido-audio-v1';
function readSettings(){try{const settings=JSON.parse(localStorage.getItem(SETTINGS_KEY));return {enabled:settings?.enabled!==false,volume:Number.isFinite(settings?.volume)?Math.max(0,Math.min(1,settings.volume)):.35};}catch{return {enabled:true,volume:.35};}}
export function AudioProvider({children}){
 const [system]=useState(()=>createSoundSystem()),[settings,setSettings]=useState(readSettings);
 useEffect(()=>{system.setVolume(settings.volume);system.setEnabled(settings.enabled);if(settings.enabled)void system.unlock();try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}},[settings,system]);
 useEffect(()=>{
  const unlock=()=>void system.unlock(),visibility=()=>system.visibility();
  window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',visibility);
  return()=>{window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);system.dispose();};
 },[system]);
 return <AudioContext.Provider value={{system,settings,setSettings}}>{children}</AudioContext.Provider>;
}
export function useAudioScene(scene){const audio=useContext(AudioContext);useEffect(()=>{if(!scene)return;audio?.system.setScene(scene);return()=>audio?.system.setScene('silent');},[audio?.system,scene]);}
export function useGameSounds(state){
 const audio=useContext(AudioContext),previous=useRef(state);
 useEffect(()=>{for(const event of gameSoundEvents(previous.current,state))audio?.system.play(event);previous.current=state;},[state,audio?.system]);
}
export function AudioControls(){
 const audio=useContext(AudioContext);
 if(!audio||!audio.system.supported())return null;
 const {settings,setSettings}=audio;
 return <div className="audio-controls" role="group" aria-label="Áudio do jogo"><button type="button" aria-pressed={!settings.enabled} aria-label={settings.enabled?'Silenciar áudio':'Ativar áudio'} title={settings.enabled?'Silenciar áudio':'Ativar áudio'} onClick={()=>setSettings(old=>({...old,enabled:!old.enabled}))}>{settings.enabled?'♫ Som ligado':'♫ Som desligado'}</button><label>Volume<input type="range" min="0" max="100" value={Math.round(settings.volume*100)} onChange={e=>setSettings(old=>({...old,volume:Number(e.target.value)/100}))}/></label></div>;
}
