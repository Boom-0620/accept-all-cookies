/* ============================================================
   COOKIE QUEST 游戏引擎
   状态机：menu → intro → play → (pause | complete | cutscene → frozen | tryagain)
   渲染：360×240 离屏 buffer → 主画布（2x 像素放大），故障时经 glitch 后处理。
   ============================================================ */
import { drawTitleScene, menuLabel, paintMenuLabels } from './title-art.js';
import { GAME_W, GAME_H, TILE, DEV, EVENTS } from './config.js';
import { emit } from './bus.js';
import { buildLevel1, buildLevel2, THEMES } from './levels.js';
import { Player } from './player.js';
import { HelpCutscene } from './cutscene.js';
import { presentFrame, presentFrozen } from './glitch.js';
import { drawCoin, drawHeart, drawFlag, drawText, drawSparks } from './art.js';
import { drawChef, drawTile, drawCloud, drawCakeMountain, drawCastle, drawHill, drawCookieWheel, drawWaterfall, drawHorizonBand, drawCookie, drawLandscape } from './scene-art.js';

const LEVEL_DEFS = { 1: { build: buildLevel1, theme: THEMES.butter, title: 'COOKIE QUEST - LEVEL 01' },
                     2: { build: buildLevel2, theme: THEMES.canyon, title: 'COOKIE QUEST - LEVEL 02' } };

const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape'];

export class Game {
  constructor(mount, { audio, windowCtl }) {
    this.mount = mount;
    this.audio = audio;
    this.windowCtl = windowCtl;
    this.state = 'menu';
    this.ambientT = 0;
    this.levelNum = 0;
    this.level = null;
    this.player = null;
    this.camera = 0;
    this.cameraLocked = false;
    this.shake = 0;
    this.glitchActive = false;
    this.cutscene = null;
    this.hearts = 3;
    this.coinCount = 0;
    this.stateT = 0;
    this.destroyed = false;
    this.particles = [];   // 二段跳尘埃粒子
    this.webRecovered = false;
    this.ceremony = null;

    this.buildDom();
    this.windowCtl.setMinimizeHandler?.(() => this.pause());
    this.buffer = document.createElement('canvas');
    this.buffer.width = GAME_W; this.buffer.height = GAME_H;
    this.bctx = this.buffer.getContext('2d');
    this.ctx = this.canvas.getContext('2d');

    this.keys = { left: false, right: false, crouch: false, jumpHeld: false, jumpPressed: false };
    this.menuSel = 0;

    this.onBlur = () => { this.keys.crouch = this.keys.left = this.keys.right = this.keys.jumpHeld = this.keys.jumpPressed = false; if (this.state === 'play') this.pause(); };
    window.addEventListener('blur', this.onBlur);
    this.onKeyDown = (e) => this.keyDown(e);
    this.onKeyUp = (e) => this.keyUp(e);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    this.lastT = performance.now();
    this.raf = 0;
    const loop = (t) => {
      if (this.destroyed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - this.lastT) / 1000);
      this.lastT = t;
      this.tick(dt);
    };
    this.raf = requestAnimationFrame(loop);

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.showMenu();
  }

  /* ---------------- DOM ---------------- */
  buildDom() {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-label', '曲奇王国：方向键移动，空格跳跃');
    this.canvas.id = 'game-canvas';
    this.canvas.width = GAME_W; this.canvas.height = GAME_H;
    this.mount.appendChild(this.canvas);

    const ov = (id, cls = 'g-overlay') => {
      const el = document.createElement('div');
      el.id = id; el.className = `${cls} hidden`;
      this.mount.appendChild(el);
      return el;
    };

    // 主菜单
    this.menuEl = ov('game-menu');
    this.menuEl.classList.remove('hidden');
    this.menuEl.innerHTML = `
      <h1 class="cq-logo">COOKIE QUEST</h1>
      <div class="cq-banner">曲奇美食王国大冒险</div>
      <div class="g-menu-list" role="group" aria-label="主菜单">
        <span class="g-menu-cursor" aria-hidden="true"><svg viewBox="0 0 24 28"><path d="M3 2H7V4H11V7H15V10H19V12H22V16H19V18H15V21H11V24H7V26H3Z" fill="#ffcd70" stroke="#664233" stroke-width="2"/><path d="M6 6V21L17 14Z" fill="#fff0b0"/></svg></span>
        <button class="g-menu-item sel" data-act="start">START GAME</button>
        <button class="g-menu-item" data-act="options">OPTIONS</button>
        <button class="g-menu-item" data-act="credits">CREDITS</button>
      </div>
      <div class="g-menu-foot">© 1995 COOKIE WORKS · A LITTLE ADVENTURE</div>`;
    this.menuItems = [...this.menuEl.querySelectorAll('.g-menu-item')];
    this.menuItems.forEach((el, i) => {
      const label=el.textContent;el.setAttribute('aria-label',label);el.innerHTML=menuLabel(label);
      const selectFromPointer = () => {this.menuEl.classList.remove('keyboard-nav');this.setMenuSel(i);};
      el.addEventListener('pointerenter', selectFromPointer);
      el.addEventListener('pointermove', selectFromPointer);
      el.addEventListener('focus', () => this.setMenuSel(i));
      el.addEventListener('click', () => {this.setMenuSel(i);this.menuAction(el.dataset.act);});
    });

    // 选项 / 制作名单
    this.optionsEl = ov('panel-options');
    this.optionsEl.innerHTML = `
      <div class="g-panel">
        <h3>OPTIONS</h3>
        <button class="q-btn" id="opt-sound">音效：${this.audio.muted ? '关' : '开'}</button>
        <div class="btn-row"><button class="q-btn" id="opt-back">返回</button></div>
      </div>`;
    this.optionsEl.querySelector('#opt-sound').addEventListener('click', (e) => {
      this.audio.setMuted(!this.audio.muted);
      e.target.textContent = `音效：${this.audio.muted ? '关' : '开'}`;
    });
    this.optionsEl.querySelector('#opt-back').addEventListener('click', () => this.showMenu());

    this.creditsEl = ov('panel-credits');
    this.creditsEl.innerHTML = `
      <div class="g-panel">
        <h3>CREDITS</h3>
        <div style="line-height:1.9;text-align:center">
          COOKIE QUEST · 曲奇美食王国大冒险<br>
          一场藏在旧电脑里的曲奇冒险<br>
          COOKIE WORKS · REFERENCE EDITION<br>
          <span style="color:#777">献给每一个按下 START 的人。</span>
        </div>
        <div class="btn-row"><button class="q-btn" id="cre-back">返回</button></div>
      </div>`;
    this.creditsEl.querySelector('#cre-back').addEventListener('click', () => this.showMenu());

    // 关卡开始卡片
    this.introEl = ov('card-intro');
    this.completeEl = ov('card-complete');
    this.tryEl = ov('card-tryagain');

    // 暂停
    this.pauseEl = ov('overlay-pause');
    this.pauseEl.innerHTML = `
      <div class="g-panel">
        <h3>PAUSED · 暂停</h3>
        <button class="q-btn" id="p-resume">继续游戏</button>
        <button class="q-btn" id="p-retry">重新开始本关</button>
        <button class="q-btn" id="p-sound">音效：${this.audio.muted ? '关' : '开'}</button>
        <button class="q-btn" id="p-quit">退出到桌面</button>
      </div>`;
    this.pauseEl.querySelector('#p-resume').addEventListener('click', () => this.resume());
    this.pauseEl.querySelector('#p-retry').addEventListener('click', () => this.startLevel(this.levelNum, { skipIntro: true }));
    this.pauseEl.querySelector('#p-sound').addEventListener('click', (e) => {
      this.audio.setMuted(!this.audio.muted);
      e.target.textContent = `音效：${this.audio.muted ? '关' : '开'}`;
    });
    this.pauseEl.querySelector('#p-quit').addEventListener('click', () => this.windowCtl.close());

    // 冻结提示（仅开发模式可见）
    if (DEV) {
      this.frozenDevEl = ov('frozen-dev');
      this.frozenDevEl.innerHTML =
        '[DEV] game:consent-requested 已发送，游戏冻结等待外部页面接管。<br>' +
        'F1=第一关 F2=第二关 F3=触发点 F4=强制剧情 F5=直接冻结 M=静音';
    }

    // 关卡卡片点击跳过
    this.introEl.addEventListener('click', () => { if (this.state === 'intro') this.beginPlay(); });
  }

  hideAllOverlays() {
    [this.menuEl, this.optionsEl, this.creditsEl, this.introEl, this.completeEl,
      this.tryEl, this.pauseEl].forEach((el) => el.classList.add('hidden'));
    if (this.frozenDevEl) this.frozenDevEl.classList.add('hidden');
  }

  /* ---------------- 流程 ---------------- */
  showMenu() {
    if (this.canChangeFlow?.() === false) return;
    this.ceremony = null;
    this.onMenuShown?.();
    this.state = 'menu';
    this.stateT = 0;
    this.hideAllOverlays();
    this.menuEl.classList.remove('hidden');
    this.setMenuSel(this.menuSel ?? 0, false);
    this.windowCtl.setTitle('COOKIE QUEST');
    this.audio.startMusic('title');
    this.cutscene = null;
    this.glitchActive = false;
  }

  setMenuSel(i, sound = true) {
    if (sound && i !== this.menuSel) this.audio.menuMove();
    this.menuSel = i;
    this.menuEl.style.setProperty('--menu-index', i);
    this.menuItems.forEach((el, k) => {
      el.classList.toggle('sel', k === i);
      el.tabIndex = k === i ? 0 : -1;
    });
  }

  menuAction(act) {
    if (this.canChangeFlow?.() === false) return;
    this.audio.menuConfirm();
    if (act === 'start') {
      this.webRecovered = false;
      this.onNewAdventure?.();
      emit(EVENTS.STARTED);            // → game:started
      this.startLevel(1);
    } else if (act === 'options') {
      this.state = 'options';
      this.menuEl.classList.add('hidden');
      this.optionsEl.classList.remove('hidden');
    } else if (act === 'credits') {
      this.state = 'credits';
      this.menuEl.classList.add('hidden');
      this.creditsEl.classList.remove('hidden');
    }
  }

  startLevel(n, { skipIntro = false, afterRecovery = this.webRecovered && n === 2 } = {}) {
    if (this.canChangeFlow?.() === false) return;
    this.ceremony = null;
    this.audio.stopMusic();
    this.particles = [];
    this.keys.crouch = this.keys.left = this.keys.right = this.keys.jumpHeld = this.keys.jumpPressed = false;
    this.levelNum = n;
    const def = LEVEL_DEFS[n];
    this.level = def.build();
    this.level.theme = def.theme;
    this.player = new Player(this.level.spawn);
    this.camera = 0;
    this.cameraLocked = false;
    this.hearts = 3;
    this.coinCount = 0;
    if (afterRecovery && n === 2) {
      this.webRecovered = true;
      this.level.trigger.fired = true;
      this.level.cookie = null;
      const checkpoint = { x: 51 * TILE, y: 11 * TILE };
      this.player.spawnAt(checkpoint);
      this.player.checkpoint = checkpoint;
      this.camera = checkpoint.x - GAME_W * .42;
    }
    this.cutscene = null;
    this.glitchActive = false;
    this.shake = 0;
    this.windowCtl.setTitle(def.title);
    if (skipIntro) {
      this.beginPlay();
    } else {
      this.state = 'intro';
      this.stateT = 0;
      this.hideAllOverlays();
      const sub = n === 1 ? '黄油饼干原野' : '巧克力夹心峡谷';
      const en = n === 1 ? 'BUTTER COOKIE FIELDS' : 'CHOCOLATE SANDWICH CANYON';
      this.introEl.innerHTML = `
        <div class="g-card">LEVEL 0${n}
          <span class="lv-sub">${sub}</span>
          <span class="lv-en">${en}</span>
          <span class="lv-hint">← → 移动 · ↓ / S 下蹲 · Space 跳跃 · ESC 暂停</span>
        </div>`;
      this.introEl.classList.remove('hidden');
    }
    return this;
  }

  beginPlay() {
    this.state = 'play';
    this.stateT = 0;
    this.hideAllOverlays();
    this.keys.crouch = this.keys.left = this.keys.right = this.keys.jumpHeld = this.keys.jumpPressed = false;
    this.audio.startMusic();
    if (this.levelNum === 2 && !this.webRecovered) emit(EVENTS.L2_STARTED);
  }

  pause() {
    if (this.state !== 'play') return;
    this.state = 'pause';
    this.audio.stopMusic();
    this.pauseEl.classList.remove('hidden');
  }

  resume() {
    if (this.state !== 'pause') return;
    this.state = 'play';
    this.pauseEl.classList.add('hidden');
    this.audio.startMusic();
  }

  onFlagReached() {
    if (this.levelNum === 1) {
      this.state = 'complete';
      this.stateT = 0;
      this.audio.stopMusic();
      this.audio.fanfare();
      emit(EVENTS.L1_COMPLETE);                        // → game:level1-complete
      this.completeEl.innerHTML = `
        <div class="g-card"><span class="big">LEVEL 01 COMPLETE!</span>
          <span class="coin-sum">金币 ×${String(this.coinCount).padStart(2, '0')} · 进入 LEVEL 02 …</span>
        </div>`;
      this.completeEl.classList.remove('hidden');
    } else {
      this.state = 'complete';
      this.stateT = 0;
      this.hideAllOverlays();
      this.keys.crouch = this.keys.left = this.keys.right = this.keys.jumpHeld = this.keys.jumpPressed = false;
      this.player.freeze();
      this.audio.stopMusic();
      this.audio.fanfare();
      this.completeEl.innerHTML = '<div class="g-card"><span class="big">LEVEL COMPLETE!</span></div>';
      this.completeEl.classList.remove('hidden');
      emit('game:level2-complete', { coins: this.coinCount });
    }
  }

  hurt(force = false) {
    if (this.state !== 'play') return;
    if (!force && this.player.invuln > 0) return;
    this.hearts--;
    this.audio.hurt();
    this.shake = 0.25;
    if (this.hearts <= 0) {
      this.state = 'tryagain';
      this.audio.stopMusic();
      this.tryEl.innerHTML = `
        <div class="g-panel">
          <h3>哎呀！</h3>
          <div>小厨师掉进果酱里了……</div>
          <div class="btn-row"><button class="q-btn" id="try-btn">TRY AGAIN</button></div>
        </div>`;
      this.tryEl.classList.remove('hidden');
      this.tryEl.querySelector('#try-btn').addEventListener('click', () => {
        this.startLevel(this.levelNum, { skipIntro: true });
      });
    } else {
      this.player.spawnAt(this.player.checkpoint);
    }
  }

  freezeForHost() {
    this.state = 'frozen';
    this.render();
    this.keys.crouch = this.keys.left = this.keys.right = this.keys.jumpHeld = false;
    this.onConsentRequested?.();
  }

  recoverySnapshot() {
    return { version: 1, level: 2, hearts: Math.max(1, this.hearts), coins: this.coinCount,
      collected: this.level?.coins.map(c => c.got) || [] };
  }

  resumeAfterRecovery(snapshot = this.recoverySnapshot()) {
    this.webRecovered = true;
    this.startLevel(2, { skipIntro: true, afterRecovery: true });
    this.hearts = Math.max(1, Math.min(3, Number(snapshot.hearts) || 3));
    this.coinCount = Math.max(0, Math.min(999, Number(snapshot.coins) || 0));
    if (Array.isArray(snapshot.collected)) this.level.coins.forEach((c,i) => c.got = snapshot.collected[i] === true);
    this.player.frozen = false;
    this.onRecovered?.();
    emit('game:resumed', { level: 2, coins: this.coinCount });
  }

  /* ---------------- 开发 / 深链 ---------------- */
  devGoto(state) {
    if (state === 'ending' || state === 'trophy') {
      this.startLevel(2, { skipIntro: true, afterRecovery: true });
      this.onFlagReached();
      if (state === 'trophy') this.stateT = 2.79;
      return;
    }
    if (state === 'menu') return void this.showMenu();
    if (state === 'l1') return void this.startLevel(1, { skipIntro: true });
    if (state === 'l2') return void this.startLevel(2, { skipIntro: true });
    if (state === 'help') {
      this.startLevel(2, { skipIntro: true });
      this.devPretrigger();
      return;
    }
    if (state === 'glitch') {
      this.startLevel(2, { skipIntro: true });
      this.cutscene = new HelpCutscene(this);
      this.cutscene.start({ startAt: 'glitch' });
      return;
    }
    if (state === 'consent') {
      this.startLevel(2, { skipIntro: true });
      this.cutscene = new HelpCutscene(this);
      this.cutscene.start({ startAt: 'glitch' });
      this.cutscene.finish();
      return;
    }
  }

  /** 把小厨师放到触发点前并给出一个真实跳跃（用于测试/截图） */
  devPretrigger() {
    if (this.canChangeFlow?.() === false) return;
    const tr = this.level.trigger;
    if (!tr) return;
    this.state = 'play';
    this.hideAllOverlays();
    this.keys.crouch = this.keys.left = this.keys.right = this.keys.jumpHeld = this.keys.jumpPressed = false;
    this.audio.startMusic();
    this.player.x = tr.x0 + 2;
    this.player.y = 10 * TILE - this.player.h - 8;
    this.camera = this.player.x - GAME_W * .35;
    this.player.vx = 92; this.player.vy = -300;
    this.player.grounded = false;
    this.player.frozen = false;
  }

  /* ---------------- 输入 ---------------- */
  keyDown(e) {
    if (this.canChangeFlow?.() === false) return;
    if(['frozen','ceremony','ending'].includes(this.state) || this.windowCtl.isVisible?.()===false)return;
    if(e.target?.closest?.('button,input') && !e.target.closest('.g-menu-item') && ['Enter','Space'].includes(e.code))return;
    if (GAME_KEYS.includes(e.code) || (this.state === 'menu' && e.code === 'Enter')) e.preventDefault();
    if (DEV && e.code.startsWith('F') && e.code.length <= 2) {
      const map = { F1: 'l1', F2: 'l2', F3: 'f3', F4: 'f4', F5: 'f5' };
      if (map[e.code]) {
        e.preventDefault();
        if (e.code === 'F3') { this.startLevel(2, { skipIntro: true }); this.devPretrigger(); }
        else if (e.code === 'F4') {
          this.startLevel(2, { skipIntro: true });
          this.cutscene = new HelpCutscene(this);
          this.cutscene.start();
        } else if (e.code === 'F5') {
          this.startLevel(2, { skipIntro: true });
          this.cutscene = new HelpCutscene(this);
          this.cutscene.start({ startAt: 'glitch' });
          this.cutscene.finish();
        } else this.devGoto(map[e.code]);
        return;
      }
    }
    if (e.code === 'KeyM') { this.audio.setMuted(!this.audio.muted); return; }

    switch (this.state) {
      case 'menu':
        if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(e.code))this.menuEl.classList.add('keyboard-nav');
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.setMenuSel((this.menuSel + 2) % 3); this.menuItems[this.menuSel].focus({preventScroll:true}); }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.setMenuSel((this.menuSel + 1) % 3); this.menuItems[this.menuSel].focus({preventScroll:true}); }
        if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) this.menuAction(this.menuItems[this.menuSel].dataset.act);
        break;
      case 'options':
      case 'credits':
        if(e.code === 'Escape')this.showMenu();
        break;
      case 'intro':
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') this.beginPlay();
        break;
      case 'play':
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.crouch = true;
        if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && !e.repeat) { this.keys.jumpHeld = true; this.keys.jumpPressed = true; }
        if (e.code === 'Escape') this.pause();
        break;
      case 'pause':
        if (e.code === 'Escape' || e.code === 'Enter') this.resume();
        break;
      case 'tryagain':
        if (e.code === 'Enter' || e.code === 'Space') this.startLevel(this.levelNum, { skipIntro: true });
        break;
      case 'complete':
        if (e.code === 'Enter' || e.code === 'Space') this.stateT = 99; // 跳过等待
        break;
    }
  }

  keyUp(e) {
    if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
    if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
    if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.crouch = false;
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) this.keys.jumpHeld = false;
  }

  /* ---------------- 更新 ---------------- */
  tick(dt) {
    // 冻结等待外部接管：彻底停止（画面保持最后一帧）
    if (this.state === 'frozen' || this.state === 'ending') return;
    this.ambientT += dt;
    this.stateT += dt;
    if (this.shake > 0 && this.state !== 'cutscene') this.shake = Math.max(0, this.shake - dt);

    switch (this.state) {
      case 'play': this.updatePlay(dt); break;
      case 'intro':
        if (this.stateT > 1.7) this.beginPlay();
        break;
      case 'complete':
        if (this.stateT > 2.8 || this.stateT > 90) {
          this.hideAllOverlays();
          if (this.levelNum === 1) this.startLevel(2);
          else { this.state = 'ending'; this.onTrophyReady?.(); }
        }
        break;
      case 'cutscene':
        this.cutscene.update(dt);
        this.updateParticles(dt);
        break;
    }
    this.render();
    this.keys.jumpPressed = false;
  }

  updateParticles(dt) {
    for (const pt of this.particles) { pt.t += dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 160 * dt; }
    this.particles = this.particles.filter((pt) => pt.t < pt.life);
  }

  updatePlay(dt) {
    const lv = this.level, p = this.player;
    this.updateParticles(dt);
    p.update(dt, this.keys, lv,
      () => this.audio.jump(),
      () => this.hurt(),
      () => {
        this.audio.doubleJump();
        const fx = p.x + p.w / 2, fy = p.y + p.h;
        for (let i = 0; i < 7; i++) {
          this.particles.push({
            x: fx + (Math.random() * 16 - 8), y: fy,
            vx: (Math.random() * 2 - 1) * 30, vy: -Math.random() * 36 - 12,
            life: 0.42, t: 0,
          });
        }
      }, () => this.audio.stomach());
    // 掉出地图：无视无敌帧立即重生，避免长时间坠落
    if (p.y > 15 * TILE + 40) this.hurt(true);

    // 金币
    const pr = p.rect();
    for (const c of lv.coins) {
      if (c.got) continue;
      if (pr.x < c.x + 12 && pr.x + pr.w > c.x && pr.y < c.y + 12 && pr.y + pr.h > c.y) {
        c.got = true;
        this.coinCount++;
        this.audio.coin();
      }
    }

    // 旗帜（关卡完成）
    const f = lv.flag;
    if (f && pr.x + pr.w > f.x - 2 && pr.x < f.x + 8 && pr.y + pr.h > f.y - 34) {
      this.onFlagReached();
      return;
    }

    // 剧情触发（第二关：空中越过指定区域）
    const tr = lv.trigger;
    if (tr && !tr.fired) {
      const pc = pr.x + pr.w / 2;
      if (pc >= tr.x0 && pc <= tr.x1 + 10) {
        tr.fired = true;
        this.cutscene = new HelpCutscene(this);
        this.cutscene.start();
        return;
      }
    }

    // 相机
    if (!this.cameraLocked) {
      const target = pr.x + pr.w / 2 - GAME_W * 0.42;
      const clamp = Math.max(0, Math.min(target, lv.width * TILE - GAME_W));
      this.camera += (clamp - this.camera) * (1 - Math.exp(-dt * 9));
      if (Math.abs(clamp - this.camera) < 0.5) this.camera = clamp;
    }
  }

  /* ---------------- 渲染 ---------------- */
  render() {
    if (this.ceremony && ['ceremony','ending'].includes(this.state)) {
      if (this.canvas.width !== GAME_W || this.canvas.height !== GAME_H) { this.canvas.width=GAME_W; this.canvas.height=GAME_H; }
      this.canvas.classList.remove('title-mode');
      this.ctx.imageSmoothingEnabled=false;
      this.ceremony.render(this.ctx, this.reducedMotion.matches);
      return;
    }
    const title = ['menu', 'options', 'credits'].includes(this.state) || !this.level;
    const out = this.ctx;
    if (title) {
      // Render to the actual display density; game physics keeps its own pixel grid.
      const bounds=this.canvas.getBoundingClientRect();
      const scale=Math.max(1,Math.min(3,bounds.width*(window.devicePixelRatio||1)/864));
      const width=Math.round(864*scale),height=Math.round(480*scale);
      if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
      this.canvas.classList.add('title-mode');
      out.setTransform(width/864,0,0,height/480,0,0);
      out.imageSmoothingEnabled=false;
      drawTitleScene(out,this.reducedMotion.matches?0:this.ambientT);
      paintMenuLabels(this.menuEl);
      out.setTransform(1,0,0,1,0,0);
      return;
    }
    if(this.canvas.width!==GAME_W||this.canvas.height!==GAME_H){this.canvas.width=GAME_W;this.canvas.height=GAME_H;}
    this.canvas.classList.remove('title-mode');
    this.bctx.imageSmoothingEnabled=false;out.imageSmoothingEnabled=false;
    this.renderLevel(this.bctx);
    if (this.state === 'frozen') presentFrozen(out, this.buffer);
    else if (this.glitchActive && this.cutscene) presentFrame(out, this.buffer, this.cutscene.glitchIntensity(), this.ambientT);
    else {out.clearRect(0,0,GAME_W,GAME_H);out.drawImage(this.buffer,0,0);}
  }

  renderLevel(g) {
    const lv = this.level, th = lv.theme.name;
    const cam = this.camera;
    const shx = this.shake > 0 ? (Math.random() * 2 - 1) * 2 * this.shake : 0;
    const shy = this.shake > 0 ? (Math.random() * 2 - 1) * 2 * this.shake : 0;

    // 天空
    const sky = g.createLinearGradient(0, 0, 0, GAME_H);
    sky.addColorStop(0, th === 'butter' ? '#ffd79a' : '#c9a1d2');
    sky.addColorStop(1, th === 'butter' ? '#ffeac1' : '#f0c5d3');
    g.fillStyle = sky;
    g.fillRect(0, 0, GAME_W, GAME_H);

    g.save();
    g.translate(Math.round(shx), Math.round(shy));

    if (!drawLandscape(g, th, cam, this.reducedMotion.matches?0:this.ambientT)) {
    // 远景地平带（滚糖丘陵剪影）
    drawHorizonBand(g, cam, 13 * TILE + 2, th === 'butter' ? '#f1b3a6' : '#b889b1', th === 'butter' ? 0 : 3, 0.16);

    // 远景视差
    const farF = 0.3, midF = 0.55;
    for (const d of lv.decors) {
      const sx = d.x - cam * (d.kind === 'cake' || d.kind === 'castle' || d.kind === 'hills' ? farF
        : d.kind === 'wheel' ? midF : d.kind === 'waterfall' ? 0.82 : 0.12);
      if (sx < -260 || sx > GAME_W + 260) continue;
      const baseY = d.y + 4;
      if (d.kind === 'cake') drawCakeMountain(g, sx, baseY, d.extra.w, d.extra.h);
      if (d.kind === 'castle') drawCastle(g, sx, baseY);
      if (d.kind === 'hills') drawHill(g, sx, baseY, d.extra.w, d.extra.h, d.extra.dark);
      if (d.kind === 'wheel') drawCookieWheel(g, sx, d.y, d.extra.r);
      if (d.kind === 'waterfall') drawWaterfall(g, sx, d.y, d.extra.bottom * TILE, this.ambientT);
    }
    // 云（慢速漂移）
    for (let i = 0; i < 6; i++) {
      const span = GAME_W + 160;
      const cx = ((i * 130 + 40 - cam * 0.12 + this.ambientT * 5) % span + span) % span - 80;
      drawCloud(g, cx, 18 + (i % 3) * 30, i % 2);
    }

    }
    // 背景平台（小曲奇脚下）
    if (lv.bgLedge) {
      const L = lv.bgLedge;
      for (let tx = L.x0; tx <= L.x1; tx++) {
        const sx = tx * TILE - cam;
        if (sx < -TILE || sx > GAME_W) continue;
        drawTile(g, 'sandwich', sx, L.y * TILE, th, false, this.ambientT);
      }
      g.fillStyle = 'rgba(30,16,40,0.4)';
      g.fillRect(L.x0 * TILE - cam, L.y * TILE, (L.x1 - L.x0 + 1) * TILE, TILE);
    }

    // 特殊背景小曲奇（在地块之前绘制 → 位于背景层）
    if (lv.cookie) {
      const c = lv.cookie;
      const shade = c.panic ? 1 : 0.86;
      drawCookie(g, c.x - cam, c.y, {
        mode: c.panic ? 'panic' : 'normal',
        panicFrame: c.panicFrame,
        shade,
      });
      if (c.panic) drawSparks(g, c.x + 6 - cam, c.y - 2, this.ambientT);
    }

    // 地块
    const t0 = Math.max(0, Math.floor(cam / TILE) - 1);
    const t1 = Math.min(lv.width - 1, Math.floor((cam + GAME_W) / TILE) + 1);
    for (let ty = 0; ty < 15; ty++) {
      for (let tx = t0; tx <= t1; tx++) {
        const t = lv.grid[ty][tx];
        if (!t) continue;
        const exposed = ty === 0 || !lv.grid[ty - 1][tx];
        drawTile(g, t, tx * TILE - cam, ty * TILE, th, exposed, this.ambientT, tx);
      }
    }

    // 旗帜
    if (lv.flag) drawFlag(g, lv.flag.x - cam, lv.flag.y, this.ambientT);

    // 金币
    const coinFrame = Math.floor(this.ambientT * 6) % 4;
    for (const c of lv.coins) {
      if (c.got) continue;
      const sx = c.x - cam;
      if (sx < -16 || sx > GAME_W + 16) continue;
      drawCoin(g, sx, c.y + Math.sin(this.ambientT * 3 + c.x) * 1.2, coinFrame);
    }

    // 小厨师（受击无敌时闪烁）
    const p = this.player;
    const blink = p.invuln > 0 && Math.floor(this.ambientT * 12) % 2 === 0;
    if (!blink) {
      drawChef(g, p.x - 3 - cam, p.y + p.h - 36, {
        facing: p.facing, pose: p.pose,
        frame: Math.floor(p.animT * 10) % 4, time:p.animT, hungerT:p.hungerT,
        flipY: p.flipY,
      });
    }

    // 粒子（二段跳尘埃）
    for (const pt of this.particles) {
      g.globalAlpha = Math.max(0, 1 - pt.t / pt.life);
      g.fillStyle = '#fff6e0';
      g.fillRect(Math.round(pt.x - cam), Math.round(pt.y), 2, 2);
    }
    g.globalAlpha = 1;

    g.restore();

    // HUD：心 + 金币（带描边阴影）

    for (let i = 0; i < 3; i++) drawHeart(g, 8 + i * 13, 8, i < this.hearts);
    drawCoin(g, 104, 6, coinFrame);
    drawText(g, `x${String(this.coinCount).padStart(2, '0')}`, 121, 9, { scale: 2, color: 'rgba(40,20,10,.55)' });
    drawText(g, `x${String(this.coinCount).padStart(2, '0')}`, 120, 8, { scale: 2, color: '#fff' });
    drawText(g, `LEVEL 0${this.levelNum}`, GAME_W - 7, 9, { scale: 1, color: 'rgba(40,20,10,.5)', align: 'right' });
    drawText(g, `LEVEL 0${this.levelNum}`, GAME_W - 8, 8, { scale: 1, color: 'rgba(255,255,255,.9)', align: 'right' });

    // 剧情气泡（HELP!!!）
    if (this.cutscene) this.cutscene.render(g);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.audio.stopMusic();
    this.mount.innerHTML = '';
  }
}
