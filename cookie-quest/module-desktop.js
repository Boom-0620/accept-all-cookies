// Host-owned adapters. Independent delivery projects are never rewritten.
import { mountBandBadge, mountBandStage, fitBandFrame } from './band-ui.js';
import { mountWindowCover } from './integration/window-covers.js';
import { mountDesktopMotion } from './integration/desktop-motion.js';
import { createBandJingle } from './integration/band-jingle.js';
import { mountCookieDrizzle } from './integration/cookie-drizzle.js';
import { mountAmbientAds } from './integration/ambient-ads.js';
import { mountDesktopWanderers } from './integration/desktop-wanderers.js';
const aliases={'desert-disco':'dubai-disco','cookie-orchestra':'cookie-band'};
const scripts=new Map();
function loadScript(src){if(!scripts.has(src))scripts.set(src,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{scripts.delete(src);s.remove();reject(Error('网络加载失败，请重试'));};document.head.append(s);}));return scripts.get(src);}
export class ModuleDesktop {
 constructor(desktop,{onReady,audio}){
  Object.assign(this,{desktop,wm:desktop.wm,onReady,audio,records:new Map(),completed:new Set(),log:[],timers:new Set(),active:null,dead:false,ready:false,pointerBusy:false,quietUntil:0});
  this.review=true;
  if(this.review){
   document.body.classList.add('module-layout-review','visual-v2');
   if(!document.getElementById('window-review-css')){const css=document.createElement('link');css.id='window-review-css';css.rel='stylesheet';css.href='./styles/window-review.css';document.head.append(css);}
   const refined=document.createElement('link');refined.rel='stylesheet';refined.href='./styles/visual-v2.css';document.head.append(refined);
   this.wordmark=document.createElement('div');this.wordmark.className='invasion-wordmark';this.wordmark.textContent='ACCEPT ALL\nCOOKIES';document.getElementById('screen').append(this.wordmark);
  }
  this.drizzle=mountCookieDrizzle(document.getElementById('screen'));
  this.ambient=mountAmbientAds(document.getElementById('screen'));
  this.wanderers=mountDesktopWanderers(document.getElementById('screen'),{milkStation:this.ambient.milk,interaction:()=>this.interactionState(),onReact:a=>{if(a.reaction==='music')this.playCharacterMusic();},isMusicPlaying:()=>!!this.characterTune&&!this.characterTune.getState().paused});
  this.previousFocus=this.wm.onFocus;this.wm.onFocus=win=>{this.previousFocus?.(win);this.activate([...this.records.values()].find(r=>r.win===win)?.id||null);};
  this.message=e=>this.handleMessage(e);window.addEventListener('message',this.message);
  this.cookie=e=>this.receive(e);document.addEventListener('cookie',this.cookie);
  this.touch=e=>{const r=[...this.records.values()].find(r=>r.viewport&&e.composedPath().includes(r.viewport));if(r)this.touchRecord(r);};
  this.down=e=>{this.pointerBusy=true;this.touch(e);};this.up=()=>{this.pointerBusy=false;this.quietUntil=Math.max(this.quietUntil,performance.now()+500);this.checkReady();};
  document.addEventListener('pointerdown',this.down,true);for(const t of ['pointerup','pointercancel'])document.addEventListener(t,this.up,true);
  window.addEventListener('blur',this.up);
  for(const t of ['input','keydown','wheel'])document.addEventListener(t,this.touch,{capture:true,passive:true});
  this.visibility=()=>{if(document.hidden){this.up();this.stopCharacterMusic();}this.syncActivity();};document.addEventListener('visibilitychange',this.visibility);
  this.mute=()=>{if(this.audio.muted)this.stopCharacterMusic();this.syncActivity();};document.addEventListener('cq-mute',this.mute);
  this.overlay=document.createElement('div');this.overlay.id='module-overlays';document.body.append(this.overlay);
  this.resize=()=>this.clipOverlay();window.addEventListener('resize',this.resize);this.clipOverlay();
  document.body.classList.add('modules-active');this.audio.stopMusic();this.audio.appExit();this.enterTransition();this.loaded=this.load();
 }
 enterTransition(){const screen=document.getElementById('screen');this.entry=document.createElement('div');this.entry.className='module-entry';this.entry.setAttribute('aria-hidden','true');this.entry.innerHTML='<div class="module-exit-outline"><div class="tbar">COOKIE QUEST.exe</div></div>';screen.append(this.entry);this.later(850,()=>{this.entry?.remove();this.entry=null;});}
 later(ms,fn){const t=setTimeout(()=>{this.timers.delete(t);if(!this.dead)fn();},ms);this.timers.add(t);return t;}
 async load(){try{const response=await fetch(this.review?'./integration/window-review.json':'./integration/module-manifest.json');if(!response.ok)throw Error('模块清单未找到');this.manifest=await response.json();if(this.dead)return;
  const ordered=this.review?[...this.manifest].sort((a,b)=>a.z-b.z):this.manifest;
  for(const spec of ordered){const r={...spec,busy:false,expanded:false};this.records.set(r.id,r);this.create(r,false);}this.wm.focus(this.records.get('kungu').win);this.started=true;
 }catch(e){if(!this.dead){const w=this.wm.create({title:'接受所有 Cookie · 启动提示',w:450,h:180,x:200,y:180});w.body.textContent='请用「启动整合预览.command」打开完整版本。'+e.message;}}}
 clipOverlay(){const b=document.getElementById('screen').getBoundingClientRect();this.overlay.style.clipPath=`inset(${b.top}px ${Math.max(0,innerWidth-b.right)}px ${Math.max(0,innerHeight-b.bottom)}px ${b.left}px)`;}
 create(r,active=false){if(this.dead||r.win)return;if(r.kind==='overlay'){this.createDoor(r);return;}
  const win=this.wm.create({title:r.title,icon:'cookie',x:r.x,y:r.y,w:r.w,h:r.h,active,onClose:()=>this.closeRecord(r)});r.win=win;win.shortTitle=({'timtam':'Tim Tam','gingerbread':'姜饼人','oreo':'OREO','thai-flower':'花形酥饼','octopus-senbei':'仙贝工场','khapse':'KHAPSE','kungu':'吃字母','fortune-cookie':'幸运饼干','dubai-disco':'DISCO'})[r.id];
  win.el.dataset.projectId=r.id;win.el.classList.add('module-window','module-'+r.kind);win.body.classList.add('module-body');win.onMinimize=()=>{if(this.active===r.id)this.activate(null);};
  if(this.review)win.el.classList.add('review-window','chrome-'+(r.chrome||r.kind));
  const viewport=document.createElement('div');viewport.className='module-viewport';win.body.append(viewport);r.viewport=viewport;
  if(r.kind==='missing'){viewport.innerHTML='<div class="fortune-placeholder"><b>FORTUNE COOKIE</b><p>幸运饼干</p><small>开发占位 · 等待独立模块接入</small></div>';return;}
  if(this.review&&r.id==='khapse'){
   const poster=document.createElement('button');poster.className='tower-poster';poster.setAttribute('aria-label','进入藏历新年饼塔');poster.innerHTML='<span class="tower-masthead">KHAPSE<small>藏历新年 · ལོ་གསར།</small></span><span class="tower-links">Play　|　How to　|　About</span><span class="tower-picture"><img src="/accept-all-cookies/modules/khapse/dist/assets/story-v3/tower.webp" alt="十六层金黄卡塞高塔"></span><span class="tower-foot">十六层新年祝愿　▸</span>';poster.onclick=()=>this.enterTower(r);win.body.append(poster);r.poster=poster;
  }
  if(false&&r.id==='octopus-senbei'){
   const peek=new Image();peek.className='preview-octopus';peek.src='/accept-all-cookies/modules/octopus-senbei/assets/octopus-sprite.webp';peek.alt='';win.el.append(peek);r.peek=peek;
  }
  if(['kungu','gingerbread','fortune-cookie','thai-flower','octopus-senbei'].includes(r.id)){
   r.cover=mountWindowCover({id:r.id,container:win.body,available:r.kind!=='missing',onEnter:()=>this.openCover(r)});win.el.classList.add('has-cover');
  }
  r.motion=mountDesktopMotion({id:r.id,container:win.body});
  const shield=document.createElement('button');shield.className='module-focus-shield';shield.setAttribute('aria-label','激活 '+r.title);shield.onclick=()=>{this.wm.focus(win);if(r.kind==='preview'&&!r.expanded)this.expand(r);else if(r.poster)this.enterTower(r);};win.body.append(shield);r.shield=shield;
  if(r.kind==='preview'&&!r.cover){const enter=document.createElement('button');enter.className='q-btn module-enter';enter.textContent='进入网页 ↗';enter.onclick=()=>{this.wm.focus(win);this.expand(r);};win.body.append(enter);r.enter=enter;}
  if(!r.cover&&!r.poster&&r.id!=='dubai-disco')this.mount(r);this.syncActivity();this.wm.notify();
 }
 openCover(r){if(!r.cover||!r.win)return;if(r.id==='gingerbread')r.launchOnLoad=true;this.mount(r);this.wm.focus(r.win);r.cover.destroy();r.cover=null;r.win.el.classList.remove('has-cover');
  if(r.kind==='preview'){this.expand(r);}
  if(r.id==='kungu'){Object.assign(r.win.el.style,{left:'315px',top:'217px',width:'300px',height:'304px'});this.fit(r);}
  if(r.id==='fortune-cookie'){Object.assign(r.win.el.style,{left:'12px',top:'252px',width:'278px',height:'288px'});this.fit(r);}
  this.syncActivity();if(r.id==='gingerbread')this.post(r,'launch');
 }
 showLoading(r){
  r.loadNotice?.remove();const box=document.createElement('div');box.className='module-load-notice';
  Object.assign(box.style,{position:'absolute',inset:'0',zIndex:'30',display:'grid',placeContent:'center',gap:'8px',textAlign:'center',background:'#f5edd8',color:'#40352b',font:'12px sans-serif'});
  const label=document.createElement('span');label.textContent='正在打开…';box.append(label);r.viewport.append(box);r.loadNotice=box;
  this.later(15000,()=>{if(r.loadNotice!==box)return;label.textContent='网络较慢，仍在加载';const retry=document.createElement('button');retry.className='q-btn';retry.textContent='重新加载';retry.onclick=()=>{if(r.mounting){label.textContent='正在连接，请稍候…';return;}r.frame?.remove();r.frame=null;this.mount(r);};box.append(retry);});
 }
 finishLoading(r){r.loadNotice?.remove();r.loadNotice=null;r.sentActive=null;this.fit(r);this.syncActivity();if(r.launchOnLoad){r.launchOnLoad=false;this.post(r,'launch');}}
 async mount(r){if(this.dead||r.frame||r.app||r.mounting)return;r.mounting=true;this.showLoading(r);try{
  if(r.id==='octopus-senbei'){await loadScript('/accept-all-cookies/modules/octopus-senbei/core.js');await loadScript('/accept-all-cookies/modules/octopus-senbei/module.js');if(this.dead||!r.win)return;
   r.app=window.OctopusSenbei.mount({container:r.viewport,desktopRoot:document.getElementById('screen'),overlayRoot:this.overlay,assetBase:'/accept-all-cookies/modules/octopus-senbei/',overlayZIndex:4500,onCookie:d=>this.emit(r,d.outcome),onClose:()=>r.win&&this.wm.close(r.win),onStateChange:()=>this.checkReady(),onIconNudge:n=>document.querySelector('.d-icon')?.classList.toggle('cookie-nudged',n)});
   const css=document.createElement('style');css.textContent='.titlebar{display:none!important}.window{height:100%!important;min-height:0!important;border:0!important;padding:0!important;box-shadow:none!important}.intro{width:100%!important;margin:0!important}.intro-movie{height:320px!important}.intro-controls{height:52px}.viewport{min-height:0}';r.app.element.shadowRoot.append(css);
   if(this.review){const preview=document.createElement('style');preview.textContent='.intro .intro-content{display:none!important}.intro .main-content[hidden]{display:flex!important}.intro .menu,.intro .toolbar{display:none!important}.intro .banner{height:94px;min-height:0}.intro .banner h1{font-size:36px}.intro .banner p{font-size:14px}.intro .welcome{padding:4px 12px}.intro .navigation{padding:5px 12px}.intro .chapter{padding:10px}.intro .chapter h2{font-size:18px}.intro .ocean{height:230px}.intro .viewport{overflow:hidden}.intro .statusbar{display:none}';r.app.element.shadowRoot.append(preview);}
   this.finishLoading(r);if(r.expanded)r.app?.start();return;}
  const url=new URL('/accept-all-cookies/modules/'+r.id+'/'+r.entry,location.href);url.searchParams.set('cq-host','1');url.searchParams.set('parentOrigin',location.origin);
  if(this.review)url.searchParams.set('layout','review');
  const iframe=document.createElement('iframe');iframe.title=r.title;iframe.allow='autoplay; camera';iframe.src=url.href;iframe.dataset.projectId=r.id;r.frame=iframe;r.viewport.append(iframe);
  iframe.addEventListener('load',()=>{if(this.dead||r.frame!==iframe)return;this.finishLoading(r);});this.fit(r);
 }catch(e){r.loadNotice?.remove();r.loadNotice=null;const retry=document.createElement('button');retry.className='q-btn';retry.textContent='加载失败，点击重试';retry.onclick=()=>{retry.remove();this.mount(r);};r.viewport.append(retry);r.error=e.message;}finally{r.mounting=false;}}
 createDoor(r){r.door=mountBandBadge(document.getElementById('window-layer'),{onPlay:()=>this.openBand(r)});}
 openBand(r){this.activate(r.id);r.door.hidden=true;if(!r.frame){r.bandReady=false;r.bandStarted=false;r.bandFinished=false;r.jingle=createBandJingle();r.jingle.sync({active:true,muted:this.audio.muted});r.jingle.start();const ui=mountBandStage(document.getElementById('screen'),{onClose:()=>this.closeRecord(r),onResume:()=>this.activate(r.id)});r.viewport=ui.viewport;r.bandControls=ui.close;this.mount(r);}}
 fit(r){if(r.id==='cookie-band'){if(r.frame)fitBandFrame(r.frame);return;}if(!r.win)return;
  const width=r.viewport.clientWidth,height=r.viewport.clientHeight;if(!width)return;const scale=width/r.nativeWidth;
  if(r.frame)Object.assign(r.frame.style,{width:r.nativeWidth+'px',height:Math.ceil(height/scale)+'px',transform:`scale(${scale})`});
  if(r.id==='khapse'&&r.expanded)this.post(r,'khapse-reader',{expanded:true});
  if(r.app)Object.assign(r.app.element.style,{width:r.nativeWidth+'px',height:Math.ceil(height/scale)+'px',transform:`scale(${scale})`,transformOrigin:'0 0'});
 }
 expand(r){if(r.expanded||!r.win)return;r.expanded=true;r.win.el.classList.add('module-expanded');r.enter?.remove();r.enter=null;r.peek?.remove();const [x,y,w,h]=r.id==='thai-flower'?[194,35,590,492]:[146,50,650,480];Object.assign(r.win.el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});this.fit(r);if(r.contentHeight)this.fitContent(r);r.app?.start();this.syncActivity();}
 fitContent(r){if(!r.win||!r.contentHeight)return;const el=r.win.el,extraH=el.offsetHeight-r.viewport.clientHeight,extraW=el.offsetWidth-r.viewport.clientWidth;
  let width=r.viewport.clientWidth,height=r.contentHeight*width/r.nativeWidth;
  const maxHeight=505-extraH;if(height>maxHeight){width=Math.floor(width*maxHeight/height);el.style.width=(width+extraW)+'px';height=r.contentHeight*width/r.nativeWidth;}
  el.style.height=Math.ceil(height+extraH)+'px';el.style.top=Math.min(el.offsetTop,540-el.offsetHeight)+'px';this.fit(r);
 }
 enterTower(r){if(!r.win)return;this.mount(r);this.wm.focus(r.win);r.poster?.remove();r.poster=null;r.expanded=true;r.nativeWidth=390;r.win.el.classList.add('module-expanded');Object.assign(r.win.el.style,{left:'674px',top:'12px',width:'178px',height:'520px'});this.fitTower(r);this.syncActivity();}
 fitTower(r){if(!r.win||!r.expanded)return;const el=r.win.el,extraH=el.offsetHeight-r.viewport.clientHeight,extraW=el.offsetWidth-r.viewport.clientWidth;
  // Fit the whole original portrait page: the tower and lower controls stay visible.
  const natural=r.naturalHeight||1260,reference=Math.max(1260,natural),width=Math.min(178,Math.floor((520-extraH-2)*390/reference)+extraW);
  const height=Math.min(520,Math.ceil(natural*(width-extraW)/390+extraH)+2);
  Object.assign(el.style,{width:width+'px',height:height+'px'});el.style.left=Math.min(el.offsetLeft,854-width)+'px';this.fit(r);
 }
 naturalSize(r,natural){r.naturalHeight=natural;if(r.poster||!r.win)return;if(natural>70&&natural<2200){const extra=r.win.el.offsetHeight-r.viewport.clientHeight,h=Math.min(425,Math.max(88,Math.ceil(natural*r.viewport.clientWidth/r.nativeWidth+extra)));r.win.el.style.height=h+'px';r.win.el.style.top=Math.min(r.win.el.offsetTop,535-h)+'px';this.fit(r);}}
 activate(id){if(this.dead)return;if(id==='dubai-disco'){const r=this.records.get(id);if(r)this.mount(r);}if(id&&this.characterTune)this.stopCharacterMusic(false);if(id!==this.active){const previous=this.records.get(this.active);if(previous)previous.busy=false;this.active=id;this.quietUntil=Math.max(this.quietUntil,performance.now()+600);}this.syncActivity();this.checkReady();}
 playCharacterMusic(){
  if(this.dead||this.audio.muted)return;
  if(this.characterTune){this.stopCharacterMusic();return;}
  this.characterReturn=this.active;this.active=null;this.syncActivity();
  const tune=createBandJingle({duration:5.6,maxVolume:.36,onFinish:()=>{if(this.characterTune===tune)this.stopCharacterMusic();}});
  this.characterTune=tune;tune.sync({active:true,muted:false});
  tune.start().then(()=>{if(this.characterTune===tune&&tune.getState().paused)this.stopCharacterMusic();this.wanderers?.refresh();});
 }
 stopCharacterMusic(restore=true){
  if(!this.characterTune)return;
  const tune=this.characterTune,previous=this.characterReturn;this.characterTune=null;this.characterReturn=null;tune.destroy();this.wanderers?.refresh();
  if(restore&&!this.dead){const r=this.records.get(previous);if(r&&(r.win||r.frame))this.activate(previous);else this.syncActivity();}
 }
 syncActivity(){document.body.classList.toggle('cq-desktop-hidden',document.hidden);for(const r of this.records.values()){
  if(r.id==='cookie-band'){const visibility=this.active==='fortune-cookie'?'hidden':'';if(r.door)r.door.style.visibility=visibility;if(r.viewport)r.viewport.style.visibility=visibility;}
  const selected=r.id===this.active&&!document.hidden&&(r.win?!r.win.minimized:!!r.frame),active=selected&&!r.cover&&!r.poster&&!r.retiring;r.isActive=active;if(!active)r.disposeEffect?.();if(r.shield)r.shield.hidden=selected||!!r.cover||!!r.poster;if(r.win)r.win.el.classList.toggle('module-idle',!selected);
  r.cover?.sync({hidden:document.hidden||!!r.win?.minimized});
  r.motion?.sync({active:active||!!r.cover,hidden:document.hidden||!!r.win?.minimized});r.jingle?.sync({active,muted:this.audio.muted});
  if(r.sentActive===active&&r.sentMuted===this.audio.muted)continue;r.sentActive=active;r.sentMuted=this.audio.muted;
  if(r.app){r.app[active?'resume':'pause']();if(r.app.overlay)r.app.overlay.style.visibility=active?'visible':'hidden';}
  this.post(r,'active',{active});this.post(r,'mute',{muted:this.audio.muted});
  if(r.id==='timtam')this.postNative(r,{channel:'cookie:timtam',action:'setActive',active});
  if(r.id==='dubai-disco')this.postNative(r,{type:'cookie-module:'+(active?'activate':'deactivate'),moduleId:'desert-disco'});
  if(r.id==='cookie-band'&&r.bandReady){if(active&&!r.bandFinished&&!r.bandStarted){r.bandStarted=true;this.postNative(r,{type:'cookie-orchestra:replay'});}else this.postNative(r,{type:'cookie-orchestra:'+(active&&!r.bandFinished?'play':'pause')});}
 }const thai=this.records.get('thai-flower');if(thai?.isActive&&thai.expanded&&!this.dead)this.audio.startMusic('thai');else if(this.audio.musicTheme==='thai')this.audio.stopMusic();}
 post(r,type,detail={}){r.frame?.contentWindow?.postMessage({source:'cookie-desktop',projectId:r.id,type,...detail},location.origin);}
 postNative(r,detail){r.frame?.contentWindow?.postMessage(detail,location.origin);}
 handleMessage(e){if(this.dead||e.origin!==location.origin)return;const r=[...this.records.values()].find(r=>r.frame?.contentWindow===e.source);if(!r)return;const m=e.data;if(!m||typeof m!=='object')return;
  if(m.source==='cookie-host-adapter'&&m.projectId===r.id){
   if(m.type==='pointer'&&Number.isFinite(m.u)&&Number.isFinite(m.v)&&r.frame){const b=r.frame.getBoundingClientRect();this.wanderers.pointerClient(b.x+Math.max(0,Math.min(1,m.u))*b.width,b.y+Math.max(0,Math.min(1,m.v))*b.height);}
   if(m.type==='engagement')this.touchRecord(r);
   if(m.type==='ready'){this.finishLoading(r);}
   if(m.type==='content-size'&&!r.cover&&r.win&&['dubai-disco','oreo','thai-flower'].includes(r.id)&&Number(m.height)>30&&Number(m.height)<4000){r.contentHeight=Number(m.height);this.fitContent(r);}
   if(m.type==='natural-size'&&this.review&&r.win&&['khapse','thai-flower','gingerbread','oreo'].includes(r.id)){
    const height=Number(m.height);
    if(r.id==='khapse'&&r.expanded&&Number.isFinite(height)&&height>70&&height<2200){r.naturalHeight=height;this.fitTower(r);}
    else if(!r.expanded)this.naturalSize(r,height);
   }
   if(m.type==='expand'&&r.id==='timtam'&&r.win){r.win.el.style.height='260px';this.fit(r);}
   if(m.type==='activity'){r.busy=!!m.busy;if(m.busy)this.touchRecord(r);this.quietUntil=Math.max(this.quietUntil,performance.now()+700);this.checkReady();}
   if(m.type==='operation'){r.operating=!!m.busy;this.checkReady();}
   if(m.type==='cookie'&&m.detail&&(!m.detail.projectId||(aliases[m.detail.projectId]||m.detail.projectId)===r.id))this.emit(r,m.detail.outcome);
   if(m.type==='close'&&r.win)this.wm.close(r.win);return;}
  if(m.type==='cookie'&&(aliases[m.projectId]||m.projectId)===r.id)this.emit(r,m.outcome);
  if(m.type==='cookie-module:complete'&&m.moduleId==='desert-disco'&&r.id==='dubai-disco'&&m.completed)this.emit(r,'watched');
  if(m.type==='module:complete'&&m.source==='cookie-orchestra'&&r.id==='cookie-band'){r.bandFinished=true;r.jingle?.finish();this.emit(r,'performed');}
  if(m.type==='module:ready'&&m.source==='cookie-orchestra'&&r.id==='cookie-band'){r.bandReady=true;r.sentActive=null;this.syncActivity();}
  if(m.type==='oreo:effect'&&r.id==='oreo'&&Array.isArray(m.effects))this.showOreoEffects(r,m.effects);
  if(m.type==='timtam:close'&&r.id==='timtam'&&r.win)this.wm.close(r.win);
  if(m.type==='oreo:resize'&&r.id==='oreo'&&r.win&&m.state!=='banner'&&m.state!=='closed'&&Number(m.height)>240&&!r.expanded){r.expanded=true;Object.assign(r.win.el.style,{left:'212px',top:'44px',width:'610px'});this.fit(r);if(r.contentHeight)this.fitContent(r);}
 }
 async showOreoEffects(r,effects){await loadScript('/accept-all-cookies/modules/oreo/effects.js');if(this.dead||!r.win||!r.isActive)return;r.disposeEffect?.();r.effectRoot?.remove();const root=document.createElement('div');root.className='module-residue';document.getElementById('screen').append(root);r.effectRoot=root;const disposers=effects.filter(d=>d.projectId==='oreo'&&d.kind==='horizontal-ad-strips').map(d=>window.OreoEffects.mount(root,d));r.disposeEffect=()=>{disposers.forEach(f=>f());root.remove();};}
 emit(r,outcome){if(r.viewport?.isConnected)r.viewport.dispatchEvent(new CustomEvent('cookie',{bubbles:true,composed:true,detail:{projectId:r.id,outcome}}));}
 receive(e){const {projectId,outcome}=e.detail||{},r=this.records.get(projectId);if(!r||!r.outcomes.includes(outcome)||!r.viewport?.contains(e.target)||this.completed.has(projectId))return;
  this.completed.add(projectId);this.log.push({projectId,outcome,at:Date.now()});this.quietUntil=Math.max(this.quietUntil,performance.now()+2000);
  const icons=document.querySelectorAll('.d-icon');icons[this.completed.size%icons.length]?.classList.add('cookie-nudged');this.queueRetirement(r);this.checkReady();}
 interactionState(){const r=this.records.get(this.active),busy=this.pointerBusy||!!this.wanderers?.isHeld?.()||!!(r?.isActive&&(r.busy||r.operating||(r.app&&r.app.state!=='ready'&&!r.app.completed)));return {busy,rect:r?.win?this.wanderers?.bounds(r.win.el):null};}
 touchRecord(r){if(r.retirePending&&!r.retiring)r.retireAt=Math.max(r.retireAt,performance.now()+2000);}
 queueRetirement(r){
  // All stories use the same short beat. Live operation guards, rather than
  // per-project reading delays, protect dragging, editing, and native finales.
  r.retirePending=true;r.retireAt=performance.now()+2000;
  const attempt=()=>{
   if(this.dead||!r.retirePending||r.dismissed)return;
   if(document.hidden||this.interactionState().busy||performance.now()<r.retireAt){this.later(80,attempt);return;}
   const element=r.win?.el||r.viewport;if(!element?.isConnected)return;
   r.retiring=true;r.retireOrigin=this.wanderers.bounds(element);this.syncActivity();
   r.cancelDissolve=this.wanderers.dissolve(element,r.id,()=>{
    r.cancelDissolve=null;
    if(this.dead)return;
    if(r.win)this.wm.close(r.win);else this.closeRecord(r);
   });
  };this.later(2000,attempt);
 }
 checkReady(){if(this.dead||this.ready||this.pendingCheck||this.completed.size<4)return;this.pendingCheck=this.later(220,()=>{this.pendingCheck=null;if(document.hidden||this.interactionState().busy||[...this.records.values()].some(r=>r.retirePending)||performance.now()<this.quietUntil){this.checkReady();return;}
  this.ready=true;document.getElementById('screen').classList.add('convergence');this.later(matchMedia('(prefers-reduced-motion: reduce)').matches?60:650,()=>{document.getElementById('screen').classList.remove('convergence');this.onReady();});});}
 closeRecord(r){if(!r)return;
  if(!this.dead&&this.completed.has(r.id)&&!r.dismissed)this.wanderers.spawn(r.id,r.retireOrigin||this.wanderers.bounds(r.win?.el||r.viewport));
  r.cancelDissolve?.();r.cancelDissolve=null;r.retirePending=false;r.retiring=false;
  r.busy=false;r.operating=false;r.sentActive=null;r.cover?.destroy();r.cover=null;r.motion?.destroy();r.motion=null;r.jingle?.destroy();r.jingle=null;r.disposeEffect?.();r.app?.destroy();r.app=null;this.post(r,'destroy');r.frame?.remove();r.frame=null;r.viewport?.remove();r.door?.remove();r.bandControls?.remove();r.bandControls=null;r.door=null;r.win=null;r.expanded=false;if(r.id==='khapse')r.nativeWidth=390;if(this.active===r.id)this.active=null;this.syncActivity();this.checkReady();
  if(this.completed.has(r.id)){r.dismissed=true;return;}
  if(!this.dead)this.later(4000,()=>{if(!this.completed.has(r.id)){this.create(r,false);this.syncActivity();}});
 }
 getState(){return {completed:[...this.completed],dismissed:[...this.records.values()].filter(r=>r.dismissed).map(r=>r.id),count:this.completed.size,ready:this.ready,active:this.active,log:[...this.log],busy:this.pointerBusy||[...this.records.values()].some(r=>r.busy),characterMusic:this.characterTune?.getState()||null,wanderers:this.wanderers.getState()};}
 destroy(){if(this.dead)return;this.dead=true;this.stopCharacterMusic(false);this.wanderers?.destroy();this.entry?.remove();this.entry=null;this.drizzle?.destroy();this.ambient?.destroy();this.timers.forEach(clearTimeout);this.timers.clear();for(const r of this.records.values()){const win=r.win;this.closeRecord(r);if(win){win.onClose=null;this.wm.close(win);}}this.wm.onFocus=this.previousFocus;this.overlay.remove();this.wordmark?.remove();document.body.classList.remove('module-layout-review');window.removeEventListener('message',this.message);window.removeEventListener('resize',this.resize);window.removeEventListener('blur',this.up);document.removeEventListener('cookie',this.cookie);document.removeEventListener('pointerdown',this.down,true);for(const t of ['pointerup','pointercancel'])document.removeEventListener(t,this.up,true);for(const t of ['input','keydown','wheel'])document.removeEventListener(t,this.touch,true);document.removeEventListener('visibilitychange',this.visibility);document.removeEventListener('cq-mute',this.mute);document.body.classList.remove('modules-active');document.querySelectorAll('.cookie-nudged').forEach(el=>el.classList.remove('cookie-nudged'));}
}
