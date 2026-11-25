/* 小厨师物理：移动 / 重力 / 跳跃缓冲+土狼时间 / 地形碰撞 / 危险判定 */
import { TILE } from './config.js';
import { isSolid, isHazard } from './levels.js';

const MOVE = 100;          // px/s
const GRAVITY = 840;
const JUMP_V = -318;      // 跳起初速（约 3.4 格高）
const JUMP_CUT = 0.45;    // 松开跳跃键的减速系数
const MAX_FALL = 320;
const COYOTE = 0.085;     // 土狼时间
const BUFFER = 0.12;      // 跳跃缓冲

export class Player {
  constructor(spawn) {
    this.w = 22; this.h = 32;
    this.spawnAt(spawn);
    this.facing = 1;
    this.pose = 'idle';
    this.animT = 0;
    this.invuln = 0;
    this.frozen = false;
    this.jumpsUsed = 0;   // 二段跳计数
    this.flipT = 0;       // 空翻动画计时
    this.checkpoint = { x: spawn.x, y: spawn.y };
  }

  spawnAt(p) {
    this.h = 32;
    this.crouching = false;
    this.idleT = 0;
    this.hungerT = 0;
    this.x = p.x;
    this.y = p.y - this.h;
    this.vx = 0; this.vy = 0;
    this.grounded = false;
    this.coyote = 0;
    this.buffer = 0;
    this.invuln = 1.0;
    this.jumpsUsed = 0;
    this.flipT = 0;
  }

  freeze() { this.frozen = true; this.vx = 0; this.vy = 0; }

  get flipY() { return this.flipT > 0; }

  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  update(dt, input, level, onJump, onHazard, onDoubleJump, onHungry) {
    this.animT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.frozen) return;

    // 水平
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const wantsCrouch=input.crouch&&this.grounded&&!input.jumpPressed;
    if(wantsCrouch&&!this.crouching){this.y+=8;this.h=24;this.crouching=true;}
    else if(!wantsCrouch&&this.crouching&&this.canStand(level)){this.y-=8;this.h=32;this.crouching=false;}
    this.vx = this.crouching ? 0 : dir * MOVE;
    if (dir !== 0) this.facing = dir;

    // 跳跃：缓冲 + 土狼时间 + 二段跳 + 可变高度
    this.buffer = input.jumpPressed && !this.crouching ? BUFFER : Math.max(0, this.buffer - dt);
    this.coyote = this.grounded ? COYOTE : Math.max(0, this.coyote - dt);
    if (this.flipT > 0) this.flipT -= dt;
    if (this.buffer > 0) {
      if (this.coyote > 0 && this.jumpsUsed === 0) {
        // 地面跳跃（含土狼时间）
        this.vy = JUMP_V;
        this.jumpsUsed = 1;
        this.buffer = 0; this.coyote = 0;
        this.grounded = false;
        onJump && onJump();
      } else if (this.jumpsUsed < 2) {
        // 二段跳：空中翻转 + 稍弱起跳
        this.vy = JUMP_V * 0.92;
        this.jumpsUsed = 2;
        this.flipT = 0.34;
        this.buffer = 0;
        this.grounded = false;
        onDoubleJump && onDoubleJump();
      }
    }
    if (!input.jumpHeld && this.vy < 0) this.vy += GRAVITY * (1 - JUMP_CUT) * dt * 2.2;

    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);

    // 位移与碰撞：先 X 后 Y
    this.moveX(this.vx * dt, level);
    this.moveY(this.vy * dt, level);

    // Idle personality is separate from movement and always yields to player input.
    const resting=this.grounded&&!this.crouching&&dir===0&&!input.jumpPressed;
    if(resting){
      if(this.hungerT>0){this.hungerT+=dt;if(this.hungerT>2.8){this.hungerT=0;this.idleT=0;}}
      else {this.idleT+=dt;if(this.idleT>=8){this.hungerT=dt;onHungry?.();}}
    } else {this.idleT=0;this.hungerT=0;}
    if (!this.grounded) this.pose = this.vy < 0 ? 'jump' : 'fall';
    else if(this.crouching)this.pose='crouch';
    else if(dir!==0)this.pose='run';
    else this.pose=this.hungerT>0?'hungry':'idle';

    // 危险（果酱）与掉出地图
    if (this.touchHazard(level) || this.y > 15 * TILE + 30) {
      onHazard && onHazard();
    }

    // 落地时记录安全检查点
    if (this.grounded && !this.touchHazard(level) && this.invuln <= 0) {
      const dx = this.x - this.checkpoint.x;
      if (dx > 56 || dx < -80) this.checkpoint = { x: this.x, y: this.y + this.h };
    }
  }

  canStand(level) {
    const top=this.y+this.h-32,bottom=this.y+this.h-1;
    for(let ty=Math.floor(top/TILE);ty<=Math.floor(bottom/TILE);ty++)
      for(let tx=Math.floor((this.x+1)/TILE);tx<=Math.floor((this.x+this.w-2)/TILE);tx++)
        if(isSolid(this.tileAt(level,tx,ty)))return false;
    return true;
  }

  tileAt(level, tx, ty) {
    if (tx < 0 || tx >= level.width) return T_SOLID_EDGE;
    if (ty < 0) return 0;
    if (ty >= 15) return 0;
    return level.grid[ty][tx];
  }

  moveX(dx, level) {
    this.x += dx;
    const r = this.rect();
    const y0 = Math.floor(r.y / TILE), y1 = Math.floor((r.y + r.h - 1) / TILE);
    if (dx > 0) {
      const tx = Math.floor((r.x + r.w) / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (isSolid(this.tileAt(level, tx, ty))) { this.x = tx * TILE - r.w - 0.01; this.vx = 0; break; }
      }
    } else if (dx < 0) {
      const tx = Math.floor(r.x / TILE);
      for (let ty = y0; ty <= y1; ty++) {
        if (isSolid(this.tileAt(level, tx, ty))) { this.x = (tx + 1) * TILE + 0.01; this.vx = 0; break; }
      }
    }
    this.x = Math.max(0, Math.min(this.x, level.width * TILE - this.w));
  }

  moveY(dy, level) {
    this.y += dy;
    const r = this.rect();
    const x0 = Math.floor((r.x + 1) / TILE), x1 = Math.floor((r.x + r.w - 2) / TILE);
    if (dy > 0) {
      const ty = Math.floor((r.y + r.h) / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (isSolid(this.tileAt(level, tx, ty))) {
          this.y = ty * TILE - r.h - 0.01;
          this.vy = 0;
          if (!this.grounded) { this.jumpsUsed = 0; this.flipT = 0; }
          this.grounded = true;
          return;
        }
      }
      this.grounded = false;
    } else if (dy < 0) {
      const ty = Math.floor(r.y / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (isSolid(this.tileAt(level, tx, ty))) {
          this.y = (ty + 1) * TILE + 0.01;
          this.vy = 0;
          return;
        }
      }
    }
  }

  touchHazard(level) {
    const r = this.rect();
    const feetY = r.y + r.h - 2;
    const tx0 = Math.floor((r.x + 2) / TILE), tx1 = Math.floor((r.x + r.w - 3) / TILE);
    const ty = Math.floor(feetY / TILE);
    for (let tx = tx0; tx <= tx1; tx++) {
      if (isHazard(this.tileAt(level, tx, ty))) return true;
    }
    return false;
  }
}

/* 地图边界视为实心墙 */
const T_SOLID_EDGE = { solid: true };
