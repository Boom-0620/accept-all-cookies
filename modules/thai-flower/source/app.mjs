import {distance,prepareShape,hasDrawing,sampleShape,pathsOf,OnceCookie} from './geometry.mjs';
import {HandInput} from './gesture.mjs';
import {drawShape,drawScene,kitchen,souvenir} from './render.mjs';
const $=id=>document.getElementById(id),config=window.THAI_FLOWER_CONFIG||{};
let state='ad',mode='mouse',strokes=[],history=[],active=null,shape=null,cursor=null,stream=null,detector=null,cameraFrame=0,cameraToken=0,lastVideo=-1,raf=0,run=0,closed=false,shared=false,submitted=false,drag=null,hover=false,drawerOpener=null;
const abort=new AbortController(),network=new AbortController(),timers=new Set(),urls=new Set(),tracker=new HandInput();
const on=(target,type,fn,opts={})=>target.addEventListener(type,fn,{...opts,signal:abort.signal});
const show=(id,value)=>{$(id).hidden=!value;};
const cloneStrokes=()=>strokes.map(s=>s.map(p=>({...p})));
function note(text='',error=false){$('feedback').textContent=text;show('feedback',!!text);$('feedback').classList.toggle('error',error);}
let targetOrigin=location.origin;
try{targetOrigin=new URL(config.parentOrigin||document.referrer||location.origin).origin;}catch{}
const cookie=new OnceCookie(message=>{if(typeof config.onCookie==='function')config.onCookie(message);else if(window.parent!==window)window.parent.postMessage(message,targetOrigin);else window.dispatchEvent(new CustomEvent('cookie',{detail:message}));});
const stageMeta={draw:[1,'先画一个形状','随手画，不用闭合。','DRAW'],mold:[1,'确认你的模具','看看形状，满意后再去蘸面糊。','MOLD'],dip:[2,'蘸上面糊','把模具拖进面糊里。','DIP'],dipping:[2,'裹上一层面糊','面糊挂住啦。','DIP'],fry:[3,'放进油锅','把模具拖进热油里。','FRY'],frying:[3,'滋——正在变金黄','等小气泡冒起来。','FRY'],ready:[3,'金黄，出锅！','轻轻脱模，沥一沥油。','CRISP'],bag:[4,'装进透明袋','把酥饼拖进右边的袋子。','PACK'],packing:[4,'系好橡皮筋','这一袋，都是你的形状。','PACK'],made:[5,'你的奇形酥饼，做好了','给它起个名字，就可以带走。','YOURS']};
function setStage(next){
 state=next;const [step,title,hint,tag]=stageMeta[next];$('step-number').textContent=String(step).padStart(2,'0');$('stage-title').textContent=title;$('stage-hint').textContent=hint;$('live-tag').textContent=tag;
 for(let i=1;i<=5;i++){const e=$('step-'+i);if(i===step)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');e.classList.toggle('done',i<step);}
 show('draw-panel',next==='draw');show('kitchen-panel',next!=='draw');show('result',next==='made');show('cook-meter',next==='frying');show('kitchen-actions',['mold','dip','fry','bag'].includes(next));show('back-draw',['mold','dip'].includes(next));
 $('step-action').textContent=({mold:'确认形状，去蘸面糊 →',dip:'蘸一下 ↓',fry:'下锅 ↓',bag:'装袋 →'})[next]||'';
 $('stage-sticker').textContent=({mold:'你的专属模具',dip:'蘸一下！',dipping:'面糊挂住啦',fry:'下锅！',frying:'油炸中…',ready:'新鲜出锅',bag:'装好带走',packing:'正在封口',made:'手绘限定'})[next]||'';
 $('browser-status').textContent=next==='draw'?'只保存作品，不保存摄像头画面':'你的形状 · '+title;note();drag=null;hover=false;
 if(next==='draw'){renderBoard();updateInput();}else renderKitchen();
}
function begin(){show('advert',false);show('shop',true);setStage('draw');}
function updateInput(){const hand=mode==='camera';$('enable-camera').classList.toggle('active',hand);$('mouse-mode').classList.toggle('active',!hand);if(state==='draw')$('stage-hint').textContent=hand?'捏合画 · 松手停 · 画完点击「制成模具」':'随手画，不用闭合。';}
function stopStroke(){active=null;}
function renderBoard(){
 const c=$('board'),ctx=c.getContext('2d');ctx.fillStyle='#17221f';ctx.fillRect(0,0,320,320);ctx.fillStyle='#8b9f8c10';for(let y=0;y<320;y+=3)ctx.fillRect(0,y,320,1);
 ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='#fff0c6';ctx.fillStyle='#fff0c6';
 for(const s of strokes){if(s.length===1){ctx.beginPath();ctx.arc(s[0].x,s[0].y,2.5,0,Math.PI*2);ctx.fill();continue;}ctx.beginPath();s.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
 if(cursor&&mode==='camera'){ctx.beginPath();ctx.arc(cursor.x,cursor.y,active?4:8,0,Math.PI*2);ctx.strokeStyle=active?'#ffe783':'#68ddce';ctx.lineWidth=2;ctx.stroke();}
 show('board-placeholder',!strokes.length);$('finish').disabled=!hasDrawing(strokes);$('clear').disabled=!strokes.length;$('undo').disabled=!history.length;
}
function startStroke(point){
 if(state!=='draw')return;history.push(cloneStrokes());if(history.length>30)history.shift();let near=null,best=20;
 for(const s of strokes){for(const end of [0,s.length-1]){const d=distance(s[end],point);if(d<best){best=d;near={s,end};}}}
 if(near){if(near.end===0)near.s.reverse();active=near.s;}else{active=[];strokes.push(active);}
 appendPoint(point);
}
function appendPoint(p){if(!active||state!=='draw')return;const q={x:Math.max(6,Math.min(314,p.x)),y:Math.max(6,Math.min(314,p.y))};if(active.length&&distance(active.at(-1),q)<1.05)return;active.push(q);if(active.length>1000){const reduced=active.filter((_,i)=>i%2===0);reduced.push(active.at(-1));active.splice(0,active.length,...reduced);}renderBoard();}
function pointOn(canvas,e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*canvas.width,y:(e.clientY-r.top)/r.height*canvas.height};}
on($('board'),'pointerdown',e=>{if(state!=='draw'||e.button>0)return;if(mode==='camera')switchMouse();e.preventDefault();$('board').setPointerCapture(e.pointerId);startStroke(pointOn($('board'),e));});
on($('board'),'pointermove',e=>{if(mode==='mouse'&&active)appendPoint(pointOn($('board'),e));});
for(const event of ['pointerup','pointercancel','lostpointercapture'])on($('board'),event,stopStroke);
on($('undo'),'click',()=>{if(state!=='draw'||!history.length)return;strokes=history.pop();stopStroke();renderBoard();});
on($('clear'),'click',()=>{if(state!=='draw')return;history.push(cloneStrokes());strokes=[];stopStroke();tracker.reset();cursor=null;renderBoard();note();});
function finishDrawing(){if(state!=='draw')return;const result=prepareShape(strokes);if(result.error){note(result.error,true);return;}shape=result.shape;stopCamera();stopStroke();setStage('mold');}
on($('finish'),'click',finishDrawing);
on($('enter'),'click',begin);
on($('back-draw'),'click',()=>{cancelAnimation();mode='mouse';setStage('draw');});
function renderKitchen(progress=0,time=0){if(!shape)return;kitchen($('scene'),shape,state,{progress,time,tool:drag?.point,hover,label:$('label').value.trim()||'我的奇形酥饼'});}
function cancelAnimation(){run++;cancelAnimationFrame(raf);raf=0;}
function animate(duration,update,done){cancelAnimation();const id=run,start=performance.now();function frame(now){if(closed||run!==id)return;const p=Math.min(1,(now-start)/duration);update(p,now);if(p===1){raf=0;done();}else raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);}
function activateStep(){
 if(state==='mold'){setStage('dip');}
 else if(state==='dip'){setStage('dipping');animate(650,(p,t)=>{kitchen($('scene'),shape,'dipping',{progress:p,time:t,tool:{x:200,y:230}});},()=>setStage('fry'));}
 else if(state==='fry'){setStage('frying');animate(4600,(p,t)=>{renderKitchen(p,t);$('cook-meter-fill').style.width=(p*100)+'%';},()=>{setStage('ready');animate(750,(p,t)=>renderKitchen(1,t),()=>setStage('bag'));});}
 else if(state==='bag'){setStage('packing');animate(1000,(p,t)=>renderKitchen(p,t),()=>{setStage('made');cookie.made();});}
}
function targetContains(p){if(state==='bag')return p.x>220&&p.x<398&&p.y>55&&p.y<350;return ((p.x-200)/139)**2+((p.y-230)/107)**2<1;}
on($('scene'),'pointerdown',e=>{if(!['dip','fry','bag'].includes(state)||e.button>0)return;const p=pointOn($('scene'),e),origin=state==='bag'?{x:96,y:209}:{x:204,y:94};if(distance(p,origin)>105)return;e.preventDefault();$('scene').setPointerCapture(e.pointerId);drag={point:origin,offset:{x:origin.x-p.x,y:origin.y-p.y}};renderKitchen();});
on($('scene'),'pointermove',e=>{if(!drag)return;const p=pointOn($('scene'),e);drag.point={x:Math.max(25,Math.min(375,p.x+drag.offset.x)),y:Math.max(40,Math.min(325,p.y+drag.offset.y))};hover=targetContains(drag.point);renderKitchen();});
on($('scene'),'pointerup',()=>{if(!drag)return;const accept=hover;drag=null;hover=false;if(accept)activateStep();else renderKitchen();});
for(const event of ['pointercancel','lostpointercapture'])on($('scene'),event,()=>{if(drag){drag=null;hover=false;renderKitchen();}});
on($('scene'),'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activateStep();}});on($('step-action'),'click',activateStep);
function stopCamera(){cameraToken++;cancelAnimationFrame(cameraFrame);cameraFrame=0;stream?.getTracks().forEach(t=>t.stop());stream=null;detector?.close();detector=null;$('camera').pause();$('camera').srcObject=null;show('camera-box',false);$('enable-camera').disabled=false;$('enable-camera').textContent='▣ 手势画';$('hand-overlay').getContext('2d').clearRect(0,0,192,144);cursor=null;tracker.reset();lastVideo=-1;stopStroke();}
function switchMouse(){stopCamera();mode='mouse';updateInput();renderBoard();note();}
on($('mouse-mode'),'click',switchMouse);
function withTimeout(promise,ms=18000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('load-timeout')),ms);timers.add(timer);})]).finally(()=>{clearTimeout(timer);timers.delete(timer);});}
const cameraErrors={NotAllowedError:'未获摄像头权限。可以直接用鼠标画。',NotFoundError:'未找到摄像头。可以直接用鼠标画。',NotReadableError:'摄像头被其他应用占用。可以先用鼠标画。',SecurityError:'请在 HTTPS 或 localhost 中开启摄像头。'};
on($('enable-camera'),'click',async()=>{
 if(state!=='draw')return;if(mode==='camera'){switchMouse();return;}
 stopCamera();mode='camera';updateInput();const token=cameraToken;$('enable-camera').textContent='■ 停止手势';note('允许摄像头后，把手放进小框。');let acquired=null,landmarker=null;
 try{
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Object.assign(new Error(),{name:'SecurityError'});
  acquired=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
  if(closed||token!==cameraToken||state!=='draw'){acquired.getTracks().forEach(t=>t.stop());return;}
  stream=acquired;$('camera').srcObject=stream;await $('camera').play();if(closed||token!==cameraToken)return;show('camera-box',true);$('camera-led').textContent='识别准备中…';note('正在载入手势识别…');
  const base=config.visionBase||'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18';
  const sdk=await withTimeout(import(base+'/vision_bundle.mjs'));if(closed||token!==cameraToken)return;
  const files=await withTimeout(sdk.FilesetResolver.forVisionTasks(base+'/wasm'));if(closed||token!==cameraToken)return;
  const options={baseOptions:{modelAssetPath:config.modelPath||'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.6};
  let creation=sdk.HandLandmarker.createFromOptions(files,options).catch(error=>{if(closed||token!==cameraToken)throw error;return sdk.HandLandmarker.createFromOptions(files,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});});
  // Even if loading finishes after timeout/close, dispose the late model.
  creation.then(model=>{if(closed||token!==cameraToken)model.close();},()=>{});
  landmarker=await withTimeout(creation,25000);if(closed||token!==cameraToken||state!=='draw'){return;}
  detector=landmarker;note();let lastAt=0;
  function detect(now){
   if(closed||token!==cameraToken||!detector||state!=='draw')return;
   try{const video=$('camera');if(video.readyState>=2&&video.currentTime!==lastVideo&&now-lastAt>32){lastAt=now;lastVideo=video.currentTime;const result=detector.detectForVideo(video,now);trackHands(result.landmarks,now);}}
   catch{switchMouse();note('手势识别中断，已关闭摄像头。继续用鼠标画也可以。',true);return;}
   if(!closed&&token===cameraToken)cameraFrame=requestAnimationFrame(detect);
  }cameraFrame=requestAnimationFrame(detect);
 }catch(error){if(acquired&&acquired!==stream)acquired.getTracks().forEach(t=>t.stop());if(closed||token!==cameraToken)return;switchMouse();note(cameraErrors[error.name]||'手势模型未能加载，摄像头已关闭。请重试或用鼠标继续。',true);}
});
function trackHands(hands,time){
 const video=$('camera'),result=tracker.update(hands,time,{aspect:(video.videoWidth||640)/(video.videoHeight||480)}),ctx=$('hand-overlay').getContext('2d');ctx.clearRect(0,0,192,144);
 if(!result.visible){stopStroke();cursor=null;$('camera-led').textContent='把手放回框里';renderBoard();return;}
 const hand=result.hand,edges=[[0,5],[5,9],[9,13],[13,17],[17,0],[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[9,10],[10,11],[11,12],[13,14],[14,15],[15,16],[17,18],[18,19],[19,20]];
 ctx.strokeStyle=result.draw?'#ffec73':'#72ecd2';ctx.lineWidth=1;for(const [a,b] of edges){ctx.beginPath();ctx.moveTo((1-hand[a].x)*192,hand[a].y*144);ctx.lineTo((1-hand[b].x)*192,hand[b].y*144);ctx.stroke();}
 for(const i of [4,8]){ctx.beginPath();ctx.arc((1-hand[i].x)*192,hand[i].y*144,3,0,Math.PI*2);ctx.fillStyle='#ffeca7';ctx.fill();}
 cursor=result.point;
 if(result.breakStroke)stopStroke();if(result.draw){if(!active)startStroke(result.point);else appendPoint(result.point);}else stopStroke();
 $('camera-led').textContent=result.draw?'● 正在画线':'● 捏合下笔';renderBoard();
}
function openDrawer(which){drawerOpener=which==='gallery'?$('show-gallery'):$('show-about');if(stream){switchMouse();}show('share-consent',false);show('drawer',true);show('gallery',which==='gallery');show('about',which==='about');$('drawer-title').textContent=which==='gallery'?'小摊橱窗':'小摊档案';$('close-drawer').focus();if(which==='gallery')loadGallery();}
function closeDrawer(){show('drawer',false);drawerOpener?.focus();}
on($('show-gallery'),'click',()=>openDrawer('gallery'));on($('show-about'),'click',()=>openDrawer('about'));on($('close-drawer'),'click',closeDrawer);
on($('drawer'),'click',e=>{if(e.target===$('drawer'))closeDrawer();});
on(document,'keydown',e=>{if($('drawer').hidden)return;if(e.key==='Escape'){e.preventDefault();closeDrawer();}else if(e.key==='Tab'){const list=[...$('drawer').querySelectorAll('button,a,input')].filter(el=>el.getClientRects().length&&!el.disabled),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
function validWork(w){const paths=w?.paths|| (w?.points?[w.points]:null);return w&&typeof w.label==='string'&&paths?.length>0&&paths.length<=64&&paths.every(p=>Array.isArray(p)&&p.length>=3&&p.length<=200&&p.every(v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1));}
function localWorks(){try{const value=JSON.parse(localStorage.getItem('thai-flower-works-v1')||'[]');return Array.isArray(value)?value.filter(validWork).slice(0,24):[];}catch{return [];}}
function card(work,label,noteText){const fig=document.createElement('figure');fig.className='gallery-card';const c=document.createElement('canvas');c.width=120;c.height=120;const ctx=c.getContext('2d');ctx.fillStyle='#947247';ctx.fillRect(0,0,120,120);for(let i=0;i<120;i+=9){ctx.fillStyle='#bc9a66';ctx.fillRect(i,0,2,120);}drawShape(ctx,work,60,61,88,'fried');const small=document.createElement('small');small.textContent=noteText;const b=document.createElement('b');b.textContent=label;fig.append(c,small,b);return fig;}
function displayWorks(works){$('works').replaceChildren();if(!works.length){const p=document.createElement('p');p.className='empty';p.textContent='这一排，等你的第一袋。';$('works').append(p);}else works.filter(validWork).forEach(w=>$('works').append(card(w.paths?{paths:w.paths}:w.points,w.label,shared?'共享作品':'本机作品')));}
async function loadGallery(){
 try{const r=await fetch('./api/gallery',{signal:network.signal});if(!r.ok)throw new Error();const data=await r.json();if(closed)return;shared=data.shared===true;if(shared){$('gallery-title').textContent='共享橱窗';$('gallery-info').textContent='主动提交后，此服务的访问者可见。';$('submit-gallery').textContent='▦ 提交共享橱窗';displayWorks(data.works||[]);return;}}
 catch{if(closed)return;}
 shared=false;$('gallery-title').textContent='本机作品';$('gallery-info').textContent='共享橱窗未接通，仅本浏览器可见。';$('submit-gallery').textContent='▦ 留在本机橱窗';displayWorks(localWorks());
}
on($('refresh-gallery'),'click',loadGallery);
on($('label'),'input',()=>{if(state==='made')renderKitchen();});
on($('save-image'),'click',()=>{if(state!=='made')return;souvenir(shape,$('label').value.trim()||'我的奇形酥饼').toBlob(blob=>{if(!blob||closed)return;const url=URL.createObjectURL(blob);urls.add(url);const a=document.createElement('a');a.href=url;a.download='DRAW-AND-FRY-'+Date.now()+'.png';a.click();const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);timers.delete(timer);},30000);timers.add(timer);note('纪念图已生成。只有作品，没有摄像头画面。');},'image/png');});
on($('submit-gallery'),'click',async()=>{
 if(state!=='made'||submitted)return;$('submit-gallery').disabled=true;await loadGallery();if(closed)return;$('submit-gallery').disabled=false;
 if(shared){openDrawer('gallery');show('share-consent',true);return;}
 if(submitted)return;const work={label:$('label').value.trim()||'我的奇形酥饼',paths:shape.paths,createdAt:Date.now()};try{const all=[work,...localWorks()].slice(0,24);localStorage.setItem('thai-flower-works-v1',JSON.stringify(all));displayWorks(all);submitted=true;$('submit-gallery').disabled=true;note('已留在本机橱窗，仅当前浏览器可见。');}catch{note('本机空间不足，请保存纪念图。',true);}
});
on($('cancel-share'),'click',()=>show('share-consent',false));
on($('confirm-share'),'click',async()=>{if(!shared||submitted||state!=='made')return;$('confirm-share').disabled=true;try{const r=await fetch('./api/gallery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label:$('label').value.trim()||'我的奇形酥饼',paths:shape.paths}),signal:network.signal});if(!r.ok)throw new Error();if(closed)return;submitted=true;$('submit-gallery').disabled=true;show('share-consent',false);await loadGallery();}catch{if(!closed)note('提交未成功，作品还在这里，可以稍后再试。',true);}finally{if(!closed)$('confirm-share').disabled=false;}});
on($('make-another'),'click',()=>{cancelAnimation();stopCamera();strokes=[];history=[];active=null;shape=null;mode='mouse';submitted=false;$('label').value='我的奇形酥饼';$('submit-gallery').disabled=false;setStage('draw');});
function destroy(){if(closed)return;closed=true;cancelAnimation();stopCamera();network.abort();abort.abort();timers.forEach(clearTimeout);timers.clear();urls.forEach(URL.revokeObjectURL);urls.clear();show('shop',false);show('advert',false);show('drawer',false);show('closed',true);}
on($('close'),'click',destroy);on(window,'pagehide',destroy);on(document,'visibilitychange',()=>{if(document.hidden&&mode==='camera'){switchMouse();note('摄像头已暂停，需要时重新点“手势画”。');}});
on(window,'message',event=>{if(event.source===window.parent&&event.origin===targetOrigin&&event.data?.type==='cookie:destroy'&&event.data?.projectId==='thai-flower')destroy();});
window.ThaiFlower={destroy,getState:()=>({stage:state,mode,cookieSent:cookie.sent,cameraActive:!!stream,closed,shape:shape?{paths:shape.paths.map(p=>p.map(v=>({...v})))}:null})};
for(const [kind,label]of [['flower','五瓣花'],['star','小星星'],['heart','爱心']])$('examples').append(card(sampleShape(kind),label,'示例作品'));
if(new URLSearchParams(location.search).get('view')==='shop')begin();
