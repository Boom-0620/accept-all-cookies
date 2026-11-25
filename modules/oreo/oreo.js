/* Original artwork module. No dependencies, remote requests, parent DOM writes or tracking. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = $('oreo'), scene = $('scene'), canvas = $('cream-mask');
  const ctx = canvas.getContext('2d');
  const events = new AbortController(), timers = new Set(), voices = new Set(), animations = new Set();
  const state = { step: 'banner', muted: false, emitted: false, effectSent: false,
    twist: 0, coverage: 0, scale: 1, destroyed: false, dragging: null, openedAt: 0 };
  let audio = null, master = null, soundtrack = null, brushX = 120, brushY = 120, inkReady = false;
  let options = {}, scratchBits = new Uint8Array(80 * 80), scratchTotal = 0;
  let dunkX = 0, dunkY = 0;
  let expectedOrigin = null;
  try { expectedOrigin = new URL(document.referrer).origin; } catch (_) {}
  const on = (el, name, fn, opt = {}) => el.addEventListener(name, fn, { ...opt, signal: events.signal });
  const later = (fn, ms) => { const id = setTimeout(() => {timers.delete(id); if (!state.destroyed && state.step !== 'closed') fn();}, ms); timers.add(id); return id; };
  function clearTimers() { for (const id of timers) clearTimeout(id); timers.clear(); }
  function setStep(step) {state.step = step; root.dataset.state = step;}
  function progress(value) {
    value = Math.max(0, Math.min(100, Math.round(value)));
    $('progress').style.width = value + '%';
    $('percent').textContent = String(value).padStart(2, '0') + '%';
    $('progress').parentElement.setAttribute('aria-valuenow', String(value));
  }
  function send(type, detail) {
    const message = { type, ...detail };
    const callback = type === 'cookie' ? options.onCookie : type === 'oreo:effect' ? options.onEffect : options.onResize;
    try {
      if (typeof callback === 'function') callback(message);
      else if (window.parent !== window) window.parent.postMessage(message, expectedOrigin && expectedOrigin !== 'null' ? expectedOrigin : '*');
      else window.dispatchEvent(new CustomEvent(type, {detail: message}));
    } catch (error) { console.error('[oreo] Host callback failed:', error); }
  }
  function resize() {
    const width = $('scene-wrap').clientWidth;
    if (width > 0) {
      state.scale = width / 880;
      scene.style.transform = `scale(${state.scale})`;
      $('scene-wrap').style.height = (400 * state.scale) + 'px';
    }
    const top = ($('page-body').offsetTop || 0) + ($('scene-wrap').offsetTop || 0);
    for (const id of ['cup-back','cup-front']) {$(id).style.top=top+'px'; $(id).style.transform=`scale(${state.scale})`;}
    send('oreo:resize', {projectId:'oreo', height: Math.ceil(document.body.getBoundingClientRect().height), state:state.step});
  }
  const observer = new ResizeObserver(resize);
  observer.observe(root);

  function initAudio() {
    if (state.muted || state.destroyed) return;
    try {
      if (!audio || audio.state === 'closed') {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audio = new AC(); master = audio.createGain(); master.gain.value = .16; master.connect(audio.destination);
        soundtrack = window.OreoMusic?.create(audio,master) || null;
      }
      if (audio.state === 'suspended') audio.resume().then(startMusic).catch(() => {});
      else startMusic();
    } catch (_) { /* Interaction remains complete on devices without audio. */ }
  }
  function startMusic() {
    if(soundtrack&&!state.muted&&!state.destroyed&&!['banner','closed','done'].includes(state.step))soundtrack.start();
  }
  function tone(start, duration, frequency, endFrequency, kind = 'triangle', gain = .6) {
    if (!audio || audio.state !== 'running' || state.muted) return;
    const osc = audio.createOscillator(), envelope = audio.createGain();
    const at = audio.currentTime + start;
    osc.type = kind; osc.frequency.setValueAtTime(frequency, at);
    osc.frequency.exponentialRampToValueAtTime(endFrequency || frequency, at + duration);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.001, gain), at + .015);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(envelope); envelope.connect(master); voices.add(osc);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); envelope.disconnect(); };
    osc.start(at); osc.stop(at + duration + .025);
  }
  function stopAudio() {
    if(soundtrack)soundtrack.stop();soundtrack=null;
    for (const voice of voices) {try { voice.stop(); voice.disconnect(); } catch (_) {}}
    voices.clear();
    if (audio && audio.state !== 'closed') audio.close().catch(() => {});
    audio = null; master = null;
  }
  function mute(value = true) {
    state.muted = !!value;
    $('mute').textContent = state.muted ? '♪̸' : '♫';
    $('mute').setAttribute('aria-label',state.muted?'开启声音':'静音');
    $('mute').setAttribute('title',state.muted?'开启声音':'静音');
    $('mute').setAttribute('aria-pressed', String(state.muted));
    if (state.muted) stopAudio(); else if (state.step !== 'closed') initAudio();
    return state.muted;
  }
  function showStage(name) {
    ['twist','lick','dunk'].forEach((s,i) => {
      $(s+'-stage').hidden = s !== name;
      $('step-'+s).className = s === name ? 'active' : i < ['twist','lick','dunk'].indexOf(name) ? 'complete' : '';
    });
    $('scene-title').textContent = name.toUpperCase() + '!';
    $('scene-number').textContent = '0'+(['twist','lick','dunk'].indexOf(name)+1)+' / 03';
    progress(0);
  }
  function cancelDrag() {
    const d = state.dragging;
    state.dragging = null;
    if (d && d.el && d.el.hasPointerCapture(d.id)) d.el.releasePointerCapture(d.id);
    $('brush').style.display = 'none'; $('milk-zone').classList.remove('over');
  }
  function open() {
    if (state.destroyed) return;
    cancelDrag(); clearTimers(); stopAudio();
    setStep('banner'); state.twist = 0; state.coverage = 0;
    $('banner').hidden = false; $('game').hidden = true; $('closed-message').hidden = true;
    $('done').hidden = true; scene.className = 'scene'; $('game').className='game';
    root.style.setProperty('--split','0px');root.style.setProperty('--scatter','0');root.style.setProperty('--web-blur','0px');root.style.setProperty('--smear','0px');
    $('cup-back').hidden=true;$('cup-front').hidden=true;clearCrumple();
    $('twist-cookie').style.transform = ''; $('twist-cookie').disabled = false;
    $('dunk-cookie').style.transform = ''; $('dunk-cookie').style.setProperty('--drop-transform','none'); $('dunk-cookie').disabled = false;
    dunkX = 0; dunkY = 0; resize();
  }
  function start() {
    if (state.step !== 'banner') return;
    state.openedAt = performance.now(); setStep('twist'); initAudio();
    $('banner').hidden = true; $('game').hidden = false; showStage('twist');
    $('instruction').textContent = '向右拖开，或转动饼干。';
    $('status').textContent = 'WAITING FOR A TWIST…';
    $('keyboard-help').textContent = '键盘：方向键扭开';
    resize(); $('twist-cookie').focus({preventScroll:true});
  }
  function twist(value) {
    if (state.step !== 'twist') return;
    state.twist = Math.max(state.twist, value);
    const p = Math.min(1, state.twist / 120);
    $('twist-cookie').style.transform = `translate(${p*58}px,${-p*9}px) rotate(${p*100}deg)`;
    root.style.setProperty('--scatter',String(p)); progress(p*100);
    if (p >= 1) {
      cancelDrag(); setStep('splitting'); $('twist-cookie').disabled = true;
      scene.classList.add('split'); $('status').textContent = 'EVERYTHING IS COMING APART.';
      tone(0,.13,190,80,'sawtooth',.4); tone(.09,.12,260,90,'triangle',.5);
      later(beginLick, 1100);
    }
  }
  const creamImage = new Image(); creamImage.src = 'assets/cream.webp';
  function drawCream() {
    ctx.clearRect(0,0,240,240);
    ctx.save(); ctx.beginPath(); ctx.arc(120,120,99,0,Math.PI*2); ctx.clip();
    if (creamImage.complete && creamImage.naturalWidth) ctx.drawImage(creamImage,0,0,240,240);
    else { ctx.fillStyle = '#f9f6e9'; ctx.fillRect(0,0,240,240); for(let i=0;i<800;i++){ctx.fillStyle=i%2?'#ede9d9':'#fffdf4';ctx.fillRect((i*43)%240,(i*67)%240,2,2);} }
    ctx.restore(); inkReady = true;
  }
  function beginLick() {
    setStep('lick'); showStage('lick');
    $('instruction').textContent = '按住擦奶油。';
    $('status').textContent = 'LICK! LICK! LICK!';
    $('keyboard-help').textContent = '键盘：方向键移动，空格擦拭';
    scratchBits.fill(0); scratchTotal = 0; inkReady = false; brushX = brushY = 120;
    for(let y=0;y<80;y++) for(let x=0;x<80;x++) if(Math.hypot(x*3+1.5-120,y*3+1.5-120)<99) scratchTotal++;
    drawCream(); canvas.focus({preventScroll:true});
  }
  function scratch(x,y) {
    if (state.step !== 'lick' || !inkReady) return;
    ctx.save(); ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,23,0,Math.PI*2);ctx.fill();ctx.restore();
    for(let gy=Math.max(0,Math.floor((y-24)/3));gy<Math.min(80,Math.ceil((y+24)/3));gy++) {
      for(let gx=Math.max(0,Math.floor((x-24)/3));gx<Math.min(80,Math.ceil((x+24)/3));gx++) {
        const px=gx*3+1.5,py=gy*3+1.5;
        if(Math.hypot(px-x,py-y)<=23 && Math.hypot(px-120,py-120)<99) scratchBits[gy*80+gx]=1;
      }
    }
    let erased=0;for(const bit of scratchBits) erased+=bit;
    state.coverage = erased/scratchTotal;
    const smearProgress=Math.min(1,state.coverage/.58);
    root.style.setProperty('--web-blur',(smearProgress*9).toFixed(2)+'px');
    root.style.setProperty('--smear',(smearProgress*6).toFixed(2)+'px');
    progress(smearProgress*100);
    if(state.coverage>=.58) {
      cancelDrag(); setStep('smearing');ctx.clearRect(0,0,240,240);
      $('instruction').textContent='…';
      $('status').textContent='EVERYTHING IS A BLUR.';
      tone(0,.4,280,80,'triangle',.18); later(beginDunk,1400);
    }
  }
  function scratchLine(x,y,fromX,fromY) {
    const length=Math.hypot(x-fromX,y-fromY), steps=Math.max(1,Math.ceil(length/8));
    for(let i=1;i<=steps;i++) scratch(fromX+(x-fromX)*i/steps,fromY+(y-fromY)*i/steps);
  }
  function beginDunk() {
    setStep('dunk');showStage('dunk');$('cup-back').hidden=false;$('cup-front').hidden=false;resize();
    $('instruction').textContent='把饼干拖进右侧牛奶。';
    $('status').textContent='ONE LAST DUNK…';
    $('keyboard-help').textContent='键盘：方向键移动，回车浸入';
    $('dunk-cookie').focus({preventScroll:true});
  }
  function inMilk() {
    const centerX=208+dunkX+110,centerY=140+dunkY+110;
    return centerX>=544 && centerX<=673 && centerY>=253 && centerY<=376;
  }
  function moveDunk(x,y) {
    dunkX=Math.max(-225,Math.min(470,x));dunkY=Math.max(-100,Math.min(124,y));
    const dropTransform=`translate(${dunkX}px,${dunkY}px) rotate(${dunkX/28}deg)`;
    $('dunk-cookie').style.transform=dropTransform;
    $('dunk-cookie').style.setProperty('--drop-transform',dropTransform);
    $('milk-zone').classList.toggle('over',inMilk());progress(inMilk()?85:Math.max(0,dunkX/300*65));
  }
  function dunk() {
    if(state.step!=='dunk')return;
    cancelDrag();setStep('soaking');$('dunk-cookie').disabled=true;
    scene.classList.add('wet');progress(100);
    $('instruction').textContent='';
    $('status').textContent='ABSORBING THE INTERNET…';
    tone(0,.4,240,65,'sine',.8);tone(.12,.15,560,150,'triangle',.3);tone(.4,.24,310,90,'sine',.5);
    crumplePage();
    later(()=>{$('game').classList.add('is-submerging');tone(0,.48,210,48,'sine',.9);},3100);
    later(complete,4200);
  }
  function clearCrumple() {
    for(const animation of animations) animation.cancel();
    animations.clear();$('crumple-layer').replaceChildren();
  }
  function animatePart(el,frames,timing) {
    if(typeof el.animate!=='function') {Object.assign(el.style,frames[frames.length-1]);return;}
    const animation=el.animate(frames,timing);animations.add(animation);
    animation.onfinish=()=>animations.delete(animation);
  }
  function crumplePage() {
    clearCrumple();
    const page=$('page-body'),game=$('game'),layer=$('crumple-layer');
    const width=page.clientWidth,height=page.offsetHeight,top=page.offsetTop;
    const sheet=document.createElement('div');sheet.className='fold-sheet';
    sheet.style.cssText=`width:${width}px;height:${height}px;top:${top}px`;
    layer.append(sheet);
    const centerX=width/2,centerY=height/2,columns=4,rows=3;
    // Shallow folds nest around a shared centre; opposite tiles balance the silhouette.
    const folds=[[-.27,-.29,-27],[-.04,-.35,14],[.25,-.28,33],[.34,-.04,-19],
      [-.36,-.03,19],[-.07,-.09,-10],[.11,.05,12],[.30,.22,-28],
      [-.25,.24,30],[-.04,.33,-18],[.18,.30,24],[.01,.01,-7]];
    const ballSize=width*.18;
    const reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++) {
      const i=row*columns+col,x=col*width/columns,y=row*height/rows;
      const w=width/columns+1,h=height/rows+1;
      const piece=document.createElement('div');piece.className='paper-piece';
      piece.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      const copy=page.cloneNode(true);copy.removeAttribute('id');copy.inert=true;
      copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      copy.querySelectorAll('[tabindex]').forEach(el=>el.removeAttribute('tabindex'));
      copy.style.cssText=`width:${width}px;height:${height}px;left:${-x}px;top:${-y}px`;
      piece.append(copy);sheet.append(piece);
      const [fx,fy,rotation]=folds[i];
      const dx=centerX-x-w/2+fx*ballSize,dy=centerY-y-h/2+fy*ballSize;
      const rx=(row-1)*18,ry=(col-1.5)*14;
      piece.style.setProperty('--crease-angle',(24+i*31)+'deg');
      // Keep each patch roughly square after folding; retain readable bits of the real ad.
      const sx=ballSize*.59/w,sy=ballSize*.58/h;
      animatePart(piece,[
        {transform:'translate(0px,0px) rotate(0deg) scale(1)',filter:'brightness(1)',clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'},
        {offset:.48,transform:`translate(${dx*.66}px,${dy*.66}px) rotate(${rotation*.5}deg) rotateX(${rx}deg) rotateY(${ry}deg) scale(.76,.84)`,filter:'brightness(.94)',clipPath:'polygon(4% 4%,95% 0,100% 86%,86% 100%,3% 94%,0 20%)'},
        {transform:`translate(${dx}px,${dy}px) rotate(${rotation}deg) rotateX(${rx*.6}deg) rotateY(${ry*.6}deg) scale(${sx},${sy})`,filter:`brightness(${.83+(i%4)*.085})`,clipPath:'polygon(13% 0,82% 4%,100% 29%,91% 82%,68% 100%,9% 89%,0 28%)'}
      ],{duration:reduced?450:1450,fill:'forwards',easing:reduced?'linear':'steps(12,end)',delay:reduced?0:(i%3)*40});
    }
    // The whole lumpy paper ball pauses, tips over the rim, then sinks behind the milk.
    const cupX=607.5*state.scale,cupY=$('scene-wrap').offsetTop+282*state.scale;
    const dx=cupX-width/2,dy=cupY-height/2;
    const above=dy-113*state.scale;
    animatePart(sheet,[
      {offset:0,transform:'translate(0px,0px) scale(1) rotate(0deg)',opacity:1},
      {offset:.40,transform:'translate(0px,0px) scale(1) rotate(-4deg)',opacity:1},
      {offset:.50,transform:'translate(0px,-4px) scale(1.04) rotate(5deg)',opacity:1},
      {offset:.72,transform:`translate(${dx}px,${above}px) scale(.72) rotate(-17deg)`,opacity:1},
      {offset:.83,transform:`translate(${dx+3*state.scale}px,${dy-40*state.scale}px) scale(.63) rotate(14deg)`,opacity:1},
      {offset:.97,transform:`translate(${dx}px,${dy+22*state.scale}px) scale(.32) rotate(28deg)`,opacity:0},
      {offset:1,transform:`translate(${dx}px,${dy+30*state.scale}px) scale(.24) rotate(30deg)`,opacity:0}
    ],{duration:4000,fill:'forwards',easing:reduced?'linear':'ease-in-out'});
    game.classList.add('is-crumpling');
  }
  function effects() {
    if(!state.emitted)return [];
    return [{id:'oreo-ad-residue',projectId:'oreo',kind:'horizontal-ad-strips',durationMs:8500,pointerEvents:'none',strips:[
      {text:'TWIST!  LICK!  DUNK!',background:'#0639ed',color:'#ffffff'},
      {text:'THE COOKIE HAS LEFT THE WINDOW.',background:'#ff0082',color:'#ffffff'},
      {text:'THANK YOU FOR YOUR COOKIES!',background:'#fff000',color:'#111111'}
    ]}];
  }
  function complete() {
    if(state.step!=='soaking')return;
    setStep('done');if(soundtrack)soundtrack.finish();$('game').classList.add('is-consumed');$('done').hidden=false;clearCrumple();
    ['twist','lick','dunk'].forEach(s=>$('step-'+s).className='complete');
    $('status').textContent='DUNKED. / 已完成';$('keyboard-help').textContent='';
    $('close').focus({preventScroll:true});
    if(!state.emitted) { state.emitted=true; send('cookie',{projectId:'oreo',outcome:'dunked'}); }
    if(!state.effectSent) {state.effectSent=true;send('oreo:effect',{projectId:'oreo',effects:effects()});}
  }
  function close() {
    if(state.destroyed)return;
    cancelDrag();clearTimers();stopAudio();setStep('closed');
    root.getAnimations({subtree:true}).forEach(animation=>animation.cancel());clearCrumple();
    $('banner').hidden=true;$('game').hidden=true;$('closed-message').hidden=false;
    resize();
  }
  function destroy() {
    if(state.destroyed)return;
    close();state.destroyed=true;observer.disconnect();events.abort();
  }
  const localPoint=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*240/r.width,y:(e.clientY-r.top)*240/r.height};};
  function capture(el,e,data) {if(e.button!==0)return false;e.preventDefault();initAudio();el.setPointerCapture(e.pointerId);state.dragging={el,id:e.pointerId,...data};return true;}
  const twistEl=$('twist-cookie');
  on(twistEl,'pointerdown',e=>{
    if(state.step!=='twist')return;
    const r=twistEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    capture(twistEl,e,{kind:'twist',x:e.clientX,y:e.clientY,base:state.twist,cx,cy,angle:Math.atan2(e.clientY-cy,e.clientX-cx),turn:0});
  });
  on(twistEl,'pointermove',e=>{
    const d=state.dragging;if(!d||d.kind!=='twist'||e.pointerId!==d.id)return;
    const angle=Math.atan2(e.clientY-d.cy,e.clientX-d.cx);let delta=angle-d.angle;
    if(delta>Math.PI)delta-=2*Math.PI;if(delta<-Math.PI)delta+=2*Math.PI;
    if(Math.hypot(e.clientX-d.cx,e.clientY-d.cy)>25){d.turn+=delta;d.angle=angle;}
    twist(d.base+Math.max(Math.hypot(e.clientX-d.x,e.clientY-d.y)/state.scale,Math.abs(d.turn)*180/Math.PI*1.2));
  });
  on(twistEl,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key)){e.preventDefault();initAudio();twist(state.twist+20);}});
  on(canvas,'pointerdown',e=>{if(state.step!=='lick')return;const p=localPoint(e);if(capture(canvas,e,{kind:'lick',x:p.x,y:p.y}))scratch(p.x,p.y);});
  on(canvas,'pointermove',e=>{
    const p=localPoint(e);$('brush').style.cssText=`display:block;left:${p.x/240*100}%;top:${p.y/240*100}%`;
    const d=state.dragging;if(!d||d.kind!=='lick'||e.pointerId!==d.id)return;
    e.preventDefault();scratchLine(p.x,p.y,d.x,d.y);d.x=p.x;d.y=p.y;
  });
  on(canvas,'pointerleave',()=>{$('brush').style.display='none';});
  on(canvas,'keydown',e=>{
    if(state.step!=='lick')return;
    const dirs={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};
    if(dirs[e.key]) {e.preventDefault();brushX=Math.max(21,Math.min(219,brushX+dirs[e.key][0]));brushY=Math.max(21,Math.min(219,brushY+dirs[e.key][1]));}
    else if(e.key===' '||e.key==='Enter') {e.preventDefault();initAudio();scratch(brushX,brushY);}
    else return;
    $('brush').style.cssText=`display:block;left:${brushX/240*100}%;top:${brushY/240*100}%`;
  });
  const dunkEl=$('dunk-cookie');
  on(dunkEl,'pointerdown',e=>{if(state.step==='dunk')capture(dunkEl,e,{kind:'dunk',x:e.clientX,y:e.clientY,baseX:dunkX,baseY:dunkY});});
  on(dunkEl,'pointermove',e=>{const d=state.dragging;if(!d||d.kind!=='dunk'||d.id!==e.pointerId)return;moveDunk(d.baseX+(e.clientX-d.x)/state.scale,d.baseY+(e.clientY-d.y)/state.scale);});
  on(dunkEl,'keydown',e=>{
    if(state.step!=='dunk')return;
    const dirs={ArrowLeft:[-25,0],ArrowRight:[25,0],ArrowUp:[0,-25],ArrowDown:[0,25]};
    if(dirs[e.key]){e.preventDefault();moveDunk(dunkX+dirs[e.key][0],dunkY+dirs[e.key][1]);}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();initAudio();moveDunk(290,52);dunk();}
  });
  [twistEl,canvas,dunkEl].forEach(el=>{
    on(el,'pointerup',e=>{const d=state.dragging;if(!d||d.id!==e.pointerId)return;const drop=d.kind==='dunk'&&inMilk();cancelDrag();if(drop)dunk();});
    on(el,'pointercancel',cancelDrag);
    on(el,'lostpointercapture',()=>{if(state.dragging&&state.dragging.el===el)cancelDrag();});
  });
  on($('start'),'click',start);on($('mute'),'click',()=>mute(!state.muted));
  on($('close'),'click',close);on($('reopen'),'click',open);
  on(window,'blur',cancelDrag);
  on(document,'visibilitychange',()=>{if(document.hidden){cancelDrag();if(audio&&audio.state==='running')audio.suspend().catch(()=>{});}else if(audio&&!state.muted&&state.step!=='closed')audio.resume().catch(()=>{});});
  on(window,'pagehide',destroy);
  on(window,'message',e=>{
    if(e.source!==window.parent||window.parent===window||!e.data||e.data.type!=='oreo:command')return;
    if(expectedOrigin&&e.origin!==expectedOrigin)return;
    if(e.data.action==='close')close();else if(e.data.action==='open')open();else if(e.data.action==='mute')mute(e.data.value!==false);
  });
  window.OreoModule=Object.freeze({
    open,close,destroy,mute,getEffects:effects,
    getState:()=>({step:state.step,muted:state.muted,completed:state.emitted,coverage:state.coverage,destroyed:state.destroyed}),
    configure(config={}) {options={...options,...config};if(config.parentOrigin)expectedOrigin=config.parentOrigin;}
  });
  resize();
})();
