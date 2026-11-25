// Host presentation only: fit the outer window to the delivered content.
(() => {
 const id=location.pathname.split('/').filter(Boolean)[location.pathname.split('/').filter(Boolean).indexOf('modules')+1];
 if(!['dubai-disco','oreo','thai-flower'].includes(id))return;
 const style=document.createElement('style');
 style.textContent='html,body{margin:0!important;padding:0!important;min-height:0!important;height:auto!important;background:transparent!important}';
 if(id==='dubai-disco')style.textContent+='body{display:block!important}.stage{width:100%!important;margin:0!important;padding:0!important;display:block!important}video{display:block!important;width:100%!important;height:auto!important;object-fit:contain!important}.transport{margin:0!important}';
 if(id==='oreo')style.textContent+='.oreo{width:100%!important;max-width:none!important;margin:0!important;border:0!important;box-shadow:none!important}.titlebar{display:none!important}';
 if(id==='thai-flower')style.textContent+='#module{width:100%!important;display:block!important;padding:0!important;margin:0!important;min-height:0!important}.browser,.ad-window{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important}.browser>.titlebar,.ad-window>.titlebar{display:none!important}';
 document.head.append(style);
 let dead=false,last=0;
 const target=document.querySelector(id==='oreo'?'.oreo':id==='thai-flower'?'#module':'body');
 if(!target)return;
 const report=()=>{
  if(dead)return;
  const height=Math.ceil(target.getBoundingClientRect().height);
  if(height<30||Math.abs(last-height)<2)return;
  last=height;parent.postMessage({source:'cookie-host-adapter',projectId:id,type:'content-size',height},location.origin);
 };
 const observer=new ResizeObserver(report);observer.observe(target);
 document.querySelector('video')?.addEventListener('loadedmetadata',report);
 report();
 window.addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.source==='cookie-desktop'&&e.data.type==='destroy'){dead=true;observer.disconnect();}});
})();
