import {canSee,createMap} from '../engine.js';
// Original synthesized sounds: no downloads, external services or audio files.
export function gameSoundEvents(previous,current){
 if(!previous||previous.level!==current.level)return [];
 const before=previous.runs[previous.level],after=current.runs[current.level],events=[];
 if((after.hits||0)>(before.hits||0))events.push('enemy-hit');
 if((after.enemyTick||0)>(before.enemyTick||0)&&(after.enemyTick%3===0)){
  const map=createMap(current.level,current.questions[current.level].length);
  if(after.enemies?.some(e=>canSee(map,after.player,e.x,e.y)))events.push('enemy-'+map.theme);
 }
 if(after.moves>before.moves&&(after.player.x!==before.player.x||after.player.y!==before.player.y))events.push('step');
 if(current.active&&current.active!==previous.active&&!after.solved.includes(current.active)&&after.moves>before.moves)events.push('clue');
 if(after.completed&&!before.completed)events.push('complete');
 return events;
}
// Melodias originais: andamento, timbre, harmonia e ritmo próprios por ambiente.
export const PHASE_MUSIC={
 forest:{beat:.34,wave:'sine',root:48,notes:[72,76,79,76,74,77,81,77,76,79,84,79,74,77,79,71],bass:[48,53,48,55],duration:.44},
 rock:{beat:.48,wave:'triangle',root:38,notes:[62,null,65,69,62,null,60,57,65,null,69,72,67,65,62,null],bass:[38,38,46,45],duration:.35},
 water:{beat:.46,wave:'sine',root:50,notes:[74,78,81,85,81,78,76,73,74,78,83,85,83,81,78,73],bass:[50,57,55,57],duration:.85},
 lava:{beat:.25,wave:'sawtooth',root:33,notes:[57,57,60,64,57,60,65,64,56,56,60,64,59,60,64,68],bass:[33,33,32,40],duration:.18},
 factory:{beat:.28,wave:'square',root:40,notes:[64,null,71,67,64,76,null,71,62,null,69,66,62,74,69,null],bass:[40,40,38,38],duration:.14},
 horror:{beat:.62,wave:'sine',root:33,notes:[69,null,70,null,76,75,null,70,68,null,69,null,63,null,70,68],bass:[33,34,29,32],duration:1.3}
};
export function createSoundSystem(host=globalThis){
 let context,master,enabled=true,volume=.35,scene='silent',timer=null;
 const voices=new Set();
 const available=()=>host.AudioContext||host.webkitAudioContext;
 const stop=()=>{if(timer!==null){host.clearInterval(timer);timer=null;}for(const voice of voices){try{voice.stop();}catch{}}voices.clear();};
 const tone=(frequency,offset,duration,type='sine',level=.15,endFrequency)=>{
  if(!context||context.state!=='running'||!enabled)return;
  const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+offset;
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
  if(endFrequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(master);voices.add(oscillator);
  oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(start);oscillator.stop(start+duration+.02);
 };
 // Quatro compassos em dó maior, 128 BPM: tema arcade original de boas-vindas.
 const loginBeat=60/128/2;
 const melody=()=>{
  const hz=note=>440*2**((note-69)/12);
  const lead=[72,76,79,84,81,79,76,79,74,79,83,86,83,79,77,74,76,81,84,88,86,84,81,79,77,81,84,89,88,84,79,71];
  const chords=[[48,52,55],[43,47,50],[45,48,52],[41,45,48]];
  lead.forEach((note,i)=>{
   const time=i*loginBeat,chord=chords[Math.floor(i/8)];
   // Melodia saltitante, com resposta aguda no fim de cada frase.
   tone(hz(note),time,loginBeat*(i%4===3?1.25:.72),'triangle',.09);
   if(i%8===7)tone(hz(note+12),time+loginBeat*.5,loginBeat*.4,'sine',.035);
   // Baixo alternado entre fundamental e quinta.
   if(i%2===0)tone(hz(chord[0]+(i%4===2?7:0)),time,loginBeat*1.5,'triangle',.095);
   // Acordes curtos no contratempo.
   if(i%4===2)chord.forEach(n=>tone(hz(n+12),time,loginBeat*.65,'sine',.035));
   // Bumbo, caixa sintetizada e chimbal leve.
   if(i%4===0)tone(135,time,.13,'sine',.12,42);
   if(i%4===2){tone(185,time,.085,'triangle',.075,70);tone(1450,time,.045,'square',.012,320);}
   tone(i%2===0?3800:4600,time,.028,'square',.007,2200);
  });
 };
 const phaseMelody=track=>{
  const hz=note=>440*2**((note-69)/12);
  track.notes.forEach((note,i)=>{
   if(note!==null)tone(hz(note),i*track.beat,track.duration,track.wave,track.wave==='sine'?.055:.022);
   if(i%4===0)tone(hz(track.bass[i/4]),i*track.beat,track.beat*3.6,'sine',.065);
   if(scene==='lava'&&i%2===0)tone(95,i*track.beat,.16,'triangle',.065,35);
   if(scene==='factory')tone(i%4===0?100:1100,i*track.beat,.045,i%4===0?'triangle':'square',i%4===0?.05:.009,80);
   if(scene==='rock'&&i%4===2)tone(130,i*track.beat,.12,'triangle',.045,45);
  });
  if(scene==='horror'){tone(hz(track.root),0,track.beat*15,'sine',.035);tone(hz(track.root)+1.4,0,track.beat*15,'sine',.025);}
 };
 const sync=()=>{
  stop();
  if(!enabled||context?.state!=='running'||host.document?.hidden)return;
  if(scene==='login'){melody();timer=host.setInterval(melody,32*loginBeat*1000);}
  else if(PHASE_MUSIC[scene]){const track=PHASE_MUSIC[scene];phaseMelody(track);timer=host.setInterval(()=>phaseMelody(track),track.beat*track.notes.length*1000);}
 };
 return {
  supported:()=>!!available(),
  async unlock(){
   if(!enabled||host.document?.hidden)return;
   try{
    if(!context){const Audio=available();if(!Audio)return;context=new Audio();master=context.createGain();master.gain.value=volume;master.connect(context.destination);}
    if(context.state!=='running')await context.resume();
    if(timer===null)sync();
   }catch{/* Audio failure must never interrupt the game. */}
  },
  setScene(value){if(scene!==value){scene=value;sync();}},
  setEnabled(value){enabled=value;if(master)master.gain.value=enabled?volume:0;sync();},
  setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(master)master.gain.value=enabled?volume:0;},
  visibility(){if(host.document?.hidden){stop();if(context)void context.suspend().catch(()=>{});}else if(context)void context.resume().then(sync).catch(()=>{});},
  play(event){
   if(host.document?.hidden||!enabled)return;
   if(event==='enemy-hit'){tone(260,0,.35,'sawtooth',.12,55);tone(90,.12,.35,'triangle',.16);tone(150,.45,.45,'sawtooth',.14,35);tone(55,.46,.5,'triangle',.18,25);}
   if(event.startsWith('enemy-')&&event!=='enemy-hit'){
    const theme=event.slice(6);
    const sounds={forest:[420,'sawtooth',630],rock:[75,'triangle',45],water:[360,'sine',700],lava:[110,'sawtooth',55],factory:[760,'square',380],horror:[230,'sine',100]};
    const sound=sounds[theme];if(sound){tone(sound[0],0,.23,sound[1],.065,sound[2]);tone(sound[2],.17,.2,'sine',.04);}
   }
   if(event==='step'){tone(180,0,.10,'triangle',.36,85);tone(620,.025,.065,'sine',.10,300);}
   if(event==='clue'){[523.25,659.25,783.99].forEach((n,i)=>tone(n,i*.10,.30,'sine',.14));}
   if(event==='complete'){[523.25,659.25,783.99,1046.5].forEach((n,i)=>tone(n,i*.16,.5,'triangle',.11));[261.63,329.63,392].forEach(n=>tone(n,.52,.95,'sine',.07));}
  },
  dispose(){stop();if(context)void context.close().catch(()=>{});context=null;}
 };
}
