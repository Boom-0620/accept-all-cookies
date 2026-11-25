/* KHAPSE — a bounded, dependency-free module for Accept All Cookies. */
(function (global) {
  'use strict';
  const scriptURL = (document.currentScript && document.currentScript.src) || location.href;
  const defaults = new URL('.', scriptURL).href;
  const instances = new WeakMap();
  const C = global.KhapseCore;
  if (!C) throw new Error('Load core.js before khapse.js');
  function mount(host, options = {}) {
    if (!host || !host.attachShadow) throw new TypeError('Khapse.mount requires an HTML element');
    if (instances.has(host)) instances.get(host).destroy();
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    const base = new URL(options.assetBase || defaults, location.href).href;
    const abort = new AbortController();
    let state = C.createState(), dead = false, raf = 0, last = 0, clock = 0;
    let drag = null, returning = null, pulse = 0, hover = null, selected = null;
    let userPaused = false, hostPaused = false, hidden = document.hidden, modalOpen = false;
    let music = null, story = null, introActive = !!global.KhapseStory, endingActive = false;
    let atlasReady = false, assetError = false, lastHint = '', lastStatus = '';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pieces = C.pieces().sort((a,b) => a.row-b.row || [0,2,1].indexOf(a.col)-[0,2,1].indexOf(b.col));
    const getPiece = id => pieces.find(p => p.id === id);
    const parentOrigin = options.parentOrigin || (location.origin === 'null' ? '*' : location.origin);
    shadow.innerHTML = `
      <link rel="stylesheet">
      <section class="window" aria-label="Khapse 藏历新年饼塔">
        <header class="bar"><span class="logo" aria-hidden="true">✥</span><span>KHAPSE</span><span class="spacer"></span><button class="music-toggle" data-action="music" aria-label="静音" aria-pressed="true" title="点击静音">♫ 音乐开</button><button data-action="pause" title="暂停窗口" aria-label="暂停">Ⅱ</button><button data-action="close" title="关闭窗口" aria-label="关闭">×</button></header>
        <div class="menu"><button data-action="rules">File</button><button data-action="pause">View</button><button data-action="about">Help</button></div>
        <div class="address"><span>Address:</span><span>losar-khapse.local</span></div>
        <div class="page">
          <header class="masthead"><span class="flower" aria-hidden="true">✿</span><h1>KHAPSE<small>藏历新年饼塔</small></h1><span class="flower" aria-hidden="true">✿</span></header>
          <nav class="nav" aria-label="饼塔导航"><button data-action="start">开始</button><span>/</span><button data-action="rules">怎么玩</button><span>/</span><button data-action="about">关于卡塞</button><button data-action="replay-story">重看故事</button></nav>
          <div class="trim"></div>
          <div class="goal"><strong>轻轻抽出八块，收下八份新年祝愿</strong><span>留住支撑，让饼塔站稳。</span></div>
          <div class="stage">
            <canvas width="360" height="760" tabindex="0" role="application" aria-label="十六层卡塞饼塔。用鼠标向外拖动；键盘用上下选择层，左右选择块，按住空格抽出，提前松开放回，Escape 取消。"></canvas>
            <div class="status-badge">16 层 · 轻轻抽取</div>
            <div class="paused" hidden><strong>饼塔休息中</strong><p>动作和等待都已暂停。</p><button data-action="resume">继续</button></div>
            <div class="overlay" hidden><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"></section></div>
          </div>
          <section class="controls"><div class="count">已取出 <strong>0 / 8</strong></div><canvas class="collection" width="200" height="54" role="img" aria-label="收集卡塞的小盘，尚未取出"></canvas><p class="hint" role="status" aria-live="polite">向外轻拖，没抽到底就可以放回。</p><div class="actions"><button data-action="restart">重新开始</button><button data-action="close">关闭</button></div><p class="rule-note">八份祝愿为作品原创设计 · 无倒计时</p></section>
          <div class="trim"></div>
        </div>
        <footer class="statusline"><span>Done</span><span>新年卡塞 / 16 layers</span></footer>
      </section>`;
    const $ = selector => shadow.querySelector(selector);
    if (options.cssText) { const style = document.createElement('style'); style.textContent = options.cssText; $('link').replaceWith(style); }
    else $('link').href = new URL('style.css', base).href;
    const stage = $('.stage'), canvas = $('canvas'), ctx = canvas.getContext('2d');
    const badge = $('.status-badge'), hint = $('.hint'), count = $('.count strong'), collection = $('.collection');
    const overlay = $('.overlay'), dialog = $('.dialog'), pausedPanel = $('.paused');
    stage.style.backgroundImage = 'url(' + JSON.stringify(options.backgroundUrl || new URL('assets/scene.svg', base).href) + ')';
    const atlas = new Image();
    // Tight rectangles in the original, unmodified 1254-square sprite sheet.
    const crops = [[.022,.075,.954,.258],[.084,.443,.83,.189],[.052,.724,.90,.217]];
    atlas.onload = () => { if (!dead) { atlasReady = true; render(); } };
    atlas.onerror = () => { if (!dead) { assetError = true; render(); } };
    atlas.src = options.atlasUrl || new URL('assets/khapse-atlas.webp', base).href;
    function on(target, type, fn, config = {}) { target.addEventListener(type, fn, { ...config, signal: abort.signal }); }
    function paused() { return userPaused || hostPaused || hidden || modalOpen; }
    function setHint(text, danger = false) { if (text !== lastHint) { hint.textContent = text; lastHint = text; } hint.classList.toggle('danger', danger); }
    function updateStatus(text) { if (text !== lastStatus) { badge.textContent = text; lastStatus = text; } }
    function available(p) { return state.removed.indexOf(p.id) === -1; }
    function cancelDrag(immediate = false) {
      if (!drag) return;
      if (!immediate) returning = { p: drag.p, dx: drag.dx, dy: drag.dy, elapsed: 0 };
      try { if (drag.pointerId != null && canvas.hasPointerCapture(drag.pointerId)) canvas.releasePointerCapture(drag.pointerId); } catch (_) {}
      drag = null;
      canvas.classList.remove('dragging');
      setHint('已放回原位，取出数量没有增加。');
    }
    function syncMusic() {
      if(!music||dead)return;
      const st=story?.state();let track=null,time=0;
      if(introActive){track='intro';time=(st?.elapsed||0)/1000;}
      else if(endingActive){track=state.outcome;time=(st?.elapsed||0)/1000;}
      else if(state.phase!=='finished'){track='game';time=(clock/1000)%20;}
      music.sync({track,time,paused:paused()||(introActive&&!st?.ready)});
    }
    function syncPause() {
      if (dead) return;
      if (paused()) {
        cancelDrag(true); returning = null;
        cancelAnimationFrame(raf); raf = 0; last = 0;
      }
      pausedPanel.hidden = !(userPaused || hostPaused || hidden) || modalOpen;
      $('[data-action="resume"]').disabled = hostPaused || hidden;
      $('[data-action="pause"]').textContent = userPaused ? '▶' : 'Ⅱ';
      syncMusic();render();
      if (!paused() && !raf) raf = requestAnimationFrame(frame);
    }
    function showDialog(kind) {
      cancelDrag(true);
      modalOpen = true;
      const resultText = state.outcome === 'stable' ? '八块取出，饼塔站稳。' : '饼塔散开了。';
      if (kind === 'rules') dialog.innerHTML = `
        <h2 id="dialog-title">轻轻抽出，让它站稳</h2>
        <p><b>轻轻抽出八块卡塞，收下八份新年祝愿。</b>平安、健康、丰足、团圆、喜乐、顺遂、和睦、新望。留住支撑，让饼塔站稳。</p><p>这是本作品设计的祝福玩法，不是传统仪式。没有倒计时，可以慢慢观察。</p>
        <ol><li>选中一块，向塔的外侧拖动。进度满格后松手，才算取出。</li><li>未满格时松手，或按 Escape，饼干会放回。</li><li>每层有三块，至少要留两块。相邻两层不能连续缺失同侧的外缘支撑。</li><li>危险位置会先摇晃、显示原因；抽到底仍会倒塌。取出八块后，等待饼塔站稳。</li></ol>
        <p class="quiet">层数从下往上数。中间支撑不属于“左／右外缘”。这是可解释的固定游戏规则，不是对真实堆叠物理的模拟。</p>
        <p class="quiet">键盘：上下选择层，左右选择块；按住空格抽取，提前松开放回。Escape 取消。</p>
        <button data-action="dismiss">知道了，继续</button>`;
      else if (kind === 'about') dialog.innerHTML = `
        <h2 id="dialog-title">新年里的 Khapse</h2>
        <p>Khapse（卡塞）是与藏历新年 Losar 密切相关的油炸面点，有不同形状和大小。小扭结可用来待客，较大的长条中空形面点也用于新年陈设。</p>
        <p>部分饼塔顶部会搭上干酪串。本作借用饼塔、彩绘木家具和织物的视觉线索，做成一扇复古电脑窗口。</p>
        <p><b>“抽八块”是本作品原创的游戏规则，并非真实传统习俗；这里的八不代表对藏族统一幸运数字的判断。</b></p>
        <p>配乐《新年一盘卡塞》为原创合成音乐，以扎念琴式拨弦为主，加入藏胡式拉弦和笛声音色。乐器参考见 <a href="https://tipa.asia/ache-lhamo/nangma-toshey/" target="_blank" rel="noopener noreferrer">TIPA · Nangma Toeshey</a>；并非传统曲目或真实乐器录音。</p><p class="source">资料：<br><a href="https://tnp.org/tibetan-new-year-cookies-khapse/" target="_blank" rel="noopener noreferrer">Tibetan Nuns Project · Tibetan New Year Cookies or Khapse（2015）</a><br><a href="https://www.atc.org.au/khapsey-tibetan-cookie/" target="_blank" rel="noopener noreferrer">Australia Tibet Council · Khapsey (Tibetan cookie)</a><br>核对日期：2026-11-12</p>
        <button data-action="dismiss">回到饼塔</button>`;
      else dialog.innerHTML = `
        <div class="result-mark" aria-hidden="true">${state.outcome === 'stable' ? '✥' : '· · ·'}</div>
        <h2 id="dialog-title">${resultText}</h2>
        <p>${state.outcome === 'stable' ? '空缺留在塔里，支撑还在。' : state.reason}</p>
        <p class="result-sub">已取出 ${state.removed.length} / 8 · 这段故事已体验</p>
        <p>Khapse 是藏历新年的油炸面点，有长条中空、扭结等多种形状。“抽八块”是作品原创玩法。</p>
        <button data-action="restart">再试一局</button> <button data-action="dismiss">看看饼塔</button> <button data-action="about">关于卡塞</button>`;
      overlay.hidden = false;
      syncPause();
      dialog.focus({ preventScroll: true });
    }
    function hideDialog() { overlay.hidden = true; modalOpen = false; syncPause(); canvas.focus({ preventScroll: true }); }
    function restart() {
      if (dead) return;
      story?.skip();
      cancelDrag(true); returning = null; hover = null; selected = null; pulse = 0; clock = 0;
      state = C.createState(state.round + 1);
      modalOpen = false; overlay.hidden = true; userPaused = false;
      setHint('向外轻拖，没抽到底就可以放回。');
      syncPause();
    }
    function emit(event) {
      // Exactly one delivery channel per round; core has already latched emitted.
      try {
        if (typeof options.emit === 'function') options.emit(event);
        else if (global.parent !== global) global.parent.postMessage(event, parentOrigin);
        else host.dispatchEvent(new CustomEvent('cookie', { detail: event, bubbles: true, composed: true }));
      } catch (error) { console.error('Khapse cookie callback failed:', error); }
    }
    function finishDrag(commit) {
      if (!drag) return;
      const d = drag;
      if (!commit || d.progress < 1) { cancelDrag(); return; }
      drag = null;
      canvas.classList.remove('dragging');
      try { if (d.pointerId != null && canvas.hasPointerCapture(d.pointerId)) canvas.releasePointerCapture(d.pointerId); } catch (_) {}
      if (C.extract(state, d.p.id)) {
        pulse = 620;
        selected = null; hover = null;
        setHint(state.phase === 'collapsing' ? state.reason : state.phase === 'settling' ? '八块了，等饼塔慢慢站稳……' : '收下“'+global.KhapseStory.WISHES[state.removed.length-1]+'”祝愿。轻轻取下一块。', state.phase === 'collapsing');
        render();
      }
    }
    function beginDrag(p, point, pointerId, keyboard = false) {
      if (introActive || paused() || state.phase !== 'playing' || !available(p)) return;
      returning = null;
      selected = p.id;
      drag = { p, origin: point, dx: 0, dy: 0, pointerId, progress: 0, keyboard, held: 0, risk: C.preview(state, p.id) };
      canvas.classList.add('dragging');
      setHint(drag.risk.stable ? '向外拖动；提前松手就会放回。' : '继续抽出会倒塌：' + drag.risk.reason, !drag.risk.stable);
    }
    function point(event) { const r = canvas.getBoundingClientRect(); return { x: (event.clientX-r.left)*360/r.width, y: (event.clientY-r.top)*760/r.height }; }
    function pick(pt) {
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i]; if (!available(p)) continue;
        const x = pt.x-p.x, y = pt.y-p.y;
        const rx = x*Math.cos(-p.angle)-y*Math.sin(-p.angle), ry = x*Math.sin(-p.angle)+y*Math.cos(-p.angle);
        if (Math.abs(rx) < p.w*.48 && Math.abs(ry) < p.h*.4) return p;
      }
      return null;
    }
    on(canvas, 'pointerdown', e => {
      if (e.button !== 0 || drag || introActive || paused() || state.phase !== 'playing') return;
      const pt = point(e), p = pick(pt); if (!p) return;
      e.preventDefault(); canvas.focus({ preventScroll: true }); beginDrag(p, pt, e.pointerId);
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    on(canvas, 'pointermove', e => {
      if (introActive || paused()) return;
      const pt = point(e);
      if (!drag) { hover = state.phase === 'playing' ? pick(pt)?.id || null : null; return; }
      if (e.pointerId !== drag.pointerId || drag.keyboard) return;
      const sign = drag.p.col === 0 ? -1 : drag.p.col === 2 ? 1 : pt.x >= drag.origin.x ? 1 : -1;
      const outward = Math.max(0, (pt.x-drag.origin.x)*sign);
      const distance = 68 + drag.p.w*.2;
      drag.dx = sign * Math.min(outward, distance+12);
      drag.dy = Math.max(-8, Math.min(8, (pt.y-drag.origin.y)*.15));
      drag.progress = Math.min(1, outward/distance);
      setHint(drag.progress >= 1 ? (drag.risk.stable ? '松手，取出这一块。' : '松手就会倒塌；往回拖可放回。') : (drag.risk.stable ? '还没抽到底，松手可放回。' : '支撑在摇晃；松手可放回。'), !drag.risk.stable);
    });
    on(canvas, 'pointerup', e => { if (drag && !drag.keyboard && e.pointerId === drag.pointerId) finishDrag(true); });
    on(canvas, 'pointercancel', () => cancelDrag());
    on(canvas, 'lostpointercapture', () => { if (drag && !drag.keyboard) cancelDrag(); });
    on(canvas, 'pointerleave', () => { if (!drag) hover = null; });
    on(canvas, 'keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); cancelDrag(); return; }
      if (introActive || paused() || state.phase !== 'playing') return;
      if (e.key.startsWith('Arrow')) {
        e.preventDefault(); if (drag) return;
        let current = selected ? getPiece(selected) : getPiece('7-middle');
        let row = current.row, col = current.col;
        if (e.key === 'ArrowUp') row = Math.min(15,row+1);
        if (e.key === 'ArrowDown') row = Math.max(0,row-1);
        if (e.key === 'ArrowLeft') col = Math.max(0,col-1);
        if (e.key === 'ArrowRight') col = Math.min(2,col+1);
        selected = row+'-'+C.LANES[col];
        setHint('第 '+(row+1)+' 层 · '+['左','中','右'][col]+'块'+(state.removed.includes(selected) ? '已取出' : '：按住空格抽取。'));
      }
      if (e.code === 'Space') {
        e.preventDefault(); if (e.repeat || drag) return;
        const p = getPiece(selected || '7-middle'); if (p && available(p)) beginDrag(p, {x:p.x,y:p.y}, null, true);
      }
    });
    on(canvas, 'keyup', e => { if (e.code === 'Space' && drag?.keyboard) { e.preventDefault(); finishDrag(true); } });
    on(canvas, 'blur', () => { if (drag?.keyboard) cancelDrag(); });
    on(global, 'blur', () => { if (drag) cancelDrag(); });
    on(shadow, 'click', e => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'music') {syncMusic();music?.toggle();}
      else if (action === 'pause') { userPaused = !userPaused; syncPause(); }
      else if (action === 'resume') { userPaused = false; syncPause(); }
      else if (action === 'close') { api.destroy(); if (typeof options.onClose === 'function') options.onClose(); }
      else if (action === 'restart') restart();
      else if (action === 'replay-story') replayStory();
      else if (action === 'dismiss-ending') story?.skip();
      else if (action === 'rules' || action === 'about') showDialog(action);
      else if (action === 'dismiss') hideDialog();
      else if (action === 'start') { story?.skip(); if (state.phase === 'finished') restart(); else { userPaused = false; syncPause(); canvas.focus({ preventScroll: true }); } }
    });
    on(shadow, 'keydown', e => {
      if (!modalOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); hideDialog(); }
      if (e.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('a,button')];
        const first = focusable[0], end = focusable[focusable.length-1];
        if (e.shiftKey && (shadow.activeElement === first || shadow.activeElement === dialog)) { e.preventDefault(); end.focus(); }
        else if (!e.shiftKey && shadow.activeElement === end) { e.preventDefault(); first.focus(); }
      }
    });
    function unlockMusic(e) {
      if(!e.isTrusted||e.composedPath().some(el=>['music','pause','close'].includes(el.dataset?.action)))return;
      syncMusic();music?.unlock();
    }
    on(document,'pointerdown',unlockMusic,{capture:true});
    on(document,'keydown',unlockMusic,{capture:true});
    on(document,'click',unlockMusic,{capture:true});
    on(document, 'visibilitychange', () => { hidden = document.hidden; syncPause(); });
    on(global, 'message', e => {
      if (e.source !== global.parent || global.parent === global) return;
      if (parentOrigin !== '*' && e.origin !== parentOrigin) return;
      const m = e.data;
      if (!m || m.type !== 'cookie:control' || m.projectId !== 'khapse') return;
      if (m.action === 'pause') api.pause();
      else if (m.action === 'resume') api.resume();
      else if (m.action === 'destroy') api.destroy();
    });
    function fallback(p) {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      if (p.sprite === 0) { ctx.ellipse(0,0,p.w*.36,p.h*.27,0,0,Math.PI*2); }
      else { ctx.moveTo(-p.w*.4,p.h*.14); ctx.bezierCurveTo(-p.w*.2,-p.h*.52,p.w*.18,p.h*.52,p.w*.4,-p.h*.14); }
      ctx.lineWidth=17;ctx.strokeStyle='#572b11';ctx.stroke();ctx.lineWidth=12;ctx.strokeStyle='#e29b21';ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#f4bc43';ctx.stroke();
    }
    function drawPiece(p, dx=0, dy=0, rotation=0, alpha=1) {
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(p.x+dx,p.y+dy);ctx.rotate(p.angle+rotation);
      if (atlasReady) {
        const a=crops[p.sprite];
        ctx.drawImage(atlas,a[0]*atlas.width,a[1]*atlas.height,a[2]*atlas.width,a[3]*atlas.height,-p.w/2,-p.h/2,p.w,p.h);
      } else fallback(p);
      ctx.restore();
    }
    function drawCheese(offsetX=0,offsetY=0,alpha=1) {
      ctx.save();ctx.translate(offsetX,offsetY);ctx.globalAlpha=alpha;
      ctx.beginPath();ctx.moveTo(145,80);ctx.quadraticCurveTo(162,22,181,45);ctx.quadraticCurveTo(197,35,218,79);ctx.lineWidth=2;ctx.strokeStyle='#d5ba76';ctx.stroke();
      [[147,72,-.4],[154,56,.4],[166,43,.6],[180,42,-.5],[192,48,.6],[205,63,-.5],[216,78,.4]].forEach(([x,y,r])=>{ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.fillStyle='#674626';ctx.fillRect(-5,-7,11,15);ctx.fillStyle='#e8d8ae';ctx.fillRect(-4,-6,8,12);ctx.fillStyle='#fff0c9';ctx.fillRect(-3,-5,3,7);ctx.restore();});
      ctx.restore();
    }
    function drawOutline(p, color) { ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.strokeRect(-p.w*.47,-p.h*.38,p.w*.94,p.h*.76);ctx.restore(); }
    function render() {
      if (dead) return;
      ctx.clearRect(0,0,360,760);ctx.imageSmoothingEnabled=false;
      const collapse = state.phase === 'collapsing' || state.outcome === 'collapsed';
      const t = Math.min(1,state.elapsed/1400);
      let sway = 0;
      if (!reduced) {
        if (drag && !drag.risk.stable) sway = Math.sin(clock*.032)*drag.progress*.024;
        else if (state.phase === 'settling') sway = Math.sin(state.elapsed*.017)*.012*(1-state.elapsed/1600);
        else if (pulse>0) sway = Math.sin(clock*.025)*.008*(pulse/620);
      }
      ctx.save();ctx.translate(180,688);ctx.rotate(sway);ctx.translate(-180,-688);
      for (const p of pieces) {
        if (!available(p) || drag?.p.id === p.id || returning?.p.id === p.id) continue;
        if (collapse && p.row >= state.failedRow) {
          const delay=(15-p.row)*.012;
          const u=Math.max(0,Math.min(1,(t-delay)/(1-delay)));
          const eased=u*u;
          const dx=(p.col-1)*74*eased + ((p.row%5)-2)*15*eased;
          const target=687+(p.row%4)*9;
          const dy=(target-p.y)*eased;
          const rot=(p.col-1)*.8*u + (p.row%2?1:-1)*.48*u;
          drawPiece(p,dx,dy,rot);
        } else drawPiece(p);
      }
      if (collapse) drawCheese((t*t)*25,(t*t)*621,1);
      else drawCheese();
      ctx.restore();
      if (!collapse && (hover || selected) && !drag && state.phase==='playing') {
        const p=getPiece(hover || selected);if(p&&available(p))drawOutline(p,'#fff0b1');
      }
      if (returning) {
        const u=1-Math.min(1,returning.elapsed/200);
        drawPiece(returning.p,returning.dx*u*u,returning.dy*u*u);
      }
      if (drag) {
        drawOutline(drag.p,drag.risk.stable?'#ddc18c':'#c75c48');
        drawPiece(drag.p,drag.dx,drag.dy,0);
        const x=Math.max(16,Math.min(268,drag.p.x+drag.dx-38)),y=Math.min(730,drag.p.y+43);
        ctx.fillStyle='#221d22';ctx.fillRect(x,y,76,6);ctx.fillStyle=drag.risk.stable?'#e3b749':'#d15c3b';ctx.fillRect(x+1,y+1,74*drag.progress,4);
      }
      count.textContent=state.removed.length+' / 8';
      story?.collection(collection,state.removed.length);collection.setAttribute('aria-label','小盘已收集 '+state.removed.length+' 块卡塞');
      if (drag) updateStatus('第 '+(drag.p.row+1)+' 层 · '+(drag.risk.stable?'支撑可保留':'支撑不足'));
      else if (state.phase==='settling') updateStatus('八块已取出 · 等待站稳');
      else if (state.phase==='collapsing') updateStatus('承托不足 · 饼塔散落');
      else if (state.phase==='finished') updateStatus(state.outcome==='stable'?'已站稳 · 故事完成':'已倒塌 · 故事完成');
      else updateStatus(assetError?'简化贴图 · 可继续体验':'16 层 · 每层留两块');
    }
    function frame(now) {
      raf=0;if(dead||paused())return;
      const rawDt=last?Math.max(0,now-last):0,dt=Math.min(64,rawDt);last=now;clock+=dt;pulse=Math.max(0,pulse-dt);
      if (returning) { returning.elapsed+=dt;if(returning.elapsed>=200)returning=null; }
      if (drag?.keyboard) {
        drag.held+=dt;drag.progress=Math.min(1,drag.held/800);
        drag.dx=(drag.p.col===0?-1:1)*(68+drag.p.w*.2)*drag.progress;
        if(drag.progress>=1)setHint(drag.risk.stable?'松开空格，取出这一块。':'松开空格会倒塌；Escape 可放回。',!drag.risk.stable);
      }
      if (introActive || endingActive) {
        story.advance(rawDt);syncMusic();render();
        if(!dead&&!paused()&&!raf)raf=requestAnimationFrame(frame);
        return;
      }
      const event=C.advance(state,dt);syncMusic();
      render();
      if(event) { const finishedRound=state.round; emit(event); if(dead)return; if(state.round===finishedRound&&state.phase==='finished')playEnding(); }
      if(!dead&&!paused()&&!raf)raf=requestAnimationFrame(frame);
    }
    const api = {
      pause(){if(dead)return;hostPaused=true;syncPause();},
      resume(){if(dead)return;hostPaused=false;syncPause();},
      restart,
      getState(){return JSON.parse(JSON.stringify({...state,story:story?.state()||null,music:music?.state()||null,paused:paused(),destroyed:dead,assetsReady:atlasReady}));},
      destroy(){
        if(dead)return;
        cancelDrag(true);dead=true;cancelAnimationFrame(raf);raf=0;abort.abort();
        atlas.onload=null;atlas.onerror=null;atlas.src='';story?.destroy();music?.destroy();
        returning=null;hover=null;selected=null;shadow.innerHTML='';instances.delete(host);
      }
    };
    function finishStory() {
      introActive=false;endingActive=false;stage.classList.remove('is-story');$('.page').classList.remove('story-running');
      canvas.removeAttribute('aria-hidden');canvas.tabIndex=0;last=0;syncMusic();
      render();
    }
    function replayStory() {
      if (!story || dead) return;
      cancelDrag(true);returning=null;hover=null;introActive=true;endingActive=false;last=0;
      modalOpen=false;overlay.hidden=true;userPaused=false;
      stage.classList.add('is-story');$('.page').classList.add('story-running');
      canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;
      story.replay();syncPause();music?.rewind();
    }
    function playEnding() {
      if (!story) {showDialog('result');return;}
      introActive=false;endingActive=true;last=0;
      stage.classList.add('is-story');$('.page').classList.add('story-running');
      canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;
      story.end(state.outcome,state.removed.length);syncMusic();
    }
    if (introActive) {
      stage.classList.add('is-story');$('.page').classList.add('story-running');
      canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;
      story=global.KhapseStory.create(stage,{
        assetBase:new URL('assets/story-v3/',base).href,assets:options.storyAssets,reduced,
        onSkip(){story.skip();},onComplete:finishStory,onEndingComplete(){endingActive=false;syncMusic();},
        onTransition(){stage.classList.remove('is-story');}
      });
    }
    if(global.KhapseMusic) music=global.KhapseMusic.create({
      assetBase:new URL('assets/music/',base).href,assets:options.musicAssets,
      onChange(s){if(dead)return;const b=$('[data-action="music"]');b.textContent=s.enabled?(s.blocked?'♫ 音乐待播':'♫ 音乐开'):'♫ 音乐关';b.setAttribute('aria-pressed',String(s.enabled));b.setAttribute('aria-label',s.enabled?'静音':'开启音乐');b.title=s.blocked?'音乐默认开启，点击页面后播放；点击此按钮静音':s.enabled?'点击静音':'开启原创配乐';}
    });
    else $('[data-action="music"]').hidden=true;
    instances.set(host,api);
    syncPause();
    return api;
  }
  global.Khapse = Object.freeze({ mount, version: '1.3.1' });
})(window);
