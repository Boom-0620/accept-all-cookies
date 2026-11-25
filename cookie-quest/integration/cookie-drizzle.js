import { cookieSprite } from '../ending-art.js';
import { COOKIE_CATALOG } from '../cookie-catalog.js';

// A decorative host layer. No audio, hit targets, scores, or story events.
const DRIZZLE_IDS = new Set([
  '01_oreo', '02_chocolate_chunk', '03_fortune', '11_butter', '13_marie',
  '14_digestive', '18_speculaas', '23_stroopwafel', '28_khapse', '32_dasik',
  '36_macaron', '43_hardtack'
]);
const drizzleSprites = new Map();
const activeDrizzles = new WeakMap();

function smallSpecimen(item, document) {
  if (drizzleSprites.has(item.id)) return drizzleSprites.get(item.id);
  const original = cookieSprite(item);
  const pixels = original.getContext('2d').getImageData(0, 0, original.width, original.height).data;
  let left = original.width, right = 0, top = original.height, bottom = 0;
  for (let y = 0; y < original.height; y++) for (let x = 0; x < original.width; x++) {
    if (pixels[(y * original.width + x) * 4 + 3] < 32) continue;
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const canvas = document.createElement('canvas');
  canvas.width = right - left + 1; canvas.height = bottom - top + 1;
  canvas.getContext('2d').drawImage(original, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  const result = {image:canvas, color:item.color || '#dba24d'};
  drizzleSprites.set(item.id, result);
  return result;
}

/** Sparse front-facing biscuits, rendered in the desktop's unscaled coordinates. */
export function mountCookieDrizzle(screen) {
  if (!screen?.ownerDocument) return {destroy() {}};
  if (activeDrizzles.has(screen)) return activeDrizzles.get(screen);
  const document = screen.ownerDocument, view = document.defaultView;
  const canvas = document.createElement('canvas');
  canvas.className = 'cookie-drizzle';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  Object.assign(canvas.style, {
    position:'absolute', left:'0', top:'0', zIndex:'9000', display:'block',
    pointerEvents:'none', userSelect:'none', imageRendering:'pixelated'
  });
  screen.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) { canvas.remove(); return {destroy() {}}; }
  const sprites = COOKIE_CATALOG.filter(item => DRIZZLE_IDS.has(item.id)).map(item => smallSpecimen(item, document));
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let dead = false, running = false, timer = 0, frame = 0, last = 0;
  let width = 864, floor = 542, pieces = [];

  function clear() {
    view.clearTimeout(timer); timer = 0;
    view.cancelAnimationFrame(frame); frame = 0;
    last = 0; pieces = [];
    context.clearRect(0, 0, width, floor);
  }

  function fit() {
    const nextWidth = Math.max(1, Math.round(screen.clientWidth || 864));
    const height = screen.clientHeight || 576;
    const taskbar = screen.querySelector('#taskbar');
    const nextFloor = Math.max(1, Math.round(taskbar?.offsetTop > 0 ? taskbar.offsetTop : height - 34));
    if (canvas.width === nextWidth && canvas.height === nextFloor) return;
    clear(); width = nextWidth; floor = nextFloor;
    canvas.width = width; canvas.height = floor;
    canvas.style.width = width + 'px'; canvas.style.height = floor + 'px';
    context.imageSmoothingEnabled = false;
    if (running) schedule();
  }

  function schedule() {
    if (!running || dead || timer) return;
    timer = view.setTimeout(() => {
      timer = 0;
      if (!running || dead) return;
      // The limit includes an impact that is still shedding crumbs.
      if (pieces.length < 3) spawn();
      schedule();
    }, 1500 + Math.random() * 2000);
  }

  function spawn() {
    const sprite = sprites[Math.floor(Math.random() * sprites.length)];
    if (!sprite) return;
    const side = 12 + Math.floor(Math.random() * 13);
    const ratio = side / Math.max(sprite.image.width, sprite.image.height);
    const w = Math.max(1, Math.round(sprite.image.width * ratio));
    const h = Math.max(1, Math.round(sprite.image.height * ratio));
    pieces.push({
      phase:'fall', image:sprite.image, color:sprite.color,
      x:12 + Math.random() * Math.max(1, width - w - 24), y:-h,
      w, h, velocity:40 + Math.random() * 30, gravity:235 + Math.random() * 65,
      drift:(Math.random() - .5) * 12
    });
    if (!frame) { last = 0; frame = view.requestAnimationFrame(tick); }
  }

  function crumble(piece) {
    piece.phase = 'crumbs'; piece.age = 0;
    const count = 4 + Math.floor(Math.random() * 4);
    piece.crumbs = Array.from({length:count}, (_, i) => ({
      x:piece.x + piece.w / 2 + (Math.random() - .5) * piece.w * .6,
      y:floor - 2 - Math.random() * 3,
      vx:(Math.random() - .5) * 135, vy:-45 - Math.random() * 60,
      size:1 + Math.floor(Math.random() * 3),
      color:i % 3 === 0 ? '#68401f' : i % 3 === 1 ? piece.color : '#efc779',
      life:.42 + Math.random() * .18
    }));
  }

  function tick(now) {
    frame = 0;
    if (!running || dead) return;
    const delta = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    context.clearRect(0, 0, width, floor);
    for (const piece of pieces) {
      if (piece.phase === 'fall') {
        piece.velocity += piece.gravity * delta;
        piece.y += piece.velocity * delta;
        piece.x = Math.max(0, Math.min(width - piece.w, piece.x + piece.drift * delta));
        if (piece.y + piece.h >= floor) crumble(piece);
        else context.drawImage(piece.image, Math.round(piece.x), Math.round(piece.y), piece.w, piece.h);
      }
      if (piece.phase === 'crumbs') {
        piece.age += delta;
        for (const crumb of piece.crumbs) {
          if (piece.age >= crumb.life) continue;
          crumb.vy += 430 * delta; crumb.x += crumb.vx * delta; crumb.y += crumb.vy * delta;
          context.globalAlpha = Math.ceil((1 - piece.age / crumb.life) * 4) / 4;
          context.fillStyle = crumb.color;
          context.fillRect(Math.round(crumb.x), Math.round(crumb.y), crumb.size, crumb.size);
        }
        context.globalAlpha = 1;
      }
    }
    pieces = pieces.filter(piece => piece.phase === 'fall' || piece.age < .6);
    if (pieces.length) frame = view.requestAnimationFrame(tick);
    else { last = 0; context.clearRect(0, 0, width, floor); }
  }

  function sync() {
    if (dead) return;
    const allowed = !document.hidden && !motion.matches;
    if (allowed === running) return;
    running = allowed;
    if (running) schedule(); else clear();
  }

  const observer = new view.ResizeObserver(fit);
  observer.observe(screen);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  fit(); sync();
  const api = {
    destroy() {
      if (dead) return;
      dead = true; running = false; clear();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      canvas.remove();
      activeDrizzles.delete(screen);
    }
  };
  activeDrizzles.set(screen, api);
  return api;
}
