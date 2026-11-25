/* ============================================================
   复古桌面：图标 / 任务栏 / 开始菜单 / 窗口管理器 / 系统小窗口
   ============================================================ */
import { SCREEN_W, SCREEN_H } from './config.js';
import { ClassicApps } from './classic-apps.js';
import { drawIconTo, drawTitleIconTo, drawStartLogoTo, drawSpeakerTo } from './art.js';

/* ---------------- 窗口管理器 ---------------- */
class WindowManager {
  constructor(layerEl, audio) {
    this.layer = layerEl;
    this.audio = audio;
    this.windows = [];
    this.z = 100;
    this.onChanged = null; // 任务栏刷新回调
  }

  create({ title = '', icon = null, x = 80, y = 60, w = 360, h = 220, taskbar = true,
           resizableMax = false, onClose = null, active = true } = {}) {
    const el = document.createElement('div');
    el.className = 'qwindow';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.width = `${w}px`; el.style.height = `${h}px`;

    const tbar = document.createElement('div');
    tbar.className = 'tbar';
    if (icon) { const ic = document.createElement('canvas'); if(icon==='cookie')drawTitleIconTo(ic);else drawIconTo(ic,icon); tbar.appendChild(ic); }
    const tTitle = document.createElement('div');
    tTitle.className = 't-title'; tTitle.textContent = title;
    tbar.appendChild(tTitle);
    const btns = document.createElement('div');
    btns.className = 'tbtns';

    const mkBtn = (cls, fn) => {
      const b = document.createElement('button');
      b.className = `tbtn ${cls}`;
      b.setAttribute('aria-label', {'t-max':'最大化','t-min':'最小化','t-close':'关闭窗口'}[cls]);
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(); b.blur(); });
      btns.appendChild(b);
      return b;
    };
    let maxBtn = null;
    if (resizableMax) maxBtn = mkBtn('t-max', () => {
      el.classList.toggle('maximized');
      maxBtn.classList.toggle('maxed');
      this.audio.click();
    });
    mkBtn('t-min', () => { el.style.display = 'none'; win.minimized = true; win.onMinimize?.(); this.notify(); });
    if(maxBtn)btns.appendChild(maxBtn);
    mkBtn('t-close', () => this.close(win));

    el.appendChild(tbar);
    tbar.appendChild(btns);

    const body = document.createElement('div');
    body.className = 'w-body';
    el.appendChild(body);

    this.layer.appendChild(el);

    const win = {
      el, body, titleEl: tTitle, minimized: false,
      maximized: () => el.classList.contains('maximized'),
      taskbar,
      icon,
      onClose,
      title,
    };

    // 拖动
    tbar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tbtn')) return;
      if (el.classList.contains('maximized')) return;
      const startX = e.clientX, startY = e.clientY;
      const ox = el.offsetLeft, oy = el.offsetTop;
      const scale=this.layer.getBoundingClientRect().width/SCREEN_W;
      const move = (ev) => {
        el.style.left = `${Math.max(-40, Math.min(SCREEN_W - 80, ox + (ev.clientX - startX)/scale))}px`;
        el.style.top = `${Math.max(-4, Math.min(SCREEN_H - 60, oy + (ev.clientY - startY)/scale))}px`;
      };
      const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    el.addEventListener('mousedown', () => this.focus(win));

    this.windows.push(win);
    if (active) this.focus(win);
    else { el.classList.add('inactive'); el.style.zIndex=++this.z; }
    this.notify();
    return win;
  }

  focus(win) {
    win.el.style.zIndex = ++this.z;
    this.windows.forEach((w) => w.el.classList.toggle('inactive', w !== win));
    this.notify();
    this.onFocus?.(win);
  }

  setTitle(win, title) { win.title = title; win.titleEl.textContent = title; this.notify(); }

  restore(win) { win.el.style.display = ''; win.minimized = false; this.focus(win); }

  close(win) {
    const wasActive=!win.el.classList.contains('inactive');
    this.audio.click();
    win.onClose && win.onClose();
    win.el.remove();
    this.windows = this.windows.filter((w) => w !== win);
    if(wasActive) {
      const next=this.windows.filter(w=>!w.minimized).sort((a,b)=>Number(b.el.style.zIndex)-Number(a.el.style.zIndex))[0];
      if(next){this.focus(next);return;}
    }
    this.notify();
  }

  closeAll() { [...this.windows].forEach((w) => this.close(w)); }

  notify() { this.onChanged && this.onChanged(); }
}

/* ---------------- 桌面 ---------------- */
export class Desktop {
  constructor({ layer, windowLayer, audio, onLaunchGame, onPowerOff, onGameClosed }) {
    this.layer = layer;
    this.wm = new WindowManager(windowLayer, audio);
    this.audio = audio;
    this.onLaunchGame = onLaunchGame;
    this.onPowerOff = onPowerOff;
    this.onGameClosed = onGameClosed;
    this.gameWin = null;
    this.timers=[];this.destroyed=false;this.launching=false;
    this.apps=new ClassicApps(this);
    this.build();
    this.wm.onChanged = () => this.syncTaskbar();
    this.clockTimer = null;
    this.updateClock();
    this.muteListener=()=>this.drawSpeaker();
    document.addEventListener('cq-mute', this.muteListener);
  }

  build() {
    // 图标
    const icons = [
      { kind: 'computer', label: 'My Computer', x: 8, y: 12, open: () => this.openMyComputer() },
      { kind: 'folder', label: 'My Documents', x: 8, y: 72, open: () => this.openMyDocuments() },
      { kind: 'globe', label: 'Internet', x: 8, y: 132, open: () => this.openInternet() },
      { kind: 'bin', label: 'Recycle Bin', x: 8, y: 192, open: () => this.openBin() },
      { kind: 'castle', label: 'COOKIE QUEST.exe', x: 626, y: 260, open: () => this.launchGame() },
    ];
    icons.forEach((spec) => {
      const el = document.createElement('div');
      el.className = 'd-icon';
      el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',spec.label);
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.audio.ensure();spec.open();}});
      el.style.left = `${spec.x}px`; el.style.top = `${spec.y}px`;
      const cv = document.createElement('canvas');
      drawIconTo(cv, spec.kind);
      const label = document.createElement('div');
      label.className = 'label'; label.textContent = spec.label;
      el.append(cv, label);
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.layer.querySelectorAll('.d-icon').forEach((i) => i.classList.remove('selected'));
        el.classList.add('selected');
      });
      if(spec.kind==='castle')el.addEventListener('dblclick', () => { this.audio.openWin(); spec.open(); });
      else el.addEventListener('click', e => { if(e.detail<2){this.audio.ensure();this.audio.openWin();spec.open();} });
      this.layer.appendChild(el);
    });
    this.layer.addEventListener('mousedown', () => {
      this.layer.querySelectorAll('.d-icon').forEach((i) => i.classList.remove('selected'));
      this.closeStartMenu();
    });

    // 任务栏
    const tb = document.createElement('div');
    tb.id = 'taskbar';
    const start = document.createElement('button');
    start.id = 'start-btn';
    const logo = document.createElement('canvas');
    drawStartLogoTo(logo);
    start.append(logo, Object.assign(document.createElement('span'), { textContent: 'start' }));
    start.addEventListener('mousedown', (e) => e.stopPropagation());
    start.addEventListener('click', (e) => { e.stopPropagation(); this.toggleStartMenu(); start.blur(); });
    const spacer = document.createElement('div'); spacer.className = 'tb-spacer';

    const tray = document.createElement('div'); tray.id = 'tray';
    const spk = document.createElement('canvas');
    spk.style.cursor = 'pointer';spk.setAttribute('role','button');spk.tabIndex=0;
    spk.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();spk.click();}});
    spk.addEventListener('click', () => {
      this.audio.setMuted(!this.audio.muted);
      this.audio.click();
    });
    this.speakerCanvas = spk;
    this.drawSpeaker();
    const clock = document.createElement('div'); clock.id = 'clock';
    this.clockEl = clock;
    tray.append(spk, clock);

    const appArea = document.createElement('div');
    appArea.id = 'task-apps'; appArea.style.display = 'contents';
    this.appArea = appArea;

    tb.append(start, appArea, spacer, tray);
    this.layer.appendChild(tb);

    // 开始菜单
    this.startMenu = document.createElement('div');
    this.startMenu.id = 'start-menu';
    this.startMenu.addEventListener('mousedown', (e) => e.stopPropagation());
    this.startMenu.classList.add('hidden');
    this.startMenu.innerHTML = `
      <div class="banner">COOKIE OS 95</div>
      <div class="items">
        <div class="mi disabled">程序 ▸</div>
        <div class="mi disabled">文档 ▸</div>
        <div class="mi disabled">设置 ▸</div>
        <div class="sep"></div>
        <div class="mi" id="mi-shutdown">关闭系统...</div>
      </div>`;
    this.layer.appendChild(this.startMenu);
    this.startMenu.querySelector('#mi-shutdown').addEventListener('click', () => {
      this.closeStartMenu();
      this.openShutdownDialog();
    });
  }

  drawSpeaker() { drawSpeakerTo(this.speakerCanvas, this.audio.muted);this.speakerCanvas.title=this.audio.muted?'开启声音':'关闭声音';this.speakerCanvas.setAttribute('aria-label',this.speakerCanvas.title);this.speakerCanvas.setAttribute('aria-pressed',String(!this.audio.muted)); }

  updateClock() {
    // The fictional desktop keeps the time shown in the reference illustration.
    this.clockEl.textContent = '10:24';
  }

  toggleStartMenu() {
    this.audio.click();
    this.startMenu.classList.toggle('hidden');
  }
  closeStartMenu() { this.startMenu.classList.add('hidden'); }

  /* —— 系统小窗口 —— */
  openMyComputer() { this.apps.openExplorer('computer'); }
  openMyDocuments() { this.apps.openExplorer('documents'); }
  openInternet() { this.apps.openInternet(); }
  openBin() { this.apps.openExplorer('bin'); }

  openShutdownDialog() {
    const win = this.wm.create({
      title: '关闭系统', x: 262, y: 210, w: 340, h: 170, taskbar: false,
    });
    win.body.innerHTML = `
      <div class="sys-dialog">
        <div style="align-self:flex-start">您想要：</div>
        <label style="align-self:flex-start"><input type="radio" name="sd" value="off" checked> 关闭计算机？</label>
        <label style="align-self:flex-start"><input type="radio" name="sd" value="reboot"> 重新启动计算机？</label>
        <div class="row2">
          <button class="q-btn" id="sd-ok">确定</button>
          <button class="q-btn" id="sd-cancel">取消</button>
        </div>
      </div>`;
    win.body.querySelector('#sd-cancel').addEventListener('click', () => this.wm.close(win));
    win.body.querySelector('#sd-ok').addEventListener('click', () => {
      const reboot = win.body.querySelector('input[name=sd]:checked').value === 'reboot';
      this.wm.close(win);
      this.audio.thud && this.audio.thud();
      this.onPowerOff(reboot);
    });
  }

  /* —— 任务栏同步 —— */
  syncTaskbar() {
    this.appArea.innerHTML = '';
    this.wm.windows.filter((w) => w.taskbar).forEach((w) => {
      const b = document.createElement('button');
      b.className = 'tb-app' + (w.minimized ? '' : (w.el.classList.contains('inactive') ? '' : ' active'));
      const ic = document.createElement('canvas');
      if(w.icon&&w.icon!=='cookie')drawIconTo(ic,w.icon);else drawTitleIconTo(ic);
      const span = document.createElement('span');
      span.textContent = w.shortTitle || w.title || '窗口';
      b.title=w.title;
      if(w.el.dataset.projectId)b.dataset.projectId=w.el.dataset.projectId;
      b.append(ic, span);
      b.addEventListener('click', () => {
        if (w.minimized) this.wm.restore(w);
        else if (w.el.classList.contains('inactive')) this.wm.focus(w);
        else { w.el.style.display = 'none'; w.minimized = true; w.onMinimize?.(); this.wm.notify(); }
      });
      this.appArea.appendChild(b);
    });
  }

  /* —— 启动游戏流程：Loading 小窗 → 游戏窗口 —— */
  launchGame(instant = false) {
    if(this.destroyed||this.launching)return;
    if (this.gameWin && this.gameWin.el.isConnected) {
      if (this.gameWin.minimized) this.wm.restore(this.gameWin);
      else this.wm.focus(this.gameWin);
      return;
    }
    this.launching=true;
    this.closeStartMenu();
    const openDelay = instant ? 40 : 1150;
    const loadWin = instant ? null : this.wm.create({
      title: 'cookie_quest.exe', x: 302, y: 240, w: 260, h: 140, taskbar: false,
    });
    if (loadWin) {
      loadWin.body.innerHTML = `
        <div class="loading-body">
          <div>正在启动 COOKIE QUEST ...</div>
          <div class="loading-bar">${'<i></i>'.repeat(10)}</div>
        </div>`;
      const cells = loadWin.body.querySelectorAll('.loading-bar i');
      cells.forEach((c, i) => this.timers.push(setTimeout(() => c.classList.add('on'), 80 + i * 95)));
    }

    this.timers.push(setTimeout(() => {
      if(this.destroyed)return;this.launching=false;
      if (loadWin) this.wm.close(loadWin);
      this.audio.openWin();
      const win = this.wm.create({
        title: 'COOKIE QUEST', icon: 'cookie', x: 15, y: 25, w: 834, h: 491,
        resizableMax: true, taskbar: true,
      });
      // 游戏窗口布局：内容区 720×480
      const wrap = document.createElement('div');
      wrap.className = 'game-wrap';
      win.body.appendChild(wrap);
      win.el.id = 'game-win';
      this.gameWin = win;
      win.onClose = () => { this.gameWin = null; this.onGameClosed && this.onGameClosed(); };
      this.onLaunchGame(wrap, {
        isVisible: () => win.el.style.display!=='none' && !win.el.classList.contains('inactive'),
        setMinimizeHandler: (handler) => {win.onMinimize=handler;},
        setTitle: (t) => this.wm.setTitle(win, t),
        close: () => this.wm.close(win),
        minimize: () => { win.el.style.display = 'none'; win.minimized = true; this.wm.notify(); },
        restore: () => this.wm.restore(win),
      });
    }, openDelay));
  }

  destroy() {
    this.destroyed=true;this.timers.forEach(clearTimeout);
    document.removeEventListener('cq-mute',this.muteListener);
    clearInterval(this.clockTimer);
    this.wm.closeAll();
    this.layer.innerHTML = '';
  }
}
