/* Host-only translation of the delivered Fortune Cookie module protocol.
   Load in its iframe after app.js, alongside the common frame-bridge.js.
   This adapter never cracks, reveals, answers, or completes a fortune itself. */
(() => {
  if (window.__cqFortuneBridgeInstalled) return;
  window.__cqFortuneBridgeInstalled = true;
  const presentation = document.createElement('link');
  presentation.rel = 'stylesheet';
  presentation.href = '/accept-all-cookies/cookie-quest/styles/fortune-layout.css';
  document.head.append(presentation);
  const projectId = 'fortune-cookie';
  const origin = location.origin;
  const events = new AbortController();
  let reported = false;
  let lastBusy = null;
  let closing = false;
  let destroyed = false;

  const send = (type, detail = {}) => {
    if (!destroyed && parent !== window) {
      parent.postMessage({source:'cookie-host-adapter', projectId, type, ...detail}, origin);
    }
  };
  function syncOperation() {
    if (destroyed) return;
    const state = window.FortuneCookie?.getState();
    const busy = !!state && !state.paused && !state.closed && !state.destroyed &&
      (state.questionOpen || ['cracked', 'revealing'].includes(state.phase));
    if (busy !== lastBusy) { lastBusy = busy; send('operation', {busy}); }
  }
  function completed(event) {
    const detail = event.detail;
    const state = window.FortuneCookie?.getState();
    if (destroyed || reported || detail?.projectId !== projectId ||
        detail.outcome !== 'fortune-read' || !state?.completed) return;
    const root = document.getElementById('fortune-window');
    if (!root) return;
    reported = true;
    root.dispatchEvent(new CustomEvent('cookie', {
      bubbles:true, composed:true,
      detail:{projectId, outcome:'fortune-read'},
    }));
    syncOperation();
  }
  function closed() {
    if (closing || destroyed) return;
    const state = window.FortuneCookie?.getState();
    if (!state?.closed || !state.completed) return;
    closing = true;
    send('close');
  }
  const observer = new MutationObserver(syncOperation);
  observer.observe(document.getElementById('fortune-window') || document.body, {
    subtree:true, attributes:true, attributeFilter:['hidden', 'data-phase', 'class'],
  });
  for (const type of ['cookie:ready', 'cookie:cracked', 'cookie:close-blocked']) {
    window.addEventListener(type, syncOperation, {signal:events.signal});
  }
  window.addEventListener('cookie:complete', completed, {signal:events.signal});
  for (const type of ['cookie:request-close', 'cookie:closed']) {
    window.addEventListener(type, closed, {signal:events.signal});
  }
  window.addEventListener('message', event => {
    const message = event.data;
    if (event.source !== parent || event.origin !== origin ||
        message?.source !== 'cookie-desktop' || message.projectId !== projectId) return;
    if (message.type === 'active') {
      window.FortuneCookie?.[message.active ? 'resume' : 'pause']();
      syncOperation();
    }
    if (message.type === 'destroy') {
      send('operation', {busy:false});
      destroyed = true;
      window.FortuneCookie?.destroy();
      observer.disconnect();
      events.abort();
    }
  }, {signal:events.signal});
  // The common bridge may receive host activity before this script finishes
  // loading. Adopt its current state; covered previews must remain suspended.
  const initiallyActive = window.CookieHostBridge?.getState().active === true;
  window.FortuneCookie?.[initiallyActive ? 'resume' : 'pause']();
  syncOperation();
  send('ready');
})();
