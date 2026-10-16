import React,{useEffect,useMemo,useRef,useState} from 'react';
import {canSee,key} from './engine.js';
import {mapViewDimensions,updateViewportSize} from './display.js';
export function Icon({name,size=20,...props}){
 const paths={
  arrow:<><path d="M12 19V5m-6 6 6-6 6 6"/></>,
  left:<><path d="m9 4-5 5 5 5M4 9h9a6 6 0 0 1 6 6v5"/></>,
  right:<><path d="m15 4 5 5-5 5m5-5h-9a6 6 0 0 0-6 6v5"/></>,
  play:<path d="m8 5 11 7-11 7Z"/>,pause:<><path d="M9 5v14M15 5v14"/></>,
  step:<><path d="m5 5 10 7-10 7ZM19 5v14"/></>,
  loop:<><path d="M19 7H6a3 3 0 0 0-3 3v1m2 6h13a3 3 0 0 0 3-3v-1M16 3l4 4-4 4M8 13l-4 4 4 4"/></>,
  condition:<><path d="m12 2 10 10-10 10L2 12Z"/><path d="m9 12 2 2 4-4"/></>,
  map:<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Zm6-3v15m6-12v15"/></>,
  book:<><path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15"/></>,
  help:<><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 5 3c-1 1-2 1-2 3m0 3h.01"/></>,
  settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></>,
  lock:<><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
  check:<path d="m5 12 4 4L19 6"/>,close:<path d="m6 6 12 12M6 18 18 6"/>,
  search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
  flag:<><path d="M5 21V3h14l-3 5 3 5H5"/></>,
  bolt:<path d="m13 2-9 12h7l-1 8 10-12h-7Z"/>,
  bulb:<><path d="M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/></>,
  trophy:<><path d="M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-5 1h10"/></>,
  file:<><path d="M14 2H5v20h14V7Zm0 0v5h5M8 12h8m-8 4h5"/></>,
  download:<><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
  upload:<><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/></>,
  plus:<path d="M12 5v14M5 12h14"/>,trash:<><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></>,
  compass:<><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/></>,
  chevron:<path d="m9 5 7 7-7 7"/>,sound:<><path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>
  ,expand:<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>,shrink:<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/>,menu:<path d="M4 6h16M4 12h16M4 18h16"/>
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]||paths.search}</svg>;
}
export function Robot({className='',style}){
 return <svg className={className} style={style} viewBox="0 0 100 110" fill="none" aria-hidden="true">
  <ellipse cx="49" cy="99" rx="31" ry="7" fill="#000" opacity=".35"/>
  <path d="M24 61h50l4 28H20Z" fill="#1263b8" stroke="#0b3f7c" strokeWidth="3"/>
  <rect x="24" y="64" width="49" height="25" rx="12" fill="#298af0"/><path d="M45 63v26h10V63" fill="#ffe16a"/>
  <path d="m44 65 6 7 7-7M50 72v13" stroke="#a8680e" strokeWidth="2"/>
  <rect x="25" y="88" width="18" height="11" rx="5" fill="#ee4355"/><rect x="58" y="88" width="18" height="11" rx="5" fill="#ee4355"/>
  <path d="M27 62 12 74l6 11m53-21 12 8" stroke="#298af0" strokeWidth="10" strokeLinecap="round"/>
  <rect x="20" y="26" width="61" height="40" rx="17" fill="#f0faff" stroke="#12477d" strokeWidth="3"/>
  <rect x="27" y="37" width="48" height="22" rx="10" fill="#0a4383"/>
  <rect x="36" y="43" width="7" height="9" rx="3" fill="#ffe770"/><rect x="59" y="43" width="7" height="9" rx="3" fill="#ffe770"/>
  <path d="M36 20 41 5h21l8 17" fill="#ffd23d" stroke="#b77a0e" strokeWidth="2"/><path d="M36 19h34v8H34Z" fill="#ef4653"/>
  <path d="M19 29q33-13 65-1l-2 6H19Z" fill="#ffe16a" stroke="#b58113" strokeWidth="2"/>
  <path d="m79 82 10 14" stroke="#ffca2c" strokeWidth="6" strokeLinecap="round"/>
  <circle cx="77" cy="75" r="12" fill="#64dfff" fillOpacity=".5" stroke="#ffde4c" strokeWidth="5"/><path d="m72 71 5-3" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
 </svg>;
}
export function WalkingRobot({direction=1,walking=false,stepDuration=360}){
 const side=direction===1||direction===3,back=direction===0;
 return <svg x="-41" y="-80" width="82" height="107" viewBox="0 0 100 130" fill="none" overflow="visible" className={`robot-character ${walking?'walking':''}`} data-facing={['north','east','south','west'][direction]} style={{'--step-cycle':`${stepDuration}ms`}} aria-hidden="true">
  <ellipse className="robot-shadow" cx="50" cy="121" rx="28" ry="7" fill="#0b2353" opacity=".6"/>
  <g transform={direction===3?'translate(100 0) scale(-1 1)':undefined}>
   <g className="robot-leg robot-leg-left"><path d="M34 88v23" stroke="#86c7ed" strokeWidth="12" strokeLinecap="round"/><circle cx="34" cy="102" r="5" fill="#ed4353" stroke="#d9f3ff" strokeWidth="2"/><path d="M26 112h17l3 10H24Z" fill="#ed4353" stroke="#fff0d1" strokeWidth="2"/><path d="M26 122h19" stroke="#9e2440" strokeWidth="3"/></g>
   <g className="robot-leg robot-leg-right"><path d="M65 88v23" stroke="#86c7ed" strokeWidth="12" strokeLinecap="round"/><circle cx="65" cy="102" r="5" fill="#ed4353" stroke="#d9f3ff" strokeWidth="2"/><path d="M57 112h17l3 10H55Z" fill="#ed4353" stroke="#fff0d1" strokeWidth="2"/><path d="M57 122h19" stroke="#9e2440" strokeWidth="3"/></g>
   <g className="robot-body">
    <g className="robot-arm robot-arm-left"><path d="m27 64-11 12 2 14" stroke="#75bdf0" strokeWidth="10" strokeLinecap="round"/><circle cx="18" cy="90" r="6" fill="#237ed2" stroke="#eefaff" strokeWidth="2"/></g>
    <path d="m30 60-7 32q27 10 54 0l-8-32Z" fill="#2485ee" stroke="#0c477e" strokeWidth="3"/>
    {back?<><rect x="35" y="63" width="30" height="27" rx="7" fill="#e93f50" stroke="#ffb36c" strokeWidth="2"/><path d="M40 77h20M44 68v5m12-5v5" stroke="#fdf6b0" strokeWidth="2"/><circle cx="50" cy="84" r="3" fill="#ffe16a"/></>:<><path d="m32 61 16 13-10 7-8-14m36-6L51 74l10 7 9-14" fill="#94dbff" stroke="#1971b8" strokeWidth="1.5"/><path d="M49 73v22" stroke="#145fa7" strokeWidth="2"/><circle cx="54" cy="83" r="1.5" fill="#ffe16a"/><path d="M61 84h10" stroke="#ffe478" strokeWidth="2"/></>}
    <rect x={side?25:20} y="27" width={side?55:60} height="37" rx="14" fill="#effaff" stroke="#14508c" strokeWidth="3"/>
    {back?<><rect x="31" y="36" width="38" height="18" rx="7" fill="#82c8f1"/><path d="M38 41h24m-24 6h24" stroke="#2b82c5" strokeWidth="2"/></>:<><rect x={side?48:28} y="38" width={side?30:44} height="20" rx="8" fill="#0b4384"/>{side?<><rect x="63" y="43" width="7" height="8" rx="3" fill="#ffe96b"/><path d="M78 45h5v5h-5" fill="#70b7e5"/></>:<><rect x="35" y="43" width="7" height="8" rx="3" fill="#ffe96b"/><rect x="58" y="43" width="7" height="8" rx="3" fill="#ffe96b"/></>}</>}
    <path d="m32 25 8-20h22l9 20" fill="#ffd449" stroke="#b67d14" strokeWidth="2"/><path d="M33 20h37v8H32Z" fill="#ed4352"/><path d="M17 30q32-13 67-1l-1 6H18Z" fill="#ffe57c" stroke="#b17a11" strokeWidth="2"/>
    <g className="robot-arm robot-arm-right"><path d="m72 65 11 11-3 9" stroke="#b1e0ff" strokeWidth="10" strokeLinecap="round"/>{back?<circle cx="80" cy="86" r="6" fill="#2082cf" stroke="#eefaff" strokeWidth="2"/>:<><path d="m79 87 8 14" stroke="#ffd034" strokeWidth="6" strokeLinecap="round"/><circle cx="76" cy="80" r="11" fill="#58ddfa" fillOpacity=".35" stroke="#ffe45b" strokeWidth="4"/><path d="m71 76 5-3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></>}</g>
   </g>
  </g>
 </svg>;
}
function cameraFor(camera,player,w,h,size){
 const x=player.x+.5,y=player.y+.5,dx=w*.23,dy=h*.23;
 return {x:Math.max(w/2,Math.min(size-w/2,Math.max(x-dx,Math.min(x+dx,camera.x)))),y:Math.max(h/2,Math.min(size-h/2,Math.max(y-dy,Math.min(y+dy,camera.y))))};
}
function useWalkingPosition(run,size,w,h,duration){
 const initial=()=>{const camera=cameraFor({x:run.player.x+.5,y:run.player.y+.5},run.player,w,h,size);return {x:run.player.x,y:run.player.y,camera,walking:false};};
 const [position,setPosition]=useState(initial),frame=useRef(position),previous=useRef({x:run.player.x,y:run.player.y,moves:run.moves,size,w,h});
 useEffect(()=>{
  const last=previous.current,from=frame.current,target={x:run.player.x,y:run.player.y},camera=cameraFor(from.camera,target,w,h,size);
  const changed=last.x!==target.x||last.y!==target.y;
  const resized=last.size!==size||last.w!==w||last.h!==h;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reset=resized||run.moves<last.moves||Math.abs(last.x-target.x)+Math.abs(last.y-target.y)>1;
  previous.current={...target,moves:run.moves,size,w,h};
  if(!changed&&!resized&&!reset){if(frame.current.walking){const next={...target,camera,walking:false};frame.current=next;setPosition(next);}return;}
  if(reset||reduced){const next={...target,camera:resized?cameraFor({x:target.x+.5,y:target.y+.5},target,w,h,size):camera,walking:false};frame.current=next;setPosition(next);return;}
  let request,start;
  const tick=now=>{
   start??=now;const progress=Math.min(1,(now-start)/duration),ease=progress*progress*(3-2*progress);
   const next={x:from.x+(target.x-from.x)*ease,y:from.y+(target.y-from.y)*ease,camera:{x:from.camera.x+(camera.x-from.camera.x)*ease,y:from.camera.y+(camera.y-from.camera.y)*ease},walking:progress<1};
   frame.current=next;setPosition(next);if(progress<1)request=requestAnimationFrame(tick);
  };
  request=requestAnimationFrame(tick);return()=>cancelAnimationFrame(request);
 },[run.player.x,run.player.y,run.moves,size,w,h]);
 return position;
}
const WORLD_COLORS={
 20:{floor:'#58b83c',alternate:'#6bc946',wallTop:'#ffb449',wallBottom:'#ed7c28',grout:'#9e4d1c',cap:'#a2e750',front:'#ab5626'},
 24:{floor:'#ffda79',alternate:'#f2c456',wallTop:'#b99af5',wallBottom:'#8153c4',grout:'#563688',cap:'#e2c5ff',front:'#57358e'},
 28:{floor:'#70d4ef',alternate:'#51b9e2',wallTop:'#83a8ff',wallBottom:'#4d74df',grout:'#2b4ca6',cap:'#b6eaff',front:'#2e4c9b'}
};
export function GameMap({map,run,questions,compact=false,stepDuration=360,fitViewport=false}){
 const svgRef=useRef(null),[viewport,setViewport]=useState(null);
 useEffect(()=>{
  if(!fitViewport)return;
  const container=svgRef.current.parentElement,measure=()=>{const {width,height}=container.getBoundingClientRect();setViewport(previous=>updateViewportSize(previous,width,height));};measure();
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(measure);observer.observe(container);return()=>observer.disconnect();}
  window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);
 },[fitViewport]);
 const tile=64,{w,h}=fitViewport?mapViewDimensions(viewport?.width,viewport?.height,compact,map.size):{w:compact?7:12,h:compact?7:9.2},terrain=WORLD_COLORS[map.size]||WORLD_COLORS[20];
 const position=useWalkingPosition(run,map.size,w,h,stepDuration);
 const vx=(position.camera.x-w/2)*tile,vy=(position.camera.y-h/2)*tile;
 const cells=useMemo(()=>{const cells=[];
 for(let y=0;y<map.size;y++)for(let x=0;x<map.size;x++){
  const seen=run.seen[key(x,y)];if(!seen)continue;const visible=canSee(map,run.player,x,y);
  const px=x*tile,py=y*tile;
  if(map.grid[y][x])cells.push(<g key={key(x,y)} opacity={visible?1:.22}><rect x={px+1} y={py+3} width="62" height="61" rx="4" fill={terrain.front}/><rect x={px+2} y={py-5} width="60" height="55" rx="4" fill="url(#wall)" stroke={terrain.grout} strokeWidth="1.5"/><rect x={px+4} y={py-4} width="56" height="6" rx="2" fill={terrain.cap}/><path d={`M${px+8} ${py+5}h47M${px+5} ${py+18}h54m-31-17v17m-13 0v24m28-24v24`} stroke={terrain.grout} opacity=".65"/><path d={`M${px+5} ${py+49}h53`} stroke={terrain.grout} strokeWidth="3"/></g>);
  else cells.push(<g key={key(x,y)} opacity={visible?1:.3}><rect x={px+.5} y={py+.5} width="63" height="63" rx="2" fill={(x+y)%2?terrain.floor:terrain.alternate} stroke="#ffffff" strokeOpacity=".18" strokeWidth=".6"/><path d={`M${px+10} ${py+12}h9m29 38h5`} stroke="#f2ffc3" opacity=".65"/>{(x*7+y*3)%13===0&&<circle cx={px+30} cy={py+43} r="1.7" fill="#f5ffc5"/>}</g>);
 }return cells;},[map,run,terrain]);
 const rot=[-90,0,90,180][run.player.dir],cx=(position.x+.5)*tile,cy=(position.y+.5)*tile;
 const exitSeen=run.seen[key(map.exit.x,map.exit.y)];
 return <svg ref={svgRef} className="game-map" viewBox={`${vx} ${vy} ${w*tile} ${h*tile}`} role="img" aria-label={`Mapa ${map.size} por ${map.size}. Robô na coluna ${run.player.x+1}, linha ${run.player.y+1}. Visão limitada pela lanterna.`}>
  <defs>
   <linearGradient id="wall" x2="0" y2="1"><stop stopColor={terrain.wallTop}/><stop offset="1" stopColor={terrain.wallBottom}/></linearGradient>
   <radialGradient id="glow"><stop stopColor="#fff3a5" stopOpacity=".22"/><stop offset="1" stopColor="#fff3a5" stopOpacity="0"/></radialGradient>
   <radialGradient id="edge"><stop offset=".5" stopColor="#102450" stopOpacity="0"/><stop offset="1" stopColor="#102450" stopOpacity=".22"/></radialGradient>
  </defs>
  <rect x={vx} y={vy} width={w*tile} height={h*tile} fill="#142861"/>
  {cells}
  <circle cx={cx} cy={cy} r="155" fill="url(#glow)" pointerEvents="none"/>
  {map.clues.map((c,j)=>{
   if(!run.seen[key(c.x,c.y)])return null;const solved=run.solved.includes(questions[j].id),lit=canSee(map,run.player,c.x,c.y);
   return <g key={j} transform={`translate(${c.x*tile+32} ${c.y*tile+32})`} opacity={lit?1:.25}>
    <circle r="24" fill={solved?'#99ff65':'#ffe35d'} opacity=".22"/><rect x="-13" y="-17" width="26" height="33" rx="5" fill={solved?'#3bba51':'#ffdb3c'} stroke={solved?'#1e783d':'#b77d14'} strokeWidth="2.5"/>
    {solved?<path d="m-7 0 5 5 9-11" stroke="#fff" strokeWidth="3" fill="none"/>:<><path d="M-7-9H7M-7-4H2" stroke="#bd7f10" strokeWidth="2"/><text textAnchor="middle" y="11" fontSize="13" fontWeight="800" fill="#725009">{j+1}</text></>}
   </g>;
  })}
  {exitSeen&&<g opacity={canSee(map,run.player,map.exit.x,map.exit.y)?1:.25} transform={`translate(${map.exit.x*tile+8} ${map.exit.y*tile+8})`}><rect width="48" height="48" rx="7" fill="#e84252" stroke="#ffe16b" strokeWidth="2"/><path d="M13 36V13h22v23M20 24h6m-3-3 3 3-3 3" stroke="#fff5b6" strokeWidth="2"/></g>}
  <rect x={vx} y={vy} width={w*tile} height={h*tile} fill="url(#edge)" pointerEvents="none"/>
  <g transform={`translate(${cx} ${cy}) rotate(${rot})`} pointerEvents="none"><path d="m20-11 60-23M20 11l60 23" stroke="#fff5a6" strokeWidth="1" opacity=".22"/></g>
  <g transform={`translate(${cx} ${cy})`} className="map-robot" pointerEvents="none"><WalkingRobot direction={run.player.dir} walking={position.walking} stepDuration={stepDuration}/></g>
 </svg>;
}
export function MiniMap({map,run}){
 return <svg className="mini-map" viewBox={`0 0 ${map.size} ${map.size}`} role="img" aria-label="Mapa das áreas já exploradas">
  {Object.keys(run.seen).map(k=>{const [x,y]=k.split(',').map(Number);return <rect key={k} x={x} y={y} width=".9" height=".9" fill={map.grid[y][x]?'#f89e41':'#78d750'}/>;})}
  <circle cx={run.player.x+.5} cy={run.player.y+.5} r=".7" fill="#ffef6a" stroke="#fff" strokeWidth=".15"/>
 </svg>;
}
