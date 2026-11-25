import { COOKIE_CATALOG } from './cookie-catalog.js';
import { cookieSprite } from './ending-art.js';
import { drawCreation, drawCreatorSymbol, describeCreation, createRandomRecipe, CREATOR_INGREDIENTS, CREATOR_OBJECTS, CREATOR_COLORS } from './creator-art.js';

const newSeed=()=>Math.floor(Math.random()*0x7fffffff);
const copy=value=>JSON.parse(JSON.stringify(value));
const shortName=item=>item.name.split(/[·｜]/)[0].trim();
const DEFAULT_BASE='02_chocolate_chunk';

export function mountCookieCreator(parent,{onClose,initialBaseId,state:previous}={}) {
 const state=previous?copy(previous):{mode:'diy',drafts:{diy:{mode:'diy',baseId:DEFAULT_BASE,icing:null,ingredients:[],objects:[],seed:newSeed(),strokes:[]},mix:createRandomRecipe({baseId:DEFAULT_BASE,ingredients:[CREATOR_INGREDIENTS[0].id],objects:[CREATOR_OBJECTS[0].id,CREATOR_OBJECTS[3].id],seed:newSeed()})},names:{diy:'',mix:''},baked:{diy:false,mix:false}};
 if(initialBaseId&&COOKIE_CATALOG.some(item=>item.id===initialBaseId)){state.mode='diy';state.drafts.diy.baseId=initialBaseId;state.drafts.diy.strokes=[];state.baked.diy=false;state.names.diy='';}
 let dead=false,busy=false,timer=0,stroke=null,brush='#693822';const urls=new Set();
 const root=document.createElement('div');root.className='creator-backdrop';
 root.innerHTML=`<section class="cookie-creator qwindow" role="dialog" aria-modal="true" aria-labelledby="creator-title">
  <div class="tbar"><span class="t-title" id="creator-title">✦ COOKIE STUDIO.exe · 曲奇实验室</span><button class="tbtn t-close creator-close" aria-label="关闭创作窗口"></button></div>
  <nav class="creator-tabs" aria-label="选择创作方式"><button class="q-btn" data-mode="diy">01　给曲奇做 DIY</button><button class="q-btn" data-mode="mix">02　灵感烤箱</button></nav>
  <div class="creator-workspace"><div class="creator-controls"></div><div class="creator-preview">
   <div class="creator-paper"><span class="creator-specimen-label">YOUR COOKIE / 正面</span><canvas class="creator-canvas" width="256" height="256" role="img" aria-label="你的曲奇作品"></canvas><div class="creator-baking" hidden><span>正在发生一点奇怪的变化…</span><i></i></div></div>
   <label class="creator-name-label">给它起个名字<input class="creator-name" maxlength="36" autocomplete="off" placeholder="这块曲奇叫什么？"></label>
   <p class="creator-description"></p><small class="creator-imaginary">想象烘焙 · 每次出炉，都可能不一样</small>
  </div></div>
  <footer class="creator-footer"><span class="creator-status" role="status" aria-live="polite"></span><button class="q-btn creator-save">保存图片</button><button class="q-btn creator-bake">烤出我的曲奇　▸</button></footer>
 </section>`;
 parent.append(root);const dialog=root.querySelector('.cookie-creator'),controls=root.querySelector('.creator-controls'),canvas=root.querySelector('canvas'),nameInput=root.querySelector('.creator-name'),status=root.querySelector('.creator-status'),bakeButton=root.querySelector('.creator-bake'),saveButton=root.querySelector('.creator-save');
 const recipe=()=>state.drafts[state.mode];
 function message(text){status.textContent=text;}
 function renderArt(){if(dead)return;drawCreation(canvas,recipe());const detail=describeCreation(recipe());nameInput.value=state.names[state.mode]||detail.name;root.querySelector('.creator-description').textContent=detail.description;canvas.setAttribute('aria-label',(state.names[state.mode]||detail.name)+' · 正面曲奇作品');canvas.classList.toggle('can-draw',state.mode==='diy');bakeButton.textContent=state.baked[state.mode]?'再烤一块　▸':'烤出我的曲奇　▸';}
 function change(){state.baked[state.mode]=false;state.names[state.mode]='';renderArt();message(state.mode==='diy'?'在曲奇上拖动，就能画糖霜。':'选几个喜欢的东西，让烤箱发挥一下。');}
 function button(text,fn,className='q-btn'){const b=document.createElement('button');b.type='button';b.className=className;b.textContent=({'画一道波浪':'≋','撤销一笔':'↶','清空涂画':'⌫','原味':'∅','✦ 帮我随便抓三样':'⚄'})[text]||text;b.title=text;b.setAttribute('aria-label',text);b.onclick=fn;return b;}
 function section(title,sub){const el=document.createElement('section');el.className='creator-section';const heading=document.createElement('h3');heading.textContent=({'1. 挑一块曲奇':'曲奇','2. 糖霜和小配料':'糖霜 · 配料','3. 亲手画几笔':'画笔','1. 喜欢什么，就放什么':'灵感','2. 再加一点味道':'配料'})[title]||title;el.append(heading);controls.append(el);return el;}
 function choices(list,selected,onToggle){const row=document.createElement('div');row.className='creator-choices';for(const item of list){const b=button(item.label,()=>onToggle(item.id));b.replaceChildren();const icon=document.createElement('canvas');icon.width=64;icon.height=64;icon.setAttribute('aria-hidden','true');drawCreatorSymbol(icon,item.id,list===CREATOR_OBJECTS?'object':'ingredient');b.append(icon);b.dataset.option=item.id;b.setAttribute('aria-pressed',String(selected.includes(item.id)));b.title=item.label;row.append(b);}return row;}
 function toggle(key,id){const list=recipe()[key],index=list.indexOf(id);if(index>=0)list.splice(index,1);else if(list.length<4)list.push(id);else{message('最多放四样，先拿走一样再试试。');return;}change();renderControls();}
 function renderControls(){const previousFocus=controls.contains(document.activeElement)?{option:document.activeElement.dataset.option,label:document.activeElement.getAttribute('aria-label'),base:document.activeElement.matches('select'),scroll:controls.scrollTop}:null;controls.replaceChildren();const current=recipe();
  if(state.mode==='diy'){
   const base=section('1. 挑一块曲奇','从原来的 46 块曲奇里，选你的起点。');
   const select=document.createElement('select');select.className='creator-base';select.setAttribute('aria-label','选择曲奇底胚');for(const item of COOKIE_CATALOG){const option=document.createElement('option');option.value=item.id;option.textContent=shortName(item);select.append(option);}select.value=current.baseId;
   select.onchange=()=>{current.baseId=select.value;current.strokes=[];change();renderControls();};base.append(select);
   const samples=document.createElement('div');samples.className='creator-base-samples';
   for(const item of COOKIE_CATALOG){const id=item.id;const b=button('',()=>{current.baseId=id;current.strokes=[];change();renderControls();},'creator-base-sample');b.title=shortName(item);b.setAttribute('aria-label',shortName(item));b.setAttribute('aria-pressed',String(id===current.baseId));const cv=document.createElement('canvas');cv.width=64;cv.height=64;const sprite=cookieSprite(item),g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(sprite,0,0,64,64);b.append(cv);samples.append(b);}base.append(samples);
   const icing=section('2. 糖霜和小配料');const colors=document.createElement('div');colors.className='creator-colors';
   const none=button('原味',()=>{current.icing=null;change();renderControls();});none.setAttribute('aria-label','不加糖霜');none.setAttribute('aria-pressed',String(!current.icing));colors.append(none);
   for(const item of CREATOR_COLORS){const b=button('',()=>{current.icing=item.color;change();renderControls();},'creator-swatch');b.style.background=item.color;b.title=item.label;b.setAttribute('aria-label',item.label+'糖霜');b.setAttribute('aria-pressed',String(current.icing===item.color));colors.append(b);}icing.append(colors,choices(CREATOR_INGREDIENTS,current.ingredients,id=>toggle('ingredients',id)));
   const pen=section('3. 亲手画几笔','在右边的曲奇上拖动画糖霜。');const tools=document.createElement('div');tools.className='creator-draw-tools';
   const penLabel=document.createElement('span');penLabel.textContent='笔色';tools.append(penLabel);for(const item of CREATOR_COLORS.slice(0,3)){const b=button('',()=>{brush=item.color;renderControls();},'creator-swatch');b.style.background=item.color;b.setAttribute('aria-label',item.label+'画笔');b.setAttribute('aria-pressed',String(brush===item.color));tools.append(b);}
   tools.append(button('画一道波浪',()=>{current.strokes.push({color:brush,points:Array.from({length:35},(_,i)=>({x:.27+i*.014,y:.47+Math.sin(i*.38)*.07}))});change();}),button('撤销一笔',()=>{current.strokes.pop();change();}),button('清空涂画',()=>{current.strokes=[];change();}));pen.append(tools);
  }else{
   const objects=section('1. 喜欢什么，就放什么','选 1–4 样灵感，烤箱会把它们揉进曲奇。');objects.append(choices(CREATOR_OBJECTS,current.objects,id=>toggle('objects',id)));
   const surprise=button('✦ 帮我随便抓三样',()=>{const pool=[...CREATOR_OBJECTS].sort(()=>Math.random()-.5);current.objects=pool.slice(0,3).map(x=>x.id);change();renderControls();},'q-btn creator-surprise');objects.append(surprise);
   const ingredients=section('2. 再加一点味道','物品负责奇怪，原料负责好吃。');ingredients.append(choices(CREATOR_INGREDIENTS,current.ingredients,id=>toggle('ingredients',id)));
   const note=section('烤箱的脾气');const p=document.createElement('p');p.className='creator-oven-note';p.textContent='同样的东西，再烤一次，也会长成另一副样子。';note.append(p);
  }
  if(previousFocus){const target=previousFocus.base?controls.querySelector('select'):[...controls.querySelectorAll('button')].find(b=>previousFocus.option?b.dataset.option===previousFocus.option:previousFocus.label&&b.getAttribute('aria-label')===previousFocus.label);target?.focus({preventScroll:true});controls.scrollTop=previousFocus.scroll;}
 }
 function switchMode(mode){if(busy||mode===state.mode)return;state.mode=mode;root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));renderControls();renderArt();message(mode==='diy'?'挑一块底胚，画上你自己的糖霜。':'可以把云、星星、唱片一起放进烤箱。');}
 for(const b of root.querySelectorAll('[data-mode]')){b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));b.onclick=()=>switchMode(b.dataset.mode);}
 nameInput.addEventListener('input',()=>{state.names[state.mode]=nameInput.value;});
 function finishStroke(){if(!stroke)return;stroke=null;change();}
 canvas.addEventListener('pointerdown',e=>{if(dead||busy||state.mode!=='diy'||e.button!==0)return;e.preventDefault();if(recipe().strokes.length>=60)recipe().strokes.shift();const r=canvas.getBoundingClientRect();stroke={color:brush,points:[{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}]};recipe().strokes.push(stroke);canvas.setPointerCapture(e.pointerId);drawCreation(canvas,recipe());});
 canvas.addEventListener('pointermove',e=>{if(!stroke||stroke.points.length>=180)return;const r=canvas.getBoundingClientRect();stroke.points.push({x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))});drawCreation(canvas,recipe());});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,finishStroke);
 function bake(){if(busy||dead)return;if(state.mode==='mix'&&!recipe().objects.length){message('先放一样喜欢的东西吧。');return;}busy=true;controls.inert=true;root.querySelector('.creator-tabs').inert=true;bakeButton.disabled=true;saveButton.disabled=true;nameInput.disabled=true;root.querySelector('.creator-baking').hidden=false;message('烤箱工作中…');
  timer=setTimeout(()=>{if(dead)return;if(state.mode==='mix')state.drafts.mix=createRandomRecipe({...recipe(),seed:newSeed()});state.names[state.mode]='';state.baked[state.mode]=true;renderArt();busy=false;controls.inert=false;root.querySelector('.creator-tabs').inert=false;bakeButton.disabled=false;saveButton.disabled=false;nameInput.disabled=false;root.querySelector('.creator-baking').hidden=true;bakeButton.textContent='再烤一块　▸';message('出炉了！给它起名，或把图片带走。');},matchMedia('(prefers-reduced-motion: reduce)').matches?40:1100);
 }
 bakeButton.onclick=bake;
 saveButton.onclick=()=>{if(dead||busy)return;const png=document.createElement('canvas');png.width=768;png.height=768;const g=png.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(canvas,0,0,768,768);const title=(nameInput.value||describeCreation(recipe()).name).trim().slice(0,36)||'我的曲奇';
  png.toBlob(blob=>{if(dead)return;if(!blob){message('图片暂时没保存成功，作品还在这里。');return;}const url=URL.createObjectURL(blob);urls.add(url);const a=document.createElement('a');a.href=url;a.download=title.replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_')+'.png';root.append(a);a.click();a.remove();message('图片已准备好，保留了透明背景。');},'image/png');
 };
 function close(){const saved=copy(state);destroy();onClose?.(saved);}
 root.querySelector('.creator-close').onclick=close;
 root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const focusable=[...dialog.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&!el.closest('[inert]')&&el.getClientRects().length);const i=focusable.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();focusable.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===focusable.length-1)){e.preventDefault();focusable[0]?.focus();}});
 function destroy(){if(dead)return;dead=true;clearTimeout(timer);stroke=null;for(const url of urls)URL.revokeObjectURL(url);urls.clear();root.remove();}
 renderControls();renderArt();message(state.mode==='diy'?'从一块熟悉的曲奇开始。':'把喜欢的东西交给想象力。');root.querySelector(`[data-mode="${state.mode}"]`).focus({preventScroll:true});
 return {destroy,getState:()=>copy(state),element:root};
}
