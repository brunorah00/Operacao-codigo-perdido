export const MOBILE_PLAY_QUERY='(max-width: 640px), (max-height: 500px) and (pointer: coarse)';

export function updateViewportSize(previous,width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return previous;
 if(previous?.width===width&&previous?.height===height)return previous;
 return {width,height};
}

// Preserve the real viewport aspect ratio so the map fills its space without cropping.
export function mapViewDimensions(width,height,compact,size){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return {w:compact?7:12,h:compact?7:9.2};
 const tile=Math.min(compact?54:64,height/3);
 let w=Math.min(size,Math.max(6,width/tile)),h=w*height/width;
 if(h>size){w*=size/h;h=size;}
 return {w,h};
}
export function supportsGameFullscreen(element){return typeof element?.requestFullscreen==='function'&&element.ownerDocument?.fullscreenEnabled!==false;}
export async function enterGameFullscreen(element){
 if(!supportsGameFullscreen(element))return false;
 try{await element.requestFullscreen();return true;}catch{return false;}
}
export async function exitGameFullscreen(element){
 const doc=element?.ownerDocument;
 if(!element||doc?.fullscreenElement!==element||typeof doc.exitFullscreen!=='function')return false;
 try{await doc.exitFullscreen();return true;}catch{return false;}
}
