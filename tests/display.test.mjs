import test from 'node:test';
import assert from 'node:assert/strict';
import {enterGameFullscreen,exitGameFullscreen,mapViewDimensions,supportsGameFullscreen,updateViewportSize} from '../src/display.js';

test('The map view matches portrait, landscape and desktop areas without letterboxing or exceeding map bounds',()=>{
 for(const size of [20,24,28])for(const [width,height] of [[320,342],[360,520],[393,600],[568,160],[844,250],[1280,620],[1920,850],[320,1200]]){
  const view=mapViewDimensions(width,height,width<=844,size);
  assert(view.w>0&&view.h>0&&view.w<=size&&view.h<=size);
  assert(Math.abs(view.w/view.h-width/height)<1e-9,`${width}x${height}`);
 }
});
test('The map has stable defaults before a viewport is measured or when its layout is temporarily hidden',()=>{
 assert.deepEqual(mapViewDimensions(undefined,undefined,true,20),{w:7,h:7});
 assert.deepEqual(mapViewDimensions(0,0,false,20),{w:12,h:9.2});
 assert.deepEqual(mapViewDimensions(NaN,200,true,20),{w:7,h:7});
});
test('Entering expanded mode and rotating preserve the last visible map size through transient zero-sized measurements',()=>{
 let viewport=null,lastView=null;
 for(const [width,height] of [[0,0],[1280,680],[1280,0],[0,0],[844,250],[0,250],[360,520],[360,520]]){
  const previous=viewport;viewport=updateViewportSize(viewport,width,height);
  if(!viewport){assert.equal(previous,null);continue;}
  const view=mapViewDimensions(viewport.width,viewport.height,true,20);
  if(width<=0||height<=0){assert.strictEqual(viewport,previous);assert.deepEqual(view,lastView);}
  else assert(Math.abs(view.w/view.h-width/height)<1e-9);
  if(previous?.width===width&&previous?.height===height)assert.strictEqual(viewport,previous);
  lastView=view;
 }
 assert.deepEqual(viewport,{width:360,height:520});
 assert.strictEqual(updateViewportSize(viewport,Infinity,520),viewport);
});
test('Fullscreen requests target the game root and only its owning document is allowed to exit',async()=>{
 let entered=0,exited=0;
 const doc={fullscreenEnabled:true,fullscreenElement:null,async exitFullscreen(){exited++;this.fullscreenElement=null;}};
 const root={ownerDocument:doc,async requestFullscreen(){entered++;doc.fullscreenElement=this;}};
 assert.equal(supportsGameFullscreen(root),true);assert.equal(await enterGameFullscreen(root),true);assert.equal(doc.fullscreenElement,root);assert.equal(entered,1);
 assert.equal(await exitGameFullscreen(root),true);assert.equal(doc.fullscreenElement,null);assert.equal(exited,1);
 doc.fullscreenElement={id:'another-app'};
 assert.equal(await exitGameFullscreen(root),false);assert.equal(exited,1);
});
test('Unsupported and disabled fullscreen APIs safely keep the expanded-window fallback usable',async()=>{
 assert.equal(supportsGameFullscreen(null),false);assert.equal(await enterGameFullscreen(null),false);assert.equal(await exitGameFullscreen(null),false);
 assert.equal(await enterGameFullscreen({ownerDocument:{}}),false);
 let called=false;const blocked={ownerDocument:{fullscreenEnabled:false},requestFullscreen(){called=true;}};
 assert.equal(await enterGameFullscreen(blocked),false);assert.equal(called,false);
});
test('Denied fullscreen entry or exit returns safely without throwing through a game click handler',async()=>{
 const doc={fullscreenEnabled:true,fullscreenElement:null,async exitFullscreen(){throw Error('denied');}};
 const root={ownerDocument:doc,async requestFullscreen(){throw Error('denied');}};
 assert.equal(await enterGameFullscreen(root),false);doc.fullscreenElement=root;
 assert.equal(await exitGameFullscreen(root),false);
});
