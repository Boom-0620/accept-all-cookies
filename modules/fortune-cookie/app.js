(() => {
 'use strict';
 const $ = (id) => document.getElementById(id);
 const win = $('fortune-window');
 const whole = $('whole-cookie');
 const tab = $('paper-tab');
 const action = $('main-action');
 const paper = $('fortune-paper');
 const copy = window.FORTUNE_COOKIE_COPY;
 const questions = window.FORTUNE_COOKIE_QUESTIONS;
 const params = new URLSearchParams(location.search);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const state = {phase:'sealed',category:null,draw:1,completed:false,paused:false,closed:false,minimized:false,destroyed:false,sound:true,ready:false,text:copy.first,questionOpen:false,hasQuestion:false,followupUsed:false,side:'front'};
 const history = new Set();
 const questionHistory = new Set();
 let followupText = questions.firstBack;
 const timers = new Map();
 const pauseReasons = new Set();
 const controller = new AbortController();
 const listen = (el,name,fn,options={}) => el.addEventListener(name,fn,{...options,signal:controller.signal});
 let audio = null;
 let pointer = null;
 let pendingReveal = false;
 let configuredOrigin = params.get('parentOrigin');
 let parentOrigin = '*';
 try { if(configuredOrigin) parentOrigin = new URL(configuredOrigin).origin; else if(document.referrer) parentOrigin = new URL(document.referrer).origin; } catch(_) {}
 if(parentOrigin==='null') parentOrigin='*';
 const directGame = params.get('host')==='game';
 if(params.get('embed')==='1') document.body.classList.add('embedded');
 function schedule(key,fn,ms){clearSchedule(key);timers.set(key,setTimeout(()=>{timers.delete(key);if(!state.destroyed)fn();},ms));}
 function clearSchedule(key){if(timers.has(key)){clearTimeout(timers.get(key));timers.delete(key);}}
 function send(type,detail={}){
  const message={source:'fortune-cookie',type,version:1,projectId:'fortune-cookie',moduleId:'fortune-cookie',...detail};
  window.dispatchEvent(new CustomEvent(type,{detail:message}));
  if(parent!==window) parent.postMessage(message,parentOrigin);
 }
 function setPhase(phase){
  state.phase=phase;win.dataset.phase=phase;
  whole.disabled=phase!=='sealed'||!state.ready||state.questionOpen;
  tab.hidden=phase!=='cracked';
  action.disabled=phase==='revealing'||!state.ready||state.questionOpen;
  action.hidden=phase==='cracked'||phase==='revealing';
  $('question-entry').hidden=phase!=='sealed'||state.questionOpen;
  $('question-entry').disabled=!state.ready;
  $('followup-action').hidden=phase!=='revealed'||state.followupUsed;
 }
 function setAction(text,icon){$('action-text').textContent=text;$('action-icon').textContent=icon;}
 function canAct(){return state.ready&&!state.paused&&!state.closed&&!state.minimized&&!state.destroyed&&!state.questionOpen;}
 function getAudio(){
  if(!state.sound||state.paused||state.destroyed)return null;
  try {audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});return audio;}catch(_){return null;}
 }
 function sound(kind){
  const ctx=getAudio();if(!ctx)return;
  try {
   if(kind==='crack'){
    const count=Math.round(ctx.sampleRate*.15), buffer=ctx.createBuffer(1,count,ctx.sampleRate), samples=buffer.getChannelData(0);
    for(let i=0;i<count;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/count,3);
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='highpass';filter.frequency.value=1100;gain.gain.value=.22;source.connect(filter).connect(gain).connect(ctx.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
   }else{
    const notes=kind==='reveal'?[523.25,659.25,783.99,1046.5]:[783.99];
    notes.forEach((hz,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.075;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.075,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.7);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+.72);o.onended=()=>{o.disconnect();g.disconnect();};});
   }
  }catch(_){}
 }
 function sparkles(){
  if(reduced)return;
  const field=$('sparkles');field.replaceChildren();
  for(let i=0;i<13;i++){const s=document.createElement('i');s.textContent=i%3?'✦':'✧';s.style.left=(16+Math.random()*68)+'%';s.style.top=(43+Math.random()*38)+'%';s.style.fontSize=(12+Math.random()*17)+'px';s.style.animationDelay=(Math.random()*.22)+'s';field.append(s);}
  schedule('sparkles',()=>field.replaceChildren(),1300);
 }
 function crack(){
  if(!canAct()||state.phase!=='sealed')return;
  setPhase('cracked');sound('crack');send('cookie:cracked');
  if(document.activeElement===whole)tab.focus({preventScroll:true});
 }
 function finishReveal(){
  if(state.phase!=='revealing'||state.destroyed)return;
  if(state.paused){pendingReveal=true;return;}
  pendingReveal=false;paper.classList.remove('turning');setPhase('revealed');paper.setAttribute('aria-hidden','false');setAction('再来一块','⟳');
  if(!state.followupUsed){paper.setAttribute('role','button');paper.setAttribute('tabindex','0');paper.setAttribute('aria-label',state.text.replace(/\n/g,'')+' 追问一句');}else{paper.removeAttribute('role');paper.removeAttribute('tabindex');paper.removeAttribute('aria-label');}
  if(document.activeElement===tab||document.activeElement===document.body)action.focus({preventScroll:true});
  if(!state.completed){
   state.completed=true;
   send('cookie:complete',{outcome:'fortune-read',fortune:state.text.replace(/\n/g,''),category:state.category});
   if(directGame&&parent!==window)parent.postMessage({source:'cookie-quest-web',type:'web:restored',version:1,moduleId:'fortune-cookie'},parentOrigin);
  }
 }
 function reveal(){
  if(!canAct()||state.phase!=='cracked')return;
  $('fortune-text').textContent=state.text;
  setPhase('revealing');sound('reveal');sparkles();
  schedule('reveal',finishReveal,reduced?20:850);
 }
 function selectFortune(){
  const pool=Object.values(copy.categories).flatMap(c=>c.fortunes);
  let unseen=pool.filter(t=>!history.has(t));
  if(!unseen.length){for(const t of pool)history.delete(t);unseen=pool.filter(t=>t!==state.text);}
  const selected=unseen[Math.floor(Math.random()*unseen.length)]||pool[0];history.add(selected);return selected;
 }
 function resetDraw(){
  if(!canAct()||state.phase!=='revealed')return;
  state.draw++;state.text=selectFortune();state.hasQuestion=false;state.category=null;state.followupUsed=false;state.side='front';
  const group=Object.entries(copy.categories).find(([,c])=>c.fortunes.includes(state.text))?.[0]||'daily';
  const backs=questions.followups[group];followupText=backs[Math.floor(Math.random()*backs.length)];
  $('question-input').value='';clearSchedule('reveal');pendingReveal=false;paper.classList.remove('turning');paper.removeAttribute('role');paper.removeAttribute('tabindex');paper.removeAttribute('aria-label');
  paper.setAttribute('aria-hidden','true');$('fortune-text').textContent='';
  setPhase('sealed');setAction('掰开饼干','✦');
  whole.focus({preventScroll:true});sound('tap');
 }
 function openQuestion(){
  if(!canAct()||state.phase!=='sealed')return;
  state.questionOpen=true;pointer=null;$('question-overlay').hidden=false;setPhase(state.phase);
  $('question-input').focus({preventScroll:true});sound('tap');
 }
 function closeQuestion(refocus=true){
  state.questionOpen=false;$('question-overlay').hidden=true;setPhase(state.phase);
  if(refocus&&state.phase==='sealed')$('question-entry').focus({preventScroll:true});
 }
 function questionPair(text){
  const topic=questions.topics.find(t=>new RegExp(t.pattern,'i').test(text));
  const key=topic?.id||'general',pairs=topic?.pairs||questions.general;
  let candidates=pairs.map((pair,index)=>({pair,id:key+':'+index})).filter(p=>!questionHistory.has(p.id));
  if(!candidates.length){pairs.forEach((_,i)=>questionHistory.delete(key+':'+i));candidates=pairs.map((pair,i)=>({pair,id:key+':'+i}));}
  const selected=candidates[Math.floor(Math.random()*candidates.length)];questionHistory.add(selected.id);
  return {front:selected.pair[0],back:selected.pair[1],category:key};
 }
 function submitQuestion(event){
  event?.preventDefault();
  if(!state.questionOpen||!state.ready||state.paused||state.closed||state.minimized||state.destroyed)return;
  const question=$('question-input').value.replace(/\s+/g,' ').trim().slice(0,80);
  if(question){const answer=questionPair(question);state.text=answer.front;followupText=answer.back;state.category=answer.category;state.hasQuestion=true;}
  $('question-input').value='';closeQuestion(false);crack();tab.focus({preventScroll:true});
 }
 function skipQuestion(){
  if(!state.questionOpen||state.paused||state.destroyed)return;
  $('question-input').value='';closeQuestion(false);crack();tab.focus({preventScroll:true});
 }
 function followUp(){
  if(!canAct()||state.phase!=='revealed'||state.followupUsed)return;
  state.followupUsed=true;state.side='back';setPhase('revealing');paper.removeAttribute('role');paper.removeAttribute('tabindex');paper.removeAttribute('aria-label');paper.classList.add('turning');sound('tap');
  schedule('followup-copy',()=>{state.text=followupText;$('fortune-text').textContent=state.text;},reduced?0:240);
  schedule('reveal',finishReveal,reduced?20:500);
 }
 function mainAction(){if(state.phase==='sealed')crack();else if(state.phase==='cracked')reveal();else if(state.phase==='revealed')resetDraw();}
 function openWindow(){
  if(state.destroyed)return;
  state.closed=false;state.minimized=false;win.hidden=false;$('restore-tab').hidden=true;document.body.classList.remove('minimized');
  pauseReasons.delete('minimized');pauseReasons.delete('closed');resume('open');win.classList.remove('popped');void win.offsetWidth;win.classList.add('popped');schedule('pop',()=>win.classList.remove('popped'),350);(state.phase==='sealed'?whole:state.phase==='cracked'?tab:action).focus({preventScroll:true});
  if(!document.body.classList.contains('embedded'))win.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
 }
 function requestClose(){
  if(state.closed||state.destroyed)return false;
  if(state.questionOpen)closeQuestion(false);
  if(!state.completed){
   win.classList.add('shaking');schedule('shake',()=>win.classList.remove('shaking'),350);(state.phase==='sealed'?whole:tab).focus({preventScroll:true});send('cookie:close-blocked');return false;
  }
  state.closed=true;win.hidden=true;win.classList.remove('maximized');pause('closed');$('sparkles').replaceChildren();
  for(const key of ['sparkles','shake','pop'])clearSchedule(key);
  if(parent===window){$('restore-tab').hidden=false;$('restore-tab').focus();}
  send('cookie:request-close',{outcome:'fortune-read'});send('cookie:closed',{outcome:'fortune-read'});return true;
 }
 function minimize(){
  if(state.destroyed||state.closed)return;
  if(state.questionOpen)closeQuestion(false);
  state.minimized=true;win.hidden=true;win.classList.remove('maximized');document.body.classList.add('minimized');$('restore-tab').hidden=false;pause('minimized');$('restore-tab').focus();
 }
 function pause(reason='host'){if(state.destroyed)return;pauseReasons.add(reason);state.paused=true;win.classList.add('paused');if(audio&&audio.state==='running')audio.suspend().catch(()=>{});}
 function resume(reason='host'){pauseReasons.delete(reason);if(state.destroyed||state.closed||state.minimized||document.hidden||pauseReasons.size)return;state.paused=false;win.classList.remove('paused');if(pendingReveal)finishReveal();}
 function destroy(){
  if(state.destroyed)return;state.questionOpen=false;$('question-overlay').hidden=true;$('question-input').value='';state.destroyed=true;state.paused=true;controller.abort();for(const id of timers.values())clearTimeout(id);timers.clear();$('sparkles').replaceChildren();win.classList.add('paused');whole.disabled=true;tab.disabled=true;action.disabled=true;if(audio)audio.close().catch(()=>{});audio=null;
 }
 listen($('question-entry'),'click',openQuestion);
 listen($('question-form'),'submit',submitQuestion);
 listen($('question-cancel'),'click',()=>closeQuestion());
 listen($('question-scrim'),'click',()=>closeQuestion());
 listen($('question-skip'),'click',skipQuestion);
 listen($('question-input'),'keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing)submitQuestion(e);});
 listen($('followup-action'),'click',followUp);
 listen(paper,'click',followUp);
 listen(paper,'keydown',e=>{if((e.key==='Enter'||e.key===' ')&&state.phase==='revealed'&&!state.followupUsed){e.preventDefault();followUp();}});
 listen(action,'click',mainAction);listen(whole,'click',crack);listen(tab,'click',reveal);
 // Click and a short intentional drag both work; ordinary page scrolling stays available.
 for(const element of [whole,tab]){
  listen(element,'pointerdown',e=>{if(!canAct()||e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,element};});
 }
 listen(window,'pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=pointer;pointer=null;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dx)>24&&Math.abs(dx)>Math.abs(dy)*.8){if(p.element===whole)crack();else reveal();}});
 listen(window,'pointercancel',()=>{pointer=null;});
 listen($('close'),'click',requestClose);listen($('minimize'),'click',minimize);
 listen($('maximize'),'click',()=>{if(state.destroyed)return;const full=win.classList.toggle('maximized');$('maximize').title=full?'还原窗口':'放大窗口';$('maximize').setAttribute('aria-label',full?'还原占卜窗口':'放大占卜窗口');});
 listen($('restore-tab'),'click',openWindow);
 listen($('sound'),'click',()=>{state.sound=!state.sound;$('sound').textContent=state.sound?'♪':'♩';$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',state.sound?'关闭声音':'打开声音');if(!state.sound&&audio)audio.suspend().catch(()=>{});else sound('tap');});
 listen(document,'visibilitychange',()=>{if(document.hidden)pause('visibility');else resume('visibility');});
 listen(window,'message',event=>{
  if(event.source!==parent||parent===window)return;
  if(parentOrigin!=='*'&&event.origin!==parentOrigin)return;
  const d=event.data;if(!d||typeof d!=='object')return;
  const target=d.projectId||d.moduleId;if(target&&target!=='fortune-cookie')return;
  if(['cookie:pause','cookie:deactivate','module:pause'].includes(d.type))pause();
  else if(['cookie:resume','cookie:activate','module:resume'].includes(d.type))resume();
  else if(['cookie:destroy','module:destroy'].includes(d.type))destroy();
  else if(d.type==='cookie:request-close')requestClose();
  else if(d.type==='cookie:open')openWindow();
  else if(d.type==='cookie:active'){if(d.active)resume();else pause();}
 });
 listen(window,'keydown',e=>{
  if(state.questionOpen){
   if(e.key==='Escape'){e.preventDefault();closeQuestion();return;}
   if(e.key==='Tab'){
    const first=$('question-cancel'),last=$('question-skip');
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
   return;
  }
  if(e.key==='Escape'&&win.classList.contains('maximized')){win.classList.remove('maximized');$('maximize').focus();}
 });
 window.FortuneCookie=Object.freeze({open:openWindow,pause,resume,destroy,requestClose,getState:()=>({...state})});
 async function prepareArtwork(){
  try {
   document.documentElement.style.setProperty('--fortune-art','url("'+window.FORTUNE_ATLAS_DATA+'")');
   const img=new Image();img.src=window.FORTUNE_ATLAS_DATA;await img.decode();if(state.destroyed)return;
   const sections={whole:[768,0],left:[0,512],right:[768,512]};
   for(const canvas of document.querySelectorAll('canvas[data-sprite]')){
    const [x,y]=sections[canvas.dataset.sprite],scratch=document.createElement('canvas');scratch.width=760;scratch.height=504;
    const ctx=scratch.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,x+4,y+4,760,504,0,0,760,504);
    const pixels=ctx.getImageData(0,0,760,504),data=pixels.data;let minX=760,minY=504,maxX=0,maxY=0;
    for(let py=0;py<504;py++)for(let px=0;px<760;px++){
     const i=(py*760+px)*4,r=data[i],g=data[i+1],b=data[i+2];
     if(b>r*.63&&b>g*1.6&&r>g*1.6){data[i+3]=0;}else{minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);}
    }
    ctx.putImageData(pixels,0,0);const width=maxX-minX+1,height=maxY-minY+1;canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(scratch,minX,minY,width,height,0,0,width,height);
   }
   state.ready=true;setPhase('sealed');setAction('掰开饼干','✦');
   send('cookie:ready',{size:{width:640,height:596},canClose:false});
  } catch(error){setAction('↻','');action.hidden=false;action.disabled=false;action.setAttribute('aria-label','重新加载');listen(action,'click',()=>location.reload(),{once:true});console.error('Fortune artwork failed:',error);}
  delete window.FORTUNE_ATLAS_DATA;
 }
 prepareArtwork();
})();
