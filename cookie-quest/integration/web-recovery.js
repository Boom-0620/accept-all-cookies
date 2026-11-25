/* Include after the module script. Call ready() only when the web page is restored. */
(() => {
 let ready=false;
 const send=type=>{
  if(window.parent===window)return false;
  const params=new URLSearchParams(location.search);
  const configured=params.get('gameOrigin');
  let target=configured;
  if(!target){try{target=new URL(document.referrer).origin;}catch(_){target='*';}}
  if(target==='null'||target==='file://')target='*';
  window.parent.postMessage({source:'cookie-quest-web',type,version:1,moduleId:document.documentElement.dataset.cookieModule||'cookie-web'},target);
  return true;
 };
 window.CookieQuestRecovery=Object.freeze({
  ready(){if(ready)return;ready=true;send('web:restored');},
  // Only for an existing, explicit return control in the external website.
  returnToGame(){if(ready)send('web:return-to-game');},
 });
})();
