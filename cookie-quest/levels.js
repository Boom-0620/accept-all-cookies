/* ============================================================
   关卡定义：LEVEL 01 黄油饼干原野 / LEVEL 02 巧克力夹心峡谷
   网格 16px/格，地图高 15 格；地面顶为第 10 行（画面下半为厚实地体，
   更贴近参考图的紧凑构图）。关卡长度按"更短更紧凑"要求设计。
   ============================================================ */
import { TILE } from './config.js';

export const T = {
  EMPTY: 0,
  WAFFLE: 'waffle',     // 威化地砖
  BISCUIT: 'biscuit',   // 饼干块
  CHOC: 'choc',         // 巧克力地砖
  SANDWICH: 'sandwich', // 夹心饼干平台
  JAM: 'jam',           // 果酱 / 巧克力酱（危险，非实心）
};

class LevelBuilder {
  constructor(width) {
    this.width = width;
    this.grid = Array.from({ length: 15 }, () => new Array(width).fill(T.EMPTY));
    this.coins = [];
    this.decors = [];
    this.spawn = { x: 3 * TILE, y: 9 * TILE };
    this.flag = null;
    this.cookie = null;
    this.bgLedge = null;
    this.trigger = null;
  }
  /* 地面：从 top 行一直填到地图底部（5 行厚的地体） */
  ground(x0, x1, top = 10, type = T.WAFFLE) {
    for (let x = x0; x <= x1; x++)
      for (let y = top; y < 15; y++) this.grid[y][x] = type;
  }
  pit(x0, x1, kind = T.JAM) {
    for (let x = x0; x <= x1; x++) this.grid[14][x] = kind;
  }
  /* 浮空平台：默认 2 行厚（参考图的厚饼干平台）；thick=false 为薄块 */
  plat(x, y, w, type = T.BISCUIT, thick = true) {
    const rows = thick ? [y, y + 1] : [y];
    for (let i = 0; i < w; i++)
      for (const yy of rows) this.grid[yy][x + i] = type;
  }
  coinsRow(x, y, n, step = 1) {
    for (let i = 0; i < n; i++) this.coins.push({ x: (x + i * step) * TILE + 2, y: y * TILE + 2, got: false });
  }
  coinArc(x, y, n) {
    const hs = [0, 2, 3, 2, 0];
    for (let i = 0; i < n; i++) this.coins.push({ x: (x + i) * TILE + 2, y: (y - hs[i % 5]) * TILE + 2, got: false });
  }
  deco(kind, x, y, extra = null) { this.decors.push({ kind, x: x * TILE, y: y * TILE, extra }); }
  addBgLedge(x0, x1, y) { this.bgLedge = { x0, x1, y }; }
  setCookie(tx, groundRow) {
    this.cookie = { x: tx * TILE, y: groundRow * TILE - 19, panic: false, panicFrame: 0 };
  }
  setTrigger(x0px, x1px) { this.trigger = { x0: x0px, x1: x1px, fired: false }; }
  setFlag(tx, groundTopRow) { this.flag = { x: tx * TILE, y: groundTopRow * TILE }; }
  setSpawn(tx, ty) { this.spawn = { x: tx * TILE, y: ty * TILE }; }
}

/* ---------------- LEVEL 01 黄油饼干原野（约 40 秒通关） ---------------- */
export function buildLevel1() {
  const b = new LevelBuilder(108);
  b.setSpawn(3,12);
  b.ground(0,5,12); b.ground(6,13,11); b.ground(14,17,10);
  b.pit(18,19); b.ground(20,23,12); b.ground(24,33,10);
  b.pit(34,36); b.ground(37,44,11); b.plat(40,7,3,T.BISCUIT,false);
  b.ground(45,49,10); b.pit(50,52); b.ground(53,60,11);
  b.plat(56,7,3,T.BISCUIT,false); b.ground(61,65,10); b.pit(66,68);
  b.ground(69,74,12); b.ground(75,81,11); b.ground(82,107,10);
  b.plat(87,9,2,T.BISCUIT,false);
  b.coinsRow(8,9,3,2); b.coinsRow(14,8,2,2); b.coinsRow(26,8,3,2);
  b.coinsRow(40,5,2,2); b.coinsRow(46,8,2,2); b.coinsRow(56,5,2,2);
  b.coinsRow(63,8,2,2); b.coinsRow(77,9,2,2); b.coinsRow(90,8,2,2);
  b.setFlag(99,10);
  b.deco('cake',-4,13,{w:143,h:85}); b.deco('cake',15,13,{w:157,h:79});
  b.deco('castle',17,9); b.deco('cake',32,13,{w:178,h:101});
  b.deco('castle',43,9); b.deco('cake',52,13,{w:140,h:74});
  return b;
}

export function buildLevel2() {
  const b = new LevelBuilder(114);
  b.setSpawn(3,12);
  b.ground(0,5,12,T.CHOC); b.ground(6,13,10,T.CHOC); b.pit(14,16);
  b.ground(17,21,11,T.CHOC); b.ground(22,28,9,T.CHOC); b.pit(29,31);
  b.ground(32,38,11,T.CHOC); b.ground(39,45,10,T.CHOC); b.pit(46,49);
  b.ground(50,57,11,T.CHOC); b.ground(58,64,8,T.CHOC); b.ground(65,72,10,T.CHOC);
  b.pit(73,75); b.ground(76,82,11,T.CHOC); b.ground(83,88,9,T.CHOC);
  b.pit(89,91); b.ground(92,98,10,T.CHOC); b.ground(99,113,11,T.CHOC);
  b.coinsRow(8,8,3,2); b.coinsRow(23,7,3,2); b.coinsRow(34,9,2,2); b.coinsRow(41,8,2,2);
  b.coinsRow(49,7,2,2);
  b.coinsRow(60,6,2,2); b.coinsRow(67,8,2,2); b.coinsRow(78,9,2,2);
  b.coinsRow(84,7,2,2); b.coinsRow(94,8,2,2); b.coinsRow(102,9,2,2);
  b.setCookie(54,11); b.setTrigger(46*TILE,50*TILE);
  b.deco('hills',-5,14,{w:155,h:102,dark:true}); b.deco('wheel',4,10,{r:29});
  b.deco('hills',17,14,{w:171,h:151,dark:true}); b.deco('wheel',25,10,{r:35});
  b.deco('waterfall',15,11,{bottom:15}); b.deco('hills',35,14,{w:165,h:126,dark:true});
  b.deco('waterfall',37,10,{bottom:15}); b.deco('wheel',45,10,{r:33});
  b.setFlag(106,11);
  return b;
}

/* 主题：天空渐变 / 地平带配色 */
export const THEMES = {
  butter: {
    name: 'butter',
    skyTop: '#ffe3a0', skyBottom: '#ffc98e',
    horizon: '#f6c9bd',
    ground: T.WAFFLE,
  },
  canyon: {
    name: 'canyon',
    skyTop: '#cbb0e0', skyBottom: '#e2d0ee',
    horizon: '#9a7ab4',
    ground: T.CHOC,
  },
};

export function isSolid(t) { return !!t && t !== T.JAM; }
export function isHazard(t) { return t === T.JAM; }
