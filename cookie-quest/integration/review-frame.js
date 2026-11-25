/* Optional layout-review skin. Original module markup, state and assets stay intact. */
(() => {
  if (new URLSearchParams(location.search).get('layout') !== 'review') return;
  const id = location.pathname.split('/').filter(Boolean)[location.pathname.split('/').filter(Boolean).indexOf('modules')+1];
  const styles = [], observers = [];
  let dead = false, readerRequested = false, reader = null;

  function setKhapseReader(expanded) {
    readerRequested = !!expanded;
    if (!reader || dead) return;
    if (reader.host.hasAttribute('data-cq-reader') === readerRequested) return;
    document.documentElement.classList.toggle('cq-khapse-reader', readerRequested);
    reader.host.toggleAttribute('data-cq-reader', readerRequested);
    // Only the dialog moves; the original goal, tower and controls stay in order.
    (readerRequested ? reader.window : reader.stage).append(reader.overlay);
  }

  function addStyle(root, css) {
    if (!root || dead) return;
    const style = document.createElement('style');
    style.dataset.cookieLayoutReview = id;
    style.textContent = css;
    root.append(style);
    styles.push(style);
  }

  function naturalHeight(element) {
    let last = 0;
    const report = () => {
      if (dead || !element.isConnected) return;
      const height = Math.ceil(Math.max(element.scrollHeight, element.getBoundingClientRect().height));
      if (!Number.isFinite(height) || height < 1 || Math.abs(height - last) < 2) return;
      last = height;
      parent.postMessage({source:'cookie-host-adapter', projectId:id, type:'natural-size', height}, location.origin);
    };
    const observer = new ResizeObserver(report);
    observer.observe(element);
    observers.push(observer);
    // A linked module stylesheet or original asset may finish after DOMContentLoaded.
    element.getRootNode().querySelectorAll('link[rel="stylesheet"],img').forEach(el => el.addEventListener('load', report, {once:true}));
    report();
  }

  function apply() {
    if (dead) return;
    addStyle(document.head, `
      html,body { margin:0!important; padding:0!important; min-height:0!important; }
      html { background:transparent!important; }
    `);



    if (id === 'khapse') {
      addStyle(document.head, `
        body,#khapse { background:transparent!important; }
        #khapse { width:100%!important; max-width:390px!important; margin:0!important; }
        html.cq-khapse-reader,html.cq-khapse-reader body { overflow:hidden; }
      `);
      const shadow = document.getElementById('khapse')?.shadowRoot;
      addStyle(shadow, `
        :host { display:block; }
        .window { position:relative; padding:0!important; border:0!important; box-shadow:none!important; background:#ede0af!important; }
        .page { border:0!important; }
        /* Keep the original .bar and buttons: the module's music logic queries them. */
        .bar { position:relative!important; display:block!important; height:0!important; min-height:0!important; padding:0!important; background:none!important; border:0!important; overflow:visible!important; }
        .bar>span { display:none!important; }
        .bar>button { position:absolute!important; top:3px!important; z-index:8; height:20px!important; margin:0!important; }
        .bar>.music-toggle { right:49px!important; width:78px!important; padding:0 4px!important; font:11px/16px Tahoma,Arial,sans-serif!important; white-space:nowrap; }
        .bar>[data-action="pause"] { right:25px!important; width:20px!important; }
        .bar>[data-action="close"] { right:2px!important; width:20px!important; }
        .menu { min-height:26px!important; height:26px!important; padding-right:132px!important; }
        .address { margin:0!important; }
        .statusline { margin:0!important; }
        /* Host-paused windows retain their scene; a user pause remains visible when active. */
        :host-context(html.cq-paused) .paused { display:none!important; }

        /* Enlarge the original portrait page without rearranging its content. */
        :host([data-cq-reader]) .stage { transition:none; }
        :host([data-cq-reader]) .goal strong { font-size:14px; }
        :host([data-cq-reader]) .goal span { font-size:12px; }
        :host([data-cq-reader]) .count { font-size:15px; }
        :host([data-cq-reader]) .count strong { font-size:23px; }
        :host([data-cq-reader]) .hint { font-size:14px; }
        :host([data-cq-reader]) .actions button { font-size:14px; }
        :host([data-cq-reader]) .rule-note { font-size:10px; }
        :host([data-cq-reader]) .window>.overlay { position:absolute; inset:52px 0 19px; z-index:20; padding:12px; }
        :host([data-cq-reader]) .dialog { font-size:18px; line-height:1.6; padding:0 15px 15px; }
        :host([data-cq-reader]) .dialog h2 { font-size:23px; }
        :host([data-cq-reader]) .dialog .quiet,:host([data-cq-reader]) .dialog .source { font-size:15px; }
        :host([data-cq-reader]) .dialog button { font-size:18px; min-height:34px; }

      `);
      const windowElement = shadow?.querySelector('.window');
      if (windowElement) {
        reader={host:document.getElementById('khapse'),window:windowElement,stage:shadow.querySelector('.stage'),overlay:shadow.querySelector('.overlay')};
        setKhapseReader(readerRequested);
        naturalHeight(windowElement);
        parent.postMessage({source:'cookie-host-adapter',projectId:id,type:'ready'},location.origin);
      }
    }

    if (id === 'timtam') {
      const shadow = window.timtam?.element?.shadowRoot || document.querySelector('#module')?.firstElementChild?.shadowRoot;
      addStyle(shadow, `
        .shell { margin:0!important; padding:0!important; border:0!important; box-shadow:none!important; }
        .menu { height:22px!important; gap:13px!important; }
        .menu>.path { display:none!important; }
        .statusbar { display:none!important; }
        .viewport { border:0!important; }
      `);
    }



    if (id === 'gingerbread') {
      addStyle(document.head, `
        html,body { background:transparent!important; }
        #ad { width:100%!important; max-width:none!important; margin:0!important; }
      `);
      addStyle(window.gingerbread?.root?.shadowRoot, `
        .window { padding:0!important; border:0!important; box-shadow:none!important; }
        .film-column { margin:0!important; }
      `);
    }



    if (id === 'kungu') {
      addStyle(document.head, `
        .window { padding:0!important; border:0!important; box-shadow:none!important; }
        .paper { border:0!important; }
      `);
    }
  }

  function destroy() {
    if (dead) return;
    if(reader){setKhapseReader(false);reader=null;}
    dead = true;
    observers.forEach(observer => observer.disconnect());
    styles.forEach(style => style.remove());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  else apply();
  window.addEventListener('pagehide', destroy, {once:true});
  window.addEventListener('message', event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.source !== 'cookie-desktop' || event.data.projectId !== id) return;
    if(event.data.type==='khapse-reader'&&id==='khapse')setKhapseReader(event.data.expanded);
    if(event.data.type==='destroy')destroy();
  });
})();
