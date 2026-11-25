import { separateArtwork, paintSeparatedLayer, drawBirds } from './animated-art.js';
/* Hand-drawn pixel scenes: one shared palette and a fixed logical pixel grid. */
import { drawMap, drawText, drawCookie as drawFallbackCookie } from './art.js';
const incenseFront = new Image(); incenseFront.src='./assets/incense-chibi.webp';
const sprites = new Image(); sprites.src='./assets/characters.webp';
const reference = new Image(); reference.src='./assets/reference-board.webp';
const landscapes = new Image(); landscapes.src='./assets/landscapes.webp';
export const sourceArt = { reference, landscapes, sprites };
const ready = image => image.complete && image.naturalWidth > 0;
const ink = '#513346';
const caches = new Map();
const hash = (x,y,s=1) => { const n = Math.sin(x*127.1+y*311.7+s*17.3)*43758.5453; return n-Math.floor(n); };
function rect(g,c,x,y,w,h) { g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
function disk(g,x,y,rx,ry,c) {
  g.fillStyle=c;
  for(let yy=-Math.ceil(ry);yy<=ry;yy++) { const ww=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)))); g.fillRect(Math.round(x)-ww,Math.round(y)+yy,ww*2+1,1); }
}
function cached(key,w,h,paint,g,x,y) {
  if(!caches.has(key)) {const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));caches.set(key,c);}
  g.drawImage(caches.get(key),Math.round(x),Math.round(y));
}
const chef = [
 '.....KKKKKK......',
 '...KKWWWWWWKK....',
 '..KWWWWWWWWWWK...',
 '.KWWWWWWWWWWWWK..',
 '.KWWWWWWWWWWWWK..',
 '..KWWWWWWWWWWK...',
 '..KGGGGGGGGGGK...',
 '...KKKKKKKKKK....',
 '...KBBSSSSSSK....',
 '...KBSSSSSSSKK...',
 '...KSSSKSSSKSK...',
 '...KSSSSSSSSSK...',
 '....KSSSSSSSK....',
 '.....KKKKKKK.....',
 '....KWRWRWWK.....',
 '...KWWRRWWWKK....',
 '...KSWWRWWWSK....',
 '....KWWWWWWK.....',
 '....KGGWGGWK.....',
 '....KKKKKKKK.....',
 '....KKK..KKK.....',
 '...KKKK..KKKK....',
];
const chefPal={K:'#312534',W:'#fffdf3',G:'#c7c6d0',S:'#f8c78f',B:'#71472f',R:'#d95458'};
let runningHead;
function cleanRunningHead(){
 if(runningHead)return runningHead;
 const c=document.createElement('canvas');c.width=28;c.height=24;
 const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 // Only the head is sampled: the atlas's motion streaks and old limbs stay outside.
 g.drawImage(sprites,1018,129,175,158,0,0,28,24);
 const image=g.getImageData(0,0,28,24),d=image.data,seen=new Uint8Array(28*24);let largest=[];
 for(let seed=0;seed<seen.length;seed++)if(d[seed*4+3]>=128&&!seen[seed]){
  const stack=[seed],component=[];seen[seed]=1;
  while(stack.length){const n=stack.pop(),x=n%28,y=Math.floor(n/28);component.push(n);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy,k=yy*28+xx;
    if(xx>=0&&xx<28&&yy>=0&&yy<24&&!seen[k]&&d[k*4+3]>=128){seen[k]=1;stack.push(k);}
   }
  }
  if(component.length>largest.length)largest=component;
 }
 const keep=new Set(largest);for(let n=0;n<seen.length;n++)d[n*4+3]=keep.has(n)?255:0;
 g.putImageData(image,0,0);runningHead=c;return c;
}
function runningArm(g,shoulder,hand,y,front){
 const left=Math.min(shoulder,hand),width=Math.abs(shoulder-hand)+3;
 rect(g,'#2b202b',left,y,width,4);
 rect(g,front?'#fff5e5':'#cfc5bf',shoulder,y,3,2);
 rect(g,front?'#f3c18b':'#dca875',hand,y+1,3,2);
}
function chefLeg(g,hip,foot,y,front){
 const ink='#251d29',cloth=front?'#513334':'#362a32';
 const knee=Math.round((hip+foot)/2);
 rect(g,ink,Math.min(hip,knee)-1,28,Math.abs(hip-knee)+4,4);
 rect(g,ink,Math.min(knee,foot)-1,30,Math.abs(knee-foot)+4,Math.max(3,y-28));
 rect(g,cloth,knee,29,3,Math.max(2,y-29));
 rect(g,ink,foot-2,y,7,3);rect(g,front?'#79504b':'#4a333a',foot-1,y,5,1);
}
export function drawChef(g,x,y,{facing=1,pose='idle',frame=0,flipY=false,time=frame*.1,hungerT=0}={}) {
 const xx=Math.round(x),yy=Math.round(y);
 if(ready(sprites)) {
  g.save();g.translate(xx+14,yy);if(facing<0)g.scale(-1,1);g.translate(-14,0);
  g.imageSmoothingEnabled=false;
  if(pose==='cheer'){
   // Clean jacket and boots, without the idle sprite's dangling hands.
   rect(g,'#2b202b',9,25,11,9);rect(g,'#fff6e9',10,26,9,7);
   rect(g,'#e45b48',12,26,2,3);rect(g,'#e45b48',15,26,2,3);
   rect(g,'#2b202b',9,33,5,3);rect(g,'#2b202b',16,33,5,3);
   rect(g,'#65443b',10,34,3,1);rect(g,'#65443b',17,34,3,1);
   // Compact bent sleeves, at the shoulders rather than up beside the hat.
   rect(g,'#2b202b',5,26,5,6);rect(g,'#fff6e9',6,27,3,4);
   rect(g,'#2b202b',19,26,5,6);rect(g,'#fff6e9',20,27,3,4);
   g.drawImage(sprites,125,116,200,190,0,0,28,26);
   rect(g,'#2b202b',7,26,4,4);rect(g,'#f5c38b',8,27,2,2);
   rect(g,'#2b202b',18,26,4,4);rect(g,'#f5c38b',19,27,2,2);
  }else if(pose==='run'){
   const step=Math.sin(time*15),front=Math.round(14+step*7),back=Math.round(14-step*7);
   chefLeg(g,12,back,Math.round(33-Math.max(0,step)*3),false);
   chefLeg(g,16,front,Math.round(33-Math.max(0,-step)*3),true);
   const bob=Math.abs(step)>.65?0:1;
   runningArm(g,10,9+Math.round(step*4),25+bob,false);
   // A clean jacket crop replaces the old running pose below the neck entirely.
   rect(g,'#2b202b',8,23+bob,14,7);
   g.drawImage(sprites,180,305,85,44,9,24+bob,12,5);
   g.drawImage(cleanRunningHead(),0,bob);
   runningArm(g,17,15-Math.round(step*4),27+bob,true);
  }else if(pose==='crouch'){
   // Lower the intact head onto bent knees instead of scaling the whole character.
   rect(g,'#251d29',5,32,8,4);rect(g,'#251d29',16,32,8,4);
   rect(g,'#65443b',6,33,6,2);rect(g,'#65443b',17,33,6,2);
   g.drawImage(sprites,177,306,99,43,7,29,14,5);
   g.drawImage(sprites,125,116,200,190,0,7,28,26);
   rect(g,'#342431',5,31,4,3);rect(g,'#efbb85',6,31,2,2);
   rect(g,'#342431',20,31,4,3);rect(g,'#efbb85',21,31,2,2);
  }else if(pose==='hungry'){
   g.drawImage(sprites,125,116,200,190,0,0,28,26);
   g.drawImage(sprites,176,306,103,68,7,26,15,10);
   rect(g,'#2b202b',6,27,4,6);rect(g,'#f2c18e',7,28,2,3);
   const handX=14+Math.round(Math.sin(hungerT*8)*2),handY=29+Math.round(Math.cos(hungerT*8));
   rect(g,'#2b202b',19,27,4,5);rect(g,'#fff5e4',20,28,2,2);
   rect(g,'#2b202b',handX-1,handY-1,7,4);rect(g,'#f2c18e',handX,handY,4,2);
   if(hungerT<1.6){const wiggle=Math.sin(hungerT*18)>0?1:0;rect(g,'#ac7866',29+wiggle,28,1,3);rect(g,'#ac7866',31+wiggle,30,1,3);}
  }else{
   const source=pose==='jump'||pose==='fall'?[1450,110,177,203]:[125,116,200,258];
   if(flipY){g.translate(14,18);g.rotate(-.2);g.translate(-14,-18);}
   g.drawImage(sprites,...source,0,0,28,36);
  }
  g.restore();return;
 }
 g.save();g.translate(xx+8,yy+11+(pose==='crouch'?6:0));if(facing<0)g.scale(-1,1);
 const rows=chef.slice();
 if(pose==='run'){rows[20]=frame%2?'...KKK....KKK....':'.....KKKKKK......';rows[21]=frame%2?'..KKKK....KKKK...':'....KKK..KKKK....';}
 drawMap(g,rows,chefPal,-8,-11);g.restore();
}
export function drawCloud(g,x,y,v=0) {
  g.save();g.translate(Math.round(x),Math.round(y));
  const c='#fff3dc';
  disk(g,12,12,10,5,c);disk(g,24,8,11,8,c);disk(g,36,12,12,5,c);
  if(v)disk(g,47,13,9,3,c);
  rect(g,'#ffdfcf',6,16,v?46:37,2);g.restore();
}
function cakePaint(g,w,h,dark=false) {
  const edge=dark?'#75494f':'#bd796a',body=dark?'#96575a':'#f2b37e';
  // Round hill rising from its base; icing follows the dome instead of a flat bowl.
  for(let xx=0;xx<w;xx++) {
    const nx=(xx-w/2)/(w/2);const top=h-Math.round(Math.sqrt(Math.max(0,1-nx*nx))*h);
    rect(g,edge,xx,top,1,h-top+2);rect(g,body,xx,top+2,1,h-top);
    const frosting=Math.round(h*.24)+Math.round(Math.sin(xx*.22)*2+Math.sin(xx*.41)*2);
    rect(g,dark?'#ffd5bd':'#fff2ce',xx,top+2,1,Math.min(frosting,h-top));
    rect(g,dark?'#fff2dc':'#fffbe9',xx,top+2,1,3);
    if(xx%17<3)rect(g,dark?'#a56561':'#f6c08b',xx,top+frosting+3,1,h-top-frosting);
    for(let yy=top+3;yy<h;yy++) {
      const r=hash(xx,yy,w);
      if(r>.965) rect(g,yy<top+frosting?'#efad96':dark?'#c17b71':'#d88f6a',xx,yy,1,2);
      if(r<.025&&yy>top+frosting)rect(g,dark?'#74454d':'#ffe0ac',xx,yy,1,1);
    }
  }
}
export function drawCakeMountain(g,x,baseY,w,h) { cached(`cake${w},${h}`,w+3,h+4,c=>cakePaint(c,w,h),g,x,baseY-h); }
export function drawHill(g,x,baseY,w,h,dark=false) { cached(`hill${w},${h},${dark}`,w+3,h+4,c=>cakePaint(c,w,h,true),g,x,baseY-h); }
export function drawCookieWheel(g,x,y,r) {
  cached(`cookie${r}`,r*2+5,r*2+5,c=>{
    const q=r+2;disk(c,q,q,r,r,'#82504a');disk(c,q,q-1,r-1,r-2,'#bf8063');disk(c,q-1,q-2,r-3,r-4,'#cf906e');
    for(let yy=2;yy<r*2;yy++)for(let xx=2;xx<r*2;xx++) {
      if((xx-q)**2+(yy-q)**2>(r-3)**2)continue;
      if(hash(xx,yy,r)>.93)rect(c,'#e8ac82',xx,yy,1,1);
      if(hash(xx,yy,r)<.012) {rect(c,'#955849',xx,yy,3,3);rect(c,'#764342',xx,yy,2,2);}
    }
  },g,x-r-2,y-r-2);
}
function tower(g,x,b,w,h) {
  rect(g,'#b97167',x,b-h,w,h);rect(g,'#ffdeb1',x+2,b-h+1,w-4,h-2);
  rect(g,'#f4ba94',x+w-5,b-h+2,3,h-3);rect(g,'#fff0ca',x+3,b-h+2,3,h-4);
  for(let yy=b-h+9;yy<b;yy+=9) {rect(g,'#eeb895',x+3,yy,3,1);rect(g,'#eeb895',x+w-9,yy+3,4,1);}
  const rh=w*.76;
  for(let row=0;row<rh;row++){const half=Math.floor(row/rh*(w/2+2));rect(g,'#ba6468',x+w/2-half,b-h-rh+row,half*2+1,1);if(row>2)rect(g,'#f68e89',x+w/2-half+2,b-h-rh+row,Math.max(1,half*2-4),1);}
  rect(g,'#ffb49c',x+w/2-1,b-h-rh+5,2,rh-7);
  rect(g,'#995466',x+w/2,b-h-rh-10,1,12);rect(g,'#de626b',x+w/2+1,b-h-rh-9,9,5);rect(g,'#ffa58d',x+w/2+2,b-h-rh-8,5,1);
  const wx=x+w/2-2;rect(g,'#9c6471',wx,b-h+8,5,10);rect(g,'#ffeac9',wx+1,b-h+9,2,6);
  rect(g,'#fff0d1',x-1,b-h,w+2,3);
}
export function drawCastle(g,x,baseY) {
 cached('castle-v2',118,125,c=>{
  tower(c,45,112,26,77);tower(c,10,114,20,43);tower(c,86,114,20,43);
  rect(c,'#bd7973',23,79,71,37);rect(c,'#ffdeb0',25,81,67,33);
  for(let xx=25;xx<92;xx+=10)rect(c,'#fff0cf',xx,77,6,7);
  tower(c,31,115,14,31);tower(c,74,115,14,31);
  rect(c,'#b7757d',52,92,15,23);rect(c,'#b7757d',55,89,9,5);
  rect(c,'#815471',55,95,9,20);rect(c,'#f7c78e',58,100,1,15);
  rect(c,'#fff0cd',49,89,3,26);rect(c,'#fff0cd',67,89,3,26);rect(c,'#fff0cd',52,87,15,3);
  rect(c,'#c68c71',6,115,103,5);rect(c,'#fff0c7',7,114,101,2);
 },g,x-10,baseY-120);
}
export function drawHorizonBand(g,cam,baseY,color,seed=0,parallax=.18) {
  for(let i=-1;i<7;i++) {const xx=i*92-((cam*parallax)%92);disk(g,xx+38,baseY,61,27+(i%3)*7,color);}
}
export function drawTile(g,type,x,y,theme,top,t,worldColumn=0) {
  x=Math.round(x);y=Math.round(y);
  if(type==='jam') {rect(g,theme==='canyon'?'#743b4b':'#d46d88',x,y,16,16);rect(g,'#f5a1af',x,y+Math.floor(Math.sin(t*3+x)*1.5),16,2);return;}
  const dark=type==='choc'||type==='sandwich';
  if(ready(reference)) {
    const offset=((worldColumn%3)+3)%3*30;
    // Samples are displayed from the supplied board; no resaved or altered source art.
    g.drawImage(reference,dark?1186+offset:96+offset,dark?445:555,30,20,x,y,16,16);
    if(top)g.drawImage(reference,dark?826+offset:90+offset,dark?480:531,30,dark?23:17,x,y,16,dark?12:9);
    return;
  }
  const base=dark?'#a85e52':'#e8a565';
  rect(g,base,x,y,16,16);
  const col=Math.floor((x)%48);
  if(col<3)rect(g,dark?'#8d494b':'#cc855b',x,y,3,16);
  if(col>=32&&col<36)rect(g,dark?'#c67a64':'#f3bb77',x,y,2,16);
  for(let i=0;i<7;i++){const dx=Math.floor(hash(i,y,Math.round(x/16))*15);const dy=Math.floor(hash(i,x,Math.round(y/16))*15);rect(g,i%2?(dark?'#c47b66':'#f9c986'):(dark?'#864547':'#ca8053'),x+dx,y+dy,i%3===0?2:1,2);}
  if(top) {
    rect(g,ink,x,y,16,2);rect(g,dark?'#edb094':'#ba783f',x,y+2,16,7);
    rect(g,dark?'#ffdfc5':'#ffdb70',x,y+2,16,5);rect(g,'#fff4da',x,y+2,16,2);
    const seed=Math.floor(x/16)%3;
    [[2,seed===0?6:3],[10,seed===1?5:3]].forEach(([dx,len])=>{rect(g,dark?'#eab59d':'#b97a45',x+dx,y+5,4,len+1);rect(g,dark?'#ffe5ce':'#ffda6b',x+dx,y+4,3,len);rect(g,'#fff0b4',x+dx,y+4,1,len-1);});
  }
  if(type==='biscuit') {
    rect(g,'#ce8c58',x,y+15,16,1);
    for(const [dx,dy] of [[4,10],[12,13]]){rect(g,'#b67848',x+dx,y+dy,2,2);rect(g,'#ffcd89',x+dx+1,y+dy+2,2,1);}
  }
}
export function drawWaterfall(g,x,top,bottom,t) {
 const colors=['#fff3de','#ead0e5','#fff1ec','#d3b4de','#ffefe0'];
 for(let i=0;i<22;i++){rect(g,colors[Math.floor(i/4)%5],x+i,top,1,bottom-top);if(i%5===0)for(let y=top+(t*24+i*3)%27;y<bottom;y+=27)rect(g,'#fff9e9',x+i,y,2,7);}
 rect(g,'#fff2d6',x-2,top-2,26,4);
}
const titleFont={C:['01110','11001','11000','11000','11000','11001','01110'],O:['01110','11011','11011','11011','11011','11011','01110'],K:['11011','11011','11110','11100','11110','11011','11011'],I:['11111','01110','01110','01110','01110','01110','11111'],E:['11111','11000','11000','11110','11000','11000','11111'],Q:['01110','11011','11011','11011','11111','01110','00011'],U:['11011','11011','11011','11011','11011','11011','01110'],S:['01111','11000','11000','01110','00011','00011','11110'],T:['11111','01110','01110','01110','01110','01110','01110']};
export function drawGameTitle(g) {
  cached('title',228,91,c=>{
    function word(text,y,s) {const width=(text.length*6-1)*s;const x=(228-width)/2;
      const cells=[];[...text].forEach((ch,k)=>titleFont[ch].forEach((row,j)=>[...row].forEach((p,i)=>{if(p==='1')cells.push([x+(k*6+i)*s,y+j*s]);})));
      for(const [xx,yy] of cells)rect(c,'#fff1ce',xx-3,yy-3,s+6,s+8);
      for(const [xx,yy] of cells)rect(c,'#583543',xx-2,yy-1,s+4,s+6);
      for(const [xx,yy] of cells){rect(c,'#c67d48',xx,yy+1,s,s+1);rect(c,'#f8bd68',xx,yy,s,s-1);if(hash(xx,yy)> .72)rect(c,'#aa6447',xx+1,yy+1,2,2);else if(hash(xx,yy)<.25)rect(c,'#ffe6a5',xx,yy,s,1);}
    }
    word('COOKIE',4,5);word('QUEST',47,5);
  },g,102,12);
}
/** A 3.4 second kneeling cycle. Knees stay planted while the torso pitches forward. */
export function incensePose(t=0) {
  const phase=((t%3.4)+3.4)%3.4;
  const ease=v=>(1-Math.cos(Math.PI*v))/2;
  let bow=0,stage='upright';
  if(phase>=.55&&phase<1.5){bow=ease((phase-.55)/.95);stage='bowing';}
  else if(phase>=1.5&&phase<1.9){bow=1;stage='kowtow';}
  else if(phase>=1.9&&phase<2.85){bow=1-ease((phase-1.9)/.95);stage='rising';}
  return {bow,stage,hipY:105+5*bow,projection:1-.54*bow,kneeY:112};
}

export function drawIncense(g,t=0) {
  g.clearRect(0,0,128,128);g.imageSmoothingEnabled=false;g.globalAlpha=1;
  const pose=incensePose(t),{bow,hipY,projection}=pose;
  if(g.canvas?.dataset)g.canvas.dataset.pose=pose.stage;
  const top=128*.30,waist=128*.82;
  const torsoHeight=(waist-top)*projection;
  const torsoY=hipY-torsoHeight;
  const back=bow===1?1:Math.max(0,Math.min(1,(bow-.68)/.32));
  const limbs=bow===1?0:1-Math.max(0,Math.min(1,(bow-.55)/.45));
  // Front-facing features disappear behind the back during the bow. At full
  // prostration no source face, hands, knees or feet are drawn at all.
  if(ready(incenseFront)) {
    const w=incenseFront.naturalWidth,h=incenseFront.naturalHeight;
    if(limbs>0) {
      g.globalAlpha=limbs;
      g.drawImage(incenseFront,0,h*.82,w,h*.09,0,waist,128,128*.09);
    }
    if(back<1) {
      g.globalAlpha=1-back;
      const breadth=1+bow*.08;
      g.drawImage(incenseFront,0,h*.30,w,h*.52,64-64*breadth,Math.round(torsoY),128*breadth,Math.round(torsoHeight));
    }
  }
  const backY=99+10*bow,backHeight=15-4*bow;
  if(back>0) {
    g.globalAlpha=back*.25;disk(g,64,122,37,3,'#48423a');
    g.globalAlpha=back;
    disk(g,64,backY+1,35,backHeight,'#392b2d');
    disk(g,64,backY,33,backHeight-1,'#d98d43');
    disk(g,64,backY-2,32,backHeight-2,'#f5bc67');
    disk(g,59,backY-4,21,4,'#ffce80');
    [[44,-3,3],[77,-4,4],[62,3,3],[85,2,2]].forEach(([x,y,r])=>disk(g,x,backY+y,r,Math.max(1,r*.5),'#a5633f'));
  }
  g.globalAlpha=1;
  // Only the three glowing incense tips peek past the bowed cookie's silhouette;
  // the hands and shafts are occluded. Smoke follows the tips downward.
  const tips=[{x:53.8,y:43.8},{x:62.5,y:41.9},{x:71.4,y:43.8}];
  for(let i=0;i<tips.length;i++) {
    const tip=tips[i],tx=64+(tip.x-64)*(1+bow*.08);
    const frontTipY=torsoY+(tip.y-top)*projection;
    const ty=frontTipY*(1-back)+(backY-backHeight-2+(i===1?-1:0))*back;
    rect(g,'#b96731',tx,ty,1,2);rect(g,'#ffd17b',tx,ty-1,1,1);
    const smokeHeight=27-bow*7;
    for(let k=0;k<smokeHeight;k++) {
      const drift=Math.sin(k*.27-t*2.7+i*.9)*(1+k*.07);
      g.globalAlpha=(1-k/smokeHeight)*.68;
      rect(g,'#eee8d8',tx+drift,ty-3-k,2,k%3===0?2:1);
    }
  }
  g.globalAlpha=1;
}

export function drawCookie(g,x,y,{mode='normal',panicFrame=0,shade=1}={}) {
  if(!ready(sprites))return drawFallbackCookie(g,x,y,{mode,panicFrame,shade});
  if(mode==='panic') {
    const xx=Math.round(x),yy=Math.round(y);
    // Keep the original frightened face; draw the raised hands separately so
    // their black silhouettes stay distinct from the cookie and yellow sparks.
    g.drawImage(sprites,583,613,158,142,xx+1,yy-1,23,21);
    const hand=panicFrame
      ? ['.KKK.','.KKK.','..KK.','..KK.','...KK','...KK']
      : ['KKK..','KKK..','.KK..','.KK..','..KK.','...KK','...KK'];
    const handY=yy-(panicFrame?3:4);
    // Preserve the raised palms and their angle, with roots at the cookie's sides.
    drawMap(g,hand,{K:'#151515'},xx-3,handY);
    drawMap(g,hand.map(row=>[...row].reverse().join('')),{K:'#151515'},xx+24,handY);
    rect(g,'#151515',xx,yy+2,2,5);
    rect(g,'#151515',xx+24,yy+2,2,5);
    rect(g,'#151515',xx+1,yy+6,3,2);
    rect(g,'#151515',xx+22,yy+6,3,2);
  } else g.drawImage(sprites,148,603,153,143,Math.round(x),Math.round(y),20,19);
}
const landscapeLayers=new Map();
function getLandscapeLayers(theme){
 if(landscapeLayers.has(theme))return landscapeLayers.get(theme);
 const clouds=theme==='butter'
  ? [[30,45,150,67],[177,149,96,54],[365,100,214,93],[648,218,111,47],[724,74,124,53],[1046,13,180,87],[1175,188,83,37],[1300,76,184,83]]
  : [[59,67,132,51],[143,145,103,42],[379,49,158,65],[509,172,107,37],[618,110,172,65],[810,69,119,46],[920,121,126,45],[1120,25,129,50],[900,211,106,37]];
 const parts=clouds.map((rect,i)=>({rect,kind:'cloud',phase:i*.8,drift:24+i%3*9,test:(r,g,b)=>theme==='butter'?(r>230&&g>205&&b>190):(r>219&&g>174&&r>b+7)}));
 if(theme==='butter')for(const rect of [[990,168,34,29],[904,228,29,29],[1070,228,32,29]])parts.push({rect,kind:'flag',wave:5,test:(r,g,b)=>r-g>28&&g<181&&b<146});
 const result=separateArtwork(landscapes,[0,theme==='butter'?0:512,1536,512],parts);
 landscapeLayers.set(theme,result);return result;
}
export function drawLandscape(g,theme,camera,t=0) {
  if(!ready(landscapes))return false;
  const {background,layers}=getLandscapeLayers(theme);
  const offset=Math.min(288,(theme==='butter'?110:35)+camera*.12);
  g.save();g.translate(-Math.round(offset),0);g.scale(720/1536,240/512);
  g.drawImage(background,0,0);
  for(const layer of layers)paintSeparatedLayer(g,layer,t);
  g.restore();drawBirds(g,t,432);
  return true;
}
