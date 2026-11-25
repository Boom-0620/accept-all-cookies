/* Host-owned adapter, injected by the preview server. Delivery files remain unchanged. */
(() => {
 if(new URLSearchParams(location.search).get('cq-host')!=='1')return;
 const id=location.pathname.split('/').filter(Boolean)[location.pathname.split('/').filter(Boolean).indexOf('modules')+1], origin=location.origin;
 const native={raf:requestAnimationFrame.bind(window),caf:cancelAnimationFrame.bind(window),timeout:setTimeout.bind(window),clearTimeout:clearTimeout.bind(window),now:performance.now.bind(performance)};
 document.addEventListener('error',event=>{const img=event.target;if(!(img instanceof HTMLImageElement)||!img.src)return;const attempt=Number(img.dataset.cqRetry||0);if(attempt>=2)return;img.dataset.cqRetry=String(attempt+1);native.timeout(()=>{if(dead||!img.isConnected)return;const url=new URL(img.src);url.searchParams.set('cq-retry',String(attempt+1));img.src=url.href;},1500*(attempt+1));},true);
 let active=false,dead=false,muted=false,pausedAt=native.now(),elapsedPaused=0;
 const tasks=new Map(),frames=new Map(),contexts=new Set(),playing=new Set(),media=new Set();let seq=0,gingerPlaying=false,timtamPlaying=false;
 const send=(type,detail={})=>parent.postMessage({source:'cookie-host-adapter',projectId:id,type,...detail},origin);
 document.addEventListener('error',event=>{const el=event.target;if(el?.tagName==='SCRIPT'||el?.tagName==='LINK'&&el.rel==='stylesheet')send('load-error');},true);
 const clock=()=>active?native.now()-elapsedPaused:pausedAt-elapsedPaused;
 try{performance.now=clock;}catch(_){}
 function arm(t){t.start=native.now();t.native=native.timeout(()=>{if(!active||dead)return;t.native=null;if(!t.interval)tasks.delete(t.id);else t.remaining=t.delay;try{typeof t.fn==='function'?t.fn(...t.args):(0,eval)(String(t.fn));}finally{if(t.interval&&tasks.has(t.id)&&active)arm(t);}},t.remaining);}
 function timer(fn,delay,interval,args){const t={id:++seq,fn,delay:Math.max(0,Number(delay)||0),interval,args,remaining:Math.max(0,Number(delay)||0)};tasks.set(t.id,t);if(active)arm(t);return t.id;}
 window.setTimeout=(fn,ms,...args)=>timer(fn,ms,false,args);window.setInterval=(fn,ms,...args)=>timer(fn,ms,true,args);
 window.clearTimeout=window.clearInterval=id=>{const t=tasks.get(id);if(t){native.clearTimeout(t.native);tasks.delete(id);}};
 function scheduleFrame(key){const f=frames.get(key);if(!f)return;f.native=native.raf(()=>{if(!active||dead)return;frames.delete(key);f.fn(clock());});}
 window.requestAnimationFrame=fn=>{const key=++seq;frames.set(key,{fn});if(active)scheduleFrame(key);return key;};
 window.cancelAnimationFrame=key=>{const f=frames.get(key);if(f)native.caf(f.native);frames.delete(key);};
 for(const name of ['AudioContext','webkitAudioContext']){const C=window[name];if(!C)continue;window[name]=class extends C{constructor(...args){super(...args);contexts.add(this);if(!active||muted)super.suspend().catch(()=>{});}resume(){return active&&!muted?super.resume():Promise.resolve();}};}
 const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){media.add(this);if(!active||muted){playing.add(this);return Promise.resolve();}return play.call(this);};
 const streams=new Set();
 if(navigator.mediaDevices?.getUserMedia){const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async args=>{const s=await get(args);streams.add(s);if(dead||!active)s.getTracks().forEach(t=>t.stop());return s;};}
 function sound(){for(const c of contexts){if(c.state==='closed')continue;(active&&!muted?c.resume():c.suspend()).catch(()=>{});}for(const m of new Set([...media,...document.querySelectorAll('audio,video')])){if(!active||muted){if(!m.paused)playing.add(m);m.pause();}else if(playing.has(m)){playing.delete(m);play.call(m).catch(()=>{});}}}
 function setActive(next){next=!!next&&!dead;if(!next)releaseInput();if(active===next){sound();return;}if(next){elapsedPaused+=native.now()-pausedAt;active=true;for(const t of tasks.values())arm(t);for(const key of frames.keys())scheduleFrame(key);}else{pausedAt=native.now();active=false;for(const t of tasks.values()){if(t.native){native.clearTimeout(t.native);t.remaining=Math.max(0,t.remaining-(pausedAt-t.start));t.native=null;}}for(const f of frames.values())native.caf(f.native);streams.forEach(s=>s.getTracks().forEach(t=>t.stop()));}
 // Kungu starts its own loop on visibilitychange; discard the suspended copy.
 if(id==='kungu'&&active){for(const f of frames.values())native.caf(f.native);frames.clear();}
 document.documentElement.classList.toggle('cq-paused',!active);document.dispatchEvent(new Event('visibilitychange'));sound();}
 try{Object.defineProperty(document,'hidden',{get:()=>!active});Object.defineProperty(document,'visibilityState',{get:()=>active?'visible':'hidden'});}catch(_){}
 const pointerIds=new Set(),keys=new Set();
 function releaseInput(){pointerIds.clear();keys.clear();send('activity',{busy:false});}
 window.addEventListener('blur',releaseInput);
 let lastPointer=-1000,lastEngagement=-1000;
 const reportPointer=e=>{const now=native.now();if(!active||dead||now-lastPointer<70)return;lastPointer=now;send('pointer',{u:e.clientX/innerWidth,v:e.clientY/innerHeight});};
 document.addEventListener('pointermove',reportPointer,{passive:true});
 document.addEventListener('pointerdown',reportPointer,{passive:true,capture:true});
 for(const type of ['input','click','wheel'])document.addEventListener(type,()=>{const now=native.now();if(!active||dead||now-lastEngagement<200)return;lastEngagement=now;send('engagement');},{capture:true,passive:true});
 document.addEventListener('pointerdown',e=>{pointerIds.add(e.pointerId);send('activity',{busy:true});},true);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{pointerIds.delete(e.pointerId);send('activity',{busy:!!(pointerIds.size||keys.size)});},true);
 document.addEventListener('keydown',e=>{keys.add(e.code);send('activity',{busy:true});},true);
 document.addEventListener('keyup',e=>{keys.delete(e.code);send('activity',{busy:!!(pointerIds.size||keys.size)});},true);
 document.addEventListener('cookie',e=>{if(e.detail)send('cookie',{detail:e.detail});});
 document.addEventListener('click',e=>{if(id==='fortune-cookie')return;const b=e.composedPath().find(n=>n instanceof Element&&n.matches('button#close,button[data-close],button[data-action="close"],button.close'));if(b)send('close');},true);
 window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==origin||e.data?.source!=='cookie-desktop'||e.data.projectId!==id)return;const m=e.data;
 if(m.type==='active'){if(!m.active){gingerPlaying=window.gingerbread?.state==='playing';timtamPlaying=!!window.timtam&&!window.timtam.getState().paused;}setActive(m.active);window.khapseModule?.[m.active?'resume':'pause']?.();window.timtam?.setActive?.(m.active);if(m.active&&timtamPlaying)window.timtam?.resume();if(m.active&&gingerPlaying)window.gingerbread?.resume();}
 if(m.type==='mute'){muted=!!m.muted;sound();}
 if(m.type==='launch'&&id==='gingerbread'&&active)window.gingerbread?.play?.();
 if(m.type==='destroy'){dead=true;setActive(false);window.ThaiFlower?.destroy?.();window.OreoModule?.destroy?.();window.khapseModule?.destroy?.();window.gingerbread?.destroy?.();for(const c of contexts)c.close().catch(()=>{});streams.forEach(s=>s.getTracks().forEach(t=>t.stop()));tasks.clear();frames.clear();}
 });
 document.addEventListener('DOMContentLoaded',()=>{
 if(id==='fortune-cookie'){const adapter=document.createElement('script');adapter.src='/accept-all-cookies/cookie-quest/integration/fortune-bridge.js';document.head.append(adapter);}
 if(new URLSearchParams(location.search).get('layout')==='review'){const review=document.createElement('script');review.src='/accept-all-cookies/cookie-quest/integration/review-frame.js';document.head.append(review);}
 const style=document.createElement('style');style.textContent='html.cq-paused *,html.cq-paused *::before,html.cq-paused *::after{animation-play-state:paused!important}html,body{margin:0!important;min-height:0!important}body{padding:0!important}';
 if(id==='gingerbread')style.textContent+='html,body{display:block!important;background:transparent!important}#ad,#app,.preview{width:100%!important;max-width:none!important;margin:0!important}';
 if(id==='oreo')style.textContent+='.titlebar{display:none!important}';
 if(id==='kungu')style.textContent+='body{display:block!important;background:#fff9e7!important}.window{margin:0!important;width:100%!important;max-width:none!important}.titlebar,.toolbar,.address,.browser-status,.footer{display:none!important}.paper{padding:6px!important}.paper>header{padding:2px!important}h1{font-size:24px!important;margin:0!important}.english{font-size:13px!important;margin:2px!important}.scene-wrap{max-width:520px!important;margin:auto!important}';
 document.head.append(style);
 if(['dubai-disco','oreo','thai-flower'].includes(id)){
  const fit=document.createElement('script');fit.src='/accept-all-cookies/cookie-quest/integration/content-fit.js';document.head.append(fit);
 }
 if(id==='timtam'||id==='gingerbread'){
  const host=id==='timtam'?document.querySelector('#module')?.firstElementChild:window.gingerbread?.root;
  if(host?.shadowRoot){const s=document.createElement('style');s.textContent='.titlebar{display:none!important}.menu{display:none!important}.shell,.window{max-width:none!important;width:100%!important;margin:0!important;border:0!important;padding:0!important;box-shadow:none!important}';host.shadowRoot.append(s);}
  if(id==='timtam')document.addEventListener('click',()=>native.timeout(()=>{if(window.timtam?.getState().phase!=='banner')send('expand');},40),true);
 }
 if(id==='kungu'){
  const cv=document.querySelector('#scene'),img=new Image();img.onload=()=>{if(!active){const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(img,0,0,cv.width,cv.height);}};img.src='assets/lake-scan.webp';
 }
 let lastOperation=null;
 function operation(){if(dead)return;let busy=false;
  if(active){const thai=window.ThaiFlower?.getState(),kungu=window.KunguModule?.getState(),tt=window.timtam?.getState(),oreo=window.OreoModule?.getState();
   if(thai){const visible=id=>{const el=document.getElementById(id);return !!el&&!el.hidden&&!!el.getClientRects().length;};const editing=document.activeElement?.matches('#label,textarea,[contenteditable="true"]');busy=!thai.closed&&(!['ad','made'].includes(thai.stage)||visible('drawer')||visible('share-consent')||(thai.stage==='made'&&editing));}
   if(kungu)busy=!['lake','intro','info'].includes(kungu.stage);
   if(tt)busy=['intro','countdown','playing','softening'].includes(tt.phase)||(tt.phase==='trophy'&&!tt.rewardReady);
   if(oreo)busy=!['banner','done','closed'].includes(oreo.step);
  }
  if(busy!==lastOperation){lastOperation=busy;send('operation',{busy});}native.timeout(operation,180);
 }
 operation();document.documentElement.classList.add('cq-paused');send('ready');
 });
 window.CookieHostBridge=Object.freeze({setActive,getState:()=>({active,muted,dead,pendingFrames:frames.size,pendingTimers:tasks.size,audioContexts:[...contexts].map(c=>c.state),playingMedia:[...document.querySelectorAll('audio,video')].filter(m=>!m.paused).length})});
})();
