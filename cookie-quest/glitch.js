/* ============================================================
   画面故障（Glitch）后处理：
   把游戏画面（离屏 buffer）以横向错位 / 色块 / 撕裂的方式呈现。
   强度 intensity ∈ [0,1]，遵循"短促、不持续高强度闪烁"的约束。
   ============================================================ */

const GLITCH_COLORS = ['#ff4fa3', '#3ff2e0', '#f8f8ff', '#a24bff', '#ffd23f'];

export function presentFrame(dstCtx, srcCanvas, intensity, t) {
  const W = srcCanvas.width, H = srcCanvas.height;
  dstCtx.clearRect(0, 0, W, H);

  if (intensity <= 0) {
    dstCtx.drawImage(srcCanvas, 0, 0);
    return;
  }

  // 基础画面
  dstCtx.drawImage(srcCanvas, 0, 0);

  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    dstCtx.fillStyle='rgba(110,40,120,.15)';dstCtx.fillRect(0,H*.4,W,8);return;
  }
  // 1. 横向切片错位
  const slices = Math.floor(3 + intensity * 9);
  for (let i = 0; i < slices; i++) {
    const sy = Math.floor(Math.random() * H);
    const sh = 4 + Math.floor(Math.random() * 26);
    const dx = (Math.random() * 2 - 1) * (3 + intensity * 16);
    dstCtx.drawImage(srcCanvas, 0, sy, W, Math.min(sh, H - sy), Math.round(dx), sy, W, Math.min(sh, H - sy));
  }

  // 2. 像素色块
  const blocks = Math.floor(intensity * 7);
  for (let i = 0; i < blocks; i++) {
    dstCtx.fillStyle = GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)];
    dstCtx.globalAlpha = 0.16 + Math.random() * 0.26;
    dstCtx.fillRect(
      Math.floor(Math.random() * W),
      Math.floor(Math.random() * H),
      8 + Math.floor(Math.random() * 60),
      2 + Math.floor(Math.random() * 8),
    );
  }
  dstCtx.globalAlpha = 1;

  // 3. 撕裂细线
  const tears = Math.floor(intensity * 5);
  dstCtx.globalAlpha = 0.4;
  for (let i = 0; i < tears; i++) {
    dstCtx.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#101018';
    dstCtx.fillRect(0, Math.floor(Math.random() * H), W, 1);
  }
  dstCtx.globalAlpha = 1;

  // 4. 偶发整帧错位 + 反色（严格限频，避免持续强闪）
  if (Math.floor(t * 2) % 5 === 0 && t % 0.5 < 0.05) {
    const dx = Math.round((Math.random() * 2 - 1) * 9);
    dstCtx.drawImage(srcCanvas, dx, 0);
    dstCtx.globalCompositeOperation = 'difference';
    dstCtx.globalAlpha = 0.55;
    dstCtx.fillStyle = '#ffffff';
    dstCtx.fillRect(0, 0, W, H);
    dstCtx.globalCompositeOperation = 'source-over';
    dstCtx.globalAlpha = 1;
  }
}

/* 冻结帧：静止画面 + 轻微压暗（等待外部页面接管） */
export function presentFrozen(dstCtx, srcCanvas) {
  dstCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
  dstCtx.drawImage(srcCanvas, 0, 0);
  dstCtx.fillStyle = 'rgba(6, 4, 14, 0.28)';
  dstCtx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
}
