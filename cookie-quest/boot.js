/* 开机流程：CRT 点亮 → BIOS 自检文字 → COOKIE OS 95 启动画面 → 进入桌面 */
import { DEV, PARAMS } from './config.js';
import { drawHourglassTo } from './art.js';

const BIOS_LINES = [
  'COOKIE BIOS v2.4  (C) 1995 Crumb Microsystems',
  'Memory Test : 65536 KB OK',
  'Display     : CRT 864x576 ... OK',
  'Booting Windows 95 ...',
];

export class BootSequence {
  constructor({ bootLayer, flashEl, audio }) {
    this.bootLayer = bootLayer;
    this.flashEl = flashEl;
    this.audio = audio;
    this.timers = [];
    this.running = false;
  }

  later(ms, fn) { this.timers.push(setTimeout(fn, ms)); }

  clear() { this.timers.forEach(clearTimeout); this.timers = []; }

  powerOn(onDone) {
    if (this.running) return;
    this.running = true;
    this.clear();
    this.bootLayer.classList.remove('hidden');
    this.bootLayer.innerHTML = '';

    // 1. CRT 点亮闪光
    this.flashEl.classList.remove('igniting');
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('igniting');
    this.audio.powerHum();

    // 2. BIOS 文字逐行出现
    const bios = document.createElement('div');
    bios.id = 'boot-bios';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    bios.appendChild(cursor);
    this.bootLayer.appendChild(bios);

    let line = 0;
    const pushLine = () => {
      if (line >= BIOS_LINES.length) return;
      const el = document.createElement('div');
      el.textContent = BIOS_LINES[line++];
      bios.insertBefore(el, cursor);
      this.audio.click();
      this.later(300, pushLine);
    };
    this.later(340, pushLine);
    // 居中的 "Starting Windows 95..." + 沙漏（参考图 ① 的构图）
    this.later(1500, () => {
      bios.innerHTML = '';
      const center = document.createElement('div');
      center.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;';
      const msg = document.createElement('div');
      msg.textContent = 'Starting Windows 95...';
      msg.style.cssText = 'font-size:24px;letter-spacing:1px;color:#e8e8e8;';
      const hg = document.createElement('canvas');
      drawHourglassTo(hg);
      center.append(msg, hg);
      bios.appendChild(center);
    });

    // 3. 启动画面（约 2.8s）
    this.later(2100, () => this.showSplash());
    // 4. 进入桌面
    this.later(5300, () => this.finish(onDone));
  }

  showSplash() {
    this.bootLayer.innerHTML = '';
    const splash = document.createElement('div'); splash.id = 'boot-splash';
    const cv = document.createElement('canvas');cv.width=864;cv.height=540;
    splash.append(cv);this.bootLayer.append(splash);
    const reference=new Image();reference.src='./assets/reference-flow.png';
    let progress=0;
    const paint=()=>{
      const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
      if(reference.complete&&reference.naturalWidth)g.drawImage(reference,538,63,370,242,0,0,864,540);
      else {g.fillStyle='#7393bf';g.fillRect(0,0,864,540);}
      g.fillStyle='#bdb6c7';g.fillRect(216,442,438,28);
      for(let i=0;i<progress;i++){g.fillStyle=i%2?'#0d1fa4':'#1034b9';g.fillRect(218+i*29,444,26,24);}
    };
    reference.onload=paint;paint();this.audio.bootChime();
    for(let i=0;i<15;i++)this.later(180+i*180,()=>{progress=i+1;paint();});
  }

  drawLogo(cv) {
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 96, 96);
    // 像素曲奇 + 四色光芒（原创徽标）
    const pal = { C: '#d9a25f', O: '#a4713a', D: '#6b4026' };
    const rows = [
      '....OOOOOO....',
      '..OOCCCCCCOO..',
      '.OCCCDCCCCCO..',
      '.OCCCCDCCCCCO.',
      'OCCDCCCCCCDCCO',
      'OCCCCCDCCCCCCO',
      'OCCDCCCCCCDCCO',
      'OCCCCCCDCCCCCO',
      '.OCCDCCCCCCCCO'.slice(0, 14),
      '.OCCCCDCCCCCO.',
      '..OOCCCCCCOO..',
      '....OOOOOO....',
    ];
    rows.forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === '.') return;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(8 + c * 6, 8 + r * 6, 6, 6);
      });
    });
    // 光芒
    ctx.fillStyle = '#ffd94a';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.fillRect(48 + Math.cos(a) * 38 - 3, 48 + Math.sin(a) * 38 - 3, 7, 7);
    }
  }

  finish(onDone) {
    this.clear();
    this.running = false;
    this.bootLayer.classList.add('hidden');
    this.bootLayer.innerHTML = '';
    onDone && onDone();
  }

  /* 跳过动画直接完成（开发模式） */
  skip(onDone) {
    if (!this.running) {
      this.bootLayer.classList.add('hidden');
      onDone && onDone();
      return;
    }
    this.finish(onDone);
  }
}

export function shouldSkipBoot() {
  return PARAMS.get('skip') === 'boot';
}

export function devSkipBoot() { return DEV && shouldSkipBoot(); }
