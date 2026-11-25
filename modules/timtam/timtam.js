/* Tim Tam Slam — local, dependency-free module. See README.md for lifecycle contract. */
(function(global){
'use strict';
const base=new URL('.',document.currentScript.src).href;
const completed=new Set();
const TOTAL=32, INTRO=4.8, COUNTDOWN=1.8, CELEBRATION=3.2;
// A fair fixed pace: no hidden catch-up, larger sips or input-dependent speed.
function cpuInterval(sips){return sips<12?.29+Math.random()*.06:sips<24?.265+Math.random()*.05:.205+Math.random()*.05;}
const DIRECTIONS=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'], LEFT_KEYS=['KeyW','KeyS','KeyA','KeyD'], ARROWS=['↑','↓','←','→'];
function create(container,options={}){
 if(typeof container==='string')container=document.querySelector(container);
 if(!container)throw new Error('TimTam: mount container is required');
 const host=document.createElement('div');container.appendChild(host);
 const shadow=host.attachShadow({mode:'open'});
 const pads=[0,1].map(player=>`<div class="key-pad ${player?'right':'left'}"><span class="pad-label">${player?'CPU':'↑ ↓ ← →'}</span><div class="key-row">${ARROWS.map((arrow,dir)=>`<button class="key-button" data-player="${player}" data-dir="${dir}" aria-label="玩家${player+1}方向${arrow}">${arrow}</button>`).join('')}</div></div>`).join('');
 shadow.innerHTML=`<link rel="stylesheet" href="${base}timtam.css">
 <section class="shell" tabindex="0" role="region" aria-label="Tim Tam 吸管竞赛">
  <div class="titlebar"><span class="appicon">▧</span><span class="title">Tim Tam Slam - Promo (1998)</span><button class="winbtn pause-button" title="暂停比赛" aria-label="暂停比赛">Ⅱ</button><button class="winbtn close-button" title="关闭窗口" aria-label="关闭窗口">×</button></div>
  <div class="menu"><span><u>F</u>ile</span><span><u>P</u>lay</span><button class="link help-button"><u>H</u>ow to slam</button><button class="link sound">声音：开</button><span class="path">Address: timtam-slam.local / promo</span></div>
  <div class="viewport"><div class="stage banner">
   <canvas class="scene" width="380" height="150" aria-hidden="true"></canvas><div class="brand">TimTam<small>®</small></div><h2 class="headline">TIM TAM <b>SLAM!</b></h2><div class="edition"><strong>1998</strong><br>Junk-Food<br>Promo!</div>
   <div class="banner-ui"><div class="banner-sub">把饼干当吸管。敢来一口吗？</div><button class="raised primary start">▸ 开始挑战</button><button class="raised start-duo">▸ 双人挑战</button></div>
   <div class="game-ui" hidden>
    <div class="play-mode"><h2>PLAY MODE</h2><button class="mode selected" data-mode="cpu">VS CPU<small>单人 · ↑ ↓ ← →</small></button><button class="mode" data-mode="duo">2 PLAYERS<small>W/S/A/D · 方向键</small></button></div>
    <output class="timer" aria-label="比赛计时">00:00.0</output><div class="tag p1">P1</div><div class="tag p2">CPU</div><div class="vs">VS</div>${pads}
    <span class="sip-count left">0 / 32 口</span><span class="sip-count right">0 / 32 口</span><span class="sip-pop left">SIP!</span><span class="sip-pop right">SIP!</span>
    <div class="tutorial" hidden><h3>饼干，就是吸管！</h3><ol><li class="t1">咬掉 <b>相对的两个角</b></li><li class="t2">把 <b>下角浸入牛奶</b></li><li class="t3">嘴对上角吸，<b>牛奶穿过饼干</b></li></ol><div class="practice-prompt">看清两处开口…</div><div class="tutorial-key-title">按亮起的键，试吸四口</div></div>
    <div class="tutorial-mouth" hidden>从上角<br>吸牛奶</div><div class="tutorial-dip" hidden>下角浸入牛奶</div>
    <div class="count-card" hidden></div>
    <div class="winner-banner" hidden aria-hidden="true"><span class="winner-name"></span><strong>WINNER!</strong></div>
    <div class="loss-banner" hidden aria-hidden="true"><strong>YOU LOSE</strong><span>挑战失败</span></div>
    <button class="reward-hit" hidden aria-label="咬一口冠军饼干"><span class="sr-only">点击饼干，咬一口</span></button><div class="reward-prompt" hidden>点击饼干<br><b>一口一口吃掉！</b></div>
    <div class="result-actions" hidden><button class="raised primary return-home">↩ 返回主页面</button><button class="raised again">▸ AGAIN 重赛</button><button class="raised close-button">▸ CLOSE 关闭</button></div>
   </div>
   <aside class="help" hidden><strong>HOW TO SLAM</strong><p>咬开相对两角 → 下角浸入牛奶 → 从上角吸。<br><b>牛奶要穿过饼干，饼干就是吸管。</b></p><p>单人依次按 ↑ ↓ ← →，循环吸饮。<br>双人：左边 W S A D，右边 ↑ ↓ ← →。<br>每按对一次吸一口；按错、长按都不吸。</p><button class="raised help-close">知道了</button></aside>
   <div class="pause-scrim" hidden><div class="pause-card"><strong>TAKE A BREATHER.</strong><p>比赛已暂停。</p><button class="raised resume">▸ 继续</button></div></div><div class="loading">正在准备巧克力饼干…</div>
  </div></div>
  <div class="statusbar"><span class="status">READY</span><span class="signal">● 待机</span></div><p class="sr-only live" aria-live="polite"></p>
 </section>`;
 const $=s=>shadow.querySelector(s), $$=s=>[...shadow.querySelectorAll(s)];
 const shell=$('.shell'),stage=$('.stage'),canvas=$('canvas'),ctx=canvas.getContext('2d');
 const aborter=new AbortController(),signal=aborter.signal;
 const bind=(el,event,fn,opts={})=>el.addEventListener(event,fn,{...opts,signal});
 const key=options.completionKey||'timtam';
 if(options.completed)completed.add(key);
 let state='banner',mode='cpu',active=false,paused=false,destroyed=false,loaded=false;
 let phaseTime=0,elapsed=0,softTime=0,winner=null,lastFrame=0,raf=null,nextCPU=.32;
 let celebrationTime=CELEBRATION,celebrationBeat=0;
 let practice=0,trophyTime=0,bites=0,biteAge=99,eatenTime=0,visualTime=0;
 let errors=[0,0];
 const rewardCanvas=document.createElement('canvas');rewardCanvas.width=64;rewardCanvas.height=132;const rewardCtx=rewardCanvas.getContext('2d');
 const reducedMotion=!!global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 let sips=[0,0],display=[1,1],flashes=[0,0],held=new Set(),muted=!!options.muted,audio=null;
 const voices=new Set();
 const sprite=new Image();sprite.src=base+'assets/biscuits.png';
 const texture=document.createElement('canvas');texture.width=380;texture.height=150;
 const tx=texture.getContext('2d'),pixels=tx.createImageData(380,150);let seed=1998;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<150;y++)for(let x=0;x<380;x++){const a=Math.atan2(y-85,x-187),r=Math.hypot(x-187,y-85),ray=Math.floor((a+Math.PI)/.16)%2;const n=(random()-.5)*78;const shade=Math.max(.5,1-r/580);const c=ray?[242,96,8]:[177,26,5];const i=(y*380+x)*4;for(let j=0;j<3;j++)pixels.data[i+j]=Math.round(Math.max(0,Math.min(255,c[j]*shade+n))/12)*12;pixels.data[i+3]=255;}
 tx.putImageData(pixels,0,0);
 function announce(s){$('.live').textContent=s;}
 function status(s){$('.status').textContent=s;}
 function hasFocus(){return document.activeElement===host;}
 function ensureAudio(){if(destroyed||muted)return;try{if(!audio)audio=new (global.AudioContext||global.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(e){}}
 function tone(frequency,duration,volume,type='triangle'){
  if(!audio||muted||paused||!active||destroyed||audio.state!=='running')return;
  try{
   const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
   osc.type=type;osc.frequency.setValueAtTime(frequency,t);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   osc.connect(gain);gain.connect(audio.destination);voices.add(osc);
   osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
   osc.start();osc.stop(t+duration+.025);
  }catch(e){}
 }
 function sound(kind){if(kind==='bite'){tone(125,.11,.035,'square');tone(960,.035,.018,'triangle');}else tone(285,.065,.022,'sine');}
 function fanfareBeat(beat){
  const notes=beat===0?[392,196]:beat===1?[523.25,261.63]:[523.25,659.25,783.99,130.81];
  notes.forEach((frequency,i)=>tone(frequency,beat===2?.68:.19,i===0?.07:.035,'triangle'));
 }
 function isLoss(){return mode==='cpu'&&winner===1;}
 function failureBeat(beat){
  const notes=beat===0?[311.13,155.56]:beat===1?[261.63,130.81]:[196,233.08,98];
  notes.forEach((frequency,i)=>tone(frequency,beat===2?.72:.22,i===0?.055:.028,'triangle'));
 }
 function celebrationStep(dt){
  if(winner===null||celebrationTime>=CELEBRATION)return;
  celebrationTime=Math.min(CELEBRATION,celebrationTime+dt);
  const beats=isLoss()?[0,.3,.6]:[0,.26,.52];
  while(celebrationBeat<beats.length&&celebrationTime>=beats[celebrationBeat]){
   (isLoss()?failureBeat:fanfareBeat)(celebrationBeat++);
  }
  if(isLoss())return;
  const lastBeat=beats[Math.max(0,celebrationBeat-1)],age=celebrationTime-lastBeat;
  const pop=reducedMotion?1:1+.13*Math.max(0,1-age/.24);
  const entrance=reducedMotion?1:Math.min(1,celebrationTime/.12);
  $('.winner-banner').style.transform=`rotate(-3deg) scale(${pop*(.72+.28*entrance)})`;
 }
 function stopSound(){for(const o of voices){try{o.stop();}catch(e){}}voices.clear();if(audio&&audio.state==='running')audio.suspend().catch(()=>{});}
 function fit(){if(destroyed)return;const w=$('.viewport').clientWidth;const scale=w/760;stage.style.transform=`scale(${scale})`;$('.viewport').style.height=`${(state==='banner'?146:300)*scale+4}px`;}
 const ro=new ResizeObserver(fit);ro.observe(shell);
 function requestFrame(){if(!destroyed&&!paused&&raf===null){lastFrame=performance.now();raf=requestAnimationFrame(frame);}}
 function frame(now){raf=null;if(destroyed||paused)return;const dt=Math.min(.1,(now-lastFrame)/1000);lastFrame=now;step(dt);if(destroyed)return;draw();if(!paused&&(['intro','countdown','playing','softening','trophy'].includes(state)||(state==='eaten'&&eatenTime<1.4))){raf=requestAnimationFrame(frame);}}
 function updateKeys(){
  $$('[data-dir]').forEach(button=>{
   const player=Number(button.dataset.player),dir=Number(button.dataset.dir),index=state==='intro'?practice:sips[player];
   button.textContent=mode==='duo'&&player===0?['W','S','A','D'][dir]:ARROWS[dir];
   button.disabled=(player===1&&mode==='cpu')||(state==='intro'&&(player===1||phaseTime<INTRO))||!['ready','intro','playing'].includes(state);
   button.classList.toggle('next',index%4===dir&&!(player===1&&mode==='cpu'));
   button.classList.toggle('pressed',flashes[player]>0&&((index+3)%4===dir));
   button.setAttribute('aria-label',`玩家${player+1} ${button.textContent}${index%4===dir?' 下一步':''}`);
  });
  $$('.key-pad').forEach((pad,i)=>pad.classList.toggle('wrong',errors[i]>0));
  $('.key-pad.left .pad-label').textContent=mode==='cpu'?'↑ ↓ ← → 循环':'P1 · W S A D';
  $('.key-pad.right .pad-label').textContent=mode==='cpu'?'CPU · AUTO':'P2 · ↑ ↓ ← →';
 }
 function setMode(value){
  if(!['cpu','duo'].includes(value)||!['ready','banner'].includes(state))return;
  mode=value;$$('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
  $('.p2').textContent=mode==='cpu'?'CPU':'P2';updateKeys();
 }
 function reveal(){
  if(destroyed||!loaded)return;
  if(raf!==null){cancelAnimationFrame(raf);raf=null;}
  stopSound();state='ready';paused=false;stage.className='stage';
  $('.banner-ui').hidden=true;$('.game-ui').hidden=false;$('.pause-button').textContent='Ⅱ';
  ['.winner-banner','.loss-banner','.result-actions','.tutorial','.tutorial-mouth','.tutorial-dip','.count-card','.pause-scrim','.help','.reward-hit','.reward-prompt'].forEach(sel=>$(sel).hidden=true);
  $$('[data-mode]').forEach(b=>b.disabled=false);
  sips=[0,0];display=[1,1];elapsed=0;softTime=0;winner=null;practice=0;bites=0;errors=[0,0];trophyTime=0;biteAge=99;eatenTime=0;visualTime=0;
  celebrationTime=CELEBRATION;celebrationBeat=0;flashes=[0,0];$('.timer').style.transform='';$('.p1').classList.remove('champion');$('.p2').classList.remove('champion');$('.timer').textContent='00:00.0';
  $('.reward-hit').disabled=true;$('.reward-prompt').innerHTML='点击饼干<br><b>一口一口吃掉！</b>';
  $('.again').textContent='▸ AGAIN 重赛';
  setMode(mode);activate();status('SELECT MODE');fit();draw();
 }
 function returnHome(){
  if(destroyed||!loaded)return;
  if(raf!==null){cancelAnimationFrame(raf);raf=null;}
  reveal();held.clear();phaseTime=0;state='banner';stage.className='stage banner';
  $('.banner-ui').hidden=false;$('.game-ui').hidden=true;$('.pause-button').textContent='Ⅱ';
  status('READY');fit();draw();$('.start').focus({preventScroll:true});announce('已返回主页面。');
 }
 function activate(){if(destroyed)return;active=true;$('.titlebar').classList.remove('inactive');shell.focus({preventScroll:true});$('.signal').textContent=paused?'Ⅱ 暂停':'● 已激活';}
 function start(value=mode){
  if(destroyed||!loaded||!['banner','ready','softening','lost','trophy','eaten'].includes(state))return;
  reveal();setMode(value);activate();ensureAudio();held.clear();state='intro';phaseTime=0;practice=0;stage.className='stage intro';
  $('.tutorial').hidden=false;$('.tutorial-mouth').hidden=false;$('.tutorial-dip').hidden=false;
  $$('[data-mode]').forEach(b=>b.disabled=true);updateKeys();status('HOW TO SLAM');
  announce('先咬开相对的两个角，下角浸入牛奶，嘴对上角吸。看完示范后试按上、下、左、右四次，再开始比赛。');requestFrame();
 }
 function retry(){
  if(destroyed||!loaded||!['softening','lost','trophy','eaten'].includes(state))return;
  reveal();activate();ensureAudio();held.clear();countdown();requestFrame();
 }
 function countdown(){
  state='countdown';phaseTime=0;stage.className='stage';$('.tutorial').hidden=true;$('.tutorial-mouth').hidden=true;$('.tutorial-dip').hidden=true;$('.count-card').hidden=false;held.clear();display=[1,1];updateKeys();
  $('.count-card').textContent='3';$$('[data-mode]').forEach(b=>b.disabled=true);status('3 · 2 · 1');
 }
 function direction(player,dir){
  if(destroyed||paused||!active||!hasFocus())return false;
  if(state==='intro'){
   if(player!==0||phaseTime<INTRO)return false;
   if(dir!==practice%4){errors[0]=.22;tone(100,.045,.012,'square');updateKeys();return false;}
   practice++;flashes[0]=.16;sound('sip');$('.practice-prompt').textContent=`牛奶穿过饼干！ ${practice} / 4`;
   if(practice===4)countdown();else updateKeys();return true;
  }
  if(state!=='playing'||(mode==='cpu'&&player!==0))return false;
  if(dir!==sips[player]%4){errors[player]=.22;tone(100,.045,.012,'square');updateKeys();return false;}
  sip(player);updateKeys();return true;
 }
 function eat(){
  if(destroyed||paused||!active||!hasFocus()||state!=='trophy'||trophyTime<1.1||bites>=6||biteAge<.2)return false;
  bites++;biteAge=0;sound('bite');$('.reward-prompt').innerHTML=`CRUNCH!<br><b>${6-bites} 口剩余</b>`;
  announce(bites<6?`咬了一口，还剩${6-bites}口。`:'冠军饼干吃光了！');
  if(bites===6){state='eaten';eatenTime=0;stage.className='stage trophy eaten';$('.reward-hit').hidden=true;$('.reward-prompt').innerHTML='CRUNCH!<br><b>吃光了！</b>';}
  requestFrame();draw();return true;
 }
 function step(dt){
  visualTime+=dt;biteAge+=dt;
  if(state==='intro'){
   const before=phaseTime;phaseTime=Math.min(INTRO,phaseTime+dt);
   if(before<.7&&phaseTime>=.7||before<1.5&&phaseTime>=1.5)sound('bite');
   const activeStep=phaseTime<1.8?1:phaseTime<3?2:3;
   [1,2,3].forEach(n=>$('.t'+n).classList.toggle('active',n===activeStep));
   $('.tutorial-mouth').classList.toggle('lit',phaseTime>=3);$('.tutorial-dip').classList.toggle('lit',phaseTime>=1.8);
   if(phaseTime<INTRO)$('.practice-prompt').textContent=phaseTime<1.8?'两个开口，必须在相对两角':phaseTime<3?'让咬开的下角接触牛奶':'从上角吸，牛奶会穿过饼干！';
   else if(practice===0)$('.practice-prompt').textContent='轮到你试吸：按亮起的方向';
  }else if(state==='countdown'){
   phaseTime+=dt;$('.count-card').textContent=phaseTime<.5?'3':phaseTime<1?'2':phaseTime<1.5?'1':'GO!';
   if(phaseTime>=COUNTDOWN){state='playing';stage.className='stage playing';$('.count-card').hidden=true;elapsed=0;nextCPU=cpuInterval(0);held.clear();status(mode==='cpu'?'↑ ↓ ← →':'W S A D / ↑ ↓ ← →');announce('开始，按上、下、左、右循环吸饮！');}
  }else if(state==='playing'){
   elapsed+=dt;if(mode==='cpu'&&elapsed>=nextCPU){sip(1);nextCPU+=cpuInterval(sips[1]);}
   $('.timer').textContent=format(elapsed);const sprint=state==='playing'&&Math.max(...sips)>=24;stage.classList.toggle('sprint',sprint);$('.timer').style.transform=sprint&&!reducedMotion?`scale(${1+.035*Math.sin(elapsed*14)})`:'';
  }else if(state==='softening'){
   softTime+=dt;if(softTime>=1){
    softTime=1;
    if(isLoss()){state='lost';stage.className='stage loss';}
    else{state='trophy';trophyTime=0;stage.className='stage trophy';$('.reward-hit').hidden=false;$('.reward-prompt').hidden=false;}
   }
  }else if(state==='trophy'){
   trophyTime+=dt;$('.reward-hit').disabled=trophyTime<1.1;
  }else if(state==='eaten'){eatenTime+=dt;}
  celebrationStep(dt);
  for(let i=0;i<2;i++){
   display[i]+=(1-sips[i]/TOTAL-display[i])*Math.min(1,dt*20);flashes[i]=Math.max(0,flashes[i]-dt);errors[i]=Math.max(0,errors[i]-dt);
   $$('.sip-pop')[i].classList.toggle('show',flashes[i]>0);$$('.sip-count')[i].textContent=`${sips[i]} / ${TOTAL} 口`;
  }
  updateKeys();
 }
 function format(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;}
 function sip(player){if(destroyed||paused||state!=='playing'||sips[player]>=TOTAL)return false;sips[player]++;flashes[player]=.15;sound('sip');if(sips[player]===TOTAL)finish(player);return true;}
 function finish(player){
  if(state!=='playing')return;
  winner=player;state='softening';softTime=0;celebrationTime=0;celebrationBeat=0;trophyTime=0;bites=0;biteAge=99;held.clear();
  const lost=isLoss();
  stage.className=lost?'stage softening loss':'stage softening';$('.timer').style.transform='';
  $('.winner-banner').hidden=lost;$('.loss-banner').hidden=!lost;$('.result-actions').hidden=false;
  $('.again').textContent=lost?'▸ 再战一次':'▸ AGAIN 重赛';
  if(lost){
   status(`YOU LOSE / ${elapsed.toFixed(1)}s`);
   announce('挑战失败。点击再战一次可直接重新开赛，也可以返回主页面。');
  }else{
   $('.winner-name').textContent=mode==='cpu'?'YOU':`P${player+1}`;
   $(player===0?'.p1':'.p2').classList.add('champion');
   status(`${mode==='cpu'?'YOU':'P'+(player+1)} WINS / ${elapsed.toFixed(1)}s`);
   announce(`${player===0?'玩家一':'玩家二'}获胜！饼干即将戴上王冠。点击冠军饼干，一口一口吃掉。`);
  }
  celebrationStep(.001);
  if(!completed.has(key)){completed.add(key);host.dispatchEvent(new CustomEvent('cookie',{detail:{projectId:'timtam',outcome:player===0?'win':'lose'},bubbles:true,composed:true}));}
 }
 function pause(){if(destroyed||paused)return;paused=true;held.clear();if(raf!==null){cancelAnimationFrame(raf);raf=null;}stopSound();$('.pause-button').textContent='▶';$('.signal').textContent='Ⅱ 暂停';if(!['banner','ready','eaten'].includes(state)){$('.pause-scrim').hidden=false;announce('比赛暂停。');}}
 function resume(){if(destroyed)return;activate();if(document.hidden)return;paused=false;$('.pause-scrim').hidden=true;$('.pause-button').textContent='Ⅱ';$('.signal').textContent='● 已激活';held.clear();ensureAudio();requestFrame();}
 function setActive(value){if(destroyed)return;if(value){activate();}else{active=false;$('.titlebar').classList.add('inactive');pause();$('.signal').textContent='○ 未激活';}}
 function destroy(){if(destroyed)return;destroyed=true;active=false;paused=true;if(raf!==null)cancelAnimationFrame(raf);raf=null;aborter.abort();ro.disconnect();held.clear();stopSound();if(audio){audio.close().catch(()=>{});audio=null;}sprite.onload=null;sprite.onerror=null;host.remove();}
 function close(){if(destroyed)return;destroy();if(typeof options.onClose==='function')options.onClose();}
 function paintCookie(x,y,w,h,kind,angle=0,topOnly=false){if(!loaded)return;const rects=[[25,43,425,953],[538,42,433,956],[1031,85,490,916]],r=rects[kind];ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(angle);if(topOnly){ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(w*.2,-h/2);ctx.lineTo(w*.16,-h*.43);ctx.lineTo(w*.32,-h*.36);ctx.lineTo(w/2,-h*.34);ctx.lineTo(w/2,h/2);ctx.lineTo(-w/2,h/2);ctx.closePath();ctx.clip();}ctx.drawImage(sprite,...r,-w/2,-h/2,w,h);ctx.restore();}
 function glass(x,y,w,h,fill,front=false){const liquidHeight=(h-6)*.77*fill;const bottom=y+h-3,top=bottom-liquidHeight;ctx.save();if(!front){ctx.fillStyle='rgba(229,242,241,.1)';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-6,y+h);ctx.lineTo(x+6,y+h);ctx.closePath();ctx.fill();ctx.clip();const g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#cabd96');g.addColorStop(.18,'#eee3bc');g.addColorStop(.65,'#fff2d3');g.addColorStop(1,'#d8c49b');ctx.fillStyle=g;ctx.fillRect(x,top,w,h);if(fill>.006){ctx.fillStyle='#fff9e1';ctx.beginPath();ctx.ellipse(x+w/2,top,w/2,4,0,0,7);ctx.fill();ctx.fillStyle='#ead9af';for(let i=0;i<13;i++)ctx.fillRect(x+5+(i*17)%(w-10),top+3+(i*11)%Math.max(1,liquidHeight),1,1);}}else{ctx.strokeStyle='rgba(217,235,245,.85)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6,y+h-2);ctx.quadraticCurveTo(x+w/2,y+h+4,x+w-6,y+h-2);ctx.lineTo(x+w,y);ctx.stroke();ctx.strokeStyle='#c3dbea';ctx.beginPath();ctx.ellipse(x+w/2,y,w/2,6,0,0,7);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(x+w/2,y+1,w/2-1,5,0,0,Math.PI);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.34)';ctx.fillRect(x+5,y+8,2,h-18);ctx.fillRect(x+w-9,y+10,1,h-22);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(x+w/2,y+h-2,w/2-6,3,0,0,Math.PI);ctx.stroke();}ctx.restore();}
 function ring(x,y){ctx.save();ctx.strokeStyle='#ffe72d';ctx.lineWidth=1.5;ctx.setLineDash([3,2]);ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.stroke();ctx.restore();}
 function drawConfetti(){
  if(winner===null||isLoss()||celebrationTime>=CELEBRATION||reducedMotion)return;
  const t=celebrationTime,origin=winner===0?145:250,colors=['#ffe569','#fff4ce','#e6210e','#1956dd'];
  ctx.save();ctx.globalAlpha=Math.min(1,(CELEBRATION-t)*1.6);
  for(let i=0;i<42;i++){
   const angle=(i*2.399963),speed=34+(i%7)*9;
   const x=origin+Math.cos(angle)*speed*t,y=74+Math.sin(angle)*speed*t-42*t+28*t*t;
   ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle+t*(i%2?3:-3));
   ctx.fillStyle=colors[i%colors.length];ctx.fillRect(-1,-2,2+(i%2),4);ctx.restore();
  }
  ctx.restore();
 }
 function drawTutorial(){
  const p=phaseTime,dip=Math.max(0,Math.min(1,(p-1.8)/1.2)),x=92,y=27+dip*18,w=40,h=96;
  ctx.fillStyle='rgba(70,14,3,.34)';ctx.fillRect(0,27,380,123);
  if(p>=1.8)glass(68,95,85,48,.91-(p>=3?.08:0)-practice*.095,false);
  paintCookie(x,y,w,h,p<1.5?0:1,0,p>=.7&&p<1.5);
  ring(x+w-2,y+2);ring(x+2,y+h-2);
  if(p>=3){
   // Moving milk droplets INSIDE the biscuit; no separate straw is drawn.
   ctx.save();ctx.fillStyle='#fff8df';
   for(let i=0;i<8;i++){const u=((visualTime*1.1+i/8)%1);ctx.beginPath();ctx.arc(x+7+u*27,y+h-7-u*(h-14),1.6,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  if(p>=1.8)glass(68,95,85,48,1,true);
 }
 function drawCrown(x,y,scale){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#ffc928';ctx.strokeStyle='#7e2700';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(-24,5);ctx.lineTo(-28,-13);ctx.lineTo(-13,-5);ctx.lineTo(-8,-22);ctx.lineTo(2,-7);ctx.lineTo(14,-20);ctx.lineTo(18,-4);ctx.lineTo(29,-12);ctx.lineTo(24,7);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffe999';ctx.fillRect(-23,4,47,7);ctx.strokeRect(-23,4,47,7);ctx.fillStyle='#b3210a';ctx.fillRect(-3,4,6,6);ctx.fillStyle='#285de0';ctx.fillRect(-17,5,4,4);ctx.fillRect(13,5,4,4);ctx.restore();
 }
 function drawReward(){
  const t=trophyTime,zoom=Math.min(1,t/.7),ease=1-Math.pow(1-zoom,3),cx=(winner===0?145:250)+(190-(winner===0?145:250))*ease;
  const w=34+22*ease,h=84+40*ease,y=55-33*ease;
  ctx.fillStyle='rgba(76,14,0,.25)';ctx.fillRect(0,0,380,150);
  // A golden halo and coarse rotating rays behind the winner.
  ctx.save();ctx.translate(190,79);ctx.rotate(reducedMotion?0:visualTime*.13);
  for(let i=0;i<16;i++){ctx.rotate(Math.PI/8);ctx.fillStyle=i%2?'rgba(255,235,119,.46)':'rgba(255,185,39,.58)';ctx.beginPath();ctx.moveTo(22,-3);ctx.lineTo(142,-17);ctx.lineTo(142,17);ctx.closePath();ctx.fill();}ctx.restore();
  ctx.fillStyle='rgba(255,236,158,.65)';ctx.beginPath();ctx.arc(190,79,61,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff3b2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(190,79,64,0,Math.PI*2);ctx.stroke();
  rewardCtx.clearRect(0,0,64,132);rewardCtx.imageSmoothingEnabled=false;rewardCtx.globalCompositeOperation='source-over';rewardCtx.drawImage(sprite,538,42,433,956,4,4,56,124);
  const bitesAt=[[49,9,26],[8,31,29],[55,59,29],[8,85,28],[53,108,18]];
  rewardCtx.globalCompositeOperation='destination-out';
  for(let i=0;i<Math.min(bites,5);i++){const [bx,by,r]=bitesAt[i];rewardCtx.beginPath();rewardCtx.arc(bx,by,r,0,Math.PI*2);rewardCtx.fill();for(let j=0;j<7;j++){const a=j*Math.PI/3.5;rewardCtx.beginPath();rewardCtx.arc(bx+Math.cos(a)*r,by+Math.sin(a)*r,3.2,0,Math.PI*2);rewardCtx.fill();}}
  rewardCtx.globalCompositeOperation='source-over';
  if(bites<6){ctx.save();const chomp=!reducedMotion&&biteAge<.2?1-.06*Math.sin(biteAge/.2*Math.PI):1;ctx.translate(cx,y+h/2);ctx.scale(chomp,chomp);ctx.drawImage(rewardCanvas,0,0,64,132,-w/2-4,-h/2-4,w+8,h+8);ctx.restore();}
  const crownDrop=reducedMotion?1:Math.min(1,Math.max(0,(t-.45)/.5));
  const crownY=bites===6?22+Math.min(1,eatenTime/.65)*108:22-(1-crownDrop)*36;
  if(t>.45||reducedMotion)drawCrown(cx,crownY,Math.min(1,.7+.3*ease));
  if(bites>0&&biteAge<.65){ctx.fillStyle='#71300f';for(let i=0;i<16;i++){const angle=i*2.4,spread=biteAge*(28+i%4*10);ctx.fillRect(Math.round(cx+Math.cos(angle)*spread),Math.round(55+Math.min(bites,5)*14+Math.sin(angle)*spread+biteAge*biteAge*45),2+i%2,2);}}
  drawConfetti();
 }
 function draw(){
  if(destroyed)return;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,380,150);ctx.drawImage(texture,0,0);
  if(state==='banner'){ctx.save();ctx.scale(1,150/73);paintCookie(10,32,22,47,0,1.2);paintCookie(25,29,22,47,1,1.12);ctx.restore();return;}
  if(state==='intro'){drawTutorial();return;}
  if(state==='trophy'||state==='eaten'){drawReward();return;}
  paintCookie(343,89,28,65,0,1.1);paintCookie(347,113,28,65,1,1.1);
  for(let i=0;i<2;i++){
   const cx=i===0?145:250,x=cx-36;glass(x,91,69,49,display[i],false);
   let y=55,w=34,h=84,angle=.16,kind=1;
   if(state==='softening'||state==='lost'){kind=2;y=67+softTime*9;w=45;h=65;angle=.05+softTime*.06;}
   else if(state==='playing'){angle=.14+(sips[i]/TOTAL)*.07;y+=flashes[i]>0?1:0;}
   paintCookie(cx-w/2+3,y,w,h,kind,angle);glass(x,91,69,49,display[i],true);
  }
  drawConfetti();
 }
 bind($('.start'),'click',()=>start('cpu'));bind($('.start-duo'),'click',()=>start('duo'));bind($('.again'),'click',retry);bind($('.return-home'),'click',returnHome);$$('.close-button').forEach(b=>bind(b,'click',close));$$('[data-mode]').forEach(b=>bind(b,'click',()=>{activate();setMode(b.dataset.mode);draw();}));bind($('.resume'),'click',resume);bind($('.pause-button'),'click',()=>paused?resume():pause());bind($('.sound'),'click',()=>{muted=!muted;$('.sound').textContent=muted?'声音：关':'声音：开';if(muted)stopSound();else ensureAudio();});
 bind($('.help-button'),'click',()=>{if(state==='banner'){start('cpu');return;}if(['intro','countdown','playing','softening','lost','trophy'].includes(state))pause();$('.help').hidden=false;$('.pause-scrim').hidden=true;});bind($('.help-close'),'click',()=>{$('.help').hidden=true;if(paused)resume();});
 $$('[data-dir]').forEach(button=>bind(button,'click',event=>{
  if(event.detail===0)return;activate();ensureAudio();direction(Number(button.dataset.player),Number(button.dataset.dir));
 }));
 bind($('.reward-hit'),'click',()=>{activate();ensureAudio();eat();});
 bind(shell,'pointerdown',()=>{activate();},{capture:true});
 bind(shell,'keydown',event=>{
  if(destroyed||!active||!hasFocus()||event.ctrlKey||event.altKey||event.metaKey||event.isComposing)return;
  if(event.target.matches?.('input,textarea,select,[contenteditable="true"]'))return;
  if(event.code==='Escape'){event.preventDefault();if(!event.repeat)paused?resume():pause();return;}
  if(paused)return;
  if(state==='trophy'&&(event.code==='Space'||event.code==='Enter')&&event.target===$('.reward-hit')){
   event.preventDefault();event.stopPropagation();if(event.repeat||held.has(event.code))return;held.add(event.code);ensureAudio();eat();return;
  }
  if(!['intro','playing'].includes(state))return;
  let player=0,dir=DIRECTIONS.indexOf(event.code);
  if(mode==='duo'){if(dir>=0)player=state==='intro'?0:1;else dir=LEFT_KEYS.indexOf(event.code);}
  if(dir<0)return;
  event.preventDefault();event.stopPropagation();
  if(event.repeat||held.has(event.code))return;held.add(event.code);ensureAudio();direction(player,dir);
 },{capture:true});
 bind(shell,'keyup',e=>held.delete(e.code),{capture:true});
 bind(document,'pointerdown',e=>{if(!e.composedPath().includes(host))setActive(false);},{capture:true});
 bind(document,'focusin',()=>{if(!hasFocus())setActive(false);});bind(global,'blur',()=>setActive(false));bind(document,'visibilitychange',()=>{if(document.hidden)setActive(false);});
 sprite.onload=()=>{if(destroyed)return;loaded=true;$('.loading').hidden=true;draw();};sprite.onerror=()=>{if(destroyed)return;$('.loading').textContent='饼干素材未能加载，请检查 assets/biscuits.png。';};if(sprite.complete&&sprite.naturalWidth)sprite.onload();
 $('.sound').textContent=muted?'声音：关':'声音：开';fit();draw();
 return Object.freeze({start,pause,resume,setActive,destroy,getState:()=>({phase:state,mode,active,paused,destroyed,ready:loaded,sips:[...sips],elapsed,winner,practice,bites,bitesLeft:6-bites,rewardReady:state==='trophy'&&trophyTime>=1.1,nextDirections:sips.map(n=>ARROWS[n%4]),completed:completed.has(key)}),element:host});
}
 global.CookieTimTam=Object.freeze({create,version:'1.3.0'});
})(window);
