import {pathsOf} from './geometry.mjs';
const UI_FONT = 'Tahoma,Arial,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
function path(ctx,p,cx,cy,size,dy=0) {ctx.beginPath();p.forEach((v,i)=>{const x=cx+v.x*size,y=cy+v.y*size+dy;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();}
function random(seed=71){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function puffAmount(progress){const p=Math.max(0,Math.min(1,progress/.78));return p*p*(3-2*p);}
export function drawShape(ctx,shape,cx,cy,size,kind='fried',gold=1){for(const p of pathsOf(shape))drawContour(ctx,p,cx,cy,size,kind,gold);}
function drawContour(ctx,p,cx,cy,size,kind='fried',gold=1){
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  if(kind==='line'){path(ctx,p,cx,cy,size);ctx.strokeStyle='#fff2cd';ctx.lineWidth=size*.025;ctx.stroke();ctx.restore();return;}
  gold=Math.max(0,Math.min(1,gold));
  const metal=kind==='metal',fried=kind==='fried',puff=fried?puffAmount(gold):0;
  const thick=size*(metal?.042:.06+.05*puff),depth=metal?4:2+5*puff;
  path(ctx,p,cx,cy,size,depth);ctx.lineWidth=thick+(metal?3:2);ctx.strokeStyle=metal?'#39434f':fried?`hsl(${38-gold*8} 58% ${58-gold*29}%)`:'#b8a77e';ctx.stroke();
  const g=ctx.createLinearGradient(cx-size/2,cy-size/2,cx+size/2,cy+size/2);
  if(metal){g.addColorStop(0,'#f5faff');g.addColorStop(.2,'#778491');g.addColorStop(.38,'#d9e2ec');g.addColorStop(.46,'#ffffff');g.addColorStop(.53,'#8996a4');g.addColorStop(.72,'#edf4fa');g.addColorStop(.88,'#606d7c');g.addColorStop(1,'#d9e3ed');}
  else if(kind==='batter'){g.addColorStop(0,'#fff4d5');g.addColorStop(1,'#d9c59a');}
  else {g.addColorStop(0,`hsl(${43-gold*5} 91% ${89-gold*26}%)`);g.addColorStop(.48,`hsl(${43-gold*10} 88% ${83-gold*30}%)`);g.addColorStop(1,`hsl(${42-gold*13} 85% ${75-gold*32}%)`);}
  path(ctx,p,cx,cy,size);ctx.strokeStyle=g;ctx.lineWidth=thick;ctx.stroke();
  path(ctx,p,cx-1,cy-thick*.2,size);ctx.strokeStyle=metal?'#ffffffdd':'#fff1b988';ctx.lineWidth=metal?1.5:Math.max(2,thick*.18);ctx.stroke();
  if(!metal){
    const rnd=random();for(let i=0;i<1500;i++){
      const point=p[Math.floor(rnd()*p.length)],angle=rnd()*Math.PI*2,r=rnd()*thick*.39;
      const x=cx+point.x*size+Math.cos(angle)*r,y=cy+point.y*size+Math.sin(angle)*r;
      ctx.fillStyle=i%4===0?'#fff0bf':i%3===0?'#ad6c24':'#e4b05d';ctx.globalAlpha=fried?.13+.27*gold:.13;
      ctx.fillRect(x,y,1+rnd()*1.4,1+rnd()*1.4);
    }
    ctx.globalAlpha=1;
    if(fried&&puff>0){
      // Small raised blisters share the original contour; no replacement outline.
      for(let i=0;i<70;i++){
        const point=p[Math.floor(rnd()*p.length)],x=cx+point.x*size+(rnd()-.5)*thick*.4,y=cy+point.y*size+(rnd()-.5)*thick*.4,r=(1+rnd()*1.6)*puff;
        ctx.beginPath();ctx.ellipse(x,y+1,r,r*.65,0,0,Math.PI*2);ctx.fillStyle='#9c551638';ctx.fill();
        ctx.beginPath();ctx.ellipse(x,y-1,r*.85,r*.5,0,0,Math.PI*2);ctx.fillStyle='#fff2be99';ctx.fill();
      }
    }
  }
  ctx.restore();
}
export function drawScene(canvas,p,stage,t=0,label='我的形状',phase=1){
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  const rnd=random(93);ctx.fillStyle='#ab956e';ctx.fillRect(0,0,w,h);
  for(let i=0;i<1600;i++){ctx.fillStyle=i%2?'#bca67e':'#897455';ctx.fillRect(rnd()*w,rnd()*h,1,1);}
  if(stage==='bag') {drawBag(ctx,p,w,h,label,phase);return;}
  if(stage==='confirm'){ctx.fillStyle='#192523';ctx.fillRect(0,0,w,h);drawShape(ctx,p,w/2,h/2,Math.min(w,h)*.7,'line');return;}
  const dip=stage==='batter',frying=stage==='fry',release=stage==='release';
  const cx=w/2,cy=h*.48,r=Math.min(w*.43,h*.43);
  const steel=ctx.createRadialGradient(cx-r*.3,cy-r*.5,r*.1,cx,cy,r);steel.addColorStop(0,'#faf9ea');steel.addColorStop(.75,'#979c98');steel.addColorStop(.84,'#e1e5da');steel.addColorStop(.93,'#535b58');steel.addColorStop(1,'#e9ebe1');
  ctx.beginPath();ctx.arc(cx,cy,r+8,0,Math.PI*2);ctx.fillStyle=steel;ctx.fill();
  if(dip||frying||release){ctx.beginPath();ctx.arc(cx,cy,r-8,0,Math.PI*2);ctx.fillStyle=dip?'#e9dab7':'#342819';ctx.fill();}
  if(frying||release){for(let i=0;i<180;i++){const angle=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*(r-12);ctx.fillStyle=i%2?'#755522':'#b28b40';ctx.fillRect(cx+Math.cos(angle)*rr,cy+Math.sin(angle)*rr,2,2);}}
  const shapeSize=r*1.43;
  if(stage==='metal'||dip||frying){
    drawShape(ctx,p,cx,cy,shapeSize,stage==='metal'?'metal':dip?'batter':'fried',phase);
    const anchor=pathsOf(p).flat().reduce((a,b)=>a.y>b.y?a:b),ax=cx+anchor.x*shapeSize,ay=cy+anchor.y*shapeSize;
    ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax,h-16);ctx.strokeStyle='#495563';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#dbe5ef';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#3f3430';ctx.fillRect(ax-6,h-65,12,62);ctx.fillStyle='#8a7669';ctx.fillRect(ax-4,h-62,2,56);
  }else drawShape(ctx,p,cx,cy,shapeSize,'fried');
  if(frying){for(let i=0;i<100;i++){const points=pathsOf(p).flat(),v=points[i%points.length],q=rnd(),br=1+((t*.003+q*4)%5);const x=cx+v.x*shapeSize+(rnd()-.5)*22,y=cy+v.y*shapeSize+(rnd()-.5)*22;ctx.beginPath();ctx.arc(x,y,br,0,Math.PI*2);ctx.strokeStyle=i%2?'#f6e5ba88':'#ffffffaa';ctx.lineWidth=1;ctx.stroke();}}
  if(release){ctx.strokeStyle='#b8aa86';ctx.lineWidth=2;for(let i=-r;i<r;i+=12){ctx.beginPath();ctx.moveTo(cx-r,cy+i);ctx.lineTo(cx+r,cy+i);ctx.stroke();}drawShape(ctx,p,cx,cy,shapeSize,'fried');}
  ctx.save();ctx.translate(w-72,h-27);ctx.rotate(-.12);ctx.fillStyle='#fff7d9';ctx.fillRect(-61,-16,122,30);ctx.strokeStyle='#d8244e';ctx.strokeRect(-61,-16,122,30);ctx.font=`bold 17px ${UI_FONT}`;ctx.fillStyle='#d8244e';ctx.textAlign='center';ctx.fillText(({metal:'专属模具',batter:'蘸上面糊',fry:'正在油炸！',release:'金黄出锅'})[stage]||'',0,5);ctx.restore();
}
export function drawBag(ctx,p,w,h,label,phase=1){
  ctx.fillStyle='#9e7351';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#c29a6b';ctx.lineWidth=2;for(let i=-h;i<w;i+=13){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+h,h);ctx.stroke();}
  drawShape(ctx,p,w*.49,h*.55,Math.min(w*.6,h*.57),'fried');
  ctx.save();ctx.globalAlpha=phase;
  const cx=w/2,top=h*.19;
  ctx.beginPath();ctx.moveTo(w*.35,h*.055);ctx.lineTo(cx,top);ctx.lineTo(w*.17,h*.32);ctx.lineTo(w*.15,h*.9);ctx.lineTo(w*.85,h*.92);ctx.lineTo(w*.83,h*.32);ctx.lineTo(cx,top);ctx.lineTo(w*.66,h*.06);ctx.closePath();ctx.fillStyle='#f7ffff22';ctx.fill();ctx.strokeStyle='#ffffffaa';ctx.lineWidth=1.2;ctx.stroke();
  const rnd=random(13);for(let i=0;i<22;i++){ctx.beginPath();ctx.moveTo(cx+(rnd()-.5)*12,top);ctx.lineTo(w*(.18+rnd()*.63),h*(.63+rnd()*.28));ctx.strokeStyle=i%3?'#ffffff33':'#ffffffaa';ctx.stroke();}
  for(let i=0;i<10;i++){ctx.beginPath();ctx.moveTo(cx,top);ctx.lineTo(w*(.35+rnd()*.3),h*.055);ctx.stroke();}
  ctx.strokeStyle='#af3c2c';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(cx,top+i*2,13,3,0,0,Math.PI*2);ctx.stroke();}
  ctx.translate(w*.66,h*.8);ctx.rotate(-.12);ctx.fillStyle='#fff6c3';ctx.fillRect(-58,-26,116,52);ctx.strokeStyle='#cbbb85';ctx.strokeRect(-58,-26,116,52);ctx.textAlign='center';ctx.fillStyle='#202f74';ctx.font=`bold 11px ${UI_FONT}`;ctx.fillText('花形酥饼 · DRAW & FRY',0,-10);ctx.font=`bold 15px ${UI_FONT}`;ctx.fillText(label.slice(0,12),0,12);ctx.restore();
}
export function souvenir(p,label){const c=document.createElement('canvas');c.width=720;c.height=900;const ctx=c.getContext('2d');ctx.fillStyle='#fff2cd';ctx.fillRect(0,0,720,900);ctx.fillStyle='#003e3a';ctx.font=`bold 55px ${UI_FONT}`;ctx.fillText('DRAW & FRY',54,78);ctx.font=`20px ${UI_FONT}`;ctx.fillText('你画什么，我们炸什么。',57,116);ctx.save();ctx.translate(40,150);drawBag(ctx,p,640,610,label);ctx.restore();ctx.fillStyle='#293e37';ctx.font=`bold 24px ${UI_FONT}`;ctx.fillText(label,55,810);ctx.font=`15px ${UI_FONT}`;ctx.fillText('ACCEPT ALL COOKIES / THAI-FLOWER / '+new Date().toLocaleDateString('sv'),55,847);ctx.font=`14px ${UI_FONT}`;ctx.fillText('手绘模具为艺术演绎 · 此纪念图片不包含摄像头画面',55,876);return c;}
function counter(ctx,w,h){
 ctx.fillStyle='#866a4a';ctx.fillRect(0,0,w,h);const rnd=random(34);
 for(let i=0;i<h;i+=11){ctx.fillStyle=i%22?'#997c53':'#6b543d';ctx.fillRect(0,i,w,4);}
 for(let i=0;i<1300;i++){ctx.fillStyle=i%2?'#d3ba8170':'#372f2530';ctx.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1);}
 ctx.fillStyle='#ebe1c0';ctx.fillRect(9,10,70,35);ctx.strokeStyle='#ce9f6c';ctx.strokeRect(9,10,70,35);ctx.fillStyle='#5a3924';ctx.font=`bold 12px ${UI_FONT}`;ctx.fillText('ขนมดอกจอก',13,26);ctx.font=`9px ${UI_FONT}`;ctx.fillText('DRAW & FRY',14,38);
}
function bowl(ctx,x,y,r,oil=false,t=0){
 const g=ctx.createRadialGradient(x-r*.5,y-r*.4,2,x,y,r);g.addColorStop(0,'#f3f0db');g.addColorStop(.78,'#a6a69b');g.addColorStop(.86,'#f6f4de');g.addColorStop(.94,'#4e5754');g.addColorStop(1,'#c3c9b9');
 ctx.save();ctx.shadowColor='#171712aa';ctx.shadowBlur=9;ctx.shadowOffsetY=6;ctx.beginPath();ctx.ellipse(x,y,r,r*.85,0,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.restore();
 const liquid=ctx.createRadialGradient(x-20,y-30,0,x,y,r);liquid.addColorStop(0,oil?'#6c471d':'#f1e4be');liquid.addColorStop(1,oil?'#251e14':'#c7b68a');
 ctx.beginPath();ctx.ellipse(x,y,r-12,(r-12)*.85,0,0,Math.PI*2);ctx.fillStyle=liquid;ctx.fill();
 const rnd=random(8);for(let i=0;i<95;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*(r-17),xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d*.85;ctx.strokeStyle=oil?'#f6d88d55':'#fff9e566';ctx.lineWidth=1;ctx.beginPath();ctx.arc(xx,yy,oil?1+(i+t*.001)%3:1,0,Math.PI*2);ctx.stroke();}
}
function moldHandle(ctx,shape,x,y,size){
 const a=pathsOf(shape).flat().reduce((a,b)=>a.y<b.y?a:b),ax=x+a.x*size,ay=y+a.y*size;
 ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(x,Math.max(12,y-size*.75));ctx.strokeStyle='#414e5d';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#b8c6d4';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#f5faff';ctx.lineWidth=1.5;ctx.stroke();
 ctx.fillStyle='#4b3024';ctx.fillRect(x-7,Math.max(5,y-size*.75-28),14,33);ctx.fillStyle='#a37c4b';ctx.fillRect(x-5,Math.max(6,y-size*.75-26),2,28);
}
function emptyBag(ctx,x,y,w,h){
 ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(-w*.45,-h*.48);ctx.lineTo(w*.45,-h*.48);ctx.lineTo(w*.5,h*.5);ctx.lineTo(-w*.5,h*.5);ctx.closePath();ctx.fillStyle='#e8fff524';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle='#ffffedbb';ctx.stroke();
 ctx.strokeStyle='#fffee866';for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(-w*.4+i*w*.11,-h*.48);ctx.lineTo(-w*.47+i*w*.13,h*.48);ctx.stroke();}ctx.fillStyle='#fff6c7';ctx.fillRect(-w*.38,h*.14,w*.76,h*.21);ctx.fillStyle='#223579';ctx.font=`bold 12px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText('你的现炸酥饼',0,h*.28);ctx.restore();
}
export function kitchen(canvas,shape,stage,{time=0,tool=null,progress=0,hover=false,label='我的奇形酥饼'}={}){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.textAlign='left';ctx.clearRect(0,0,w,h);counter(ctx,w,h);
 if(stage==='made'||stage==='packing'){drawBag(ctx,shape,w,h,label,stage==='made'?1:progress);return;}
 if(stage==='mold'){
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#777f88');g.addColorStop(.3,'#b0b8c0');g.addColorStop(1,'#5b6570');ctx.fillStyle=g;ctx.fillRect(20,18,w-40,h-36);ctx.strokeStyle='#d7e1eb';ctx.lineWidth=3;ctx.strokeRect(24,22,w-48,h-44);
  drawShape(ctx,shape,w/2,h*.56,w*.57,'metal');moldHandle(ctx,shape,w/2,h*.56,w*.57);return;
 }
 if(stage==='bag'){
  ctx.fillStyle='#afb7aa';ctx.fillRect(10,h*.3,w*.43,h*.6);ctx.strokeStyle='#e9e9d6';for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(18,h*.34+i*21);ctx.lineTo(w*.43,h*.34+i*21);ctx.stroke();}
  emptyBag(ctx,w*.76,h*.57,w*.39,h*.7);
  if(hover){ctx.strokeStyle='#ffe965';ctx.lineWidth=3;ctx.strokeRect(w*.56,h*.19,w*.39,h*.76);}
  drawShape(ctx,shape,tool?.x??w*.24,tool?.y??h*.58,w*.3,'fried');return;
 }
 const frying=stage==='frying'||stage==='ready',coated=['fry','frying','ready'].includes(stage),cook=stage==='ready'?1:progress,puff=frying?puffAmount(cook):0,x=tool?.x??(frying?w*.5:w*.51),y=tool?.y??(frying?h*.62:h*.26),size=w*(.34+.14*puff);
 bowl(ctx,w*.5,h*.64,w*.38,coated,time);
 if(hover){ctx.beginPath();ctx.ellipse(w*.5,h*.64,w*.32,h*.27,0,0,Math.PI*2);ctx.strokeStyle='#ffff91';ctx.lineWidth=3;ctx.stroke();}
 if(!frying){ctx.fillStyle='#e8ca90';ctx.font=`11px ${UI_FONT}`;ctx.textAlign='center';ctx.fillText(coated?'热油':'面糊',w*.5,h*.96);}
 if(stage==='frying'&&cook<.58){
  // The silver tool stays rigid while the batter releases and expands below it.
  const lift=Math.max(0,(cook-.12)/.46);ctx.save();ctx.globalAlpha=1-lift;
  drawShape(ctx,shape,x,y-lift*h*.39,w*.34,'metal');moldHandle(ctx,shape,x,y-lift*h*.39,w*.34);ctx.restore();
 }
 drawShape(ctx,shape,x,y,size,stage==='dip'?'metal':['fry','dipping'].includes(stage)?'batter':'fried',cook);
 if(!frying)moldHandle(ctx,shape,x,y,size);
 if(frying){const rnd=random(24),points=pathsOf(shape).flat(),spread=size*(.06+.05*puff);for(let i=0;i<100;i++){const p=points[i%points.length],r=1+(time*.004+rnd()*4)%4;ctx.beginPath();ctx.arc(x+p.x*size+(rnd()-.5)*spread*1.8,y+p.y*size+(rnd()-.5)*spread*1.8,r,0,Math.PI*2);ctx.strokeStyle=i%2?'#fff5ccaa':'#edbc6688';ctx.lineWidth=1;ctx.stroke();}}
 if(!frying&&!tool){ctx.strokeStyle='#fff5ab';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(w*.83,h*.24);ctx.bezierCurveTo(w*.92,h*.35,w*.88,h*.48,w*.72,h*.59);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(w*.72,h*.59-10);ctx.lineTo(w*.72,h*.59);ctx.lineTo(w*.72+10,h*.59);ctx.stroke();}
}
