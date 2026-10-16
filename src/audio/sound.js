// Original synthesized sounds: no downloads, external services or audio files.
export function gameSoundEvents(previous,current){
 if(!previous||previous.level!==current.level)return [];
 const before=previous.runs[previous.level],after=current.runs[current.level],events=[];
 if(after.moves>before.moves&&(after.player.x!==before.player.x||after.player.y!==before.player.y))events.push('step');
 if(current.active&&current.active!==previous.active&&!after.solved.includes(current.active)&&after.moves>before.moves)events.push('clue');
 if(after.completed&&!before.completed)events.push('complete');
 return events;
}
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
 const melody=()=>{
  // Quiet, inquisitive arpeggio in A minor.
  [220,329.63,440,523.25,392,329.63,261.63,329.63].forEach((note,i)=>tone(note,i*.48,.65,'sine',.055));
  tone(110,0,3.7,'sine',.045);
 };
 const sync=()=>{
  stop();
  if(scene==='login'&&enabled&&context?.state==='running'&&!host.document?.hidden){melody();timer=host.setInterval(melody,4200);}
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
   if(event==='step'){tone(180,0,.075,'triangle',.18,85);tone(620,.025,.045,'sine',.04,300);}
   if(event==='clue'){[523.25,659.25,783.99].forEach((n,i)=>tone(n,i*.10,.30,'sine',.14));}
   if(event==='complete'){[523.25,659.25,783.99,1046.5].forEach((n,i)=>tone(n,i*.16,.5,'triangle',.11));[261.63,329.63,392].forEach(n=>tone(n,.52,.95,'sine',.07));}
  },
  dispose(){stop();if(context)void context.close().catch(()=>{});context=null;}
 };
}
