/* One bounded audio player per window. Default-on playback with a gesture fallback for browser autoplay restrictions. */
(function(global){
 'use strict';
 function create(options={}){
  const player=options.audioFactory?options.audioFactory():new Audio();
  player.preload='auto';let enabled=true,blocked=false,dead=false,paused=true,track=null,offset=0,revision=0,pending=null;
  const volumes={intro:.8,game:.55,stable:.85,collapsed:.7};
  const notify=()=>options.onChange?.(api.state());
  function position(){try{player.currentTime=offset;}catch(_){}}
  function stop(){revision++;pending=null;player.pause();}
  function play(){
   if(dead||paused||!enabled||!track||!player.paused||pending!==null)return;
   position();const version=revision;pending=version;
   Promise.resolve(player.play()).then(()=>{
    if(dead||version!==revision){if(dead||paused||!enabled)player.pause();return;}
    pending=null;blocked=false;notify();
   }).catch(()=>{if(dead||version!==revision)return;pending=null;blocked=true;notify();});
  }
  const api={
   sync(next){
    if(dead)return;
    const change=track!==next.track;offset=Math.max(0,next.time||0);
    if(change){stop();track=next.track;player.loop=track==='game';if(track){player.src=options.assets?.[track]||new URL(track+'.wav',options.assetBase).href;player.volume=volumes[track];position();}else{player.removeAttribute('src');player.load();}}
    const wasPaused=paused;paused=!!next.paused;
    if(paused){if(!wasPaused||change)stop();}
    else if(wasPaused||change)play();
   },
   unlock(){if(dead||!enabled)return;play();},
   rewind(){if(dead)return;stop();position();play();},
   toggle(){if(dead)return;enabled=!enabled;blocked=false;if(enabled)play();else stop();notify();},
   state(){return{enabled,blocked,track,paused:paused||!enabled||!track||player.paused,destroyed:dead};},
   destroy(){if(dead)return;dead=true;enabled=false;stop();player.removeAttribute('src');player.load();}
  };
  return api;
 }
 global.KhapseMusic=Object.freeze({create});
})(window);
