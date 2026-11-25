import { makeWandererSprites } from './wanderer-art.js';

// Completion souvenirs belong to the desktop, never to the delivered modules.
// Only the small character silhouettes receive input. The space between them
// stays transparent to the independent webpages below.
const PALETTES = {
  'dubai-disco': ['#bb8b40', '#e5c16a', '#819535', '#faf0d6'],
  'fortune-cookie': ['#54256f', '#d9a248', '#fff0b4'],
  gingerbread: ['#bb3e34', '#e2bc79', '#f7e6bf', '#2d7353'],
  oreo: ['#1655ec', '#e8f1ff', '#392b23'],
  kungu: ['#84b7c9', '#dcc58c', '#665d3c'],
  'thai-flower': ['#e777a3', '#f8d75a', '#f4dfbb'],
  'octopus-senbei': ['#63c9dd', '#2d77ac', '#e5c390']
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;

export function mountDesktopWanderers(screen, { interaction = () => ({busy:false}), onReact=()=>{}, isMusicPlaying=()=>false, milkStation=null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'desktop-wanderers';
  canvas.setAttribute('aria-hidden', 'true'); canvas.inert = true;
  Object.assign(canvas.style, {position:'absolute', inset:'0 auto auto 0', zIndex:'3900',
    pointerEvents:'none', imageRendering:'pixelated', userSelect:'none'});
  screen.append(canvas);
  const controls=document.createElement('div');controls.className='desktop-wanderer-controls';
  Object.assign(controls.style,{position:'absolute',inset:'0',zIndex:'3901',pointerEvents:'none'});
  screen.append(controls);
  const g = canvas.getContext('2d'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cast = [], papers = [], puffs=[], dissolves = new Set(), spawned = new Set();
  let width = 864, floor = 542, dead = false, frame = 0, last = 0, time = 0;
  let pointer = {x:-1000, y:-1000}, grabbed=null;
  let milkVisitor=null, milkPlace=null, milkMeasured=-1, milkVisits=0;
  let lastReduced=reduced.matches;

  function fit() {
    milkMeasured=-1;
    width = screen.clientWidth || 864;
    floor = screen.querySelector('#taskbar')?.offsetTop || (screen.clientHeight || 576) - 34;
    canvas.width = width; canvas.height = floor;
    canvas.style.width = width + 'px'; canvas.style.height = floor + 'px';
    g.imageSmoothingEnabled = false;
    for (const a of cast) { a.x = clamp(a.x, 16, width - 16); a.y = clamp(a.y, 38, floor - 6); }
    wake();
  }
  function bounds(element) {
    const b = element?.getBoundingClientRect(), s = screen.getBoundingClientRect();
    if (!b || !s.width) return {x:width / 2 - 40, y:floor / 2 - 40, w:80, h:80};
    return {x:(b.left-s.left)*width/s.width, y:(b.top-s.top)*width/s.width,
      w:b.width*width/s.width, h:b.height*width/s.width};
  }
  function pointerClient(x, y) {
    const b = screen.getBoundingClientRect();
    if (b.width) pointer = {x:(x-b.left)*width/b.width, y:(y-b.top)*width/b.width};
  }
  const move = e => {
    pointerClient(e.clientX, e.clientY);
    if(grabbed&&grabbed.pointerId===e.pointerId){
      grabbed.x=clamp(pointer.x+grabbed.holdOffset.x,16,width-16);
      grabbed.y=clamp(pointer.y+grabbed.holdOffset.y,38,floor-6);wake();
    }
  };
  const leave = () => {pointer = {x:-1000,y:-1000};};
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerdown', move, {passive:true,capture:true});
  document.documentElement.addEventListener('pointerleave', leave);

  function silhouette(image) {
    const pixels=image.getContext('2d').getImageData(0,0,image.width,image.height).data,left=[],right=[];
    for(let y=0;y<image.height;y+=2){let lo=image.width,hi=-1;
      for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>40){lo=Math.min(lo,x);hi=x;}
      if(hi>=0){left.push(`${Math.max(0,lo-1)/image.width*100}% ${y/image.height*100}%`);right.push(`${Math.min(image.width,hi+2)/image.width*100}% ${Math.min(image.height,y+2)/image.height*100}%`);}
    }
    return `polygon(${[...left,...right.reverse()].join(',')})`;
  }
  function startHold(a,e,keyboard=false){
    if(dead||grabbed||(!keyboard&&e.button!==0))return;
    if(a.snack)endMilk(a,false);
    if(!keyboard){pointerClient(e.clientX,e.clientY);a.pointerId=e.pointerId;a.holdOffset={x:a.x-pointer.x,y:a.y-pointer.y};}
    else a.pointerId=null;
    e.preventDefault();e.stopPropagation();grabbed=a;a.held=true;a.holdKeyboard=keyboard;a.focusVisible=keyboard;a.reactAge=0;a.recover=0;a.alpha=1;
    a.button.style.cursor='grabbing';a.button.focus({preventScroll:true});
    if(!keyboard)a.button.setPointerCapture(e.pointerId);onReact(a);wake();
  }
  function releaseHold(e){
    const a=grabbed;if(!a||e?.pointerId!=null&&e.pointerId!==a.pointerId)return;
    grabbed=null;a.held=false;a.recover=a.reaction==='burst'?1.4:.9;a.button.style.cursor='grab';
    if(a.pointerId!=null&&a.button.hasPointerCapture(a.pointerId))a.button.releasePointerCapture(a.pointerId);
    a.pointerId=null;if(!a.holdKeyboard)a.button.blur();target(a);a.rest=0;
    // An intentional drop takes priority over fleeing, hover pauses and cooldowns.
    const place=milkLocation(), state=interaction();
    const dropped=['pointerup','keyup'].includes(e?.type);
    const nearCup=place&&Math.hypot(a.x-(place.mug.x+place.mug.w/2),a.y-a.h/2-(place.mug.y+place.mug.h/2))<58;
    if(dropped&&nearCup&&!state.busy){
      if(milkVisitor&&milkVisitor!==a)endMilk(milkVisitor,false);
      a.recover=0;a.dash=null;beginMilk(a,place);
    }else if(a.reaction==='dash'&&dropped)startDash(a);
    wake();
  }
  function makeHandle(a){
    const button=document.createElement('button');button.className='wanderer-handle';button.dataset.projectId=a.id;
    button.setAttribute('aria-label',a.name+'，可拖到牛奶杯旁喝牛奶');
    button.title='拖到牛奶杯旁，松手喝牛奶';
    Object.assign(button.style,{position:'absolute',border:'0',padding:'0',margin:'0',background:'transparent',
      boxShadow:'none',outline:'none',borderRadius:'0',cursor:'grab',touchAction:'none',pointerEvents:'auto',
      clipPath:silhouette(a.image)});
    button.addEventListener('pointerdown',e=>startHold(a,e));
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,releaseHold);
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
    button.addEventListener('keydown',e=>{
      if(e.code==='Escape'){releaseHold();e.preventDefault();}
      else if(['Space','Enter'].includes(e.code)&&!e.repeat)startHold(a,e,true);
    });
    button.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){releaseHold(e);e.preventDefault();}});
    button.addEventListener('blur',()=>{if(grabbed===a)releaseHold();});
    button.addEventListener('focus',()=>{a.focusVisible=!grabbed;wake();});controls.append(button);a.button=button;
  }
  window.addEventListener('blur',releaseHold);

  function wake() { if (!frame && !dead && !document.hidden) frame = requestAnimationFrame(tick); }
  function startDash(a){
    if(reduced.matches){a.recover=.6;return;}
    const end={x:a.x<width/2?width*.77:width*.23,y:clamp(a.y+(a.y<floor/2?105:-105),45,floor-12)};
    a.dash={age:0,from:{x:a.x,y:a.y},to:end};a.recover=0;
    puffs.push({x:a.x,y:a.y-a.h/2,age:0});if(puffs.length>6)puffs.shift();
  }
  function target(a, busy = false) {
    const place=!busy&&!milkVisitor&&a.feedKind&&time>=a.nextMilk?milkLocation():null;
    if(place&&Math.random()<.7){a.tx=place.dock.x;a.ty=place.dock.y;a.rest=.2;return;}
    // Mostly skirt the windows. A shorter, occasional cross-screen trip keeps
    // them feeling alive without making the central work area a parade.
    const edge = busy || Math.random() < .72;
    if (edge) {
      const side = Math.floor(Math.random() * 4);
      a.tx = side===0 ? 20 : side===1 ? width-20 : 30+Math.random()*(width-60);
      a.ty = side===2 ? 40 : side===3 ? floor-8 : 48+Math.random()*(floor-70);
    } else { a.tx=40+Math.random()*(width-80); a.ty=65+Math.random()*(floor-100); }
    a.rest = .5 + Math.random()*1.4;
  }
  async function spawn(id, rect) {
    if (dead || spawned.has(id)) return;
    spawned.add(id);
    const sprites = await makeWandererSprites(id);
    if (dead) return;
    const cx = clamp(rect.x+rect.w*.55, 40, width-40), cy=clamp(rect.y+rect.h*.72, 45, floor-12);
    sprites.forEach((sprite, i) => {
      const a = {id, name:sprite.name, image:sprite.image,frames:sprite.reactionFrames,
        feedKind:sprite.feedKind,feedFrames:sprite.feedingFrames,snack:null,milkVisits:0,nextMilk:time+4+Math.random()*3,
        reaction:sprite.reaction||({timtam:'bow',gingerbread:'cheer','fortune-cookie':'kiss',kungu:'struggle',oreo:'wave',khapse:'bow','thai-flower':'shy','octopus-senbei':'struggle','cookie-band':'cheer'})[id]||['cheer','kiss','shy'][i%3],
        held:false,recover:0,reactAge:0,pointerId:null,
        x:clamp(cx+(i-(sprites.length-1)/2)*25,18,width-18), y:cy,
        h:id==='fortune-cookie'?30:id==='kungu'?33:27,
        speed:id==='kungu'?43:24+Math.random()*10, phase:i*2+Math.random(), age:0,
        flight:id==='kungu', nextPaper:3.5+Math.random()*2, rest:0, alpha:1, traveled:0};
      target(a); a.rest=0;
      // A little shared run out of the former window before independent routes.
      a.tx=clamp(a.x+(i%2?-1:1)*(70+i*16),20,width-20); a.ty=clamp(a.y+35,45,floor-8);
      if(reduced.matches){a.x=25+cast.length*35;a.y=floor-8;}
      cast.push(a);makeHandle(a);
    });
    wake();
  }

  function milkLocation() {
    if(time-milkMeasured<.2&&milkMeasured>=0)return milkPlace;
    milkMeasured=time;milkPlace=null;
    if(!milkStation?.isConnected||getComputedStyle(milkStation).visibility!=='visible'||!milkStation.getClientRects().length)return null;
    const cup=milkStation.querySelector('.ambient-mug');if(!cup)return null;
    const mug=bounds(cup),dock={x:mug.x-13,y:mug.y+mug.h+2};
    if(mug.w<4||dock.x<16||mug.y<30||mug.y+mug.h>floor)return null;
    // The ad stays behind webpages. Never drink through a covering window.
    for(const win of screen.querySelectorAll('.qwindow')){
      if(!win.getClientRects().length||getComputedStyle(win).visibility==='hidden')continue;
      const r=bounds(win);
      if(r.x<mug.x+mug.w+4&&r.x+r.w>dock.x-14&&r.y<mug.y+mug.h+4&&r.y+r.h>mug.y-28)return null;
    }
    milkPlace={mug,dock};return milkPlace;
  }
  function beginMilk(a,place){
    milkVisitor=a;a.snack={stage:'approach',age:0,place};a.rest=0;
    milkStation?.classList.add('milk-occupied');
  }
  function endMilk(a,finished){
    if(!a.snack)return;
    a.snack=null;
    if(milkVisitor===a){milkVisitor=null;milkStation?.classList.remove('milk-occupied');}
    a.nextMilk=time+(finished?30+Math.random()*12:12);
    if(finished){a.milkVisits++;milkVisits++;}
    target(a);a.tx=clamp(a.x+65,20,width-20);a.ty=clamp(a.y+24,40,floor-8);a.rest=0;
  }
  function visitMilk(a,dt,state){
    const place=milkLocation();
    if(a.snack&&(state.busy||!place)){endMilk(a,false);return false;}
    if(!a.snack&&!milkVisitor&&!state.busy&&a.feedKind&&time>=a.nextMilk&&place&&
       Math.hypot(pointer.x-a.x,pointer.y-(a.y-a.h/2))>30&&document.activeElement!==a.button&&
       Math.hypot(a.x-place.dock.x,a.y-place.dock.y)<72)beginMilk(a,place);
    if(!a.snack&&milkVisitor&&place&&Math.hypot(a.x-place.dock.x,a.y-place.dock.y)<35&&
       Math.hypot(a.tx-place.dock.x,a.ty-place.dock.y)<8){
      a.tx=clamp(place.dock.x-44,20,width-20);a.ty=clamp(place.dock.y+22,40,floor-8);a.rest=0;
    }
    const s=a.snack;if(!s)return false;
    s.place=place;s.age+=dt;
    const {mug,dock}=place;
    if(s.stage==='approach'){
      const dx=dock.x-a.x,dy=dock.y-a.y,d=Math.hypot(dx,dy),step=Math.min(d,a.speed*dt);
      if(d>1){a.x+=dx/d*step;a.y+=dy/d*step;a.phase+=dt*12;}
      if(d<2){a.x=dock.x;a.y=dock.y;s.stage=a.feedKind;s.age=0;}
    }else if(s.stage==='sip'||s.stage==='dunk'){
      const duration=s.stage==='sip'?3.8:3.4,p=clamp(s.age/duration,0,1);
      const reach=Math.min(1,p/.22,(1-p)/.22),dip=s.stage==='dunk'?Math.sin(p*Math.PI)*8:2;
      a.x=mix(dock.x,mug.x+mug.w*.65,reach);a.y=mix(dock.y,mug.y+3+dip,reach);
      if(p===1){s.stage='satisfied';s.age=0;a.x=dock.x;a.y=dock.y;}
    }else if(s.age>2.2){endMilk(a,true);}
    return true;
  }
  function scheduleMilk(state){
    if(milkVisitor||state.busy||reduced.matches)return;
    const place=milkLocation();if(!place)return;
    const eligible=cast.filter(a=>a.feedKind&&!a.held&&!a.dash&&a.recover<=0&&time>=a.nextMilk&&document.activeElement!==a.button);
    // Give every character a turn before repeat visitors; reserve one trip only.
    eligible.sort((a,b)=>a.milkVisits-b.milkVisits||Math.hypot(a.x-place.dock.x,a.y-place.dock.y)-Math.hypot(b.x-place.dock.x,b.y-place.dock.y));
    if(eligible[0])beginMilk(eligible[0],place);
  }
  function paintMilkCaption(){
    const a=milkVisitor,s=a?.snack;if(!s)return;
    const {mug}=s.place;
    const action=s.stage==='approach'?'来喝牛奶啦':s.stage==='sip'?'咕嘟咕嘟…':s.stage==='dunk'?'蘸一蘸牛奶…':'喝好了，好满足！';
    g.save();g.font='bold 10px sans-serif';g.textAlign='center';g.textBaseline='middle';
    const w=Math.max(g.measureText(a.name).width,g.measureText(action).width)+16;
    const x=clamp(mug.x+mug.w/2,w/2+3,width-w/2-3),y=Math.max(20,mug.y-54);
    g.fillStyle='#473925';g.fillRect(Math.round(x-w/2-1),y-1,w+2,33);
    g.fillStyle='#fff5d9';g.fillRect(Math.round(x-w/2),y,w,31);
    g.fillStyle='#473925';g.fillText(a.name,x,y+9);g.fillText(action,x,y+23);
    if(s.stage==='satisfied'){
      g.fillStyle='#ed8091';const lift=Math.sin(Math.min(1,s.age/2.2)*Math.PI)*9;
      for(const side of [-1,1]){const hx=a.x+side*17,hy=a.y-a.h-5-lift;g.fillRect(hx-3,hy,3,3);g.fillRect(hx+1,hy,3,3);g.fillRect(hx-2,hy+3,5,2);g.fillRect(hx,hy+5,1,2);}
    }
    g.restore();
  }
  function paintMilk(){
    const a=milkVisitor,s=a?.snack;if(!s||!['sip','dunk'].includes(s.stage))return;
    const {mug}=s.place,x=Math.round(mug.x),y=Math.round(mug.y),w=Math.round(mug.w),h=Math.round(mug.h);
    // The cup's front occludes the dipped biscuit; the cup itself never intercepts input.
    g.save();g.fillStyle='#fff9e8';g.fillRect(x+2,y+7,w-4,h-9);
    g.fillStyle='#d5e1dc';g.fillRect(x+w-5,y+7,3,h-9);
    g.fillStyle='#4d7c8c';g.fillRect(x,y+h-2,w,2);g.fillRect(x+w-2,y+7,2,h-7);
    g.fillStyle='#c8dde1';const wave=Math.floor(time*7)%3;g.fillRect(x+5+wave,y+6,5,1);g.fillRect(x+w-8-wave,y+7,3,1);
    if(s.stage==='dunk'&&s.age>.4&&s.age<2.8){g.fillStyle='#fff9e8';g.fillRect(x-2,y+1,2,2);g.fillRect(x+w+1,y+3,2,2);}
    g.restore();
  }

  function dissolve(element, id, done) {
    const rect=bounds(element), mask=document.createElement('canvas');
    mask.width=Math.max(1,Math.round(rect.w));mask.height=Math.max(1,Math.round(rect.h));
    const mg=mask.getContext('2d'), colors=PALETTES[id]||['#dfb86e','#8b512e','#f5dba4'];
    const cells=Array.from({length:36*24},(_,i)=>{
      const x=i%36,y=Math.floor(i/36);
      return {x,y,at:clamp((Math.hypot(x-20,(y-18)*1.2)/31)*.75+Math.random()*.25,0,1)};
    });
    const effect={element,id,rect,mask,mg,cells,colors,age:0,lastStep:-1,done,
      before:{maskImage:element.style.maskImage,webkitMaskImage:element.style.webkitMaskImage,
        opacity:element.style.opacity,pointerEvents:element.style.pointerEvents,inert:element.inert}};
    element.classList.add('module-dissolving'); element.inert=true;element.style.pointerEvents='none';
    dissolves.add(effect); wake();
    return () => finish(effect, false);
  }
  function finish(effect, completed) {
    if (!dissolves.delete(effect)) return;
    const {element,before} = effect;
    Object.assign(element.style,{maskImage:before.maskImage,webkitMaskImage:before.webkitMaskImage,
      opacity:before.opacity,pointerEvents:before.pointerEvents});element.inert=before.inert;
    element.classList.remove('module-dissolving');
    if(completed&&!dead) effect.done(effect.rect);
  }
  function paintDissolve(e, dt, busy) {
    e.age+=dt; const p=clamp(e.age/(reduced.matches ? .12 : .48),0,1);
    if(reduced.matches){e.element.style.opacity=String(1-p);}
    else {
      const step=Math.floor(p*26);
      if(step!==e.lastStep){
        e.lastStep=step;e.mg.clearRect(0,0,e.mask.width,e.mask.height);e.mg.fillStyle='#fff';
        for(const c of e.cells)if(p<1-c.at){
          const x=Math.floor(c.x*e.mask.width/36),y=Math.floor(c.y*e.mask.height/24);
          e.mg.fillRect(x,y,Math.ceil((c.x+1)*e.mask.width/36)-x,Math.ceil((c.y+1)*e.mask.height/24)-y);
        }
        const url=`url(${e.mask.toDataURL()})`;
        Object.assign(e.element.style,{maskImage:url,webkitMaskImage:url,maskSize:'100% 100%',webkitMaskSize:'100% 100%'});
      }
      if(!busy)for(let i=0;i<e.cells.length;i+=5){
        const c=e.cells[i],age=p-(1-c.at);if(age<0||age>.48)continue;
        const t=age/.48,x=e.rect.x+(c.x+.5)/36*e.rect.w,y=e.rect.y+(c.y+.5)/24*e.rect.h;
        g.globalAlpha=(1-t)*.95;g.fillStyle=e.colors[i%e.colors.length];
        const outward=(c.x-18)/18;
        g.fillRect(Math.round(x+outward*t*28+Math.sin(i)*t*9),
          Math.round(y+(c.y-12)*t*1.5),3+(i%3),3+(i%3));
      }
      g.globalAlpha=1;
    }
    if(p===1)finish(e,true);
  }

  function walk(a, dt, state) {
    a.age+=dt;
    if(a.dash){
      a.dash.age+=dt;const t=clamp((a.dash.age-.07)/.22,0,1),ease=1-Math.pow(1-t,2);
      a.x=mix(a.dash.from.x,a.dash.to.x,ease);a.y=mix(a.dash.from.y,a.dash.to.y,ease);a.reactAge+=dt;a.phase+=dt*28;
      if(a.dash.age>.34){puffs.push({x:a.x,y:a.y-a.h/2,age:.12});a.dash=null;a.recover=.35;target(a);a.rest=0;}
      return;
    }
    if(a.snack&&!a.held){visitMilk(a,dt,state);return;}
    if(a.reaction==='music'&&isMusicPlaying()&&!a.held){a.reactAge+=dt;a.alpha=1;return;}
    if(a.held||a.recover>0){a.reactAge+=dt;if(!a.held)a.recover=Math.max(0,a.recover-dt);a.alpha=1;return;}
    if (reduced.matches) return;
    const dx=pointer.x-a.x,dy=pointer.y-(a.y-a.h/2),distance=Math.hypot(dx,dy);
    const work=state.rect;
    const inWork=state.busy&&work&&a.x>work.x-16&&a.x<work.x+work.w+16&&a.y>work.y-10&&a.y<work.y+work.h+20;
    a.alpha=mix(a.alpha,inWork ? .12 : 1,Math.min(1,dt*8));
    if(a.feedKind&&visitMilk(a,dt,state))return;
    // A hovering hand can catch a character. Only flee a pointer already busy
    // with another task; otherwise the old avoidance made them uncatchable.
    if(!state.busy&&(distance<28||document.activeElement===a.button))return;
    if(state.busy&&distance<72){
      const d=Math.max(distance,1);
      a.tx=clamp(a.x-dx/d*85,18,width-18);a.ty=clamp(a.y-dy/d*65,40,floor-8);a.rest=0;
    }
    let vx=a.tx-a.x,vy=a.ty-a.y,d=Math.hypot(vx,vy);
    if(d<4){a.rest-=dt;if(a.rest<=0)target(a,state.busy);}
    else {
      const speed=a.speed*(state.busy&&distance<72?1.35:1),step=Math.min(d,speed*dt);
      a.x=clamp(a.x+vx/d*step,16,width-16);a.y=clamp(a.y+vy/d*step,38,floor-6);
      a.phase+=dt*(a.flight?10:12);a.traveled+=step;
    }
    if(a.id==='fortune-cookie'&&!state.busy&&distance>85&&a.traveled>36){
      a.nextPaper-=dt;
      if(a.nextPaper<=0){
        a.nextPaper=5+Math.random()*4;a.traveled=0;
        if(papers.length<3)papers.push({x:a.x+8,y:a.y-12,age:0,phase:Math.random()*6});
      }
    }
  }
  function paintActor(a,state) {
    const scale=a.h/56,w=48*scale,walk=reduced.matches?0:Math.sin(a.phase),fly=a.flight&&!reduced.matches;
    const reacting=a.held||a.recover>0||!!a.dash||(a.reaction==='music'&&isMusicPlaying()&&!a.snack),rt=a.reactAge,still=reduced.matches;
    const feeding=a.snack&&a.snack.stage!=='approach';
    const bob=reacting||feeding?0:fly?Math.sin(time*5+a.phase*.12)*3:Math.abs(walk)*1.2;
    let px=a.x+(fly&&!reacting?Math.sin(time*2.4+a.phase*.1)*4:0),py=a.y-bob;
    let tilt=0,squash=1;
    if(feeding){tilt=a.snack.stage==='sip'?.28:a.snack.stage==='dunk'?-.18:0;
      if(a.snack.stage==='satisfied')py-=Math.sin(Math.min(1,a.snack.age/2.2)*Math.PI)*2;}
    if(reacting&&!still){
      if(a.reaction==='cheer')py-=Math.abs(Math.sin(rt*8))*4;
      if(a.reaction==='bow'){squash=1-Math.pow(Math.sin(Math.min(1,rt/.7)*Math.PI),2)*.28;tilt=Math.sin(rt*3)*.04;}
      if(a.reaction==='struggle'){tilt=Math.sin(rt*22)*.17;px+=Math.sin(rt*18)*2;}
      if(a.reaction==='wave')tilt=Math.sin(rt*8)*.1;
      if(a.reaction==='kiss')tilt=Math.sin(rt*4)*.07;
      if(a.reaction==='shy'){tilt=Math.sin(rt*3)*.06;squash=.95;}
      if(a.reaction==='greet'){tilt=Math.sin(rt*5)*.05;squash=1-Math.max(0,Math.sin(rt*3))*.1;}
      if(a.reaction==='burst'){tilt=Math.sin(rt*19)*.05*Math.max(0,1-rt);squash=1+Math.sin(Math.min(1,rt/.4)*Math.PI)*.15;}
      if(a.reaction==='music'){tilt=Math.sin(rt*7)*.12;py-=Math.abs(Math.sin(rt*7))*2;}
      if(a.dash)tilt=(a.dash.to.x>a.dash.from.x?1:-1)*.3;
    }
    const canCatch=!a.dash&&(a.held||!state.busy);
    Object.assign(a.button.style,{left:(px-w/2)+'px',top:(py-a.h)+'px',width:w+'px',height:a.h+'px',
      pointerEvents:canCatch?'auto':'none'});
    // Prevent Tab from entering an unrelated character while drawing or dragging.
    a.button.tabIndex=canCatch?0:-1;
    const arrive=reduced.matches?1:Math.min(1,a.age/.24);
    g.save();g.globalAlpha=a.alpha*arrive*(a.dash?.age>.07&&a.dash.age<.27 ? .28 : 1);
    if(a.dash){g.strokeStyle='#e9e4ce';g.lineWidth=1;g.globalAlpha=.35;
      for(let i=0;i<3;i++){g.beginPath();g.moveTo(px-(a.dash.to.x>a.dash.from.x?1:-1)*(15+i*6),py-a.h/2+i*3);g.lineTo(px-(a.dash.to.x>a.dash.from.x?1:-1)*(31+i*7),py-a.h/2+i*3);g.stroke();}g.globalAlpha=.45;}
    g.translate(Math.round(px),Math.round(py));g.rotate(tilt);g.scale(.8+.2*arrive,(.8+.2*arrive)*squash);
    if(!a.flight){
      g.fillStyle='#382a22';
      const stride=feeding?0:reacting?(a.reaction==='struggle'&&!still?Math.sin(rt*22)*3:0):walk*2;
      g.fillRect(Math.round(-4+stride),-3,2,4);g.fillRect(Math.round(3-stride),-3,2,4);
      g.fillRect(Math.round(-4+stride),0,4,1);g.fillRect(Math.round(3-stride),0,4,1);
    }
    const reactionFrame=reacting&&a.frames?.length?a.frames[still?0:Math.floor(rt*5)%a.frames.length]:null;
    const foodFrame=feeding&&a.feedFrames?.[a.snack.stage==='satisfied'?2:a.snack.age<.35?0:1];
    g.drawImage(foodFrame||reactionFrame||a.image,Math.round(-w/2),-a.h,w,a.h);
    if(fly){
      // A very small flicker of wings, separate from the carried biscuit.
      g.globalAlpha*=.55;g.strokeStyle='#e9f3ea';g.lineWidth=1;
      const wing=Math.sin(time*42)*3;
      g.beginPath();g.moveTo(-2,-a.h+8);g.lineTo(-6,-a.h+3+wing);
      g.moveTo(2,-a.h+8);g.lineTo(7,-a.h+3-wing);g.stroke();
    }
    g.restore();
    if(reacting)paintReaction(a,px,py,still);
    if(a.snack?.stage==='satisfied'){g.fillStyle='#ffe895';g.fillRect(Math.round(px+14),Math.round(py-a.h-2),1,5);g.fillRect(Math.round(px+12),Math.round(py-a.h),5,1);}
    if(document.activeElement===a.button&&a.focusVisible){
      g.strokeStyle='#ffed9d';g.setLineDash([2,2]);g.strokeRect(Math.round(px-w/2-2),Math.round(py-a.h-2),w+4,a.h+5);g.setLineDash([]);
    }
  }
  function paintReaction(a,x,y,still){
    const phase=still ? .45 : (a.reactAge%1.15)/1.15;
    g.save();g.translate(Math.round(x),Math.round(y-a.h));
    if(a.reaction==='kiss'){
      g.globalAlpha=still?1:1-phase;g.fillStyle='#ef6e8c';
      const hx=12+phase*14,hy=4-phase*12;
      for(const [xx,yy,ww,hh] of [[-3,-2,2,2],[1,-2,2,2],[-4,0,8,2],[-3,2,6,1],[-2,3,4,1],[-1,4,2,1]])g.fillRect(Math.round(hx+xx),Math.round(hy+yy),ww,hh);
    }else if(a.reaction==='cheer'||a.reaction==='wave'||a.reaction==='greet'){
      g.fillStyle='#ffe895';const lift=still?0:Math.sin(a.reactAge*8)*2;
      for(const side of [-1,1]){g.fillRect(side*14,-4+lift,1,5);g.fillRect(side*14-2,-2+lift,5,1);}
    }else if(a.reaction==='struggle'){
      g.strokeStyle='#f4edc8';g.lineWidth=1;const j=still?0:Math.sin(a.reactAge*15)*2;
      for(const side of [-1,1]){g.beginPath();g.moveTo(side*16,8+j);g.lineTo(side*18,11+j);g.lineTo(side*16,14+j);g.stroke();}
    }else if(a.reaction==='shy'){
      g.fillStyle='#e997a2';g.fillRect(-13,11,3,2);g.fillRect(10,11,3,2);
    }else if(a.reaction==='burst'){
      const t=still ? .35 : Math.min(1,a.reactAge/.6);
      if(t<1){g.globalAlpha=1-t;
        for(let i=0;i<8;i++){const angle=i*Math.PI/4,dist=11+t*23;g.save();g.translate(Math.cos(angle)*dist,13+Math.sin(angle)*dist);g.rotate(angle+t);g.fillStyle=i%2?'#ebbc4e':'#805037';g.fillRect(-2,-2,4,3);g.restore();}
      }
    }else if(a.reaction==='music'){
      g.fillStyle='#a97ccf';
      for(let i=0;i<2;i++){const t=still ? .35 : ((a.reactAge*.65+i*.5)%1),xx=-16+i*30,yy=6-t*14;g.globalAlpha=1-t*.6;g.fillRect(xx,yy,2,7);g.fillRect(xx,yy,5,2);g.fillRect(xx-2,yy+5,3,3);}
    }
    g.restore();
  }
  function tick(now) {
    frame=0;if(dead||document.hidden){last=0;return;}
    // Some browsers update matches before delivering the media change event.
    if(reduced.matches!==lastReduced)motionChange();
    const dt=last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;
    const state=interaction();g.clearRect(0,0,width,floor);
    for(const e of [...dissolves])paintDissolve(e,dt,state.busy);
    scheduleMilk(state);
    for(const a of cast){walk(a,dt,state);paintActor(a,state);}
    paintMilk();
    paintMilkCaption();
    for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];p.age+=dt;if(p.age>.48){puffs.splice(i,1);continue;}
      const t=p.age/.48;g.save();g.globalAlpha=(1-t)*.7;g.fillStyle='#d8d7c9';
      for(let j=0;j<5;j++){const angle=j*Math.PI*2/5,s=6+(1-t)*5;g.fillRect(Math.round(p.x+Math.cos(angle)*t*15-s/2),Math.round(p.y+Math.sin(angle)*t*12-s/2),s,s);}
      g.restore();
    }
    for(let i=papers.length-1;i>=0;i--){
      const p=papers[i];p.age+=dt;
      if(p.age>3.8||reduced.matches){papers.splice(i,1);continue;}
      if(state.busy||Math.hypot(p.x-pointer.x,p.y-pointer.y)<65)continue;
      const y=Math.min(floor-5,p.y+p.age*10),x=p.x+Math.sin(p.age*3+p.phase)*3;
      g.save();g.translate(Math.round(x),Math.round(y));g.rotate(Math.sin(p.age*2)*.2);
      g.globalAlpha=Math.min(1,(3.8-p.age)*1.3)*.8;g.fillStyle='#fff0be';g.fillRect(-3,-4,6,8);
      g.fillStyle='#7d426f';g.fillRect(-1,-2,2,2);g.fillRect(-2,1,4,1);g.restore();
    }
    if(dissolves.size||cast.length&&!reduced.matches||cast.some(a=>a.recover>0||a.snack)||papers.length||puffs.length)wake();else last=0;
  }
  function visibility(){if(document.hidden)releaseHold();last=0;cancelAnimationFrame(frame);frame=0;if(!document.hidden)wake();}
  function motionChange(){
    if(reduced.matches===lastReduced)return;lastReduced=reduced.matches;
    if(reduced.matches){releaseHold();if(milkVisitor)endMilk(milkVisitor,false);papers.length=0;puffs.length=0;cast.forEach((a,i)=>{a.dash=null;a.x=25+i*35;a.y=floor-8;a.alpha=1;});}
    last=0;wake();
  }
  const resize=new ResizeObserver(fit);resize.observe(screen);fit();
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motionChange);
  return {
    bounds,pointerClient,spawn,dissolve,isHeld:()=>!!grabbed,refresh:wake,
    getState:()=>({characters:cast.map(a=>({projectId:a.id,name:a.name,x:a.x,y:a.y,flight:a.flight,reaction:a.reaction,held:a.held,dashing:!!a.dash,feeding:a.snack?.stage||null,feedKind:a.feedKind||null,milkVisits:a.milkVisits,milkCooldown:Math.max(0,a.nextMilk-time)})),
      milk:{visitor:milkVisitor?.id||null,stage:milkVisitor?.snack?.stage||null,visits:milkVisits},
      dissolving:[...dissolves].map(e=>e.id),papers:papers.length,spawned:[...spawned],reduced:reduced.matches}),
    destroy(){if(dead)return;releaseHold();if(milkVisitor)endMilk(milkVisitor,false);dead=true;cancelAnimationFrame(frame);resize.disconnect();
      for(const e of [...dissolves])finish(e,false);cast.length=0;papers.length=0;puffs.length=0;
      document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',move,true);
      document.documentElement.removeEventListener('pointerleave',leave);
      window.removeEventListener('blur',releaseHold);
      document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChange);canvas.remove();controls.remove();}
  };
}
