/* A complete 25-second movie timeline, synchronized to its original soundtrack.
   Six photographic cuts, slow push-ins, a brief blink and intermittent 12 fps tape glitches. */
(function (global) {
  'use strict';
  const DURATION = 25;
  const SHOTS = [
    { start: 0, end: 4.5, zoom: .08, x: .5, y: .58 },
    { start: 4.5, end: 8, zoom: .09, x: .5, y: .66 },
    { start: 8, end: 12, zoom: .10, x: .49, y: .58 },
    { start: 12, end: 16.5, zoom: .12, x: .52, y: .48 },
    { start: 16.5, end: 21, zoom: .09, x: .5, y: .65 },
    { start: 21, end: 25, zoom: .04, x: .5, y: .8 }
  ];
  // Short defects separated by several calm seconds. Never a whole-frame flash.
  const GLITCHES = [
    { start: 3.08, end: 3.42, y: 259 },
    { start: 7.17, end: 7.5, y: 181 },
    { start: 10.83, end: 11.08, y: 66 },
    { start: 14.67, end: 15, y: 214 },
    { start: 19.25, end: 19.58, y: 250 },
    { start: 22.58, end: 22.83, y: 58 }
  ];
  function create(canvas, audio, assetBase, assetSources = {}) {
    const doc = canvas.ownerDocument, win = doc.defaultView;
    const ctx = canvas.getContext('2d', { alpha: false });
    const reducedMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    canvas.width = 640; canvas.height = 360;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '温馨厨房中的姜饼家庭，将迷你成年人装饰为圣诞礼物');
    const assetURL = name => assetSources[name] || new URL(name, assetBase).href;
    audio.src = assetURL('christmas-original.wav');
    audio.preload = 'auto';
    const events = new win.EventTarget();
    let released = false, request = 0, raf = 0, lastFrame = -1;
    let ended = false, ready = false, visualLoadError = null;
    let abortPending;
    const interrupted = new Promise(resolve => { abortPending = resolve; });
    const frameNames = ['film-01.jpg','film-02.jpg','film-03.jpg','film-04.jpg','film-blink.jpg','film-05.jpg','film-06.jpg'];
    const pictures = frameNames.map(() => new win.Image());
    const cleanup = [];
    const on = (type, callback) => { audio.addEventListener(type, callback); cleanup.push(() => audio.removeEventListener(type, callback)); };
    function emit(type) { if (!released) events.dispatchEvent(new win.Event(type)); }
    function draw(t) {
      if (!ready || released) return;
      // One audio clock drives the camera, blink and defects, including after pause/resume.
      const frame = Math.floor(t * 12);
      const filmTime = frame / 12;
      const idx = t < 4.5 ? 0 : t < 8 ? 1 : t < 12 ? 2 : t < 16.5 ? ((t >= 13.25 && t < 13.5) ? 4 : 3) : t < 21 ? 5 : 6;
      const shot = SHOTS[idx > 3 ? idx - 1 : idx];
      const progress = Math.max(0, Math.min(1, (filmTime - shot.start) / (shot.end - shot.start)));
      const eased = progress * progress * (3 - 2 * progress);
      const scale = 1 + (reducedMotion ? 0 : shot.zoom * eased);
      const sw = 640 / scale, sh = 360 / scale;
      const sx = (640 - sw) * shot.x, sy = (360 - sh) * shot.y;
      const picture = pictures[idx];
      ctx.drawImage(picture, sx, sy, sw, sh, 0, 0, 640, 360);
      // Grain and defects stay inside the movie; system chrome remains crisp.
      let seed = frame + 1996;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,231,191,.045)' : 'rgba(26,9,7,.045)';
        ctx.fillRect(Math.floor(random() * 640), Math.floor(random() * 360), 2, 1);
      }
      const glitch = !reducedMotion && GLITCHES.find(cue => filmTime >= cue.start && filmTime < cue.end);
      if (glitch) {
        const colors = ['rgba(231,35,120,.52)', 'rgba(15,204,205,.48)', 'rgba(113,207,75,.42)', 'rgba(58,77,226,.5)'];
        for (let band = 0; band < 2; band++) {
          const y = glitch.y + band * 21 + Math.floor(random() * 5);
          const height = 6 + Math.floor(random() * 8);
          const shift = (band ? -1 : 1) * (7 + Math.floor(random() * 12));
          // Tear one narrow strip sideways using the same camera crop.
          ctx.drawImage(picture, sx, sy + y / scale, sw, height / scale, shift, y, 640, height);
          for (let tile = 0; tile < 15; tile++) {
            ctx.fillStyle = colors[Math.floor(random() * colors.length)];
            const x = Math.floor(random() * 80) * 8;
            ctx.fillRect(x, y + (tile % 3) * 3, (1 + Math.floor(random() * 5)) * 8, 3 + (tile % 2) * 4);
          }
          ctx.fillStyle = 'rgba(250,213,168,.25)';
          ctx.fillRect(0, y + height, 640, 1);
        }
      }
    }
    function cancelFrame() { if (raf) win.cancelAnimationFrame(raf); raf = 0; }
    function tick() {
      if (released || audio.paused || ended) { raf = 0; return; }
      const frame = Math.floor(Math.min(DURATION, audio.currentTime) * 12);
      if (frame !== lastFrame) { lastFrame = frame; draw(audio.currentTime); emit('timeupdate'); }
      raf = win.requestAnimationFrame(tick);
    }
    function loadPictures(){visualLoadError=null;return Promise.all(pictures.map((img, index) => new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Unable to load ' + frameNames[index]));
      img.src = assetURL(frameNames[index]);
    }))).then(() => { ready = true; if (!released) draw(0); }, (error) => { visualLoadError = error; emit('error'); });}
    let imageReady=loadPictures();
    on('playing', () => { ended = false; cancelFrame(); lastFrame = -1; emit('playing'); tick(); });
    on('pause', () => { cancelFrame(); emit('pause'); });
    on('waiting', () => emit('waiting'));
    on('error', () => emit('error'));
    on('timeupdate', () => { draw(Math.min(DURATION,audio.currentTime)); emit('timeupdate'); });
    on('ended', () => { ended = true; cancelFrame(); draw(DURATION); emit('timeupdate'); emit('ended'); });
    const api = {
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      async play() {
        if (released) throw new Error('Film destroyed');
        const ticket = ++request;
        if (ended) { audio.currentTime = 0; ended = false; }
        // Invoke audio.play inside the user's click. The audio clock owns the entire timeline.
        if(visualLoadError)imageReady=loadPictures();
        if(audio.error)audio.load();
        const started = audio.play();
        await Promise.race([Promise.all([imageReady, started]), interrupted]);
        if (released || ticket !== request) throw new win.DOMException('Playback interrupted', 'AbortError');
        if (visualLoadError) { audio.pause(); throw visualLoadError; }
      },
      pause() { ++request; cancelFrame(); audio.pause(); },
      removeAttribute(name) { if (name === 'src') release(); },
      load() { audio.load(); },
      get paused() { return audio.paused; },
      get ended() { return ended; },
      get currentTime() { return ended ? DURATION : audio.currentTime; },
      set currentTime(value) { ended = false; audio.currentTime = Math.max(0, Math.min(DURATION, Number(value) || 0)); lastFrame = -1; draw(audio.currentTime); },
      get volume() { return audio.volume; },
      set volume(value) { audio.volume = value; },
      get muted() { return audio.muted; },
      set muted(value) { audio.muted = value; },
      release
    };
    function release() {
      if (released) return;
      released = true; ++request; abortPending(); cancelFrame();
      cleanup.splice(0).forEach(fn => fn());
      audio.pause(); audio.removeAttribute('src'); audio.load();
      pictures.forEach(img => { img.onload = null; img.onerror = null; img.removeAttribute('src'); });
    }
    return api;
  }
  global.GingerbreadFilm = Object.freeze({ create, duration: DURATION });
})(typeof window !== 'undefined' ? window : globalThis);
