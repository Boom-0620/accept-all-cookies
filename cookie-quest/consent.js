import { drawTitleIconTo } from './art.js';

// Both invitations share the same markup and Windows appearance.
export function mountConsent(root, onAccept, onClose) {
 const el=document.createElement('section');el.className='qwindow cookie-dialog shared-consent';
 el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','We use cookies.');
 el.innerHTML='<div class="tbar"><canvas></canvas><div class="t-title">We use cookies.</div><button class="tbtn t-close" aria-label="关闭窗口"></button></div><div class="cookie-body"><p class="consent-copy">We use cookies.</p><div class="consent-actions"><button class="q-btn accept-all">ACCEPT ALL</button><button class="q-btn cookie-settings" disabled aria-disabled="true">Settings</button></div></div>';
 drawTitleIconTo(el.querySelector('canvas'));
 el.querySelector('.accept-all').onclick=onAccept;el.querySelector('.t-close').onclick=onClose;
 root.append(el);el.querySelector('.accept-all').focus({preventScroll:true});return el;
}
