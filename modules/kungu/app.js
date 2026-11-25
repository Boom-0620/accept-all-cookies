(function(){
'use strict';
const $=id=>document.getElementById(id), canvas=$('scene'),ctx=canvas.getContext('2d'),flow=new KunguFlow();
const abort=new AbortController(),timers=new Set(),art={},config=window.KUNGU_CONFIG||{};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ellipse=(x,y,rx,ry)=>x*x/(rx*rx)+y*y/(ry*ry)<=1;
const on=(el,event,fn,opts={})=>el.addEventListener(event,fn,{...opts,signal:abort.signal});
const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!destroyed)fn();},ms);timers.add(id);return id;};
let opening=0,stageAge=0,previousStage='intro';
let ready=false,destroyed=false,frame=0,lastTime=0,tool=null,pointer={x:235,y:225},held=false,drag=null;
let mute=false,audio=null,hiss=null,completionSent=false,flights=[],oilMarks=[],cookAt=0,cakePos={x:260,y:220},lastFocus=null,keyboardHold=false;
const letters=Array.from({length:95},(_,i)=>({char:'kungu'[i%5],x:20+(i*79)%480,y:35+(i*37)%135,used:0}));
const lake=document.createElement('canvas');lake.width=260;lake.height=150;
function audioReady(){if(mute||destroyed)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio ||=new AC();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function stopSizzle(){if(hiss){try{hiss.stop();hiss.disconnect();}catch(_){}hiss=null;}}
function noise(duration,gainValue){if(mute||!audio||document.hidden)return;try{const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);const source=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();source.buffer=buffer;filter.type='highpass';filter.frequency.value=1200;gain.gain.setValueAtTime(gainValue,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();if(hiss===source)hiss=null;};source.start();return source;}catch(_){}}
function sync(){
 if(previousStage!==flow.stage){stageAge=0;previousStage=flow.stage;}
 // Instructions are available to screen readers and in the optional help dialog.
 const hint={intro:'拖动锅柄，拿起平底锅。',oil:'拿起油刷，在锅底来回刷开。',catch:'按住锅柄左右挥动。滚轮可以轻轻晃锅。',gather:'拿起锅铲，从锅边往中间推。',press:'按住锅铲，在字母上缓缓压实。',fry:'正在煎制。',eat:'点击饼，吃一口。',reveal:'KUNGU',info:'资料照片与来源。'}[flow.stage];
 $('status').textContent=hint;canvas.setAttribute('aria-label',hint);$('module').dataset.stage=flow.stage;$('browser-status').textContent=flow.stage==='info'?'Internet':'就绪';
}
function openingProgress(){return flow.stage==='intro'?clamp((opening-2200)/1200,0,1):1;}
function canInteract(){return ready&&!destroyed&&(flow.stage!=='intro'||opening>=3400);}

function reset(){timers.forEach(clearTimeout);timers.clear();stopSizzle();flow.reset();opening=0;stageAge=0;previousStage='intro';letters.forEach(l=>l.used=0);flights=[];oilMarks=[];tool=null;drag=null;held=false;keyboardHold=false;cakePos={x:260,y:220};$('facts').hidden=true;$('scene-wrap').hidden=false;$('reveal').hidden=true;sync();}
function complete(){if(completionSent||destroyed||flow.stage!=='info'||$('facts').hidden||document.hidden)return;completionSent=true;const detail={projectId:'kungu',outcome:'eaten'};if(window.parent!==window){let origin='*';try{const value=config.parentOrigin||(document.referrer?new URL(document.referrer).origin:'');if(value&&value!=='null')origin=value;}catch(_){}window.parent.postMessage({type:'cookie',...detail},origin);}else window.dispatchEvent(new CustomEvent('cookie',{detail}));}
function showInfo(){if(!flow.inform())return;$('facts').hidden=false;$('scene-wrap').hidden=true;sync();$('facts').focus({preventScroll:true});requestAnimationFrame(()=>{if(!destroyed)complete();});}
function bite(){if(!flow.bite())return;noise(.1,.07);cakePos={x:260,y:220};drag=null;held=false;sync();if(flow.stage==='reveal'){tool=null;$('reveal').hidden=false;later(showInfo,1100);}}
function fry(){tool=null;held=false;drag=null;cookAt=performance.now();hiss=noise(2.3,.035);sync();later(()=>{stopSizzle();if(flow.serve()){cakePos={x:260,y:220};sync();}},2400);}
function panPoint(p){const a=-flow.pan.angle,x=p.x-flow.pan.x,y=p.y-flow.pan.y;return{x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)};}
function panHit(p){const q=panPoint(p);return ellipse(q.x,q.y,113,56)||(q.x>85&&q.x<199&&q.y>5&&q.y<73);}
function movePan(dx,dy){flow.pan.x=clamp(flow.pan.x+dx,115,313);flow.pan.y=clamp(flow.pan.y+dy,160,241);flow.pan.angle=clamp(dx*.004,-.13,.13);}
function catchLetters(dx,dy){const added=flow.catchTravel(Math.hypot(dx,dy*.3));const now=performance.now();for(const p of added){const available=letters.filter(l=>l.used<now);const l=(available.length?available:letters).reduce((a,b)=>Math.abs(a.x-flow.pan.x)<Math.abs(b.x-flow.pan.x)?a:b);l.used=now+700;p.landing=now+260;flights.push({p,x:l.x,y:l.y,start:now});}if(flow.stage==='gather'){tool=null;drag=null;held=false;sync();}}
function applyTool(dx,dy){const p=panPoint(pointer);if(tool==='brush'&&flow.stage==='oil'&&ellipse(p.x,p.y,103,50)){if(Math.hypot(dx,dy)>.3){oilMarks.push({x:p.x,y:p.y,dx:clamp(dx,-22,22),dy:clamp(dy,-14,14)});if(oilMarks.length>160)oilMarks.shift();if(flow.brush(p.x,p.y)){tool=null;held=false;drag=null;sync();}}}else if(tool==='spatula'&&flow.stage==='gather'){if(flow.stir(p.x,p.y,dx,dy)){held=false;drag=null;sync();}}}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*520/r.width,y:(e.clientY-r.top)*370/r.height};}
function chooseTool(name){if((name==='brush'&&flow.stage==='oil')||(name==='spatula'&&['gather','press'].includes(flow.stage))||(name==='pan'&&['intro','catch'].includes(flow.stage))){tool=name;pointer={x:flow.pan.x,y:flow.pan.y};return true;}return false;}
function down(p,id){if(!canInteract())return;audioReady();pointer=p;held=true;
 if(flow.stage==='intro'&&panHit(p)){flow.pick();tool='pan';drag={id,kind:'pan',last:p};sync();return;}
 if(p.y>300){if(p.x>325&&p.x<405&&chooseTool('brush')){pointer=p;drag={id,kind:'tool',last:p};return;}if(p.x>416&&p.x<495&&chooseTool('spatula')){pointer=p;drag={id,kind:'tool',last:p};return;}held=false;return;}
 if(flow.stage==='catch'&&panHit(p)){tool='pan';drag={id,kind:'pan',last:p};return;}
 if(flow.stage==='eat'&&ellipse(p.x-cakePos.x,p.y-cakePos.y,82,62)){drag={id,kind:'bite',last:p,travel:0};return;}
 if((flow.stage==='oil'&&tool==='brush')||(['gather','press'].includes(flow.stage)&&tool==='spatula')){drag={id,kind:'tool',last:p};return;}held=false;
}
function move(p){pointer=p;if(!held||!drag)return;const dx=p.x-drag.last.x,dy=p.y-drag.last.y;drag.last=p;
 if(drag.kind==='pan'){const before={...flow.pan};movePan(dx,dy);if(flow.stage==='catch')catchLetters(flow.pan.x-before.x,flow.pan.y-before.y);}
 else if(drag.kind==='tool')applyTool(dx,dy);
 else if(drag.kind==='bite')drag.travel+=Math.hypot(dx,dy);
}
function release(){held=false;drag=null;if(tool==='pan'||tool==='cake')tool=null;if(flow.stage==='eat')cakePos={x:260,y:220};}
on(canvas,'pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});down(point(e),e.pointerId);canvas.setPointerCapture(e.pointerId);});
on(canvas,'pointermove',e=>{move(point(e));canvas.style.cursor=!canInteract()?'default':flow.stage==='eat'?(ellipse(pointer.x-cakePos.x,pointer.y-cakePos.y,82,62)?'pointer':'default'):held?'grabbing':panHit(pointer)||(flow.stage!=='intro'&&pointer.y>300)||flow.stage==='eat'?'grab':tool?'none':'default';});
on(canvas,'pointerup',e=>{const p=point(e),eatClick=drag?.kind==='bite'&&drag.id===e.pointerId&&drag.travel<10&&ellipse(p.x-cakePos.x,p.y-cakePos.y,82,62);release();if(eatClick)bite();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});on(canvas,'pointercancel',release);on(canvas,'lostpointercapture',release);
on(canvas,'wheel',e=>{if(!['catch','gather'].includes(flow.stage))return;e.preventDefault();flow.pan.angle=clamp(flow.pan.angle+e.deltaY*.001,-.18,.18);if(flow.stage==='gather')for(const p of flow.particles){p.x=clamp(p.x+Math.sin(flow.pan.angle)*1.5,-94,94);}}, {passive:false});
on(canvas,'keydown',e=>{if(!canInteract())return;if(!['1','2','3','Enter',' ','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();audioReady();if(flow.stage==='eat'){if((e.key==='Enter'||e.key===' ')&&!e.repeat)bite();return;}if(e.key==='Escape'){release();tool=null;return;}if(e.key==='Enter'){if(flow.stage==='intro'){flow.pick();sync();}chooseTool(flow.stage==='oil'?'brush':flow.stage==='catch'?'pan':'spatula');return;}if(['1','2','3'].includes(e.key)){chooseTool({'1':'pan','2':'brush','3':'spatula'}[e.key]);return;}if(e.key===' '){keyboardHold=true;held=true;return;}
 const dx=e.key==='ArrowLeft'?-12:e.key==='ArrowRight'?12:0,dy=e.key==='ArrowUp'?-9:e.key==='ArrowDown'?9:0;
 if(tool==='pan'&&flow.stage==='catch'){const old={...flow.pan};movePan(dx,dy);catchLetters(flow.pan.x-old.x,flow.pan.y-old.y);return;}pointer={x:clamp(pointer.x+dx,0,520),y:clamp(pointer.y+dy,0,300)};if(keyboardHold)applyTool(dx,dy);
});on(canvas,'keyup',e=>{if(e.key===' '){keyboardHold=false;held=false;}});on(canvas,'blur',()=>{release();keyboardHold=false;});
on($('home'),'click',reset);on($('again'),'click',()=>{reset();canvas.focus({preventScroll:true});$('module').scrollIntoView({block:'start',behavior:'instant'});});
on($('sound'),'click',()=>{mute=!mute;$('sound').textContent=mute?'声音：关':'声音：开';$('sound').setAttribute('aria-pressed',String(mute));if(mute)stopSizzle();else audioReady();});
on($('help'),'click',()=>{release();lastFocus=document.activeElement;$('instructions').showModal();$('help').setAttribute('aria-expanded','true');});
on($('close-help'),'click',()=>$('instructions').close());on($('help-ok'),'click',()=>$('instructions').close());on($('instructions'),'close',()=>{$('help').setAttribute('aria-expanded','false');lastFocus?.focus({preventScroll:true});});
function load(name,src){return new Promise(resolve=>{const im=new Image();im.onload=()=>{art[name]=im;resolve();};im.onerror=()=>resolve();im.src=window.KUNGU_ASSETS?.[name]||src;});}
function glyph(char,x,y,size,angle=0,alpha=1){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.fillStyle='#0e160d';ctx.font='bold italic '+size+'px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(char,0,0);ctx.restore();}
function label(value,x,y,size=12,color='#39432b'){ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=size+'px "Songti SC", "SimSun", serif';ctx.fillText(value,x,y);}
function cake(index,x,y,scale=1){ctx.drawImage(art['cake'+index],x-80*scale,y-60*scale,160*scale,120*scale);}
function paintPan(now){ctx.save();const arrival=openingProgress(),offset=reduced?0:390*Math.pow(1-arrival,3);ctx.globalAlpha=arrival;ctx.translate(flow.pan.x+offset,flow.pan.y);ctx.rotate(flow.pan.angle);ctx.drawImage(art.pan,-120,-60,322,138);
 ctx.save();ctx.beginPath();ctx.ellipse(0,0,97,44,0,0,Math.PI*2);ctx.clip();if(flow.stage!=='intro'){
 ctx.fillStyle='rgba(143,146,52,'+(flow.stage==='oil'?Math.min(.38,flow.oil.size/125):.42)+')';ctx.fillRect(-100,-48,200,96);ctx.strokeStyle='#b7ac4c6e';ctx.lineWidth=14;ctx.lineCap='round';for(const m of oilMarks){ctx.beginPath();ctx.moveTo(m.x-m.dx,m.y-m.dy);ctx.lineTo(m.x,m.y);ctx.stroke();}}
 ctx.restore();
 if(flow.stage==='gather'){ctx.strokeStyle='#e5dfb18a';ctx.setLineDash([3,5]);ctx.beginPath();ctx.ellipse(0,0,57,25,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 if(flow.stage==='press'){ctx.globalAlpha=flow.pressure*.96;cake(0,0,0,.8);ctx.globalAlpha=1;}
 if(flow.stage==='fry'){cake(0,0,0,.8);for(let i=0;i<5;i++){const t=((now-cookAt)*.00065+i*.2)%1;ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle='#f3efd3';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(-58+i*29,-18-t*36,1.5+t*3,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
 else for(const p of flow.particles){if(p.landing>now)continue;glyph(p.char,p.x,p.y-((p.index%3)*.7),12-p.press*6,p.angle*(1-p.press),1-p.press*.95);}
 ctx.restore();
 flights=flights.filter(f=>{const t=clamp((now-f.start)/260,0,1);if(t>=1)return false;const endx=flow.pan.x+f.p.x,endy=flow.pan.y+f.p.y;glyph(f.p.char,f.x+(endx-f.x)*t,f.y+(endy-f.y)*t,20-8*t,f.p.angle*t);return true;});
}
function shelf(now){
 if(flow.stage==='intro'||['eat','reveal','info'].includes(flow.stage))return;
 ctx.save();ctx.globalAlpha=flow.stage==='oil'?clamp(stageAge/320,0,1):1;
 ctx.fillStyle='#d7d3ba';ctx.fillRect(0,300,520,70);ctx.fillStyle='#8b8e70';ctx.fillRect(0,300,520,1);
 ctx.fillStyle='#7e8342';ctx.beginPath();ctx.ellipse(277,337,18,10,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ece7d0';ctx.lineWidth=3;ctx.stroke();
 const brushActive=flow.stage==='oil'&&tool!=='brush',spatulaActive=['gather','press'].includes(flow.stage)&&tool!=='spatula';
 const lift=reduced?0:Math.sin(now*.004)*2;
 if(tool!=='brush')ctx.drawImage(art.brush,348,305+(brushActive?lift:0),23,52);
 if(tool!=='spatula')ctx.drawImage(art.spatula,438,304+(spatulaActive?lift:0),29,54);
 if(brushActive||spatulaActive){ctx.fillStyle='#515e38';ctx.beginPath();ctx.arc(brushActive?360:453,363,2,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function gestureHints(now){
 if(held||tool||reduced||stageAge>6500)return;
 ctx.save();ctx.strokeStyle='#f0ebcf';ctx.lineWidth=1.8;ctx.globalAlpha=.4+.15*Math.sin(now*.003);const x=flow.pan.x,y=flow.pan.y;
 if(flow.stage==='catch'){for(const dir of [-1,1]){const px=x+dir*74;ctx.beginPath();ctx.moveTo(px-dir*15,y);ctx.lineTo(px,y);ctx.lineTo(px-dir*5,y-4);ctx.moveTo(px,y);ctx.lineTo(px-dir*5,y+4);ctx.stroke();}}
 ctx.restore();
}

function draw(now){if(destroyed||document.hidden)return;const dt=Math.min(40,lastTime?now-lastTime:16);lastTime=now;if(flow.stage==='intro')opening+=dt;stageAge+=dt;ctx.clearRect(0,0,520,370);ctx.imageSmoothingEnabled=false;ctx.drawImage(lake,0,0,520,370);
 if(!held)flow.pan.angle*=.94;
 if(['intro','oil','catch'].includes(flow.stage)){for(let i=0;i<letters.length;i++){const l=letters[i];const arrival=flow.stage==='intro'?clamp((opening-850-i*12)/450,0,1):1;if(l.used>now||arrival===0)continue;const t=reduced?0:now*.00024;l.x=20+((i*79+Math.sin(t+i)*20+480)%480);l.y=34+(i*37)%137+Math.sin(t*2+i)*7;glyph(l.char,l.x,l.y,18+i%4,0,arrival);}}
 if(['eat','reveal','info'].includes(flow.stage)){ctx.drawImage(art.plate,125,157,270,128);if(flow.stage==='eat'){const hover=ellipse(pointer.x-cakePos.x,pointer.y-cakePos.y,82,62);cake(flow.bites,cakePos.x,cakePos.y,hover?.88:.85);}}
 else if(openingProgress()>0)paintPan(now);
 shelf(now);gestureHints(now);
 if(tool==='brush'||tool==='spatula'){const name=tool,scale=name==='brush'?.8:.7,w=name==='brush'?46:68,h=name==='brush'?108:126;ctx.save();ctx.translate(pointer.x,pointer.y);ctx.rotate(-.35);ctx.drawImage(art[name],-w*scale/2,-h*scale+8,w*scale,h*scale);ctx.restore();if(flow.stage==='press'&&held){const p=panPoint(pointer);if(flow.press(p.x,p.y,dt))fry();}}
 if(flow.stage==='info')complete();frame=requestAnimationFrame(draw);
}
function destroy(){if(destroyed)return;destroyed=true;abort.abort();timers.forEach(clearTimeout);timers.clear();cancelAnimationFrame(frame);stopSizzle();audio?.close().catch(()=>{});}
on(document,'visibilitychange',()=>{release();if(document.hidden){stopSizzle();audio?.suspend().catch(()=>{});cancelAnimationFrame(frame);frame=0;}else if(ready&&!destroyed){lastTime=0;frame=requestAnimationFrame(draw);}});
on(window,'pagehide',e=>{if(!e.persisted)destroy();else{stopSizzle();cancelAnimationFrame(frame);frame=0;}});on(window,'pageshow',e=>{if(e.persisted&&ready&&!destroyed&&!frame){lastTime=0;frame=requestAnimationFrame(draw);}});
window.KunguModule=Object.freeze({reset,destroy,getState:()=>({stage:flow.stage,bites:flow.bites,letters:flow.particles.length,completionSent})});
Promise.all([load('lake','assets/lake-scan.webp'),load('pan','assets/pan.svg'),load('plate','assets/plate.svg'),load('brush','assets/brush.svg'),load('spatula','assets/spatula.svg'),...[0,1,2,3].map(i=>load('cake'+i,'assets/cake-'+i+'.svg'))]).then(()=>{if(destroyed)return;if(!art.pan||!art.plate||!art.brush||!art.spatula||!art.cake0||!art.cake1||!art.cake2){$('status').textContent='素材未能载入。请刷新页面。';return;}const c=lake.getContext('2d');if(art.lake)c.drawImage(art.lake,0,0,260,150);else{c.fillStyle='#8ca9b4';c.fillRect(0,0,260,150);}ready=true;opening=0;sync();frame=requestAnimationFrame(draw);});
})();
