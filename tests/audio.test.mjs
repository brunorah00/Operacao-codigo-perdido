import test from 'node:test';
import assert from 'node:assert/strict';
import {freshGame,gameReducer} from '../src/engine.js';
import {createSoundSystem,gameSoundEvents} from '../src/audio/sound.js';

test('Audio follows actual robot movements and clue discovery, not queue edits or turns',()=>{
 let state=freshGame();
 let next=gameReducer(state,{type:'ADD',command:'forward',repeat:3});
 assert.deepEqual(gameSoundEvents(state,next),[]);state=next;
 for(let i=0;i<3;i++){
  next=gameReducer(state,{type:'STEP'});
  assert.deepEqual(gameSoundEvents(state,next),i===2?['step','clue']:['step']);state=next;
 }
 next=gameReducer(state,{type:'CLOSE_CARD'});
 assert.deepEqual(gameSoundEvents(state,next),[]);
 const reopened=gameReducer(next,{type:'OPEN_CARD'});
 assert.deepEqual(gameSoundEvents(next,reopened),[]);
 let turn=freshGame();turn=gameReducer(turn,{type:'ADD',command:'left'});
 const turned=gameReducer(turn,{type:'STEP'});
 assert.deepEqual(gameSoundEvents(turn,turned),[]);
 const blocked=gameReducer(turned,{type:'ADD',command:'forward'});
 assert.deepEqual(gameSoundEvents(blocked,gameReducer(blocked,{type:'STEP'})),[]);
});

test('Completion plays once; initial load, restart and level switch stay silent',()=>{
 const state=freshGame(),next=structuredClone(state);next.runs[0].completed=true;
 assert.deepEqual(gameSoundEvents(state,next),['complete']);
 assert.deepEqual(gameSoundEvents(next,next),[]);
 assert.deepEqual(gameSoundEvents(null,next),[]);
 assert.deepEqual(gameSoundEvents(next,state),[]);
 const switched={...next,level:1};assert.deepEqual(gameSoundEvents(next,switched),[]);
});

function fakeAudioHost(){
 const counts={starts:0,stops:0},intervals=new Set();
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Context{
  state='suspended';currentTime=0;destination={};
  createGain(){return {gain:param(),connect(){},disconnect(){}};}
  createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(){counts.starts++;},stop(){counts.stops++;}};}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
 }
 return {counts,intervals,AudioContext:Context,document:{hidden:false},setInterval(fn){intervals.add(fn);return fn;},clearInterval(id){intervals.delete(id);}};
}
test('Login loop stops on game entry, mute and hidden tabs; muted effects do not play',async()=>{
 const host=fakeAudioHost(),audio=createSoundSystem(host);
 audio.setScene('login');assert.equal(host.counts.starts,0);
 await audio.unlock();assert.equal(host.intervals.size,1);assert.equal(host.counts.starts,9);
 await audio.unlock();assert.equal(host.counts.starts,9);
 audio.setScene('silent');assert.equal(host.intervals.size,0);
 audio.play('step');assert.equal(host.counts.starts,11);
 audio.setEnabled(false);audio.play('complete');assert.equal(host.counts.starts,11);
 audio.setEnabled(true);audio.setScene('login');assert.equal(host.intervals.size,1);
 host.document.hidden=true;audio.visibility();assert.equal(host.intervals.size,0);
 const before=host.counts.starts;audio.play('clue');assert.equal(host.counts.starts,before);
 audio.dispose();assert.equal(host.intervals.size,0);
});
test('Unsupported browsers and denied autoplay remain usable',async()=>{
 const unavailable=createSoundSystem({});assert.equal(unavailable.supported(),false);await unavailable.unlock();unavailable.play('step');unavailable.dispose();
 const host=fakeAudioHost();host.AudioContext=class{constructor(){throw Error('unavailable');}};
 const denied=createSoundSystem(host);await assert.doesNotReject(()=>denied.unlock());denied.dispose();
});
