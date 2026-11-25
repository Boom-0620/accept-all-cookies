import { cookieSprite as detailedCookieSprite } from './cookie-art.js';
/* Flat front-facing pixel illustrations. No thickness, perspective or 3D rotation. */
const INK='#51372e';
const bit=(g,c,x,y,w=2,h=w)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
function disk(g,x,y,r,c){g.fillStyle=c;for(let y0=-r;y0<=r;y0++){const w=Math.floor(Math.sqrt(r*r-y0*y0));g.fillRect(x-w,y+y0,w*2+1,1);}}
function line(g,pts,color,width=2){g.strokeStyle=color;g.lineWidth=width;g.lineJoin='miter';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
function polygon(g,pts,fill,stroke=INK){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=stroke;g.lineWidth=2;g.stroke();}
export function cookieSprite(item){return detailedCookieSprite(item);}
export function drawTrophy(g,x,y,scale=1){
 g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);
 // Cup and handles are intentionally pixel-flat as well.
 polygon(g,[[8,10],[0,10],[0,27],[9,35],[16,35],[16,29],[10,29],[6,25],[6,16],[10,16]],'#f4ba4f');
 polygon(g,[[48,10],[56,10],[56,27],[47,35],[40,35],[40,29],[46,29],[50,25],[50,16],[46,16]],'#f4ba4f');
 polygon(g,[[9,4],[47,4],[45,27],[39,37],[32,42],[32,54],[43,56],[46,63],[10,63],[13,56],[24,54],[24,42],[17,37],[11,27]],'#eeb94e');
 bit(g,'#fff1a2',12,7,32,5);bit(g,'#ffd977',14,13,8,15);bit(g,'#b87834',37,15,5,13);
 disk(g,28,24,9,'#8e5a32');disk(g,28,24,7,'#f6d37d');bit(g,'#a7703b',24,20,2);bit(g,'#a7703b',30,23,2);bit(g,'#a7703b',26,28,2);
 bit(g,INK,8,63,40,9);bit(g,'#88604a',11,65,34,4);g.restore();
}

let goldSurface, trophyCloseup;
export function drawGoldSurface(g){
 if(!goldSurface){
  // The enlarged cup keeps the game's four-pixel grid and limited gold palette.
  // No gradients: adjacent gold tones meet through a sparse ordered dither.
  goldSurface=document.createElement('canvas');goldSurface.width=216;goldSurface.height=144;
  const c=goldSurface.getContext('2d'),palette=['#d99e3c','#e7ae46','#eeb94e','#f3c763','#f8d57a'];
  const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(let y=0;y<144;y++)for(let x=0;x<216;x++){
   const diagonal=x-y*.27;
   const light=Math.max(0,1-Math.abs(diagonal-67)/125);
   const level=light*3.6,base=Math.floor(level),mix=level-base;
   const shade=Math.min(4,base+(mix>bayer[(y%4)*4+x%4]/16?1:0));
   c.fillStyle=palette[shade];c.fillRect(x,y,1,1);
  }
  // Tiny hard-edged flecks share the same raster as the trophy highlights.
  for(let i=0;i<180;i++){
   const x=(i*131)%216,y=(i*79)%144;c.fillStyle=i%3?'#ffe6a333':'#b8783422';c.fillRect(x,y,1,1);
  }
 }
 g.save();g.imageSmoothingEnabled=false;g.drawImage(goldSurface,0,0,864,576);g.restore();
}
export function drawTrophyZoom(g,progress){
 const t=Math.max(0,Math.min(1,progress)),u=t*t*(3-2*t);
 drawGoldSurface(g);
 const scale=4.4*Math.pow(55,u),focusY=38+(13.2-38)*u;
 if(t<1){
  if(!trophyCloseup){trophyCloseup=document.createElement('canvas');trophyCloseup.width=240;trophyCloseup.height=312;drawTrophy(trophyCloseup.getContext('2d'),8,8,4);}
  g.save();g.imageSmoothingEnabled=false;g.drawImage(trophyCloseup,432-30*scale,288-(focusY+2)*scale,60*scale,78*scale);g.restore();
 }
 const blend=Math.max(0,Math.min(1,(u-.85)/.15));
 if(blend>0){g.save();g.globalAlpha=blend;drawGoldSurface(g);g.restore();}
}
