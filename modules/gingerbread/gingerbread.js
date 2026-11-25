/* Gingerbread Christmas — dependency-free, instance-scoped module. */
(function (global) {
  'use strict';
  const scriptURL = typeof document !== 'undefined' && document.currentScript
    ? document.currentScript.src : '';
  const defaultBase = scriptURL ? new URL('./assets/', scriptURL).href : './assets/';
  const defaultStyle = scriptURL ? new URL('./gingerbread.css', scriptURL).href : './gingerbread.css';
  const time = (seconds) => '00:' + String(Math.floor(Number.isFinite(seconds) ? seconds : 0)).padStart(2, '0');

  function mountGingerbread(container, options = {}) {
    if (!container || typeof container.appendChild !== 'function') throw new TypeError('A DOM container is required.');
    const doc = container.ownerDocument;
    const root = doc.createElement('section');
    root.dataset.projectId = 'gingerbread';
    root.setAttribute('aria-label', '姜饼人的圣诞广告');
    const shadow = root.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <link rel="stylesheet">
      <article class="window" aria-label="A Very Sweet Christmas 广告播放器">
        <header class="titlebar"><span class="window-title">A Very Sweet Christmas!</span><button class="close" aria-label="关闭广告窗口" title="关闭">×</button></header>
            <main class="film-column">
              <div class="screen">
                <canvas class="film"></canvas><audio hidden preload="auto"></audio>
                <button class="cover" aria-label="Play A Very Sweet Christmas"><span class="cover-title">A Very Sweet<br>Christmas</span><span class="cover-play">▶ PLAY</span></button>
                <div class="pause-label" hidden>Ⅱ PAUSED</div>
                <div class="loading" hidden>载入录像…</div>
              </div>
              <div class="controls">
                <button class="play" aria-label="播放广告">▶ PLAY</button>
                <button class="stop" aria-label="停止并回到开头">■ STOP</button>
                <button class="sound" aria-label="静音" aria-pressed="false">♪</button>
                <input class="volume" aria-label="音量" type="range" min="0" max="1" step="0.05" value="0.65">
                <progress class="progress" value="0" max="25" aria-label="播放进度"></progress>
                <output class="time">00:00 / 00:25</output>
              </div>
            </main>
        <span class="status" role="status" aria-live="polite">准备就绪 · 点击观看</span>
      </article>`;
    const $ = (selector) => shadow.querySelector(selector);
    $('link').href = options.stylesheetURL || defaultStyle;
    const base = new URL(options.assetBase || defaultBase, doc.baseURI);
    const video = global.GingerbreadFilm.create($('canvas'), $('audio'), base, options.assetSources);
    video.volume = 0.65;
    const cover = $('.cover'), playButton = $('.play'), status = $('.status');
    let destroyed = false, completed = false, playingRequest = 0;
    const listeners = [];
    const listen = (node, type, callback) => {
      node.addEventListener(type, callback);
      listeners.push(() => node.removeEventListener(type, callback));
    };
    function updateTime() {
      $('.progress').value = video.currentTime || 0;
      $('.time').textContent = `${time(video.currentTime)} / 00:25`;
    }
    function updateSound() {
      const silent = video.muted || video.volume === 0;
      $('.sound').textContent = silent ? '♪×' : '♪';
      $('.sound').setAttribute('aria-label', silent ? '开启声音' : '静音');
      $('.sound').setAttribute('aria-pressed', String(silent));
    }
    async function resume() {
      if (destroyed) return false;
      const request = ++playingRequest;
      if (video.ended) video.currentTime = 0;
      status.textContent = '正在载入录像…';
      try {
        await video.play();
        if (destroyed || request !== playingRequest) return false;
        return true;
      } catch (error) {
        if (destroyed || request !== playingRequest || error.name === 'AbortError') return false;
        status.textContent = '暂时无法播放，请点击播放重试';
        $('.loading').hidden = true;
        return false;
      }
    }
    function pause() {
      if (destroyed) return;
      ++playingRequest;
      video.pause();
    }
    function stop() {
      if (destroyed) return;
      pause();
      video.currentTime = 0;
      cover.hidden = false;
      $('.pause-label').hidden = true;
      playButton.textContent = '▶ PLAY';
      playButton.setAttribute('aria-label', '播放广告');
      status.textContent = '准备就绪 · 点击观看';
      updateTime();
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true;
      ++playingRequest;
      listeners.splice(0).forEach((remove) => remove());
      observer.disconnect();
      video.pause();
      video.removeAttribute('src');
      video.load(); // release the decoder and embedded soundtrack immediately
      root.remove();
    }
    function toggle() { if (video.paused || video.ended) void resume(); else pause(); }
    listen(cover, 'click', () => void resume());
    listen(playButton, 'click', toggle);
    listen($('.stop'), 'click', stop);
    listen($('.close'), 'click', () => { destroy(); if (typeof options.onClose === 'function') options.onClose(); });
    listen($('.sound'), 'click', () => { video.muted = !video.muted; if (!video.muted && video.volume === 0) { video.volume = 0.65; $('.volume').value = '0.65'; } updateSound(); });
    listen($('.volume'), 'input', (event) => { video.volume = Number(event.target.value); video.muted = false; updateSound(); });
    listen(video, 'playing', () => {
      if (destroyed) return;
      cover.hidden = true;
      $('.pause-label').hidden = true;
      $('.loading').hidden = true;
      playButton.textContent = 'Ⅱ PAUSE';
      playButton.setAttribute('aria-label', '暂停广告');
      status.textContent = '正在播放 · A Very Sweet Christmas';
    });
    listen(video, 'pause', () => {
      if (destroyed || video.ended) return;
      $('.pause-label').hidden = video.currentTime === 0;
      $('.loading').hidden = true;
      playButton.textContent = '▶ PLAY';
      playButton.setAttribute('aria-label', '继续广告');
      status.textContent = '已暂停';
    });
    listen(video, 'waiting', () => { if (!video.paused) $('.loading').hidden = false; });
    listen(video, 'timeupdate', updateTime);
    listen(video, 'error', () => { $('.loading').hidden = true; status.textContent = '录像加载失败 · 请检查 assets/ 中的影像与配乐'; });
    listen(video, 'ended', () => {
      $('.pause-label').hidden = true;
      $('.loading').hidden = true;
      playButton.textContent = '↻ REPLAY';
      playButton.setAttribute('aria-label', '重播广告');
      status.textContent = 'MADE WITH LOVE · 播放完毕';
      updateTime();
      if (!completed && !destroyed) {
        completed = true;
        const EventClass = doc.defaultView.CustomEvent;
        root.dispatchEvent(new EventClass('cookie', {
          bubbles: true, composed: true,
          detail: { projectId: 'gingerbread', outcome: 'watched' }
        }));
      }
    });
    listen(root, 'keydown', (event) => {
      // Native buttons keep their usual Space behavior; K works inside the module only.
      if (event.key.toLowerCase() === 'k' && event.target.tagName !== 'INPUT') { event.preventDefault(); toggle(); }
    });
    listen(doc, 'visibilitychange', () => { if (doc.hidden) pause(); });
    listen(doc.defaultView, 'pagehide', destroy);
    const observer = new doc.defaultView.MutationObserver(() => { if (!root.isConnected) destroy(); });
    container.appendChild(root);
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    return Object.freeze({
      root, pause, resume, play: resume, stop, destroy,
      get state() { return destroyed ? 'destroyed' : video.ended ? 'ended' : video.paused ? (video.currentTime ? 'paused' : 'ready') : 'playing'; },
      get currentTime() { return video.currentTime || 0; },
      get completed() { return completed; }
    });
  }
  global.GingerbreadAd = Object.freeze({ mount: mountGingerbread, version: '1.2.0' });
})(typeof window !== 'undefined' ? window : globalThis);
