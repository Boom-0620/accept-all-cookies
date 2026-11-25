/* Cookie Orchestra module. No network or third-party libraries. */
(() => {
  'use strict';
  const p = new URLSearchParams(location.search);
  const overlay = p.get('mode') === 'overlay';
  const once = p.get('once') === '1';
  const duration = 600; // original 16-frame GIF: each 600 ms; 9.6 seconds total
  const frameCount = 16;
  const folder = overlay ? 'overlay_frames' : 'frames';
  const frameURL = (i) => `./assets/${folder}/frame_${String(i).padStart(2, '0')}.png`;
  const img = document.getElementById('sequence');
  const status = document.getElementById('status');
  const playButton = document.getElementById('playBtn');
  const replayButton = document.getElementById('replayBtn');
  const soundButton = document.getElementById('soundBtn');
  const sound = document.getElementById('sound');
  let i=0, isPlaying=false, timer=null, completed=false, audioEnabled=false;
  let parentOrigin = p.get('parentOrigin') || (location.protocol === 'file:' ? '*' : location.origin);
  if (overlay) document.body.classList.add('overlay');
  function emit(type) {
    if (window.parent === window) return;
    window.parent.postMessage({source:'cookie-orchestra',type,version:1},parentOrigin);
  }
  function draw(index) { i=index; img.src=frameURL(index); }
  function update() {
    playButton.textContent = isPlaying ? '暂停' : '播放';
    status.textContent = `${isPlaying?'播放中':'已暂停'} · ${i+1}/${frameCount} 帧 · ${completed?'已完成一次演出':'尚未演完一轮'}`;
  }
  function stopTick() { if (timer!==null) clearTimeout(timer); timer=null; }
  function tick() {
    if (!isPlaying) return;
    if (i+1 >= frameCount) {
      if (!completed) { completed=true; emit('module:complete'); }
      if (once) { pause(); return; }
      draw(0);
    } else draw(i+1);
    update();
    timer=setTimeout(tick,duration);
  }
  function play() {
    if(isPlaying) return;
    if(once && completed) { draw(0); completed=false; }
    isPlaying=true;
    update();
    if(audioEnabled) sound.play().catch(()=>{});
    timer=setTimeout(tick,duration);
    emit('module:play');
  }
  function pause() {
    isPlaying=false; stopTick(); sound.pause(); update(); emit('module:pause');
  }
  function replay() {
    stopTick(); completed=false; draw(0); isPlaying=false;
    if(audioEnabled) { sound.currentTime=0; }
    emit('module:replay'); play();
  }
  function toggleSound(){
    if(!sound.getAttribute('src')) return;
    audioEnabled=!audioEnabled;
    soundButton.textContent=`试听旧版配乐（${audioEnabled?'开启':'关闭'}）`;
    soundButton.setAttribute('aria-pressed',String(audioEnabled));
    if(audioEnabled && isPlaying) sound.play().catch(()=>{});
    else sound.pause();
  }
  playButton.addEventListener('click',()=>isPlaying?pause():play());
  replayButton.addEventListener('click',replay);
  soundButton.addEventListener('click',toggleSound);
  // The old music track is reference-only, and intentionally not auto-enabled.
  soundButton.title='旧版配乐为历史参考，与当前9.6秒GIF不保证同步';
  window.addEventListener('message',(e)=>{
    // Only accept same-origin host unless explicit parentOrigin was configured.
    if(e.source!==window.parent) return;
    if(location.protocol!=='file:' && e.origin!==parentOrigin) return;
    const cmd=e.data?.type;
    if(cmd==='cookie-orchestra:play') play();
    if(cmd==='cookie-orchestra:pause') pause();
    if(cmd==='cookie-orchestra:replay') replay();
    if(cmd==='cookie-orchestra:mute') {audioEnabled=false;sound.pause();soundButton.setAttribute('aria-pressed','false');soundButton.textContent='试听旧版配乐（关闭）';}
  });
  // Local relative assets: preloading helps prevent GIF-like frame jitter.
  Promise.all(Array.from({length:frameCount},(_,n)=>new Promise((resolve,reject)=>{
    const pic=new Image();pic.onload=resolve;pic.onerror=()=>reject(new Error('frame_'+n+' failed'));pic.src=frameURL(n);
  }))).then(()=>{draw(0);update();emit('module:ready');if(p.get('autoplay')!=='0') play();})
    .catch(err=>{status.textContent='资源加载失败：'+err.message; console.error(err);});
  window.cookieOrchestra={play,pause,replay,getStatus:()=>({frame:i,playing:isPlaying,completed})};
})();