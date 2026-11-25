/* ============================================================
   入口：屏幕缩放 / 自动开机 → 桌面 → 游戏 生命周期 / 开发深链
   ============================================================ */
import { DEV, PARAMS, EVENTS, SCREEN_W, SCREEN_H } from './config.js';
import { emit } from './bus.js';
import { AudioEngine } from './audio.js';
import { BootSequence, shouldSkipBoot } from './boot.js';
import { Desktop } from './desktop.js';
import { Game } from './engine.js';
import { CookieInvasion } from './invasion.js';
import { CookieFinale } from './ending.js';
import { WebRecovery, readRecovery, clearRecovery } from './recovery.js';
import { ModuleDesktop } from './module-desktop.js';

/* ---------- 舞台缩放 ---------- */
const stage = document.getElementById('stage');
function fitStage() {
  const s = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitStage);
fitStage();

/* ---------- 系统生命周期 ---------- */
const restartBtn = document.getElementById('restart-btn');
const poweroffLayer = document.getElementById('poweroff-layer');
const bootLayer = document.getElementById('boot-layer');
const desktopLayer = document.getElementById('desktop-layer');
const windowLayer = document.getElementById('window-layer');
const flashEl = document.getElementById('crt-flash');

const audio = new AudioEngine();
const boot = new BootSequence({ bootLayer, flashEl, audio });

let desktop = null;
let game = null;
let powered = false;
let invasion = null;
let recovery = null;
let finale = null;
let modules = null;

function showDesktop() {
  powered = true;
  restartBtn.disabled = false;
  desktopLayer.classList.remove('hidden');
  windowLayer.classList.remove('hidden');
  poweroffLayer.classList.add('hidden');
}

function powerOff(reboot = false) {
  modules?.destroy(); modules=null;
  powered = false;
  recovery?.destroy(); recovery = null;
  finale?.destroy(); finale = null;
  document.body.classList.remove('ending-active');
  invasion?.destroy(); invasion = null;
  boot.clear();
  if (game) { game.destroy(); game = null; }
  if (desktop) { desktop.destroy(); desktop = null; }
  audio.stopMusic();
  audio.stopBootChime();
  desktopLayer.classList.add('hidden');
  windowLayer.classList.add('hidden');
  bootLayer.classList.add('hidden');
  poweroffLayer.classList.remove('hidden');
  restartBtn.disabled = false;
  document.body.classList.remove('game-active');
  if (!reboot) restartBtn.focus({preventScroll:true});
  windowCtlRef = null;
  if (reboot) setTimeout(startSystem, 900);
}

/* 桌面创建 */
function createDesktop() {
  desktop = new Desktop({
    layer: desktopLayer,
    windowLayer,
    audio,
    onLaunchGame: (wrap, ctl) => {
      windowCtlRef = ctl;
      game = new Game(wrap, { audio, windowCtl: ctl });
      recovery = new WebRecovery(document.getElementById('screen'), audio, {
        game,
        onRestore: () => { invasion?.destroy(); invasion = null; },
        onReturn: () => { modules?.destroy();modules=null; },
        onOpenModules: () => {
          modules?.destroy();modules=new ModuleDesktop(desktop,{audio,onReady:()=>recovery?.notify()});return true;
        },
      });
      document.body.classList.add('game-active');
      game.onConsentRequested = () => {
        recovery.arm();
        if (PARAMS.get('host') === '1') return;
        invasion?.destroy();
        invasion = new CookieInvasion(document.getElementById('screen'), audio, {
          onExit: () => { ctl.close(); },
          onReplay: () => { game?.showMenu(); },
          onRestore: () => recovery?.notify(),
          onWebStart: () => {
            if (!recovery?.openConfiguredWeb()) return false;
            invasion?.destroy(); invasion=null;
            return true;
          },
        });
        invasion.showConsent();
      };
      game.onTrophyReady = () => {
        document.body.classList.add('ending-active');
        finale?.destroy();
        finale = new CookieFinale(document.getElementById('screen'), audio, {
          onReplay: () => { finale=null;game?.showMenu(); },
          onExit: () => { finale=null;ctl.close(); },
        });
      };
      game.onMenuShown = () => {
        modules?.destroy();modules=null;
        recovery?.reset();
        document.body.classList.remove('ending-active');
        finale?.destroy(); finale=null;
      };
      game.onNewAdventure = clearRecovery;
      game.onClose = () => { game = null; };
      if (DEV) window.__cq = game;   // 开发调试句柄
      applyDeepLink();
    },
    onGameClosed: () => {
      modules?.destroy();modules=null;
      recovery?.destroy(); recovery=null;
      finale?.destroy(); finale=null;
      document.body.classList.remove('ending-active','web-interlude-active');
      document.body.classList.remove('game-active');
      invasion?.destroy(); invasion = null;
      if (game) { game.destroy(); game = null; }
      windowCtlRef = null;
      if (powered) audio.startMusic('desktop');
    },
    onPowerOff: (reboot) => powerOff(reboot),
  });
  showDesktop();
  audio.startMusic('desktop');
}

let windowCtlRef = null;

/* ---------- 开发深链：?state=menu|l1|l2|help|glitch|consent ---------- */
function applyDeepLink() {
  const st = PARAMS.get('state');
  if (!game) return;
  if(st==='modules'){
    game.startLevel(2,{skipIntro:true});game.state='frozen';game.audio.stopMusic();game.render();recovery.arm();recovery.openConfiguredWeb();return;
  }
  if (st === 'restored' || PARAMS.get('resume') === '1') {
    const saved=readRecovery();
    if (st !== 'restored' && !saved?.restored) return;
    game.startLevel(2, {skipIntro:true});
    game.state='frozen';game.audio.stopMusic();game.render();
    recovery.arm(saved || game.recoverySnapshot());
    recovery.notify();
    return;
  }
  if (!st) return;
  // 等游戏窗口完全建立后跳转
  setTimeout(() => game && game.devGoto(st), 60);
}

/* The real display provides the enclosure; opening the page boots the system. */
function startSystem() {
  if (powered || boot.running) return;
  restartBtn.disabled = true;
  poweroffLayer.classList.add('hidden');
  audio.ensure();
  audio.stopBootChime();
  boot.powerOn(enterDesktop);
}
restartBtn.addEventListener('click', startSystem);

function applyDeepLinkDesktop() {
  // ?skip=boot 时直接进桌面；若带 state 且需要自动打开游戏，则自动双击图标
  const st = PARAMS.get('state');
  if ((st || PARAMS.get('resume') === '1') && desktop) {
    desktop.launchGame(true);
  }
}

// Local integration entry; external frames use the validated message protocol.
window.CookieQuest = Object.freeze({
  webRestored: () => recovery?.notify() || false,
  returnToGame: () => recovery?.resume() || false,
  getIntegrationState: () => modules?.getState() || null,
});

/* 桌面就绪统一入口（含深链处理） */
function enterDesktop() {
  createDesktop();
  applyDeepLinkDesktop();
}

if (shouldSkipBoot()) {
  setTimeout(() => {audio.ensure();boot.skip(enterDesktop);}, 50);
} else {
  audio.ensure();
  setTimeout(() => {
    if (!audio.ctx || audio.ctx.state === 'running' || audio.muted) {
      startSystem();
      return;
    }
    // A real gesture unlocks Safari/Chrome audio before the BIOS and startup chime.
    bootLayer.classList.remove('hidden');
    const button = document.createElement('button');
    button.className = 'boot-power-button';
    button.type = 'button';
    button.title = '开机';
    button.setAttribute('aria-label', '开机');
    button.innerHTML = '<span aria-hidden="true">⏻</span>';
    button.addEventListener('click', startSystem, {once:true});
    bootLayer.replaceChildren(button);
    button.focus({preventScroll:true});
  }, 120);
}

/* ---------- 协议事件：页面就绪 ---------- */
window.addEventListener('load', () => emit(EVENTS.READY));

/* 开发提示 */
if (DEV) {
  const note = document.getElementById('dev-note');
  note.classList.remove('hidden');
  note.textContent =
    'COOKIE QUEST · dev\n' +
    'URL: ?dev=1&skip=boot&state=menu|l1|l2|help|glitch|consent\n' +
    '游戏内热键: F1=第一关 F2=第二关 F3=触发点 F4=强制剧情 F5=直接冻结 M=静音';
}

// Gesture-based audio unlock also covers the silent preview deep links.
document.addEventListener('pointerdown', () => audio.ensure());
document.addEventListener('keydown', () => audio.ensure());
document.querySelectorAll('#touch-controls button').forEach(button => {
  const key=button.dataset.key;
  button.addEventListener('pointerdown', e => {e.preventDefault();button.setPointerCapture(e.pointerId);game?.keyDown({code:key,repeat:false,preventDefault(){}});});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>game?.keyUp({code:key}));
});
