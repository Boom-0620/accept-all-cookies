/* 全局配置：事件名 / URL 参数 / 尺寸常量 */

export const SOURCE = 'cookie-quest';
export const VERSION = 1;

export const EVENTS = {
  READY:            'game:ready',
  STARTED:          'game:started',
  L1_COMPLETE:      'game:level1-complete',
  L2_STARTED:       'game:level2-started',
  COOKIE_HELP:      'game:cookie-help',
  GLITCH_STARTED:   'game:glitch-started',
  CONSENT_REQUESTED:'game:consent-requested',
};

const qs = new URLSearchParams(location.search);

export const PARAMS = qs;
export const DEV = qs.get('dev') === '1';

/** postMessage 目标 origin：可用 ?parentOrigin= 配置，默认同源。 */
export function parentOrigin() {
  const p = PARAMS.get('parentOrigin');
  if (p) return p;
  if (window.location.protocol === 'file:') return '*';
  const o = window.location.origin;
  return o && o !== 'null' ? o : '*';
}

/* 屏幕与游戏逻辑分辨率 */
export const SCREEN_W = 864;
export const SCREEN_H = 576;
export const GAME_W = 432;    // 游戏内部逻辑分辨率（2x 显示为 720×480）
export const GAME_H = 240;
export const TILE = 16;
