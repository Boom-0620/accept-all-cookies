/* Host-owned excerpt of the delivered orchestra recording. */
const START_OFFSET = 9.8;
const DURATION = 9.6;
const MAX_VOLUME = 0.6;
const FADE_IN = 0.15;
const FADE_OUT = 0.5;

export function createBandJingle({duration=DURATION,maxVolume=MAX_VOLUME,onFinish=()=>{}} = {}) {
  const audio = new Audio('/accept-all-cookies/modules/cookie-band/assets/previous-version-music.m4a');
  // The host creates this only when the little door is clicked.
  audio.preload = 'auto';
  audio.loop = false;
  audio.volume = 0;

  const events = new AbortController();
  let started = false;
  let active = true;
  let muted = false;
  let finished = false;
  let destroyed = false;
  let frame = null;
  let deadline = null;
  let rampAt = START_OFFSET;
  let request = 0;

  const elapsed = () => Math.max(0, audio.currentTime - START_OFFSET);
  const canPlay = () => started && active && !muted && !finished && !destroyed;

  function cancelClock() {
    if (frame !== null) cancelAnimationFrame(frame);
    if (deadline !== null) clearTimeout(deadline);
    frame = deadline = null;
  }

  function pause() {
    ++request;
    cancelClock();
    audio.pause();
    audio.volume = 0;
  }

  function finish() {
    if(finished)return;
    finished = true;
    pause();
    onFinish();
  }

  function setVolume() {
    const opening = Math.max(0, audio.currentTime - rampAt) / FADE_IN;
    const closing = Math.max(0, duration - elapsed()) / FADE_OUT;
    audio.volume = canPlay() ? maxVolume * Math.min(1, opening, closing) : 0;
  }

  function tick() {
    frame = null;
    if (!canPlay() || audio.paused) return;
    if (elapsed() >= duration) { finish(); return; }
    setVolume();
    frame = requestAnimationFrame(tick);
  }

  function checkEnd() {
    deadline = null;
    if (!canPlay() || audio.paused) return;
    const remaining = duration - elapsed();
    if (remaining <= 0) { finish(); return; }
    deadline = setTimeout(checkEnd, Math.max(20, remaining * 1000));
  }

  function beginClock() {
    if (!canPlay() || audio.paused) return;
    if (frame === null) tick();
    if (deadline === null) checkEnd();
  }

  function resume() {
    if (!canPlay()) { pause(); return Promise.resolve(); }
    if (elapsed() >= duration) { finish(); return Promise.resolve(); }
    if (!audio.paused) { beginClock(); return Promise.resolve(); }
    rampAt = Math.max(START_OFFSET, audio.currentTime);
    setVolume();
    const version = ++request;
    return Promise.resolve(audio.play()).then(() => {
      if (!canPlay()) pause();
      else beginClock();
    }).catch(() => {
      // A browser can decline playback; leave the rest of the desktop usable.
      if (version === request) { cancelClock(); audio.volume = 0; }
    });
  }

  function start() {
    if (finished || destroyed) return Promise.resolve();
    if (!started) {
      started = true;
      try { audio.currentTime = START_OFFSET; } catch (_) { /* metadata will seek */ }
    }
    return resume();
  }

  function sync(next = {}) {
    if (typeof next.active === 'boolean') active = next.active;
    if (typeof next.muted === 'boolean') muted = next.muted;
    if (!canPlay()) pause();
    else resume();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    finish();
    events.abort();
    audio.removeAttribute('src');
    audio.load();
  }

  audio.addEventListener('loadedmetadata', () => {
    if (started && !finished && !destroyed && audio.currentTime < START_OFFSET) {
      audio.currentTime = START_OFFSET;
      rampAt = START_OFFSET;
    }
  }, {signal: events.signal});
  audio.addEventListener('playing', beginClock, {signal: events.signal});
  audio.addEventListener('timeupdate', () => {
    if (started && !finished && elapsed() >= duration) finish();
  }, {signal: events.signal});
  audio.addEventListener('ended', finish, {signal: events.signal});

  return Object.freeze({
    start, sync, finish, destroy,
    getState: () => ({
      currentTime: audio.currentTime,
      elapsed: Math.min(duration, elapsed()),
      paused: audio.paused,
      finished, destroyed, started, active, muted,
      volume: audio.volume,
      startOffset: START_OFFSET,
      duration,
    }),
  });
}
