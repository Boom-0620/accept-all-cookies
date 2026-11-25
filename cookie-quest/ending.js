import { cookieSprite } from './ending-art.js';
import { COOKIE_CATALOG } from './cookie-catalog.js';
import { PHOTO_CATALOG } from './photo-catalog.js';
import { drawGoldSurface } from './ending-art.js';
import { paintAward } from './award.js';
import { emit } from './bus.js';
import { getCookieGesture, drawCookieGesture } from './integration/cookie-tactile.js';
import { mountCookieCreator } from './creator.js';

const CREATOR_COOKIE={id:'create-your-cookie',name:'神秘曲奇 · 创作自己的曲奇',creator:true};
function mysterySprite(){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;const g=canvas.getContext('2d');
 for(let y=-43;y<=43;y++){const w=Math.floor(Math.sqrt(43*43-y*y));g.fillStyle='#100f13';g.fillRect(48-w,48+y,w*2+1,1);}
 for(let y=-39;y<=39;y++){const w=Math.floor(Math.sqrt(39*39-y*y));g.fillStyle='#242128';g.fillRect(48-w,48+y,w*2+1,1);}
 for(let i=0;i<55;i++){const x=13+(i*37)%70,y=13+(i*23)%70;if((x-48)**2+(y-48)**2<34**2){g.fillStyle=i%2?'#332e38':'#17151b';g.fillRect(x,y,2,2);}}
 const mark=['01110','11011','00011','00110','00100','00000','00100'];g.fillStyle='#fff4d6';mark.forEach((row,y)=>[...row].forEach((bit,x)=>{if(bit==='1')g.fillRect(33+x*6,25+y*6,6,6);}));return canvas;
}

const trimmed=new Map();
function specimen(item){
 if(trimmed.has(item.id))return trimmed.get(item.id);
 const src=item.creator?mysterySprite():cookieSprite(item),ctx=src.getContext('2d'),pixels=ctx.getImageData(0,0,src.width,src.height).data;
 let l=src.width,t=src.height,r=0,b=0;for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++)if(pixels[(y*src.width+x)*4+3]>20){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 const cv=document.createElement('canvas');cv.width=r-l+1;cv.height=b-t+1;cv.getContext('2d').drawImage(src,l,t,cv.width,cv.height,0,0,cv.width,cv.height);trimmed.set(item.id,cv);return cv;
}
// Staggered, aspect-preserving specimens; no duplicate filler cookies.
export function finalLayout(){
 const entries=[...COOKIE_CATALOG];entries.splice(28,0,CREATOR_COOKIE);
 const counts=[8,8,8,8,8,7],heights=[96,99,94,96,97,94];let index=0,y=0;
 return counts.flatMap((count,row)=>{
  const items=entries.slice(index,index+count),weights=items.map((item,i)=>{const s=specimen(item);return Math.max(.8,Math.min(1.55,s.width/s.height))*(1+Math.sin((index+i)*1.9)*.09);}),sum=weights.reduce((a,b)=>a+b,0);let x=0;
  const out=items.map((item,col)=>{const cellW=864*weights[col]/sum,cellH=heights[row],image=specimen(item),angle=Math.sin((index+col)*3.4)*.16;
   const cos=Math.abs(Math.cos(angle)),sin=Math.abs(Math.sin(angle));const scale=Math.min((cellW-3)/(image.width*cos+image.height*sin),(cellH-3)/(image.height*cos+image.width*sin));
   const p={item,image,x:x+cellW/2+(row%2?8:-8),y:y+cellH/2+Math.sin(col*2.1)*6,w:image.width*scale*1.28,h:image.height*scale*1.28,angle,cell:{x,y,w:cellW,h:cellH},delay:(5-row)*.31+col*.07};x+=cellW;return p;
  });index+=count;y+=heights[row];return out;
 });
}
// Bake the paper texture once so the fibres stay still beneath the moving cookies.
function bakingPaper(){
 const canvas=document.createElement('canvas');canvas.width=864;canvas.height=576;
 const g=canvas.getContext('2d');let seed=7419;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 g.fillStyle='#eddbb9';g.fillRect(0,0,864,576);
 for(let i=0;i<38;i++){
  const x=random()*864,y=random()*576,r=55+random()*150;
  const wash=g.createRadialGradient(x,y,0,x,y,r);
  wash.addColorStop(0,i%2?'rgba(255,250,226,.18)':'rgba(171,133,82,.045)');wash.addColorStop(1,'rgba(237,219,185,0)');
  g.fillStyle=wash;g.fillRect(0,0,864,576);
 }
 for(let i=0;i<21000;i++){
  const x=random()*864,y=random()*576;
  g.fillStyle=i%3?'rgba(139,108,66,.045)':'rgba(255,253,233,.22)';
  g.fillRect(x,y,random()<.9?1:2,1);
 }
 for(let i=0;i<1400;i++){
  const x=random()*864,y=random()*576;
  g.strokeStyle=i%2?'rgba(133,105,71,.08)':'rgba(255,253,232,.28)';g.lineWidth=.6;
  g.beginPath();g.moveTo(x,y);g.lineTo(x+2+random()*6,y+(random()-.5)*3);g.stroke();
 }
 for(const [x,y,dx,dy] of [[-50,174,650,52],[315,-30,122,650],[470,580,450,-270]]){
  for(let side=0;side<2;side++){
   g.strokeStyle=side?'rgba(255,253,233,.22)':'rgba(151,116,73,.055)';g.lineWidth=side?1:3;
   g.beginPath();g.moveTo(x,y+side*2);g.quadraticCurveTo(x+dx*.53,y+dy*.4+side*2,x+dx,y+dy+side*2);g.stroke();
  }
 }
 return canvas;
}
export class CookieFinale {
 constructor(screen,audio,{onReplay,onExit}){
  Object.assign(this,{audio,onReplay,onExit,destroyed:false,phase:'consent',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
  this.root=document.createElement('section');this.root.id='ending-layer';this.root.className='ending-consent';this.root.setAttribute('aria-label','曲奇故事');screen.append(this.root);
  this.onKey=e=>{if(e.target.closest('input,textarea,[contenteditable="true"],.cookie-creator'))return;if(e.key==='Escape'&&this.card){e.preventDefault();this.closeStory();}if(this.card&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();this.stepStory(e.key==='ArrowLeft'?-1:1);}if(e.code==='KeyM')audio.setMuted(!audio.muted);};this.root.addEventListener('keydown',this.onKey);this.outside=e=>{if(this.card&&!e.target.closest('.archive-card,.field-cookie,.cookie-creator'))this.closeStory(false);};this.root.addEventListener('pointerdown',this.outside);this.showAward();
 }
 showAward(){this.phase='award';this.root.className='ending-trophy';const canvas=document.createElement('canvas');canvas.width=864;canvas.height=576;canvas.className='trophy-zoom-canvas';canvas.setAttribute('aria-label','小厨师站上领奖台，小曲奇递来奖杯');this.root.append(canvas);const g=canvas.getContext('2d');let time=0,last=performance.now(),cheered=false;this.audio.stopMusic();
  const tick=now=>{if(this.destroyed)return;if(!document.hidden)time+=Math.min(.05,(now-last)/1000);last=now;paintAward(g,time,this.reduced);if(time>3.4&&!cheered){cheered=true;this.audio.fanfare();}if(time>=8){this.showConsent();return;}this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);emit('game:award-started');
 }
 showConsent(){if(this.destroyed)return;this.phase='consent';this.root.className='ending-trophy';this.root.replaceChildren();const canvas=document.createElement('canvas');canvas.width=864;canvas.height=576;canvas.className='trophy-zoom-canvas';drawGoldSurface(canvas.getContext('2d'));this.root.append(canvas);const panel=document.createElement('section');panel.className='trophy-consent revealed';panel.setAttribute('aria-label','We use cookies.');panel.innerHTML='<h3 class="consent-copy">We use cookies.</h3><button class="trophy-answer accept-all">ACCEPT ALL</button>';panel.querySelector('button').onclick=()=>this.accept();this.root.append(panel);panel.querySelector('button').focus({preventScroll:true});this.audio.ding();}
 accept(){if(this.phase!=='consent')return;this.phase='rain';this.audio.menuConfirm();this.audio.startMusic('gallery');emit('game:all-cookies-accepted');this.root.className='ending-rain';this.root.replaceChildren();
  this.layout=finalLayout();this.canvas=document.createElement('canvas');this.canvas.width=864;this.canvas.height=576;this.canvas.className='cookie-rain-canvas';this.canvas.setAttribute('aria-hidden','true');this.root.append(this.canvas);this.g=this.canvas.getContext('2d');this.g.imageSmoothingEnabled=false;let elapsed=0,last=performance.now();
  const tick=now=>{if(this.destroyed)return;elapsed+=Math.min(.06,(now-last)/1000);last=now;this.paint(elapsed);if(elapsed>=(this.reduced?.1:3.7)){this.showStories();return;}this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
 }
 paint(elapsed,time=0){const g=this.g;this.paper??=bakingPaper();g.drawImage(this.paper,0,0);for(const p of this.layout){
   if(this.gesture?.id===p.item.id)continue;
   const progress=this.reduced?1:Math.min(1,Math.max(0,(elapsed-p.delay)/1.1));const y=-140+(p.y+140)*progress*progress;g.save();g.translate(p.x,y);g.rotate(p.angle+(time?Math.sin(time*.0008+p.x)*.012:0));const pulse=time?1+Math.sin(time*.0013+p.y)*.009:1;g.scale(pulse,pulse);g.drawImage(p.image,-p.w/2,-p.h/2,p.w,p.h);g.restore();
  }
  if(this.gesture){const p=this.layout.find(p=>p.item.id===this.gesture.id),age=(performance.now()-this.gesture.started)/1000;if(!drawCookieGesture(g,p,age,this.reduced))this.gesture=null;}
 }
 playCookie(item){
  this.audio.ensure();this.audio.menuMove();this.gesture=this.reduced?null:{id:item.id,started:performance.now()};
  this.tray.querySelectorAll('.field-cookie').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cookieId===item.id)));
  this.paint(99,0);
 }

 showStories(){this.phase='stories';this.paint(99);this.audio.startMusic('gallery');const animate=now=>{if(this.destroyed)return;if(!document.hidden&&!this.creator)this.paint(99,this.reduced?0:now);this.frame=requestAnimationFrame(animate);};if(!this.reduced)this.frame=requestAnimationFrame(animate);this.tray=document.createElement('div');this.tray.className='cookie-field';this.tray.setAttribute('aria-label','曲奇游乐桌，点击曲奇玩一玩或展开资料');this.root.append(this.tray);
  for(const p of this.layout){const b=document.createElement('button');b.className='field-cookie';b.dataset.cookieId=p.item.id;b.setAttribute('aria-label',p.item.name);b.setAttribute('aria-pressed','false');b.title=p.item.name;
   if(p.item.creator)b.classList.add('mystery-cookie');
   Object.assign(b.style,{left:(p.x-p.w/2)+'px',top:(p.y-p.h/2)+'px',width:p.w+'px',height:p.h+'px',transform:'rotate('+p.angle+'rad)',maskImage:'url('+p.image.toDataURL()+')',maskSize:'100% 100%',maskRepeat:'no-repeat'});b.onclick=()=>{this.lastCookie=b;if(p.item.creator)this.openCreator();else if(this.card&&this.storyId===p.item.id){this.playCookie(p.item);this.closeStory(false);}else this.openStory(p.item);};this.tray.append(b);}
  this.restart=document.createElement('button');this.restart.className='q-btn finale-restart';this.restart.textContent='↻';this.restart.title='重新开始';this.restart.setAttribute('aria-label','重新开始');this.restart.onclick=()=>{this.destroy();this.onReplay();};this.root.append(this.restart);
  this.sound=document.createElement('button');this.sound.className='q-btn finale-sound';this.updateSound=()=>{this.sound.textContent=this.audio.muted?'♪̸':'♪';this.sound.title=this.audio.muted?'开启音乐':'关闭音乐';this.sound.setAttribute('aria-label',this.sound.title);this.sound.setAttribute('aria-pressed',String(!this.audio.muted));};this.sound.onclick=()=>{this.audio.setMuted(!this.audio.muted);this.audio.startMusic('gallery');};this.updateSound();document.addEventListener('cq-mute',this.updateSound);this.root.append(this.sound);emit('game:open-gallery');
 }
 openStory(item,focusDirection=0){
  this.card?.remove();this.storyId=item.id;this.lastCookie=[...this.tray.children].find(b=>b.dataset.cookieId===item.id)||this.lastCookie;
  this.tray.inert=false;this.restart.inert=false;this.sound.inert=false;this.playCookie(item);
  const gesture=getCookieGesture(item),placement=this.layout.find(p=>p.item.id===item.id);
  const holder=document.createElement('div');holder.className='story-backdrop cookie-note-backdrop';
  holder.innerHTML='<section class="archive-card cookie-note" role="region"><div class="cookie-note-caption"><span>COOKIE QUEST</span><button class="archive-dismiss" aria-label="收起曲奇卡片" title="收起">⌄</button></div><div class="cookie-note-summary"><div class="archive-copy"><small></small><h2></h2></div><button class="cookie-play" type="button"><span class="cookie-play-icon" aria-hidden="true"></span><span class="cookie-play-caption"></span></button></div><div class="cookie-note-tools"><button class="archive-nav archive-prev" aria-label="上一块曲奇" title="上一块">◀</button><button class="archive-info" aria-label="展开实物照片和资料" title="实物照片与资料" aria-expanded="false">i</button><button class="archive-diy" aria-label="用这块曲奇做 DIY" title="DIY">✎</button><button class="archive-nav archive-next" aria-label="下一块曲奇" title="下一块">▶</button></div><div class="archive-details archive-body" hidden></div></section>';
  const panel=holder.querySelector('section');panel.setAttribute('aria-label',item.name+'，曲奇互动卡片');
  panel.style.left=placement.x>432?'14px':'566px';panel.style.top=placement.y>300?'16px':'auto';panel.style.bottom=placement.y>300?'auto':'16px';
  panel.querySelector('.archive-copy small').textContent=item.region;
  panel.querySelector('.archive-copy h2').textContent=item.name;
  const play=panel.querySelector('.cookie-play');play.setAttribute('aria-label',gesture.label);play.title=gesture.label;play.querySelector('.cookie-play-icon').textContent=gesture.icon;play.querySelector('.cookie-play-caption').textContent=gesture.label;play.onclick=()=>this.playCookie(item);
  panel.querySelector('.archive-dismiss').onclick=()=>this.closeStory();
  panel.querySelector('.archive-prev').onclick=()=>this.stepStory(-1);panel.querySelector('.archive-next').onclick=()=>this.stepStory(1);
  panel.querySelector('.archive-diy').onclick=()=>this.openCreator(item.id);
  const body=panel.querySelector('.archive-details'),info=panel.querySelector('.archive-info');
  const setDetails=open=>{this.detailsOpen=open;body.hidden=!open;info.setAttribute('aria-expanded',String(open));info.setAttribute('aria-label',open?'收起实物照片和资料':'展开实物照片和资料');panel.classList.toggle('show-details',open);};
  info.onclick=()=>setDetails(!this.detailsOpen);
  const figure=document.createElement('figure'),photo=PHOTO_CATALOG[item.id];
  if(photo){const img=new Image();img.src=photo.src;img.alt=item.name+'的实物资料照片';img.onerror=()=>{img.hidden=true;figure.querySelector('figcaption').textContent='实物照片暂时无法载入，请查看原始来源。';};figure.append(img);const caption=document.createElement('figcaption');caption.textContent='实物资料照片 · '+photo.credit;figure.append(caption);}
  else{const art=specimen(item),cv=document.createElement('canvas');cv.width=art.width;cv.height=art.height;cv.getContext('2d').drawImage(art,0,0);cv.setAttribute('aria-label','正面造型示意');figure.append(cv);const note=document.createElement('figcaption');note.textContent='造型示意 · 实物照片待补';figure.append(note);}
  const copy=document.createElement('div');copy.className='archive-facts';for(const[tag,text]of[['h3','主要原料'],['p',item.ingredients],['h3','制作与文化'],['p',item.story],['p',item.detail]]){const el=document.createElement(tag);el.textContent=text;copy.append(el);}
  const sources=document.createElement('div');sources.className='archive-sources';const link=(label,url)=>{const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';sources.append(a);};link('资料来源 ↗',item.source);if(photo)link('实物照片原始来源 ↗',photo.sourceUrl);
  if(item.id==='46_dubai_chewy')link('Dessert39 产品配料资料 ↗','https://www.tradekorea.com/product/detail/P846946');
  body.append(figure,copy,sources);setDetails(!!this.detailsOpen);this.root.append(holder);this.card=holder;
  if(focusDirection)panel.querySelector(focusDirection<0?'.archive-prev':'.archive-next').focus({preventScroll:true});
 }

 stepStory(direction){const index=COOKIE_CATALOG.findIndex(item=>item.id===this.storyId);this.openStory(COOKIE_CATALOG[(index+direction+COOKIE_CATALOG.length)%COOKIE_CATALOG.length],direction);}
 openCreator(baseId){if(this.creator)return;if(this.card)this.closeStory();this.tray.inert=true;this.restart.inert=true;this.sound.inert=true;
  this.creator=mountCookieCreator(this.root,{initialBaseId:baseId,state:this.creatorState,onClose:state=>{this.creatorState=state;this.creator=null;this.tray.inert=false;this.restart.inert=false;this.sound.inert=false;(this.lastCookie||this.tray.querySelector('.mystery-cookie'))?.focus({preventScroll:true});}});
 }
 closeStory(restoreFocus=true){this.card?.remove();this.card=null;this.storyId=null;this.detailsOpen=false;this.tray.inert=false;this.restart.inert=false;this.sound.inert=false;this.tray.querySelectorAll('.field-cookie').forEach(b=>b.setAttribute('aria-pressed','false'));if(restoreFocus)this.lastCookie?.focus({preventScroll:true});}
 destroy(){if(this.destroyed)return;this.destroyed=true;document.removeEventListener('cq-mute',this.updateSound);this.creator?.destroy();this.creator=null;clearTimeout(this.reopen);cancelAnimationFrame(this.frame);this.root.removeEventListener('keydown',this.onKey);this.root.removeEventListener('pointerdown',this.outside);this.root.remove();this.audio.stopMusic();}
}
