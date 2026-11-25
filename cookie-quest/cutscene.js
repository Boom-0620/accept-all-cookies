/* ============================================================
   关键剧情反转序列（第二关）：
   阶段1 冻结空停 → 阶段2 小曲奇惊恐求救 HELP!!! → 阶段3 画面故障 → 阶段4 冻结移交
   ============================================================ */
import { EVENTS } from './config.js';
import { emit } from './bus.js';
import { drawHelpBubble } from './art.js';

const PHASE_TIME = { freeze: 0.55, panic: 1.45, glitch: 3.1 };

export class HelpCutscene {
  /** @param engine 游戏引擎；@param onDevDevFrozenHint 冻结后的开发提示回调 */
  constructor(engine) {
    this.engine = engine;
    this.phase = null;
    this.t = 0;
    this.done = false;
    this.bubbleT = 0;
  }

  start({ startAt = 'freeze' } = {}) {
    this.phase = startAt;
    this.t = 0;
    this.done = false;
    const e = this.engine;
    e.state = 'cutscene';
    e.player.freeze();
    e.cameraLocked = true;
    e.audio.stopMusic();

    if (startAt === 'freeze') {
      e.audio.stutterMusic();                 // 阶段1：声音卡顿
    } else {
      this.enterPanic();
    }
    if (startAt === 'glitch') {
      this.t = PHASE_TIME.panic;              // 直接进入故障
      this.enterGlitch();
    }
  }

  enterPanic() {
    const e = this.engine;
    this.phase = 'panic';
    this.t = 0;
    if (e.level.cookie) e.level.cookie.panic = true;
    this.bubbleT = 0;
    e.audio.stinger();
    e.shake = 0.32;                            // 轻微镜头停顿
    emit(EVENTS.COOKIE_HELP);                  // → game:cookie-help
  }

  enterGlitch() {
    const e = this.engine;
    this.phase = 'glitch';
    this.t = 0;
    e.glitchActive = true;
    e.audio.stinger();
    emit(EVENTS.GLITCH_STARTED);               // → game:glitch-started
  }

  finish() {
    const e = this.engine;
    this.phase = 'done';
    this.done = true;
    e.glitchActive = false;
    e.audio.stopMusic();
    e.audio.thud();
    e.freezeForHost();                         // 冻结等待外部接管
    emit(EVENTS.CONSENT_REQUESTED);            // → game:consent-requested
  }

  update(dt) {
    if (this.done) return;
    this.t += dt;
    const e = this.engine;

    if (this.phase === 'freeze') {
      // 背景仍在动一瞬间（引擎 update 只跳过玩家），到点进入惊恐
      if (this.t >= PHASE_TIME.freeze) this.enterPanic();
    } else if (this.phase === 'panic') {
      this.bubbleT += dt;
      // 小手快速挥动（10fps 交替）
      e.level.cookie.panicFrame = Math.floor(this.bubbleT * 10) % 2;
      if (e.shake > 0) e.shake = Math.max(0, e.shake - dt);
      if (this.t >= PHASE_TIME.panic) this.enterGlitch();
    } else if (this.phase === 'glitch') {
      // 故障尾声随机短促音
      if (Math.random() < dt * 14) e.audio.glitchTick();
      if (this.t >= PHASE_TIME.glitch) this.finish();
    }
  }

  /** 故障强度包络：渐入 → 保持 → 收束（不持续满强度闪烁） */
  glitchIntensity() {
    if (this.phase !== 'glitch') return 0;
    const t = this.t, d = PHASE_TIME.glitch;
    if (t < 0.45) return (t / 0.45) * 0.62;
    if (t < d - 0.8) return 0.62 + Math.sin(t * 9) * 0.1;
    if (t < d - 0.18) return 0.78;
    return 0.95;   // 最后两帧最重，随后骤停
  }

  /** 在世界坐标之上绘制 HELP!!! 气泡 */
  render(ctx) {
    if (this.phase !== 'panic' && this.phase !== 'glitch' && !(this.phase === 'done')) return;
    if (!this.bubbleT && this.phase !== 'panic') return;
    const c = this.engine.level.cookie;
    if (!c) return;
    const cam = this.engine.camera;
    // 冻结完成后仍保留气泡（画面静止）
    drawHelpBubble(ctx, c.x + 6 - cam, c.y - 2, this.engine.ambientT);
  }
}
