(() => {
  'use strict';
  const moduleId = 'desert-disco';
  const version = 'Q9-delivery-2026-11-17';
  const video = document.getElementById('advert');
  const playButton = document.getElementById('play');
  const replayButton = document.getElementById('replay');
  const soundButton = document.getElementById('sound');
  const status = document.getElementById('status');
  const time = document.getElementById('time');
  const params = new URLSearchParams(location.search);
  let active = params.get('autoplay') !== '0';
  let completed = false;
  let sentComplete = false;
  let resumeWhenVisible = false;
  let readySent = false;
  let parentOrigin = '*';
  try {
    const origin = new URL(document.referrer).origin;
    if (origin !== 'null') parentOrigin = origin;
  } catch (_) {}
  const formatTime = n => {
    const seconds = Math.max(0, Math.floor(Number.isFinite(n) ? n : 0));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  };
  const getState = () => ({
    moduleId, version, currentTime: video.currentTime,
    duration: Number.isFinite(video.duration) ? video.duration : 26,
    paused: video.paused, muted: video.muted, active, completed,
    ready: video.readyState >= 1
  });
  const emit = (event, extra = {}) => {
    const detail = { type: 'cookie-module:' + event, ...getState(), ...extra };
    window.dispatchEvent(new CustomEvent('cookie-module-' + event, { detail }));
    if (window.parent !== window) window.parent.postMessage(detail, parentOrigin);
  };
  const update = () => {
    playButton.textContent = video.paused ? '播放' : '暂停';
    soundButton.textContent = video.muted ? '开启声音' : '静音';
    soundButton.setAttribute('aria-pressed', String(video.muted));
    time.value = formatTime(video.currentTime) + ' / ' + formatTime(video.duration || 26);
  };
  const play = async () => {
    active = true;
    if (document.hidden) { resumeWhenVisible = true; return false; }
    try {
      if(video.error)video.load();
      await video.play();
      return true;
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        status.textContent = '点击播放，开启声音';
        emit('needs-user-gesture');
      } else if (error.name !== 'AbortError') {
        status.textContent = '暂时无法播放';
        emit('error', { reason: error.name });
      }
      update();
      return false;
    }
  };
  const pause = () => { resumeWhenVisible = false; video.pause(); update(); };
  const restart = () => {
    completed = false; sentComplete = false;
    video.currentTime = 0;
    return play();
  };
  const setActive = value => {
    active = Boolean(value);
    if (active) {
      if (!completed) return play();
    } else {
      pause();
    }
    emit('state');
    return Promise.resolve(false);
  };
  const setMuted = value => { video.muted = Boolean(value); update(); };
  const onReady = () => {
    document.getElementById('error').hidden=true;
    update();
    if (readySent) return;
    readySent = true; emit('ready');
    if (active) play();
    else status.textContent = '点击播放';
  };
  video.addEventListener('loadedmetadata', onReady);
  video.addEventListener('timeupdate', update);
  video.addEventListener('volumechange', update);
  video.addEventListener('play', () => {
    active = true;
    if (completed && video.currentTime < video.duration - 0.1) {
      completed = false; sentComplete = false;
    }
    status.textContent = '播放中'; update(); emit('state');
  });
  video.addEventListener('pause', () => {
    if (!video.ended) status.textContent = '已暂停';
    update(); emit('state');
  });
  video.addEventListener('ended', () => {
    completed = true; status.textContent = '播放完成'; update();
    if (!sentComplete) { sentComplete = true; emit('complete'); }
  });
  video.addEventListener('error', () => {
    document.getElementById('error').hidden = false;
    status.textContent = '载入失败';
    emit('error', { reason: 'media-load-failed', code: video.error ? video.error.code : null });
  });
  playButton.addEventListener('click', () => {
    if (!video.paused) pause();
    else if (completed) restart();
    else play();
  });
  replayButton.addEventListener('click', restart);
  soundButton.addEventListener('click', () => setMuted(!video.muted));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeWhenVisible = active && !video.paused && !completed;
      video.pause();
    } else if (resumeWhenVisible && active && !completed) {
      resumeWhenVisible = false; play();
    }
  });
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.source === window) return;
    if (parentOrigin !== '*' && event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || data.moduleId !== moduleId) return;
    switch (data.type) {
      case 'cookie-module:activate': setActive(true); break;
      case 'cookie-module:deactivate': setActive(false); break;
      case 'cookie-module:play': play(); break;
      case 'cookie-module:pause': pause(); break;
      case 'cookie-module:restart': restart(); break;
      case 'cookie-module:mute': setMuted(data.muted); break;
      case 'cookie-module:get-state': emit('state'); break;
    }
  });
  window.CookieModule = Object.freeze({ moduleId, version, play, pause, restart, setActive, setMuted, getState });
  update();
  if (video.readyState >= 1) onReady();
})();
