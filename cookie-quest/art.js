/* ============================================================
   像素美术模块（对照参考图精修版）：
   —— 描边像素精灵 / 厚糖霜滴落地块 / 精致云朵·蛋糕山·城堡·巧克力峡谷
   全部代码绘制，无外部素材。
   ============================================================ */

/* ---------- 3×5 像素字体 ---------- */
const FONT = {
  'A': '010/101/111/101/101', 'B': '110/101/110/101/110', 'C': '011/100/100/100/011',
  'D': '110/101/101/101/110', 'E': '111/100/110/100/111', 'F': '111/100/110/100/100',
  'G': '011/100/101/101/011', 'H': '101/101/111/101/101', 'I': '111/010/010/010/111',
  'J': '001/001/001/101/010', 'K': '101/101/110/101/101', 'L': '100/100/100/100/111',
  'M': '101/111/111/101/101', 'N': '110/101/101/101/101', 'O': '010/101/101/101/010',
  'P': '110/101/110/100/100', 'Q': '010/101/101/010/001', 'R': '110/101/110/101/101',
  'S': '011/100/010/001/110', 'T': '111/010/010/010/010', 'U': '101/101/101/101/111',
  'V': '101/101/101/101/010', 'W': '101/101/111/111/101', 'X': '101/101/010/101/101',
  'Y': '101/101/010/010/010', 'Z': '111/001/010/100/111',
  '0': '111/101/101/101/111', '1': '010/110/010/010/111', '2': '110/001/010/100/111',
  '3': '110/001/010/001/110', '4': '101/101/111/001/001', '5': '111/100/110/001/110',
  '6': '011/100/110/101/010', '7': '111/001/010/010/010', '8': '010/101/010/101/010',
  '9': '010/101/011/001/110',
  '!': '010/010/010/000/010', '.': '000/000/000/000/010', ':': '000/010/000/010/000',
  '-': '000/000/111/000/000', '?': '110/001/010/000/010', '>': '100/010/001/010/100',
  ' ': '000/000/000/000/000',
};

export function drawText(ctx, text, x, y, { scale = 1, color = '#fff', align = 'left' } = {}) {
  const chars = [...String(text).toUpperCase()];
  const w = chars.length * 4 * scale - scale;
  let ox = x;
  if (align === 'center') ox = Math.round(x - w / 2);
  if (align === 'right') ox = Math.round(x - w);
  ctx.fillStyle = color;
  chars.forEach((ch, i) => {
    const g = FONT[ch] || FONT['?'];
    const rows = g.split('/');
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < 3; rx++) {
        if (row[rx] === '1') {
          ctx.fillRect(ox + i * 4 * scale + rx * scale, y + ry * scale, scale, scale);
        }
      }
    });
  });
  return w;
}

export function textWidth(text, scale = 1) {
  return [...String(text)].length * 4 * scale - scale;
}

/* ---------- 通用像素图绘制 ---------- */
export function drawMap(ctx, rows, pal, x, y, { flip = false, scale = 1, tint = null } = {}) {
  x = Math.round(x); y = Math.round(y);
  const h = rows.length;
  const w = rows[0].length;
  for (let r = 0; r < h; r++) {
    const line = rows[r];
    for (let c = 0; c < w; c++) {
      const ch = line[c];
      if (ch === '.' || ch === ' ') continue;
      const col = tint || pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      const dx = x + (flip ? (w - 1 - c) : c) * scale;
      ctx.fillRect(dx, y + r * scale, scale, scale);
    }
  }
}

/* 描边绘制：先勾勒 1px 深色轮廓，再画主体（参考图的干净像素描边感） */
export function drawOutlined(ctx, rows, pal, x, y, { flip = false, outline = '#241f31' } = {}) {
  const h = rows.length, w = rows[0].length;
  ctx.fillStyle = outline;
  for (let r = 0; r < h; r++) {
    const line = rows[r];
    for (let c = 0; c < w; c++) {
      const ch = line[c];
      if (ch === '.' || ch === ' ') continue;
      const px = x + (flip ? (w - 1 - c) : c);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          ctx.fillRect(px + dx, y + r + dy, 1, 1);
    }
  }
  drawMap(ctx, rows, pal, x, y, { flip });
}

/* ============================================================
   主角：小厨师（18×30，描边，约占画面高 12.5%）
   ============================================================ */
const CHEF_PAL = {
  W: '#ffffff', G: '#dcdce8', S: '#f3c08c', K: '#26222e',
  R: '#e23a44', w: '#e8e8f0', B: '#5a3a26',
};

const HAT = [
  '......WWWWW.......',
  '....WWWWWWWWW.....',
  '..WWWWWWWWWWWWW...',
  '.WWWWWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWWW..',
  '..GGGGGGGGGGGGG...',
];
const FACE = [
  '....SSSSSSSSS.....',
  '....SSSSSSSSS.....',
  '....SKSSSSSKS.....',
  '....SSSSSSSSS.....',
  '....SSSSSSSSS.....',
  '....SSSSSSSSS.....',
  '....SSSSSSSSS.....',
];
const SCARF = ['....RRRRRRRRR.....', '...RRRRRRRRRRR....'];
const COAT_A = [
  '..WWWWWWWWWWWWW...',
  '.WWWWWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWWW..',
  '.SWWWWWWWWWWWWWS..',
  '.SWWWWWWWWWWWWWS..',
  '..WWWWWWWWWWWWW...',
  '..WwwwwwwwwwwwW...',
  '..WWWWWWWWWWWWW...',
  '...WWWWWWWWWWW....',
];
const COAT_HANDS_UP = [
  '.SWWWWWWWWWWWWWS..',
  '.SWWWWWWWWWWWWWS..',
  '..WWWWWWWWWWWWW...',
  '..WWWWWWWWWWWWW...',
  '..WwwwwwwwwwwwW...',
  '..WWWWWWWWWWWWW...',
  '..WWWWWWWWWWWWW...',
  '..WWWWWWWWWWWWW...',
  '...WWWWWWWWWWW....',
];
const LEGS_IDLE = [
  '...KKK.....KKK....',
  '...KKK.....KKK....',
  '...KKK.....KKK....',
  '..BBBB....BBBB....',
  '..BBBB....BBBB....',
];
const LEGS_RUN_A = [
  '..KKK.......KKK...',
  '..KKK.......KKK...',
  '.KKK.........KKK..',
  '.BBBB........BBBB.',
  '.BBBB........BBBB.',
];
const LEGS_RUN_B = [
  '....KKK...KKK.....',
  '....KKK...KKK.....',
  '....KKK...KKK.....',
  '...BBBB...BBBB....',
  '...BBBB...BBBB....',
];
const LEGS_JUMP = [
  '...KKK.....KKK....',
  '...KKK.....KKK....',
  '..BBBB....BBBB....',
  '..................',
  '..................',
];
const LEGS_FALL = [
  '..KKK.......KKK...',
  '..KKK.......KKK...',
  '.KKK.........KKK..',
  '.BBBB........BBBB.',
  '..................',
];

const chefRows = (legs, coat) => [...HAT, ...FACE, ...SCARF, ...coat, ...legs];
const CHEF = {
  idle: chefRows(LEGS_IDLE, COAT_A),
  runA: chefRows(LEGS_RUN_A, COAT_A),
  runB: chefRows(LEGS_RUN_B, COAT_A),
  jump: chefRows(LEGS_JUMP, COAT_HANDS_UP),
  fall: chefRows(LEGS_FALL, COAT_HANDS_UP),
};

/**
 * 绘制小厨师（带 1px 描边）。flipY=true 时上下翻转（二段跳空翻）。
 */
export function drawChef(ctx, x, y, { facing = 1, pose = 'idle', frame = 0, flipY = false } = {}) {
  const map =
    pose === 'run' ? (frame ? CHEF.runB : CHEF.runA) :
    pose === 'jump' ? CHEF.jump :
    pose === 'fall' ? CHEF.fall :
    CHEF.idle;
  const ox = Math.round(x), oy = Math.round(y);
  if (!flipY) {
    drawOutlined(ctx, map, CHEF_PAL, ox, oy, { flip: facing < 0 });
  } else {
    ctx.save();
    ctx.translate(0, oy * 2 + 30);
    ctx.scale(1, -1);
    drawOutlined(ctx, map, CHEF_PAL, ox, 0, { flip: facing < 0 });
    ctx.restore();
  }
}

/* ============================================================
   特殊角色：背景小曲奇（12×12，明显小于小厨师）
   ============================================================ */
const COOKIE_PAL = { C: '#dfae6a', O: '#9c6a33', D: '#5f3826', K: '#1c1c1c', W: '#ffffff' };

const COOKIE_NORMAL = [
  '...OOOOOO...',
  '..OCCCCCCO..',
  '.OCCDCCCCCO.',
  'OCCCDCCDCCCO',
  'OCCKCCCCKCCO',
  'OCCDCCCCCCCO',
  'KCCCCCCCCCCK',
  'OCCCDDDDCCCO',
  'OCCCCCCCCCCO',
  '.OCCDCCCCCO.',
  '..OCCCCCCO..',
  '...OOOOOO...',
];

/* 惊恐帧 A：眼睛圆睁（白底黑瞳）、嘴大张、双手举起 */
const COOKIE_PANIC_A = [
  'K..OOOOOO..K',
  '.KOOOOOOOOK.',
  '.OCWWCCWWCO.',
  'OCWKCCCCWKCO',
  'OCCCCCCCCCCO',
  'OCCDCCCCCCCO',
  'OCCCDDDDCCCO',
  'OCCCDDDDCCCO',
  'OCCCCCCCCCCO',
  '.OCCDCCCCCO.',
  '..OCCCCCCO..',
  '...OOOOOO...',
];
/* 惊恐帧 B：小手快速挥动到外侧 */
const COOKIE_PANIC_B = [
  '.K.OOOOOO.K.',
  '..OCCCCCCO..',
  '.OCWWCCWWCO.',
  'KCWKCCCCWKCK',
  'OCCCCCCCCCCO',
  'OCCDCCCCCCCO',
  'OCCCDDDDCCCO',
  'OCCCDDDDCCCO',
  'OCCCCCCCCCCO',
  '.OCCDCCCCCO.',
  '..OCCCCCCO..',
  '...OOOOOO...',
];

export function drawCookie(ctx, x, y, { mode = 'normal', panicFrame = 0, shade = 1 } = {}) {
  const map = mode === 'panic' ? (panicFrame ? COOKIE_PANIC_B : COOKIE_PANIC_A) : COOKIE_NORMAL;
  const pal = shade < 1
    ? { ...COOKIE_PAL, C: shadeHex('#dfae6a', shade), O: shadeHex('#9c6a33', shade * 0.8), D: shadeHex('#5f3826', shade) }
    : COOKIE_PAL;
  drawMap(ctx, map, pal, Math.round(x), Math.round(y));
}

/* 惊恐火花（黄色短线，参考图的小 ! 激光线） */
export function drawSparks(ctx, cx, topY, t) {
  const on = Math.floor(t * 12) % 2;
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(cx - 10 + on, topY + 2, 2, 4);
  ctx.fillRect(cx - 1, topY - (on ? 3 : 1), 2, 5);
  ctx.fillRect(cx + 8 - on, topY + 2, 2, 4);
}

function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f + 30 * (1 - f));
  const g = Math.round(((n >> 8) & 255) * f + 24 * (1 - f));
  const b = Math.round((n & 255) * f + 20 * (1 - f));
  return `rgb(${r},${g},${b})`;
}

/* ---------- HELP!!! 漫画对白框（参考图：白色锯齿泡 + 红字） ---------- */
export function drawHelpBubble(ctx, cx, bottomY, t) {
  const bob = Math.sin(t * 14) * 1.5;
  const h = 32, w = 68;
  const y0 = Math.round(bottomY - h - 10 + bob);
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#161222';
  ctx.beginPath();
  ctx.moveTo(cx - 5, y0 + h - 1);
  ctx.lineTo(cx + 2, y0 + h + 9);
  ctx.lineTo(cx + 7, y0 + h - 1);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  const spikes = 20;
  for (let i = 0; i <= spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 - Math.PI / 2;
    const rx = (w / 2) + (i % 2 === 0 ? 3.5 : -1);
    const ry = (h / 2) + (i % 2 === 0 ? 3.5 : -1);
    const px = cx + Math.cos(a) * rx;
    const py = y0 + h / 2 + Math.sin(a) * ry;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = '#161222';
  ctx.stroke();
  drawText(ctx, 'HELP!!!', cx, y0 + h / 2 - 5, { scale: 2, color: '#e02430', align: 'center' });
  ctx.restore();
}

/* ============================================================
   游戏元素：金币 / 心 / 旗帜
   ============================================================ */
export function drawCoin(ctx, x, y, frame) {
  const widths = [12, 8, 4, 8];
  const w = widths[frame % 4];
  const cx = Math.round(x + 6), yy = Math.round(y);
  const half = w / 2;
  ctx.fillStyle = '#8a5c12';
  ctx.fillRect(cx - half - 1, yy + 2, w + 2, 8);
  ctx.fillRect(cx - half + 1, yy + 1, w - 2, 10);
  ctx.fillStyle = '#c9891e';
  ctx.fillRect(cx - half, yy + 2, w, 8);
  ctx.fillRect(cx - half + 1, yy + 1, w - 2, 10);
  ctx.fillStyle = '#f6c84a';
  ctx.fillRect(cx - half + 1, yy + 2, w - 2, 8);
  ctx.fillRect(cx - half + 2, yy + 1, Math.max(0, w - 4), 10);
  if (w >= 8) {
    ctx.fillStyle = '#ffe17a';
    ctx.fillRect(cx - half + 3, yy + 3, w - 6, 6);
    ctx.fillStyle = '#f6c84a';
    ctx.fillRect(cx - half + 4, yy + 4, w - 8, 4);
    ctx.fillStyle = '#fff2b0';
    ctx.fillRect(cx - half + 2, yy + 2, 2, 2);
    ctx.fillStyle = '#c9891e';
    ctx.fillRect(cx - 1, yy + 4, 2, 4);
  } else if (w === 4) {
    ctx.fillStyle = '#fff2b0';
    ctx.fillRect(cx - 1, yy + 2, 1, 2);
  }
}

const HEART_FULL = [
  '.RRR.RRR.',
  'RLRRRRRRR',
  'RRRRRRRRR',
  'RRRRRRRRR',
  '.RRRRRRR.',
  '..RRRRR..',
  '...RRR...',
  '....R....',
];
const HEART_EMPTY = [
  '.ddd.ddd.',
  'ddddddddd',
  'ddddddddd',
  'ddddddddd',
  '.ddddddd.',
  '..ddddd..',
  '...ddd...',
  '....d....',
];
export function drawHeart(ctx, x, y, full) {
  if (full) {
    drawOutlined(ctx, HEART_FULL, { R: '#ef4052', L: '#ffa2ac' }, x, y, { outline: '#4a1420' });
  } else {
    drawMap(ctx, HEART_EMPTY, { d: '#4a3a44' }, x, y);
  }
}

export function drawFlag(ctx, x, groundY, t) {
  const flap = Math.floor(t * 5) % 2;
  ctx.fillStyle = '#6e6a78';
  ctx.fillRect(x, groundY - 34, 2, 34);
  ctx.fillStyle = '#8a8694';
  ctx.fillRect(x + 2, groundY - 33, 1, 33);
  ctx.fillStyle = '#f6c84a';
  ctx.fillRect(x - 1, groundY - 36, 4, 3);
  ctx.fillStyle = '#8a5c12';
  ctx.fillRect(x - 1, groundY - 33, 4, 1);
  const rows = [[13, 0], [12, 1], [11, 1], [9, 2], [8, 2], [6, 3], [5, 3]];
  rows.forEach(([w, off], i) => {
    const dx = flap && i % 2 ? off + 1 : off;
    ctx.fillStyle = '#e02430';
    ctx.fillRect(x + 2 + dx, groundY - 33 + i * 2, w, 2);
  });
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 6 + (flap ? 1 : 0), groundY - 31, 2, 2);
  ctx.fillRect(x + 9 + (flap ? 1 : 0), groundY - 29, 2, 2);
}

/* ============================================================
   地块（16×16，参考图风格：厚糖霜滴落顶 + 饼干/威化机身）
   ============================================================ */

/* 糖霜顶盖（厚约 6px，圆润滴落） */
function icingCap(ctx, x, y, main, light, shadow, dripSeed) {
  ctx.fillStyle = main;
  ctx.fillRect(x, y, 16, 4);
  const drips = dripSeed % 2 === 0
    ? [[0, 2], [5, 4], [11, 3]]
    : [[2, 4], [8, 2], [13, 4]];
  drips.forEach(([dx, len]) => {
    ctx.fillRect(x + dx, y + 4, 3, len);
  });
  ctx.fillStyle = shadow;
  ctx.fillRect(x, y + 4, 16, 1);
  drips.forEach(([dx, len]) => ctx.fillRect(x + dx + 2, y + 5, 1, len - 1));
  ctx.fillStyle = light;
  ctx.fillRect(x, y, 16, 2);
  ctx.fillRect(x, y + 2, 5, 1);
  drips.forEach(([dx]) => ctx.fillRect(x + dx, y + 4, 1, 1));
}

export function drawTile(ctx, type, x, y, theme, topExposed, t) {
  switch (type) {
    case 'waffle': {
      // 威化机身：暖金 + 格纹 + 高光点 + 底部焦壳
      ctx.fillStyle = '#ecbd72'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#cf9c50';
      for (const gx of [3, 8, 12]) ctx.fillRect(x + gx, y, 1, 16);
      for (const gy of [5, 10, 14]) ctx.fillRect(x, y + gy, 16, 1);
      ctx.fillStyle = '#f7dca4';
      ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + 6, y + 1, 1, 1);
      ctx.fillRect(x + 10, y + 6, 1, 1); ctx.fillRect(x + 14, y + 11, 1, 1);
      ctx.fillRect(x + 4, y + 11, 1, 1);
      ctx.fillStyle = '#8a6230';
      ctx.fillRect(x, y + 15, 16, 1);
      if (topExposed) icingCap(ctx, x, y, '#ffd88e', '#fff1bf', '#e2a952', (x / 16) | 0);
      break;
    }
    case 'biscuit': {
      // 饼干块：边框 + 斑点质感
      ctx.fillStyle = '#d9a55e'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#a8763c';
      ctx.fillRect(x, y, 16, 1); ctx.fillRect(x, y + 15, 16, 1);
      ctx.fillRect(x, y, 1, 16); ctx.fillRect(x + 15, y, 1, 16);
      ctx.fillStyle = '#b88744';
      ctx.fillRect(x + 1, y + 1, 14, 1);
      ctx.fillRect(x + 1, y + 14, 14, 1);
      ctx.fillStyle = '#c08c48';
      ctx.fillRect(x + 3, y + 5, 2, 2); ctx.fillRect(x + 9, y + 4, 2, 2);
      ctx.fillRect(x + 5, y + 10, 2, 2); ctx.fillRect(x + 11, y + 11, 2, 2);
      ctx.fillStyle = '#e8bd7d';
      ctx.fillRect(x + 11, y + 6, 2, 2); ctx.fillRect(x + 3, y + 11, 2, 2);
      if (topExposed) icingCap(ctx, x, y, '#ffd88e', '#fff1bf', '#e2a952', ((x / 16) | 0) + 1);
      break;
    }
    case 'choc': {
      // 巧克力崖体：深棕 + 岩层横纹 + 焦壳 + 淡紫奶油盖
      ctx.fillStyle = '#5d3722'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#6e4630';
      ctx.fillRect(x, y + 3, 16, 1);
      ctx.fillRect(x, y + 9, 16, 1);
      ctx.fillRect(x + 2, y + 13, 12, 1);
      ctx.fillStyle = '#4a2a18';
      ctx.fillRect(x + 3, y + 5, 3, 2); ctx.fillRect(x + 10, y + 11, 3, 2);
      ctx.fillRect(x + 6, y + 6, 2, 1);
      ctx.fillStyle = '#3f2414';
      ctx.fillRect(x, y + 15, 16, 1);
      if (topExposed) icingCap(ctx, x, y, '#f2e4f2', '#ffffff', '#cbb2cf', (x / 16) | 0);
      break;
    }
    case 'sandwich': {
      // 夹心饼干：深色上下饼 + 波浪奶油夹心
      ctx.fillStyle = '#54321c'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#6b4526';
      ctx.fillRect(x + 2, y + 2, 3, 1); ctx.fillRect(x + 9, y + 3, 3, 1);
      ctx.fillRect(x + 4, y + 12, 3, 1); ctx.fillRect(x + 11, y + 12, 2, 1);
      ctx.fillStyle = '#3f2413';
      ctx.fillRect(x, y, 16, 1); ctx.fillRect(x, y + 15, 16, 1);
      ctx.fillRect(x, y, 1, 16); ctx.fillRect(x + 15, y, 1, 16);
      ctx.fillStyle = '#ffe9c6';
      ctx.fillRect(x, y + 6, 16, 4);
      ctx.fillStyle = '#fff4dd';
      const wob = ((x / 16) | 0) % 2 === 0 ? 0 : 2;
      ctx.fillRect(x, y + 6, 16, 1);
      ctx.fillRect(x + 2 + wob, y + 5, 3, 1); ctx.fillRect(x + 9 - wob, y + 5, 3, 1);
      ctx.fillRect(x + 5 + wob, y + 9, 3, 1); ctx.fillRect(x + 12 - wob, y + 9, 2, 1);
      break;
    }
    case 'jam': {
      const canyon = theme === 'canyon';
      ctx.fillStyle = canyon ? '#38200f' : '#8f1f3e';
      ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = canyon ? '#5a3a20' : '#b23353';
      ctx.fillRect(x, y, 16, 3);
      ctx.fillStyle = canyon ? '#7a5430' : '#d14e6e';
      const sh = Math.floor(x / 8 + t * 3) % 2 === 0;
      if (sh) { ctx.fillRect(x + 2, y + 1, 4, 1); ctx.fillRect(x + 9, y + 2, 3, 1); }
      if ((Math.floor(t * 2) + x) % 5 === 0) {
        ctx.fillStyle = canyon ? '#96683a' : '#e87a94';
        ctx.fillRect(x + 6, y + 4, 2, 2);
      }
      break;
    }
  }
}

/* ============================================================
   背景装饰（参考图风格）
   ============================================================ */
const CLOUD_A = [
  '.....WWWWW......',
  '...WWWWWWWWW....',
  '..WWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWW.',
  'WWWWWWWWWWWWWWWW',
  '.GGGGGGGGGGGGGG.',
];
const CLOUD_B = [
  '...WWWWW....',
  '.WWWWWWWWW..',
  'WWWWWWWWWWWW',
  '.GGGGGGGGGG.',
];
export function drawCloud(ctx, x, y, variant = 0) {
  if (variant === 0) drawMap(ctx, CLOUD_A, { W: '#ffffff', G: '#e4e2ee' }, x, y, { scale: 2 });
  else drawMap(ctx, CLOUD_B, { W: '#ffffff', G: '#e4e2ee' }, x, y, { scale: 2 });
}

/* 圆顶蛋糕山（粉色 + 奶油顶 + 草莓） */
export function drawCakeMountain(ctx, x, baseY, w, h) {
  const half = w / 2;
  for (let i = 0; i < h; i++) {
    const k = i / h;
    const ww = Math.round(w * Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k))));
    ctx.fillStyle = i > h - Math.max(3, h * 0.2) ? '#f7c3d0' : '#f2aec0';
    ctx.fillRect(Math.round(x + half - ww / 2), baseY - i, ww, 1);
  }
  ctx.fillStyle = '#e79cb0';
  for (let dx = -half + 6; dx < half - 2; dx += 12) {
    const top = Math.round(baseY - h * Math.sqrt(Math.max(0, 1 - ((Math.abs(dx) + 3) / half) ** 2)) - 2);
    ctx.fillRect(Math.round(x + half + dx), top, 2, Math.max(0, baseY - top));
  }
  const capW = Math.round(w * 0.62);
  const capTop = baseY - h;
  ctx.fillStyle = '#fff0d6';
  ctx.fillRect(x + half - capW / 2, capTop, capW, 3);
  for (let d = 0; d < capW - 2; d += 7) {
    ctx.fillRect(x + half - capW / 2 + d + 1, capTop + 3, 4, 2 + ((d + x) % 8 < 4 ? 2 : 1));
  }
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(x + half - capW / 2, capTop, capW, 1);
  const sx = x + half - 2, sy = capTop - 6;
  ctx.fillStyle = '#e0404e';
  ctx.fillRect(sx - 2, sy, 6, 5);
  ctx.fillRect(sx - 1, sy + 5, 4, 2);
  ctx.fillStyle = '#f2777f';
  ctx.fillRect(sx - 2, sy, 2, 2);
  ctx.fillStyle = '#5fae4a';
  ctx.fillRect(sx, sy - 2, 2, 2);
}

/* 奶油城堡（L1 终点地标：粉顶白墙多塔） */
export function drawCastle(ctx, x, baseY) {
  const wall = '#fdf2dc', shade = '#ecd9b4', line = '#d9c398';
  const roof = '#ef8f9f', roofDeep = '#cf6b80', flagC = '#e0404e';
  const win = '#8a5a3a', door = '#b98154';
  const H = 64;
  ctx.fillStyle = wall; ctx.fillRect(x, baseY - H, 72, H);
  ctx.fillStyle = line;
  for (let gy = baseY - H + 6; gy < baseY; gy += 8) ctx.fillRect(x, gy, 72, 1);
  ctx.fillStyle = shade; ctx.fillRect(x + 68, baseY - H, 4, H);
  ctx.fillStyle = wall;
  for (let mx = 0; mx < 72; mx += 10) ctx.fillRect(x + mx, baseY - H - 4, 6, 4);
  [[-14, 96], [60, 96]].forEach(([dx, th]) => {
    ctx.fillStyle = wall; ctx.fillRect(x + dx, baseY - th, 26, th);
    ctx.fillStyle = line;
    for (let gy = baseY - th + 6; gy < baseY; gy += 8) ctx.fillRect(x + dx, gy, 26, 1);
    ctx.fillStyle = shade; ctx.fillRect(x + dx + 22, baseY - th, 4, th);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i < 3 ? roofDeep : roof;
      ctx.fillRect(x + dx + 13 - i, baseY - th - 16 + i, i * 2 + 1, 1);
    }
    ctx.fillStyle = '#6e6a78'; ctx.fillRect(x + dx + 12, baseY - th - 22, 1, 7);
    ctx.fillStyle = flagC; ctx.fillRect(x + dx + 13, baseY - th - 21, 8, 4);
    ctx.fillStyle = win;
    ctx.fillRect(x + dx + 9, baseY - th + 8, 6, 8);
    ctx.fillRect(x + dx + 9, baseY - th + 24, 6, 8);
    ctx.fillStyle = '#f7e7c4';
    ctx.fillRect(x + dx + 9, baseY - th + 8, 6, 2);
  });
  ctx.fillStyle = win;
  ctx.fillRect(x + 14, baseY - 42, 7, 10); ctx.fillRect(x + 42, baseY - 42, 7, 10);
  ctx.fillRect(x + 14, baseY - 24, 7, 8); ctx.fillRect(x + 42, baseY - 24, 7, 8);
  ctx.fillStyle = '#f7e7c4';
  ctx.fillRect(x + 14, baseY - 42, 7, 2); ctx.fillRect(x + 42, baseY - 42, 7, 2);
  ctx.fillStyle = door;
  ctx.fillRect(x + 28, baseY - 22, 16, 22);
  ctx.fillRect(x + 30, baseY - 26, 12, 4);
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(x + 35, baseY - 12, 2, 6);
  ctx.fillStyle = '#fff6e4';
  ctx.fillRect(x + 26, baseY - 30, 20, 3);
  ctx.fillRect(x + 28, baseY - 27, 4, 2); ctx.fillRect(x + 40, baseY - 27, 4, 2);
  ctx.fillRect(x - 2, baseY - H - 1, 76, 2);
  for (let d = 0; d < 72; d += 9) ctx.fillRect(x + d + 1, baseY - H + 1, 4, 2 + (d % 18 < 9 ? 2 : 1));
}

/* 巧克力圆顶丘（L2 远景） */
export function drawHill(ctx, x, baseY, w, h, dark = false) {
  const half = w / 2;
  for (let i = 0; i < h; i++) {
    const k = i / h;
    const ww = Math.round(w * Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k))));
    ctx.fillStyle = i > h - Math.max(3, h * 0.18) ? (dark ? '#7d5340' : '#8a5a3e') : (dark ? '#54331f' : '#6e4430');
    ctx.fillRect(Math.round(x + half - ww / 2), baseY - i, ww, 1);
  }
  const capW = Math.round(w * 0.55);
  const capTop = baseY - h;
  ctx.fillStyle = '#f2e4f2';
  ctx.fillRect(x + half - capW / 2, capTop, capW, 3);
  for (let d = 0; d < capW - 2; d += 8) {
    ctx.fillRect(x + half - capW / 2 + d + 1, capTop + 3, 4, 2 + ((d + x) % 8 < 4 ? 2 : 1));
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + half - capW / 2, capTop, capW, 1);
}

/* 大曲奇圆盘装饰（L2） */
export function drawCookieWheel(ctx, x, y, r) {
  ctx.fillStyle = '#4a2c18';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6e4428';
  ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3620';
  ctx.beginPath(); ctx.arc(x, y, r - 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2e6f2';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
    const px = x + Math.cos(a) * (r - 8);
    const py = y + Math.sin(a) * (r - 8);
    ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
  }
  ctx.fillStyle = '#8a5c36';
  ctx.beginPath(); ctx.arc(x, y, r * 0.34, 0, Math.PI * 2); ctx.fill();
}

/* 远景地平带（滚糖丘陵剪影） */
export function drawHorizonBand(ctx, cam, baseY, color, seed = 0, parallax = 0.18) {
  ctx.fillStyle = color;
  const off = cam * parallax;
  const span = 90;
  const start = Math.floor(off / span) - 1;
  for (let i = start; i < start + 7; i++) {
    const hx = i * span - off;
    const hh = 16 + ((i * 37 + seed) % 14);
    const hw = 70 + ((i * 53 + seed) % 30);
    for (let k = 0; k < hh; k++) {
      const ww = Math.round(hw * Math.sqrt(Math.max(0, 1 - (1 - k / hh) ** 2)));
      ctx.fillRect(Math.round(hx + (hw - ww) / 2), baseY - k, ww, 1);
    }
  }
}

/* 奶油瀑布（L2，动画） */
export function drawWaterfall(ctx, x, topY, bottomY, t) {
  const off = Math.floor(t * 26) % 8;
  for (let wx = 0; wx < 16; wx += 4) {
    ctx.fillStyle = (wx / 4) % 2 === 0 ? '#fff4e0' : '#e2d0f5';
    ctx.fillRect(x + wx, topY, 4, bottomY - topY);
    ctx.fillStyle = '#fdf2ff';
    for (let yy = topY + ((wx * 3 + off) % 24); yy < bottomY; yy += 24) ctx.fillRect(x + wx, yy, 4, 6);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 2, topY - 2, 20, 4);
  ctx.fillStyle = '#f0e0fa';
  ctx.fillRect(x - 2, topY + 2, 20, 2);
  ctx.fillStyle = '#ffffff';
  const sp = Math.floor(t * 8) % 3;
  ctx.fillRect(x - 4, bottomY - 2, 24, 3);
  ctx.fillRect(x - 6 + sp, bottomY - 5, 4, 3); ctx.fillRect(x + 14 - sp, bottomY - 6, 4, 3);
  ctx.fillRect(x + 4, bottomY - 7 - sp, 3, 2);
}

/* ============================================================
   桌面图标（48×48 canvas，16×16 逻辑像素 ×3）
   ============================================================ */
const ICON_MAPS = {
  computer: {
    pal: { d: '#3a3a3a', g: '#c0c0c0', s: '#9a9a9a', t: '#0f8080', w: '#bfe8e4', l: '#e8e8e8' },
    rows: [
      '................',
      '.dddddddddddddd.',
      'dggggggggggggggd',
      'dgllllllllllllgd',
      'dglttttttttttlgd',
      'dglttttttttttlgd',
      'dgltttttttwtllgd',
      'dglttttttttttlgd',
      'dglttttttttttlgd',
      'dgllllllllllllgd',
      'dggggggggggggggd',
      'dddddddddddddddd',
      '...dssssssssd...',
      '..dddddddddddd..',
      '.ddggggggggggdd.',
      '................',
    ],
  },
  folder: {
    pal: { d: '#8a5a10', f: '#f0c060', l: '#f8dfa0', p: '#ffffff' },
    rows: [
      '................',
      '..dddddddd......',
      '.dffffffffd.....',
      '.dfflllllffd....',
      '.dffffffffffffd.',
      '.dfppppppppppfd.',
      '.dfppppppppppfd.',
      '.dfppppppppppfd.',
      '.dfppppppppppfd.',
      '.dfppppppppppfd.',
      '.dfppppppppppfd.',
      '.dffppppppppffd.',
      '.dfffffffffffd..',
      '..dddddddddd....',
      '................',
      '................',
    ],
  },
  globe: {
    pal: { d: '#123a8a', b: '#2a5adf', l: '#8fd0ff', g: '#3fae5a', w: '#ffffff' },
    rows: [
      '................',
      '....dddddd......',
      '..ddbbbbbbdd....',
      '.dbbllbgbllbd...',
      '.dbllbbbbblbd...',
      'dbbwbbbbbbbbbd..',
      'dbbbbbbggbbbbbd.',
      'dbbbbbbgbbbbbbd.',
      'dbbllbbggblllbd.',
      '.dbllbbbbbbbld..',
      '.dbbllbbbbbbld..',
      '..ddbbbbbbdd....',
      '....dddddd......',
      '................',
      '................',
      '................',
    ],
  },
  bin: {
    pal: { d: '#4a545c', b: '#9aa4ad', l: '#c2ccd4', g: '#3fae5a' },
    rows: [
      '................',
      '.....dddddd.....',
      '....dbbbbbbd....',
      '.dddddddddddddd.',
      '.dbbbbbbbbbbbbd.',
      '.dblgglgglgglbd.',
      '.dbbbbbbbbbbbbd.',
      '.dblgglgglgglbd.',
      '.dbbbbbbbbbbbbd.',
      '.dblgglgglgglbd.',
      '.dbbbbbbbbbbbbd.',
      '.dblgglgglgglbd.',
      '..dbbbbbbbbbbd..',
      '..dddddddddddd..',
      '................',
      '................',
    ],
  },
  castle: {
    pal: { d: '#6e4018', b: '#b5773a', c: '#f7e7c4', r: '#e8899c', f: '#d8383e', g: '#f2c14a', k: '#5a3a20' },
    rows: [
      '................',
      '.f....f.........',
      '.ff...ff...ff...',
      'drrd.drrd.drrd..',
      'dbcb.dbcb.dbcb..',
      'dbcbfdbcbfdbcb..',
      'dbccccccccccb...',
      'dbckkbckkbccb...',
      'dbccccccccccb...',
      'dbckkbckkbccb...',
      'dbccccgggcccb...',
      'dbcccckkcccbb...',
      'dbcccckkcccbd...',
      'dddddddddddd....',
      '................',
      '................',
    ],
  },
};

export function drawIconTo(canvas, kind) {
  const spec = ICON_MAPS[kind];
  if (!spec) return;
  canvas.width = 48; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 48, 48);
  drawMap(ctx, spec.rows, spec.pal, 0, 0, { scale: 3 });
}

/* 12×12 金色小曲奇（窗口标题栏用） */
const TITLE_COOKIE = {
  pal: { O: '#b8860b', C: '#f2c14a', D: '#8a5a18' },
  rows: [
    '...OOOOOO...',
    '..OCCCCCCO..',
    '.OCCDCCCCCO.',
    'OCCCDCCDCCCO',
    'OCCCCCCDCCCO',
    'OCCDCCCCCCCO',
    'OCCCCCCCCCCO',
    'OCCCDCCDCCCO',
    'OCCCCCCCCCCO',
    '.OCCDCCCCCO.',
    '..OCCCCCCO..',
    '...OOOOOO...',
  ],
};
export function drawTitleIconTo(canvas) {
  canvas.width = 14; canvas.height = 14;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 14, 14);
  drawMap(ctx, TITLE_COOKIE.rows, TITLE_COOKIE.pal, 1, 1, { scale: 1 });
}

/* 开始按钮徽标（原创四色块） */
export function drawStartLogoTo(canvas) {
  canvas.width = 18; canvas.height = 18;
  const ctx = canvas.getContext('2d');
  const c = [['#e8483c', 0, 0], ['#38a848', 9, 0], ['#3a6fd8', 0, 9], ['#f0c030', 9, 9]];
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 18, 18);
  c.forEach(([col, x, y]) => { ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, 7, 7); });
}

/* 任务栏喇叭图标 */
export function drawSpeakerTo(canvas, muted) {
  canvas.width = 16; canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const B = '#1a1a1a', G = '#2a7de1', R = '#c83838';
  const rows = [
    '................',
    '.......B........',
    '......BB...B....',
    '.....BBB..B.....',
    '....BBB.B...B...',
    '..BBBBB..B..B...',
    '..BBBBB...B.B...',
    '..BBBBB...B.B...',
    '..BBBBB..B..B...',
    '....BBB.B...B...',
    '.....BBB..B.....',
    '......BB...B....',
    '.......B........',
    '................',
    '................',
    '................',
  ];
  const pal = muted ? { B, X: R } : { B, X: G };
  drawMap(ctx, rows, pal, 0, 0);
}

/* 像素沙漏（开机画面） */
export function drawHourglassTo(canvas) {
  canvas.width = 28; canvas.height = 36;
  const ctx = canvas.getContext('2d');
  const K = '#101010', W = '#e8e8e8', S = '#9a9a9a';
  const rows = [
    'KKKKKKKKKKKKKK',
    '.KWWWWWWWWWWK.',
    '..KWWWWWWWWK..',
    '...KWWKKWWK...',
    '....KWKKWK....',
    '.....KWWK.....',
    '......KK......',
    '.....KWWK.....',
    '....KWWWWK....',
    '...KWWSSWWK...',
    '..KWWWSSWWWK..',
    '.KWWWWWSSWWWK.',
    '..KWWWWWWWWK..',
    '.KWWWWWWWWWWK.',
    'KKKKKKKKKKKKKK',
  ];
  drawMap(ctx, rows, { K, W, S }, 0, 0, { scale: 2 });
}
