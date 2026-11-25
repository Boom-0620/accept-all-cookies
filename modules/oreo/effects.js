/* The controller explicitly imports and mounts effects into a container it owns. */
(() => {
  'use strict';
  const mounted = new WeakMap();
  window.OreoEffects = Object.freeze({
    mount(container, descriptor) {
      if (!(container instanceof HTMLElement)) throw new TypeError('An owned effect container is required.');
      if (!descriptor || descriptor.projectId !== 'oreo' || descriptor.kind !== 'horizontal-ad-strips') throw new TypeError('Unsupported effect.');
      if (mounted.has(container)) mounted.get(container)();
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;contain:layout style;';
      host.setAttribute('aria-hidden','true');
      const shadow = host.attachShadow({mode:'closed'});
      const style = document.createElement('style');
      style.textContent = ':host{pointer-events:none!important}*{box-sizing:border-box;pointer-events:none!important}.ad{position:absolute;height:19px;font:900 10px/19px Arial,sans-serif;white-space:nowrap;overflow:hidden;padding:0 11px;letter-spacing:1px;border:1px solid #111;box-shadow:2px 2px #111;opacity:.95;transition:opacity .5s}.ad:nth-of-type(1){bottom:16px;left:3%;width:min(220px,50%)}.ad:nth-of-type(2){bottom:42px;right:2%;width:min(255px,56%)}.ad:nth-of-type(3){bottom:68px;left:11%;width:min(245px,55%)}.fade .ad{opacity:0}@media(prefers-reduced-motion:reduce){.ad{transition:none}}';
      shadow.append(style);
      const wrap = document.createElement('div');
      (descriptor.strips || []).slice(0,3).forEach(item => {
        const strip=document.createElement('div');strip.className='ad';strip.textContent=String(item.text).slice(0,80);
        strip.style.backgroundColor=item.background;strip.style.color=item.color;wrap.append(strip);
      });
      shadow.append(wrap);container.append(host);
      const ttl=Math.max(1000,Math.min(10000,Number(descriptor.durationMs)||8500));
      let stopped=false;
      const fade=setTimeout(()=>wrap.classList.add('fade'),Math.max(0,ttl-500));
      const timer=setTimeout(dispose,ttl);
      function dispose(){if(stopped)return;stopped=true;clearTimeout(fade);clearTimeout(timer);host.remove();mounted.delete(container);}
      mounted.set(container,dispose);
      return dispose;
    }
  });
})();
