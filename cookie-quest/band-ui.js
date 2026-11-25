/* Host-owned presentation of the delivered orchestra; no source art is changed. */
const BAND_SCALE = 0.32;
const BAND_WIDTH = 481;
const BAND_HEIGHT = 210;

function installBandStyles(doc) {
  if (doc.getElementById('cq-small-band-styles')) return;
  const style = doc.createElement('style');
  style.id = 'cq-small-band-styles';
  style.textContent = `
    .band-door.cq-band-badge {
      position:absolute;left:148px!important;top:auto!important;bottom:41px;
      width:36px;height:54px;min-width:0;padding:0;margin:0;
      border:0;border-radius:0;box-shadow:none;background:transparent;
      appearance:none;cursor:pointer;pointer-events:auto;z-index:3900;
    }
    .cq-band-badge[hidden] {display:none!important}
    .cq-band-doorframe {
      position:absolute;inset:0;display:block;background:#3b251d;
      clip-path:polygon(0 30%,4% 20%,11% 11%,23% 4%,36% 0,64% 0,77% 4%,89% 11%,96% 20%,100% 30%,100% 100%,0 100%);
      pointer-events:none;image-rendering:pixelated;
    }
    .cq-band-doorframe::before {content:'';position:absolute;inset:2px;background:#d6a960;clip-path:inherit;box-shadow:inset 3px 0 #f3d29a,inset -3px 0 #987346;}
    .cq-band-doorleaf {
      position:absolute;inset:4px 4px 3px;display:block;
      background:linear-gradient(90deg,#65466d 0 3px,#8c6090 3px 8px,#805286 8px 22px,#694372 22px);
      border:1px solid #49314f;border-radius:45% 45% 0 0;
      box-shadow:inset 2px 2px #ad86a5,inset -2px -2px #5b3c66;
    }
    .cq-band-doorstar {position:absolute;left:3px;top:15px;color:#f3cf64;font:17px/18px Georgia,serif;text-shadow:1px 1px #714d25,-1px 0 #714d25;}
    .cq-band-doorhandle {position:absolute;right:2px;bottom:10px;width:3px;height:4px;background:#f2cf6f;border:1px solid #78502a;box-shadow:1px 1px #422d36;}
    .cq-band-doorstep {position:absolute;bottom:0;left:0;right:0;height:3px;background:#d8b175;border-top:1px solid #f4d8a0;}
    .cq-band-badge:hover .cq-band-doorframe {filter:brightness(1.08)}
    .cq-band-badge:focus-visible {outline:1px dotted #fff2c5;outline-offset:1px}
    .band-stage.cq-band-stage {
      position:absolute;left:140px;top:auto;bottom:41px;
      width:153.92px;height:67.2px;overflow:hidden;
      background:transparent;pointer-events:auto;cursor:pointer;z-index:4600;
    }
    .cq-band-stage iframe {
      position:absolute;inset:0 auto auto 0;max-width:none;
      display:block;background:transparent;border:0;
      transform-origin:0 0;pointer-events:none;
    }
    .band-close.cq-band-close {
      position:absolute;left:280px;top:auto;bottom:108px;
      width:14px;height:14px;min-width:0!important;min-height:0;
      padding:0;margin:0;border-radius:0;
      font:12px/12px Arial,sans-serif;z-index:4601;
      opacity:.75;pointer-events:auto;
    }
    .cq-band-close:hover,.cq-band-close:focus-visible {opacity:1}
  `;
  doc.head.append(style);
}

export function mountBandBadge(parent, { onPlay } = {}) {
  const doc = parent.ownerDocument;
  installBandStyles(doc);
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'band-door cq-band-badge';
  button.setAttribute('aria-label', '打开小门，让曲奇乐队依次出场');
  button.title = '曲奇乐队 · 点击开门';
  button.innerHTML = '<span class="cq-band-doorframe" aria-hidden="true"><span class="cq-band-doorleaf"><i class="cq-band-doorstar">✦</i><i class="cq-band-doorhandle"></i></span><span class="cq-band-doorstep"></span></span>';
  button.addEventListener('click', () => onPlay?.());
  parent.append(button);
  return button;
}

export function mountBandStage(screen, { onClose, onResume } = {}) {
  const doc = screen.ownerDocument;
  installBandStyles(doc);
  const viewport = doc.createElement('div');
  viewport.className = 'band-stage cq-band-stage';
  viewport.setAttribute('aria-label', '小曲奇乐队演出');
  viewport.setAttribute('role', 'button');viewport.tabIndex=0;viewport.title='点击继续乐队演出';
  viewport.addEventListener('pointerdown',()=>onResume?.());
  viewport.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onResume?.();}});
  screen.append(viewport);
  return { viewport, close:null };
}

export function fitBandFrame(frame) {
  Object.assign(frame.style, {
    width: `${BAND_WIDTH}px`,
    height: `${BAND_HEIGHT}px`,
    maxWidth: 'none',
    border: '0',
    background: 'transparent',
    transform: `scale(${BAND_SCALE})`,
    transformOrigin: '0 0',
  });
}
