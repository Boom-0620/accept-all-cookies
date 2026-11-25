import { PARAMS, parentOrigin } from './config.js';
import { emit } from './bus.js';
const SAVE='cq-web-checkpoint-v1';
export function readRecovery(){
 try{const s=JSON.parse(sessionStorage.getItem(SAVE));if(s?.version===1&&s.level===2&&Array.isArray(s.collected))return s;}catch(_){}return null;
}
export function clearRecovery(){try{sessionStorage.removeItem(SAVE);}catch(_){}}
export class WebRecovery {
 constructor(screen,audio,{game,onRestore,onReturn,onOpenModules}){
  this.screen=screen;this.audio=audio;this.game=game;this.onRestore=onRestore;this.onReturn=onReturn;this.armed=false;this.restored=false;this.destroyed=false;
  this.onOpenModules=onOpenModules;
  this.message=e=>{
   const parent=window.parent!==window&&e.source===window.parent;
   const child=this.frame&&e.source===this.frame.contentWindow;
   if(!parent&&!child)return;
   const allowed=child?this.webOrigin:parentOrigin();
   if(allowed!=='*'&&e.origin!==allowed)return;
   const m=e.data;if(!m||m.source!=='cookie-quest-web'||m.version!==1)return;
   if(m.type==='web:restored')this.notify();
   if(m.type==='web:return-to-game'){this.notify();this.resume();}
  };
  window.addEventListener('message',this.message);
 }
 save(){try{sessionStorage.setItem(SAVE,JSON.stringify({...this.snapshot,restored:this.restored}));}catch(_){}}
 reset(){this.armed=false;this.restored=false;this.toast?.remove();this.toast=null;this.webRoot?.remove();this.webRoot=null;this.frame=null;document.body.classList.remove('web-interlude-active');}
 arm(snapshot=this.game.recoverySnapshot()){this.armed=true;this.snapshot=snapshot;this.restored=false;this.save();}
 openConfiguredWeb(){
  const raw=PARAMS.get('web');if(!raw){this.game.windowCtl.minimize();document.body.classList.remove('game-active');return this.onOpenModules?.()!==false;}
  let url;try{url=new URL(raw,location.href);}catch(_){return false;}
  if(!['http:','https:','file:'].includes(url.protocol))return false;
  const root=document.createElement('div');root.id='web-interlude';const frame=document.createElement('iframe');frame.title='曲奇故障网页';frame.src=url.href;
  this.webOrigin=url.protocol==='file:'?'null':url.origin;this.frame=frame;this.webRoot=root;root.append(frame);this.screen.append(root);
  document.body.classList.add('web-interlude-active');return true;
 }
 notify(){
  if(this.destroyed||!this.armed||this.restored)return false;
  this.restored=true;this.save();this.onRestore();
  if(!this.frame)this.game.windowCtl.minimize();
  document.body.classList.remove('game-active');
  const toast=document.createElement('section');toast.id='return-to-game';toast.setAttribute('aria-label','网页恢复完成');toast.setAttribute('role','status');
  toast.innerHTML='<div class="tbar"><span class="t-title">COOKIE QUEST.exe 已恢复响应</span></div><p class="return-copy">游戏可以继续了。</p><div class="return-actions"><button class="q-btn" id="return-game-btn">返回游戏</button><button class="q-btn" id="keep-exploring">继续探索</button></div>';
  toast.querySelector('#return-game-btn').onclick=()=>this.resume();toast.querySelector('#keep-exploring').onclick=()=>{toast.classList.add('return-collapsed');};this.screen.append(toast);this.toast=toast;this.audio.ding();emit('game:return-available');return true;
 }
 resume(){
  if(this.destroyed||!this.armed||!this.restored)return false;
  this.armed=false;this.toast?.remove();this.toast=null;this.webRoot?.remove();this.webRoot=null;this.frame=null;
  document.body.classList.remove('web-interlude-active');document.body.classList.add('game-active');
  // Dispose background modules before restoring the game's sound and focus.
  this.audio.ensure();this.onReturn();this.game.windowCtl.restore();this.game.resumeAfterRecovery(this.snapshot);
  document.activeElement?.blur();return true;
 }
 destroy(){this.destroyed=true;window.removeEventListener('message',this.message);this.toast?.remove();this.webRoot?.remove();document.body.classList.remove('web-interlude-active');}
}
