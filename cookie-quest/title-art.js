/* Original board artwork, separated into moving layers without redrawing its style. */
import { sourceArt } from './scene-art.js';
import { separateArtwork, paintSeparatedLayer, drawBirds } from './animated-art.js';
let title;
const warm=(r,g,b)=>r>b+6;
const dark=(r,g,b)=>r<165&&g<150&&b<185;
const cloud=(r,g,b)=>r>220&&g>190&&r>b+6;
function titleLayers(){
 const image=sourceArt.reference;if(!image.complete||!image.naturalWidth)return null;
 if(title)return title;
 const parts=[
  {name:'cookie',rect:[115,7,235,47],test:warm},
  {name:'quest',rect:[132,54,194,47],test:warm},
  {name:'start',rect:[195,171,134,24],test:dark},
  {name:'options',rect:[195,200,111,23],test:dark},
  {name:'credits',rect:[195,228,111,24],test:dark},
  {name:'old-arrow',rect:[163,169,28,28],test:(r,g,b)=>r>b+12||dark(r,g,b)},
  {kind:'cloud',rect:[0,31,114,54],test:cloud,phase:0,drift:9},
  {kind:'cloud',rect:[365,9,95,42],test:cloud,phase:1,drift:9},
  {kind:'flag',rect:[55,104,23,25],test:(r,g,b)=>r-g>30&&g<170&&b<160,wave:2},
  {kind:'flag',rect:[451,54,21,17],test:(r,g,b)=>r-g>30&&g<170&&b<160,wave:2},
  {kind:'flag',rect:[407,91,20,18],test:(r,g,b)=>r-g>30&&g<170&&b<160,wave:2},
  {kind:'flag',rect:[497,87,17,19],test:(r,g,b)=>r-g>30&&g<170&&b<160,wave:2},
 ];
 title=separateArtwork(image,[20,47,516,266],parts);
 return title;
}
function movingWord(g,layer,t,count){
 const [x,y,w,h]=layer.rect;
 // Find the small gaps between the original letters rather than substituting a font.
 if(!layer.cuts){
  const data=layer.canvas.getContext('2d').getImageData(0,0,w,h).data;
  const weight=Array.from({length:w},(_,xx)=>{let n=0;for(let yy=0;yy<h;yy++)n+=data[(yy*w+xx)*4+3]/255;return n;});
  const cuts=[0];
  for(let i=1;i<count;i++){
   const guess=w*i/count;let cut=Math.round(guess),best=Infinity;
   for(let k=Math.round(guess-8);k<=Math.round(guess+8);k++)if(weight[k]+Math.abs(k-guess)*.16<best){best=weight[k]+Math.abs(k-guess)*.16;cut=k;}
   cuts.push(cut);
  }
  cuts.push(w);layer.cuts=cuts;
 }
 for(let i=0;i<count;i++){
  const left=layer.cuts[i],width=layer.cuts[i+1]-left;
  const jump=Math.pow(Math.max(0,Math.sin(t*2.5-i*.47)),3)*2.4;
  g.drawImage(layer.canvas,left,0,width,h,x+left,y-jump,width,h);
 }
}
export function drawTitleScene(g,t=0){
 const art=titleLayers();g.fillStyle='#c7bde5';g.fillRect(0,0,864,480);if(!art)return;
 g.save();g.scale(864/516,480/266);g.imageSmoothingEnabled=false;
 g.drawImage(art.background,0,0);
 for(const layer of art.layers){
  if(layer.name==='cookie')movingWord(g,layer,t,6);
  else if(layer.name==='quest')movingWord(g,layer,t+.2,5);
  else if(layer.kind)paintSeparatedLayer(g,layer,t);
 }
 drawBirds(g,t,516);g.restore();
}
export function menuLabel(text){return `<canvas class="menu-label-art" data-label="${text}" aria-hidden="true"></canvas>`;}
export function paintMenuLabels(root){
 const art=titleLayers();if(!art)return;
 for(const canvas of root.querySelectorAll('canvas[data-label]')){
  if(canvas.dataset.painted)return;
  const name={'START GAME':'start','OPTIONS':'options','CREDITS':'credits'}[canvas.dataset.label];
  const layer=art.layers.find(v=>v.name===name);
  canvas.width=layer.canvas.width*3;canvas.height=layer.canvas.height*3;
  const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(layer.canvas,0,0,canvas.width,canvas.height);
  canvas.style.width=`${layer.canvas.width*828/516}px`;canvas.style.height=`${layer.canvas.height*460/266}px`;canvas.dataset.painted='1';
 }
}
