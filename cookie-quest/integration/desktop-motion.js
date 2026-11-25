// Decorative previews never talk to the story-completion protocol.
export function mountDesktopMotion({id,container}) {
 if(id==='oreo')return mountRollingOreo(container);
 if(id!=='dubai-disco')return mountIdleDetails(id,container);
 const layer=document.createElement('div');layer.className='desktop-film-preview';layer.setAttribute('aria-hidden','true');
 const video=document.createElement('video');video.poster='/accept-all-cookies/modules/dubai-disco/assets/images/poster.webp';
 video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';video.tabIndex=-1;
 const label=document.createElement('span');label.textContent='♪ DESERT DISCO · 点击播放有声广告';layer.append(video,label);container.append(layer);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let state={active:false,hidden:false},dead=false;
 const sync=next=>{if(dead)return;state=next;layer.hidden=state.active;const playing=!state.active&&!state.hidden&&!reduced.matches;
  if(playing&&video.getAttribute('src')){video.muted=true;video.play().catch(()=>{});}else video.pause();};
 // Keep the lightweight poster here; the real movie loads when its window is opened.
 const change=()=>sync(state);reduced.addEventListener('change',change);sync(state);
 return {element:layer,sync,destroy(){dead=true;video.pause();video.removeAttribute('src');video.load();layer.remove();reduced.removeEventListener('change',change);}};
}

function mountIdleDetails(id,container){
 const styles={timtam:['steam','〰','〰','✦'],'thai-flower':['flowers','✿','❀','✿'],khapse:['spark','✦','✧','✦'],'octopus-senbei':['water','〜','〜','〜']};
 const spec=styles[id];if(!spec)return null;
 const layer=document.createElement('div');layer.className='desktop-idle-details idle-'+spec[0];layer.setAttribute('aria-hidden','true');
 for(let i=1;i<spec.length;i++){const el=document.createElement('i');el.textContent=spec[i];el.style.setProperty('--i',i-1);layer.append(el);}container.append(layer);
 return {sync({active,hidden}){layer.hidden=active||hidden;},destroy(){layer.remove();}};
}

// Animate only the delivered banner photo; gameplay retains its own transforms.
function mountRollingOreo(container) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let animation=null,food=null,dead=false,state={hidden:false},observer=null;
 function sync(next=state) {
  state=next;if(dead)return;
  const doc=container.querySelector('iframe')?.contentDocument;
  const current=doc?.querySelector('.banner-food');
  if(current!==food){
   animation?.cancel();animation=null;food=current;
   observer?.disconnect();observer=null;
   if(food){
    animation=food.animate([
     {transform:'translateX(-65px) rotate(-66deg)'},
     {transform:'translateX(65px) rotate(33deg)'}
    ],{duration:3200,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
    // The banner is hidden, not destroyed, when PLAY starts.
    observer=new MutationObserver(()=>sync());
    const banner=food.closest('.banner');if(banner)observer.observe(banner,{attributes:true,attributeFilter:['hidden','class','style']});
   }
  }
  if(!animation)return;
  const banner=food.closest('.banner');
  const visible=!state.hidden&&!document.hidden&&!reduced.matches&&banner&&!banner.hidden&&getComputedStyle(banner).display!=='none';
  if(visible)animation.play();else animation.pause();
 }
 const change=()=>sync();reduced.addEventListener('change',change);document.addEventListener('visibilitychange',change);
 // Capturing load also handles the frame created just after this decoration.
 container.addEventListener('load',change,true);
 return {sync,destroy(){dead=true;animation?.cancel();observer?.disconnect();container.removeEventListener('load',change,true);reduced.removeEventListener('change',change);document.removeEventListener('visibilitychange',change);}};
}
