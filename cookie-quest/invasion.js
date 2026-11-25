import { drawIncense } from './scene-art.js';
import { drawTitleIconTo } from './art.js';
import { emit } from './bus.js';
import { mountConsent } from './consent.js';

/** The invasion is contained inside the fictional desktop. */
export class CookieInvasion {
  constructor(screen,audio,{onExit,onReplay,onRestore,onWebStart}) {
    this.audio=audio;this.onExit=onExit;this.onReplay=onReplay;this.onRestore=onRestore;this.onWebStart=onWebStart;
    this.root=document.createElement('div');this.root.id='invasion-layer';
    screen.append(this.root);this.timers=[];this.canvases=[];this.destroyed=false;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.frame=0;this.escaped=e=>{if(e.key==='Escape')this.exit();};
    document.addEventListener('keydown',this.escaped);
  }
  later(ms,fn){this.timers.push(setTimeout(()=>{if(!this.destroyed)fn();},ms));}
  window(title,{x=220,y=154,w=424,h=228,close=()=>this.exit()}={}) {
    const el=document.createElement('section');el.className='qwindow cookie-dialog';
    el.setAttribute('role','dialog');el.setAttribute('aria-label',title);
    Object.assign(el.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
    const bar=document.createElement('div');bar.className='tbar';
    const icon=document.createElement('canvas');drawTitleIconTo(icon);
    const label=document.createElement('div');label.className='t-title';label.textContent=title;
    const xbtn=document.createElement('button');xbtn.className='tbtn t-close';xbtn.setAttribute('aria-label','关闭 '+title);xbtn.onclick=close;
    const body=document.createElement('div');body.className='cookie-body';
    bar.append(icon,label,xbtn);el.append(bar,body);this.root.append(el);
    return {el,body};
  }
  showConsent() {
    this.root.replaceChildren();
    mountConsent(this.root,()=>this.accept(),()=>{this.root.replaceChildren();this.later(1800,()=>this.showConsent());});
    this.audio.ding();
  }
  accept() {
    if(this.accepted)return;this.accepted=true;this.root.replaceChildren();
    this.audio.click();emit('game:consent-accepted');
    const add=(index)=>{
      const center=index===0;
      const x=center?268:Math.round(36+(index*63)%470);
      const y=center?120:Math.round(24+(index*33)%240);
      const {el,body}=this.window('We use cookies.',{x,y,w:328,h:292,close:()=>{el.remove();if(this.canvases.length<22)add(this.canvases.length);}});
      el.classList.add('replica');
      const cv=document.createElement('canvas');cv.width=128;cv.height=128;cv.setAttribute('aria-label','双手持三炷香、不断俯身叩拜的曲奇');
      body.append(cv);this.canvases.push(cv);drawIncense(cv.getContext('2d'),index*.3);
      if(index>0&&index%3===0)this.audio.glitchTick();
    };
    add(0);
    let animationStart=null;
    const animate=t=>{
      if(this.destroyed)return;
      if(animationStart===null)animationStart=t;
      const elapsed=(t-animationStart)/1000;
      this.canvases.forEach((cv,i)=>{if(cv.isConnected)drawIncense(cv.getContext('2d'),this.reduced?0:elapsed+i*.17);});
      this.frame=requestAnimationFrame(animate);
    };
    this.frame=requestAnimationFrame(animate);
    this.later(1500,()=>emit('game:invasion-started'));
    const count=this.reduced?5:12;
    for(let i=1;i<=count;i++)this.later(1500+i*(this.reduced?360:160),()=>add(i));
    this.later(2100+count*(this.reduced?360:160),()=>{
      emit('game:invasion-complete');
      if(this.onWebStart?.())return;
      const footer=document.createElement('div');footer.className='invasion-footer';
      footer.innerHTML='<span>COOKIE QUEST.exe 已被曲奇占领</span><button class="q-btn" id="restore-desktop">恢复桌面</button><button class="q-btn" id="replay-story">重新体验</button><button class="q-btn" id="escape-desktop">返回桌面</button>';
      footer.querySelector('#restore-desktop').onclick=()=>{this.destroy();this.onRestore?.();};
      footer.querySelector('#replay-story').onclick=()=>{this.destroy();this.onReplay();};
      footer.querySelector('#escape-desktop').onclick=()=>this.exit();
      this.root.append(footer);
    });
  }
  exit(){this.destroy();this.onExit();}
  destroy(){if(this.destroyed)return;this.destroyed=true;this.timers.forEach(clearTimeout);cancelAnimationFrame(this.frame);document.removeEventListener('keydown',this.escaped);this.root.remove();}
}
