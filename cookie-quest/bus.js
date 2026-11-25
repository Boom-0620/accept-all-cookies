/* 事件总线：向父页面发送 window.postMessage 事件 */
import { DEV, SOURCE, VERSION, parentOrigin } from './config.js';

const history = [];

function devNote(type) {
  const el = document.getElementById('dev-note');
  if (!el) return;
  el.classList.remove('hidden');
  const t = new Date();
  const ts = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
  history.push(`[${ts}] emit → ${type}`);
  while (history.length > 9) history.shift();
  el.textContent = 'COOKIE QUEST · dev\n' + history.join('\n');
}

/**
 * 发送协议事件。
 * 消息结构：{ source, type, version, payload }
 */
export function emit(type, payload = null) {
  const msg = { source: SOURCE, type, version: VERSION, payload };
  try {
    window.parent.postMessage(msg, parentOrigin());
  } catch (e) {
    console.warn('[cookie-quest] postMessage 失败:', e);
  }
  // 同页监听入口（非 iframe 集成时可用）
  try { window.dispatchEvent(new CustomEvent('cookie-quest', { detail: msg })); } catch (_) {}
  if (DEV) {
    console.info('[cookie-quest] emit:', type, payload ?? '');
    devNote(type);
  }
}
