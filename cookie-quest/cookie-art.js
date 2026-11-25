/* Detailed, front-on biscuit illustrations on a 160px grid. All relief is surface
   decoration: no extruded sides, cast shadows or perspective transforms. */
export const COOKIE_SPRITE_SIZE=160;
const cache=new Map();
const palettes={
 dubai:['#6e3425','#ac6c45','#3a1915'],
 cocoa:['#281713','#60402d','#110b0b'],chips:['#e5a13a','#f8cd73','#914618'],fortune:['#edaf3d','#ffe39a','#a85d1b'],
 alfajor:['#edc884','#fff0be','#b17b37'],lace:['#e8b249','#ffdf91','#ae6d22'],ruffle:['#eaa1a5','#ffd1c4','#b85b65'],
 octopus:['#eac485','#fff0c2','#ad783f'],speckle:['#bf7c2d','#eeb557','#844615'],wasp:['#d59a36','#f6d073','#865122'],
 dark:['#65432a','#ad7944','#382518'],ring:['#efb22e','#ffe27d','#b66b10'],shortbread:['#e9bd5e','#fff1b2','#ac7628'],
 marie:['#d69b3b','#f3cf79','#8f551e'],grain:['#b97f31','#e4b75a','#74471e'],milk:['#e6b94f','#ffe9a1','#a66823'],
 almond:['#d8a75d','#f5dca4','#93612e'],crackle:['#a95a23','#e39a47','#663019'],stamp:['#b66a28','#e7aa55','#6e381b'],
 oat:['#bf7923','#edb44d','#76431b'],powder:['#e8c68f','#fff8e6','#b18858'],biscotti:['#d7a147','#ffe2a0','#8b531e'],
 waffle:['#c98224','#f6be55','#784216'],emboss:['#f1dbb2','#fff9e9','#c29b61'],cone:['#d99533','#fbd481','#8c4d1c'],
 roll:['#e8ab42','#ffe2a2','#995b25'],braid:['#d99321','#ffcf65','#8e4b13'],knot:['#dc9224','#ffcc62','#8c4716'],
 flower:['#d8ac5d','#ffe4a3','#95672d'],spiral:['#daa152','#fce1a3','#925722'],poppy:['#eed39b','#fff2c6','#b78a49'],
 crescent:['#f1dfb9','#fffdf0','#be955d'],macaron:['#d85784','#ffafc6','#9e3156'],coconut:['#dca652','#fff3c9','#986122'],
 clover:['#d0b35f','#f7e6a0','#92713b'],star:['#cb8d42','#f1c77c','#864b24'],nut:['#c7954c','#f3d392','#8e5c30'],
 rice:['#c17b25','#efb34e','#7a3814'],hardtack:['#d0a565','#f0cf94','#846036'],thin:['#e0bc56','#fae5a2','#b18a37'],
};
const px=(g,c,x,y,w=1,h=w)=>{g.fillStyle=c;g.fillRect(Math.round(x*2)/2,Math.round(y*2)/2,w,h);};
function stroke(g,pts,c,w=1){g.strokeStyle=c;g.lineWidth=w;g.lineJoin='round';g.lineCap='round';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
function oval(g,x,y,rx,ry,c,angle=0){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,Math.PI*2);g.fill();}
function ring(g,x,y,r,c,w=1){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();}
function polygon(g,pts,c){g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function seedRandom(id){let s=Array.from(id).reduce((n,c)=>n*31+c.charCodeAt(0),17)>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function around(n,r,phase=0){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2+phase;return [40+Math.cos(a)*r,40+Math.sin(a)*r,a];});}
function pathFor(item){
 const p=new Path2D(),s=item.style,id=item.id;
 const circle=(x,y,r,reverse=false)=>{p.moveTo(x+r,y);p.arc(x,y,r,0,Math.PI*2,reverse);p.closePath();};
 const poly=pts=>{pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();};
 const radial=(lobes,low,high,steps=96)=>{poly(Array.from({length:steps},(_,i)=>{const a=i/steps*Math.PI*2;const r=low+(high-low)*(1+Math.cos(a*lobes))/2;return [40+Math.cos(a)*r,40+Math.sin(a)*r];}));};
 if(s==='fortune'){
  p.moveTo(8,35);p.bezierCurveTo(10,19,24,13,40,19);p.bezierCurveTo(56,13,70,19,72,35);p.bezierCurveTo(72,49,64,62,51,63);p.lineTo(40,45);p.lineTo(29,63);p.bezierCurveTo(16,62,8,49,8,35);p.closePath();
 }else if(s==='shortbread')p.roundRect(24,7,32,66,5);
 else if(s==='milk'){
  const pts=[];for(let i=0;i<16;i++)pts.push([7+i*4.4,17+(i%2)*2]);for(let i=0;i<10;i++)pts.push([73-(i%2)*2,17+i*4.8]);for(let i=0;i<16;i++)pts.push([73-i*4.4,63-(i%2)*2]);for(let i=0;i<10;i++)pts.push([7+(i%2)*2,63-i*4.8]);poly(pts);
 }else if(s==='stamp')p.roundRect(18,7,44,66,4);
 else if(s==='emboss')p.roundRect(10,12,60,56,8);
 else if(s==='hardtack')p.roundRect(10,10,60,60,3);
 else if(s==='biscotti'){p.moveTo(7,39);p.bezierCurveTo(8,28,20,24,36,23);p.lineTo(65,23);p.quadraticCurveTo(74,26,73,39);p.lineTo(69,52);p.lineTo(13,57);p.closePath();}
 else if(s==='cone'){p.moveTo(10,17);p.quadraticCurveTo(40,4,70,17);p.lineTo(43,72);p.quadraticCurveTo(40,76,37,72);p.closePath();}
 else if(s==='roll'){p.roundRect(26,7,28,66,5);}
 else if(s==='braid'){
  p.moveTo(32,8);p.bezierCurveTo(8,19,58,37,29,54);p.bezierCurveTo(17,63,27,74,41,71);p.bezierCurveTo(62,68,67,50,51,40);p.bezierCurveTo(34,29,63,19,47,9);p.quadraticCurveTo(40,4,32,8);p.closePath();
  p.moveTo(38,16);p.bezierCurveTo(28,21,49,26,43,34);p.bezierCurveTo(58,24,45,14,38,16);p.closePath();
  p.moveTo(38,48);p.bezierCurveTo(17,59,39,72,47,60);p.quadraticCurveTo(53,53,38,48);p.closePath();
 }else if(s==='knot'){
  poly([[15,12],[34,9],[40,24],[47,9],[66,13],[58,35],[63,63],[47,71],[40,54],[32,70],[16,64],[23,39]]);
  poly([[37,30],[43,28],[45,45],[40,51],[35,44]]);
 }else if(s==='crescent'){
  p.moveTo(60,10);p.bezierCurveTo(12,-2,0,54,32,69);p.bezierCurveTo(45,75,61,69,70,57);p.bezierCurveTo(44,69,23,40,40,20);p.quadraticCurveTo(48,12,60,10);p.closePath();
 }else if(s==='clover'||id==='32_dasik')radial(4,25,34);
 else if(s==='flower')radial(id==='29_maamoul'?16:8,29,34);
 else if(s==='lace')radial(12,31,35);
 else if(s==='star')poly(around(10,1,-Math.PI/2).map((v,i)=>[40+Math.cos(v[2])*(i%2?18:34),40+Math.sin(v[2])*(i%2?18:34)]));
 else if(s==='ring'){radial(18,31.5,35);circle(40,40,12,true);}
 else if(s==='cocoa'){radial(36,33,34.5);}
 else if(s==='powder'&&id==='20_polvoron')p.roundRect(9,17,62,46,17);
 else if(s==='nut')p.ellipse(40,40,34,28,0,0,Math.PI*2);
 else if(s==='ruffle'||s==='thin'||s==='coconut'||s==='octopus'||s==='dark'){
  const rng=seedRandom(id),pts=[];for(let i=0;i<72;i++){const a=i/72*6.283185,r=31+rng()*4;pts.push([40+Math.cos(a)*r,40+Math.sin(a)*r*(s==='octopus'?.88:1)]);}poly(pts);
 }else if(s==='chips'){radial(11,32,34.5);}
 else circle(40,40,34);
 return p;
}
function almond(g,x,y,a=0,k=1){
 g.save();g.translate(x,y);g.rotate(a);g.scale(k,k);
 oval(g,0,0,3.7,7.3,'#8b4e21');oval(g,-.3,-.5,2.8,6.1,'#efd69b');stroke(g,[[0,-5],[-1,0],[.6,5]],'#bd8c4e',.7);g.restore();
}
function embossed(g,pts,dark,light,w=1){
 stroke(g,pts.map(([x,y])=>[x+.45,y+.6]),dark,w+.45);stroke(g,pts,light,w);
}
function waffle(g,light,dark){
 for(let k=-64;k<108;k+=8){
  stroke(g,[[k,2],[k+80,78]],dark,2.2);stroke(g,[[k+.7,2],[k+80.7,78]],light,.9);
  stroke(g,[[k,78],[k+80,2]],dark,2.2);stroke(g,[[k,77],[k+80,1]],light,.9);
 }
}
export function cookieSprite(item){
 if(cache.has(item.id))return cache.get(item.id);
 const cv=document.createElement('canvas');cv.width=cv.height=COOKIE_SPRITE_SIZE;
 const g=cv.getContext('2d');g.scale(2,2);g.imageSmoothingEnabled=false;
 const s=item.style,id=item.id,rng=seedRandom(id);let [base,light,dark]=palettes[s]||palettes.chips;
 if(id==='32_dasik')[base,light,dark]=['#789b3c','#d1dc86','#405e23'];
 if(id==='39_bangkit')[base,light,dark]=['#f1e1b5','#fff9e2','#c5a56e'];
 if(id==='21_nankhatai')[base,light,dark]=['#edbd66','#ffe6a5','#b47c32'];
 if(id==='35_ghriba')[base,light,dark]=['#d2a065','#f9e2b4','#8c5832'];
 if(id==='45_kulit')[base,light,dark]=['#cf8b31','#ffcf70','#91501d'];
 const shape=pathFor(item);
 const dough=g.createRadialGradient(37,34,9,40,40,39);dough.addColorStop(0,light);dough.addColorStop(.35,base);dough.addColorStop(.87,base);dough.addColorStop(1,dark);
 g.fillStyle=dough;g.fill(shape,'evenodd');g.strokeStyle=dark;g.lineWidth=1.5;g.stroke(shape);
 g.save();g.clip(shape,'evenodd');
 // Fine pores and toasted grain are deterministic, so the texture never flickers.
 const count=s==='macaron'?100:s==='dark'?650:350;
 for(let i=0;i<count;i++){
  const x=4+rng()*72,y=4+rng()*72,r=.25+rng()*.65;
  g.globalAlpha=.12+rng()*.28;px(g,i%3?dark:light,x,y,r,r*(.6+rng()));
 }
 g.globalAlpha=1;
 if(s==='chips'){
  for(let i=0;i<10;i++){
   const a=i*2.399,r=7+Math.sqrt(i/10)*23,x=40+Math.cos(a)*r,y=40+Math.sin(a)*r;
   const pts=[[x-3,y-3],[x+2,y-4],[x+5,y],[x+3,y+4],[x-3,y+3],[x-4,y]];
   polygon(g,pts,'#3b1b12');polygon(g,[[x-2,y-2],[x+1,y-3],[x+3,y],[x-2,y+1]],'#784020');px(g,'#a96735',x-1,y-2,1.5,.7);
  }
  for(let i=0;i<7;i++){const a=i*.94;stroke(g,[[40+Math.cos(a)*17,40+Math.sin(a)*17],[40+Math.cos(a+.08)*23,40+Math.sin(a+.08)*23],[40+Math.cos(a-.1)*29,40+Math.sin(a-.1)*29]],'#b2752e',.6);}
 }
 if(s==='cocoa'){
  ring(g,40,40,30.5,'#100b09',1.6);ring(g,40,40,28.5,'#976f4b',.7);ring(g,40,40,25.5,'#130d0b',1.4);
  for(const [x,y,a]of around(24,32.2))stroke(g,[[x-Math.cos(a)*1.4,y-Math.sin(a)*1.4],[x+Math.cos(a)*.5,y+Math.sin(a)*.5]],'#a07850',.8);
  for(const [x,y,a]of around(10,20.5)){
   g.save();g.translate(x,y);g.rotate(a);embossed(g,[[-3,0],[0,-3],[3,0],[0,3],[-3,0]],'#140d0b','#8c6544',.8);stroke(g,[[-4,-4],[4,4]],'#8c6544',.8);stroke(g,[[-4,4],[4,-4]],'#8c6544',.8);g.restore();
  }
  g.strokeStyle='#98714e';g.lineWidth=.8;g.beginPath();g.ellipse(40,40,15,8,0,0,6.283);g.stroke();
  g.fillStyle='#bd9568';g.font='bold 8px Georgia';g.textAlign='center';g.fillText('OREO',40,43);
 }
 if(s==='fortune'){
  g.fillStyle='#f6c258';g.beginPath();g.moveTo(9,32);g.quadraticCurveTo(24,17,40,37);g.quadraticCurveTo(55,17,71,32);g.quadraticCurveTo(56,27,40,45);g.quadraticCurveTo(24,27,9,32);g.fill();
  stroke(g,[[12,35],[22,31],[32,33],[40,44],[48,33],[58,31],[68,35]],'#b97825',1.2);
  stroke(g,[[18,42],[22,51],[29,58]],'#ffdf8b',1);stroke(g,[[62,42],[58,51],[52,58]],'#ffdf8b',1);
 }
 if(s==='alfajor'){
  ring(g,40,40,29.5,'#c09450',.7);
  for(let i=0;i<120;i++){const a=rng()*6.28,r=29+rng()*4;const x=40+Math.cos(a)*r,y=40+Math.sin(a)*r;stroke(g,[[x,y],[x+Math.cos(a+.6)*2,y+Math.sin(a+.6)*2]],i%3?'#fff4d1':'#dbb779',.7);}
  for(let i=0;i<35;i++){const a=rng()*6.28,r=rng()*27;px(g,'#fff0c5',40+Math.cos(a)*r,40+Math.sin(a)*r,1.2,.8);}
 }
 if(s==='lace'){
  ring(g,40,40,30,dark,.8);ring(g,40,40,7,dark,1);
  for(const [x,y,a]of around(8,23)){
   g.save();g.translate(40,40);g.rotate(a);embossed(g,[[7,0],[14,-5],[25,0],[14,5],[7,0]],dark,light,.9);embossed(g,[[10,-1],[16,-1],[22,0],[16,1]],dark,light,.6);stroke(g,[[28,-2],[30,0],[28,2]],light,1);g.restore();
  }
  for(const[x,y]of around(8,4))oval(g,x,y,1.2,1.2,dark);
 }
 if(s==='waffle'||s==='cone'||s==='roll'){
  waffle(g,light,dark);
  if(s==='waffle'){ring(g,40,40,31,dark,1);ring(g,40,40,30,light,.8);}
  if(s==='cone'){stroke(g,[[14,18],[28,23],[43,23],[65,18]],'#9f5c1f',2);stroke(g,[[16,17],[30,21],[46,21],[63,17]],'#ffe4a1',1);}
  if(s==='roll'){stroke(g,[[29,10],[32,28],[31,48],[30,70]],light,1.8);stroke(g,[[50,9],[49,71]],dark,1);}
 }
 if(s==='ring'){
  for(let i=0;i<32;i++){const a=i/32*6.283;const pts=[[40+Math.cos(a)*15,40+Math.sin(a)*15],[40+Math.cos(a+.09)*23,40+Math.sin(a+.09)*23],[40+Math.cos(a+.1)*32,40+Math.sin(a+.1)*32]];embossed(g,pts,dark,light,1.2);}
  ring(g,40,40,13.2,dark,.9);
 }
 if(s==='marie'){
  ring(g,40,40,30,dark,.7);ring(g,40,40,26.5,light,1);ring(g,40,40,25,dark,.7);
  for(const[x,y]of around(22,28.5))oval(g,x,y,.7,.7,dark);
  for(const[x,y]of [[25,30],[36,25],[47,27],[55,34],[26,49],[36,55],[48,53],[56,47]]){oval(g,x,y,1,1.1,dark);px(g,light,x-.5,y-1,.5);}
  g.font='bold 7px Georgia';g.textAlign='center';g.fillStyle=dark;g.fillText('MARIE',40,43);stroke(g,[[24,36],[56,36]],dark,.6);stroke(g,[[25,46],[55,46]],dark,.6);
 }
 if(s==='shortbread'||s==='milk'||s==='hardtack'){
  g.strokeStyle=light;g.lineWidth=.8;if(s==='shortbread')g.strokeRect(27,10,26,60);else if(s==='milk')g.strokeRect(12,22,56,36);else g.strokeRect(14,14,52,52);
  if(s==='shortbread')for(let y=17;y<68;y+=10)for(let x=32;x<=48;x+=8){oval(g,x,y,1,1.2,dark);px(g,light,x-.5,y-1.4,.8,.5);}
  if(s==='milk'){
   for(let y=27;y<=54;y+=9)for(let x=17;x<66;x+=8)if(y<32||y>45||x<26||x>55){oval(g,x,y,.8,1,dark);px(g,light,x,y-1,.6);}
   g.fillStyle=dark;g.font='bold 8px Georgia';g.textAlign='center';g.fillText('MILK',40,43);
  }
  if(s==='hardtack')for(let y=22;y<=60;y+=12)for(let x=22;x<=60;x+=12){oval(g,x,y,1.7,1.8,'#70512c');ring(g,x,y,2.3,light,.6);}
 }
 if(s==='stamp'){
  g.strokeStyle=dark;g.lineWidth=.9;g.strokeRect(22,12,36,56);g.strokeStyle=light;g.lineWidth=.8;g.strokeRect(24,14,32,52);
  for(let y=17;y<65;y+=6){oval(g,23,y,.8,.8,light);oval(g,57,y,.8,.8,light);}
  polygon(g,[[33,39],[46,39],[49,60],[31,60]],dark);polygon(g,[[35,41],[44,41],[46,58],[33,58]],base);
  embossed(g,[[32,39],[39,29],[47,39]],dark,light,1.1);
  for(let i=0;i<4;i++){g.save();g.translate(40,33);g.rotate(i*Math.PI/2+.4);polygon(g,[[0,0],[2,-15],[6,-15],[3,0]],dark);stroke(g,[[2,-2],[3,-13],[5,-13]],light,.7);g.restore();}
  oval(g,40,33,2,2,light);px(g,dark,37,51,5,8);
 }
 if(s==='emboss'||s==='flower'||s==='clover'){
  const n=id==='32_dasik'?4:s==='emboss'?8:id==='29_maamoul'?16:s==='clover'?4:8;
  if(s==='emboss'){g.strokeStyle=dark;g.lineWidth=.7;g.strokeRect(15,17,50,46);g.strokeStyle=light;g.strokeRect(17,19,46,42);}
  for(let i=0;i<n;i++){
   const a=i/n*6.283;g.save();g.translate(40,40);g.rotate(a);
   if(id==='29_maamoul')embossed(g,[[7,0],[16,0],[29,0]],dark,light,1.1);
   else{embossed(g,[[2,0],[10,-7],[23,-4],[26,0],[23,4],[10,7],[2,0]],dark,light,1);embossed(g,[[9,0],[21,0]],dark,light,.7);}
   g.restore();
  }
  ring(g,40,40,4.5,dark,.7);oval(g,40,40,2.5,2.5,light);
  if(s==='clover'){polygon(g,[[38,37],[42,36],[43,40],[39,42]],'#527836');px(g,'#a2b64d',39,37,1.5,2);}
 }
 if(s==='crackle'){
  if(id==='35_ghriba'){g.globalAlpha=.62;oval(g,40,40,28,27,'#fff2d8');g.globalAlpha=1;}
  const count=id==='21_nankhatai'?5:9;
  for(let i=0;i<count;i++){const a=i/count*6.283;const pts=[[40+Math.cos(a)*8,40+Math.sin(a)*8],[40+Math.cos(a+.2)*18,40+Math.sin(a+.2)*18],[40+Math.cos(a-.1)*31,40+Math.sin(a-.1)*31]];stroke(g,pts,dark,id==='35_ghriba'?1.8:1.1);stroke(g,pts.map(([x,y])=>[x-.6,y-.5]),light,.45);}
  if(id==='21_nankhatai'){almond(g,40,39,.4,.8);polygon(g,[[34,35],[37,32],[38,38]],'#799444');polygon(g,[[43,44],[47,41],[45,47]],'#658739');}
 }
 if(s==='almond'){
  ring(g,40,40,27.5,dark,.8);for(const[x,y,a]of around(16,30))stroke(g,[[x,y],[x-Math.cos(a)*4,y-Math.sin(a)*4]],light,1);
  for(const[x,y,a]of around(8,18))embossed(g,[[x-3,y-3],[x,y],[x+3,y-3]],dark,light,1);
  almond(g,40,40,0,1.5);
 }
 if(s==='spiral'){
  const pts=[];for(let i=0;i<190;i++){const a=i*.12,r=i*.14;pts.push([40+Math.cos(a)*r,40+Math.sin(a)*r]);}
  stroke(g,pts,'#653519',3.5);stroke(g,pts.map(([x,y])=>[x-.4,y-.5]),'#976030',1);ring(g,40,40,31,light,1.2);
 }
 if(s==='braid'){
  for(let i=0;i<7;i++)embossed(g,[[28,13+i*8],[36,17+i*8],[46,18+i*8]],dark,light,1.1);
  stroke(g,[[36,9],[31,16],[44,30],[49,39],[38,47],[29,60],[36,68]],light,1.4);
 }
 if(s==='knot'){
  polygon(g,[[18,15],[31,12],[40,30],[46,29],[55,15],[60,16],[45,43],[39,47]],'#b46516');
  stroke(g,[[20,17],[32,14],[39,28]],light,1.2);stroke(g,[[22,61],[33,64],[40,49],[50,35],[57,16]],light,1.4);
  stroke(g,[[27,29],[35,40],[32,55]],dark,1.1);
 }
 if(s==='biscotti'){for(const[x,y,a]of [[20,40,.2],[36,34,-.4],[49,44,.5],[62,34,-.3]])almond(g,x,y,a,1);for(let i=0;i<25;i++)oval(g,12+rng()*56,30+rng()*22,.6,.8,dark);}
 if(s==='grain'||s==='oat'||s==='coconut'||s==='nut'||s==='speckle'||s==='poppy'||s==='dark'){
  const n=s==='dark'?230:s==='coconut'?130:s==='oat'?60:s==='nut'?110:90;
  for(let i=0;i<n;i++){
   const a=rng()*6.28,r=Math.sqrt(rng())*31,x=40+Math.cos(a)*r,y=40+Math.sin(a)*r,angle=rng()*3.14;
   if(s==='coconut'){stroke(g,[[x,y],[x+Math.cos(angle)*4,y+Math.sin(angle)*4]],i%3?'#fff3ca':'#bc7e33',.8);}
   else if(s==='oat'){oval(g,x,y,1.3,2.5,i%3?'#e8bd67':'#805025',angle);stroke(g,[[x-Math.sin(angle),y-Math.cos(angle)],[x+Math.sin(angle),y+Math.cos(angle)]],'#b58132',.45);}
   else if(s==='nut'){polygon(g,[[x-1,y-2],[x+2,y-1],[x+1,y+2],[x-2,y+1]],i%4?'#f1ce8b':'#915b27');}
   else if(s==='dark'){oval(g,x,y,1.1,.45,i%3?'#392516':'#b8894d',angle);stroke(g,[[x-1,y-1],[x+1,y+1]],'#d4a968',.35);}
   else if(s==='poppy'){oval(g,x,y,.55,.7,'#463324');}
   else{px(g,i%4?dark:light,x,y,s==='speckle'?.5:1,s==='grain'?1.5:.7);}
  }
 }
 if(s==='powder'||s==='crescent'){
  for(let i=0;i<550;i++){const x=8+rng()*64,y=8+rng()*64;g.globalAlpha=.4+rng()*.6;px(g,'#fffbed',x,y,.5+rng()*1.4,.5+rng()*1.2);}g.globalAlpha=1;
  if(id==='31_kahk')for(const[x,y,a]of around(12,22))stroke(g,[[x,y],[x-Math.cos(a)*8,y-Math.sin(a)*8]],'#cfaa70',.6);
 }
 if(s==='macaron'){
  ring(g,40,40,30.5,'#9b2c57',1.7);ring(g,40,40,28.5,'#ffafc4',.7);
  for(const[x,y]of around(48,32)){oval(g,x,y,1.1,1.2,'#f487ac');px(g,'#b23968',x+.7,y+.3,.6);}
  for(let i=0;i<40;i++){const a=rng()*6.28,r=rng()*24;px(g,'#ffcee0',40+Math.cos(a)*r,40+Math.sin(a)*r,.5);}
  stroke(g,[[23,27],[29,22],[37,20]],'#f9a6c0',1.1);
 }
 if(s==='octopus'){
  for(let i=0;i<8;i++){
   const a=i/8*6.283;g.save();g.translate(40,40);g.rotate(a);const pts=[];
   for(let n=0;n<20;n++){const x=5+n*1.1,y=Math.sin(n*.19)*4+(n>12?(n-12)*.5:0);pts.push([x,y]);}
   stroke(g,pts,'#8c3826',2.8);stroke(g,pts.map(([x,y])=>[x,y-.5]),'#cf7851',1.1);
   for(let n=0;n<8;n++)oval(g,8+n*2,Math.sin((3+n*2)*.19)*4+1,.7,.7,'#f1bb83');g.restore();
  }
  oval(g,40,35,6.2,8.5,'#a44830');oval(g,38,33,3,5,'#c87850');
 }
 if(s==='wasp')for(const[x,y,a]of [[27,27,-.6],[51,36,.6],[33,54,.4]]){
  g.save();g.translate(x,y);g.rotate(a);oval(g,-2,-3,3,1.4,'#ebd6a1',-.5);oval(g,-2,3,3,1.4,'#ebd6a1',.5);
  oval(g,2,0,4,1.9,'#32231a');px(g,'#bc8b30',1,-1.5,1,3);px(g,'#bc8b30',3,-1.3,1,2.6);oval(g,-3,0,1.7,1.5,'#302319');
  for(let i=0;i<3;i++){stroke(g,[[-1+i*1.5,0],[-3+i*2,-4]],'#49301d',.6);stroke(g,[[-1+i*1.5,0],[-3+i*2,4]],'#49301d',.6);}g.restore();
 }
 if(s==='rice'||s==='thin'||s==='ruffle'){
  for(let i=0;i<70;i++){
   const a=rng()*6.28,r=Math.sqrt(rng())*30,x=40+Math.cos(a)*r,y=40+Math.sin(a)*r,rr=1+rng()*2.4;
   oval(g,x,y,rr,rr*.75,i%4?base:dark);g.globalAlpha=.65;stroke(g,[[x-rr,y],[x-rr*.5,y-rr*.6],[x+rr*.5,y-rr*.6]],light,.7);g.globalAlpha=1;
  }
  if(s==='thin')for(let i=0;i<22;i++){const a=rng()*6.28,r=rng()*28;oval(g,40+Math.cos(a)*r,40+Math.sin(a)*r,.4,1.2,'#796536',a);}
  if(s==='rice')for(const[x,y]of [[25,28],[51,48],[40,19],[21,51]]){g.globalAlpha=.7;oval(g,x,y,5,3,'#955018');g.globalAlpha=1;stroke(g,[[x-2,y-1],[x+2,y-1]],'#e4ab41',.7);}
 }
 if(s==='star')for(let i=0;i<170;i++){const a=rng()*6.28,r=rng()*31;px(g,i%3?'#9d5c28':'#ffe6b5',40+Math.cos(a)*r,40+Math.sin(a)*r,.6);}
 if(s==='dubai'){
  polygon(g,[[22,35],[27,27],[42,25],[56,32],[59,43],[49,51],[30,50],[21,43]],'#657024');
  stroke(g,[[22,35],[27,27],[42,25],[56,32],[59,43],[49,51],[30,50],[21,43],[22,35]],'#44261b',2);
  for(let i=0;i<110;i++){const x=26+rng()*28,y=30+rng()*16;stroke(g,[[x,y],[x+2+rng()*3,y-2]],i%3?'#d4af50':'#a1ad40',.7);}
 }
 g.restore();
 if(s==='fortune'){
  polygon(g,[[37,46],[42,45],[45,65],[39,67]],'#fff9e9');stroke(g,[[39,53],[42,52]],'#c6ad7b',.6);stroke(g,[[40,57],[43,56]],'#c6ad7b',.6);
 }
 cache.set(item.id,cv);return cv;
}
