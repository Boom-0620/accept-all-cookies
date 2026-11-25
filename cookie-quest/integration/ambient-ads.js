import { cookieSprite } from '../ending-art.js';
import { COOKIE_CATALOG } from '../cookie-catalog.js';

// Background-only mini adverts: no input targets, sound, focus or story events.
export function mountAmbientAds(screen) {
 const layer=document.createElement('div');layer.className='ambient-ads';layer.setAttribute('aria-hidden','true');layer.inert=true;
 const ad=(name,cls,html)=>{
  const el=document.createElement('div');el.className='ambient-ad '+cls;
  el.innerHTML=`<div class="ambient-caption"><i></i><span>${name}</span><small>GIF</small></div>${html}`;
  layer.append(el);return el;
 };
 const express=ad('COOKIE EXPRESS','ambient-express','<div class="ambient-belt"><canvas width="176" height="18"></canvas></div>');
 ad('fresh.htm','ambient-fresh','<div class="ambient-marquee"><div><span>FRESH COOKIES · 24H · </span><span>FRESH COOKIES · 24H · </span></div></div>');
 const milk=ad('milk.gif','ambient-milk','<div class="ambient-milk-body"><strong>MILK<br>BREAK</strong><div class="ambient-mug"><i></i><i></i><i></i><span></span></div><small>one more bite.</small></div>');
 screen.append(layer);
 const canvas=express.querySelector('canvas'),g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 const ids=['02_chocolate_chunk','01_oreo','36_macaron','11_butter','32_dasik','13_marie'];
 const sprites=ids.map(id=>cookieSprite(COOKIE_CATALOG.find(c=>c.id===id)));
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,last=0,elapsed=0,dead=false;
 function draw(){
  g.fillStyle='#f1d788';g.fillRect(0,0,176,18);
  g.fillStyle='#7d6a3e';g.fillRect(0,15,176,3);
  g.fillStyle='#d4bd7e';for(let i=-1;i<24;i++)g.fillRect(Math.round(i*8+(elapsed*12)%8),16,4,1);
  for(let i=0;i<7;i++){
   const x=((i*30+elapsed*12)%210)-18;
   const sprite=sprites[i%sprites.length];
   const scale=14/Math.max(sprite.width,sprite.height),w=sprite.width*scale,h=sprite.height*scale;
   g.drawImage(sprite,Math.round(x),Math.round(14-h),w,h);
  }
 }
 function tick(now){
  frame=0;if(dead||document.hidden||motion.matches)return;
  // 24 fps is enough for this tiny pixel GIF; throttle paint while keeping time continuous.
  if(!last)last=now;
  if(now-last>=1000/24){elapsed+=Math.min((now-last)/1000,.1);last=now;draw();}
  frame=requestAnimationFrame(tick);
 }
 function sync(){
  cancelAnimationFrame(frame);frame=0;last=0;
  layer.classList.toggle('ambient-paused',document.hidden||motion.matches);
  if(!dead&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(tick);
 }
 document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);draw();sync();
 return {element:layer,milk,destroy(){dead=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);layer.remove();}};
}
