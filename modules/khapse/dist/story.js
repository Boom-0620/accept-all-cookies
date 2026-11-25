/* KHAPSE: independent transparent props over one intact background.
   The old storyboard is a design reference only; no scene patches are sampled. */
(function (global) {
  'use strict';
  const DURATION=20000, FADE=650, ENDING_DURATION=4200;
  const WISHES=['平安','健康','丰足','团圆','喜乐','顺遂','和睦','新望'];
  const scenes=[
    {start:0,end:3000,title:'01　新年前夕',caption:'藏历新年前，人们开始准备卡塞。'},
    {start:3000,end:6000,title:'02　面团变个样',caption:'折耳、扭结……面团有了不同形状。'},
    {start:6000,end:10000,title:'03　炸成金黄',caption:'下锅炸至金黄，这就是 Khapse。'},
    {start:10000,end:13000,title:'04　新年待客',caption:'小卡塞，用来招待来访的客人。'},
    {start:13000,end:17000,title:'05　摆上最后一块',caption:'较大的卡塞，也用于新年陈设。'},
    {start:17000,end:20000,title:'06　新年祝愿',caption:'取出八块卡塞，收下八份新年祝愿。'}
  ];
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function frameAt(ms){let i=scenes.findIndex(s=>ms<s.end);if(i<0)i=5;return {...scenes[i],index:i,progress:clamp((ms-scenes[i].start)/(scenes[i].end-scenes[i].start))};}
  function create(stage,options={}) {
    let elapsed=0,active=true,ready=false,dead=false,previous='',ending=false,mode='intro',outcome=null,collected=0,held=false;
    const abort=new AbortController(), images={};
    const layer=document.createElement('section');layer.className='story-layer';layer.setAttribute('aria-label','卡塞的故事');
    layer.innerHTML='<div class="story-strip"><span class="story-title">新年前的一座饼塔</span><button type="button" class="story-skip" data-action="skip-story">跳过 ›</button></div><canvas class="story-canvas" width="360" height="430" role="img"></canvas><div class="ending-copy" hidden><p class="ending-kicker">LOSAR · 新年卡塞</p><h2></h2><div class="ending-blessing"><p>愿新的一年</p><div class="ending-wishes">'+WISHES.map(w=>'<span>'+w+'</span>').join('')+'</div></div></div><p class="story-caption" aria-live="polite">藏历新年前，人们开始准备卡塞。</p><div class="story-dots" aria-hidden="true">'+scenes.map(()=>'<i></i>').join('')+'</div><div class="ending-actions" hidden><button data-action="restart">再摆一局</button><button data-action="dismiss-ending">看看饼塔</button></div>';
    stage.appendChild(layer);
    const canvas=layer.querySelector('canvas'),ctx=canvas.getContext('2d'),title=layer.querySelector('.story-title'),caption=layer.querySelector('.story-caption'),skip=layer.querySelector('.story-skip'),dots=[...layer.querySelectorAll('.story-dots i')],copy=layer.querySelector('.ending-copy'),actions=layer.querySelector('.ending-actions');
    skip.addEventListener('click',()=>options.onSkip?.(),{signal:abort.signal});
    const files={room:'room.webp',prep:'prep.webp',rolling:'rolling.webp',dough:'dough.webp',pan:'pan.webp',spoon:'spoon.webp',serving:'serving.webp',placing:'placing.webp',tower:'tower.webp'};
    const rects={rolling:[250,118,1272,632],pan:[120,190,1295,670],spoon:[180,50,1455,805],serving:[80,331,1590,462],placing:[211,133,1494,687],tower:[218,152,650,1252]};
    function prop(name,x,y,w,h,alpha=1){if(!images[name]?.complete)return;const a=rects[name];ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(images[name],...a,x,y,w,h);ctx.restore();}
    function background(prep=false){ctx.drawImage(prep?images.prep:images.room,0,0,360,430);}
    function gold(g,x,y,w,h,angle=0){const atlas=images.gold;if(!atlas?.complete)return;g.save();g.translate(x,y);g.rotate(angle);g.drawImage(atlas,.022*atlas.width,.075*atlas.height,.954*atlas.width,.258*atlas.height,-w/2,-h/2,w,h);g.restore();}
    function strokeCurve(g,points,width,color){g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.lineWidth=width;g.strokeStyle=color;g.stroke();}
    function dough(x,y,twist,scale=1,brown=0){
      // A continuous centerline deformation. Only the dough changes shape.
      const start=['ac8050','dfbe88','f5dfb5','fff0ce'],end=['75401a','c88025','efac3a','ffcf62'];const colors=start.map((hex,i)=>{const a=parseInt(hex,16),b=parseInt(end[i],16),t=ease(brown);return 'rgb('+[16,8,0].map(shift=>Math.round(lerp((a>>shift)&255,(b>>shift)&255,t))).join(',')+')';});
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineCap='round';ctx.lineJoin='round';
      const pts=[];for(let j=0;j<=96;j++){const a=j/96*Math.PI*2;pts.push([Math.cos(a)*77,(1-twist)*Math.sin(a)*14+twist*Math.sin(2*a)*28]);}
      strokeCurve(ctx,pts,23,colors[0]);strokeCurve(ctx,pts,18,colors[1]);strokeCurve(ctx,pts,14,colors[2]);
      ctx.save();ctx.translate(0,-2);strokeCurve(ctx,pts,5,colors[3]);ctx.restore();
      if(twist>.35){const front=pts.slice(14,35);strokeCurve(ctx,front,22,colors[0]);strokeCurve(ctx,front,17,colors[1]);strokeCurve(ctx,front,13,colors[2]);ctx.save();ctx.translate(0,-2);strokeCurve(ctx,front,4,colors[3]);ctx.restore();}
      for(let j=0;j<48;j++){const p=pts[j*2];ctx.fillStyle=j%3?colors[1]:colors[3];ctx.fillRect(Math.round(p[0]+(j%3)-1),Math.round(p[1]+((j*7)%9)-4),2,1);}
      ctx.restore();
    }
    function slab(){ctx.save();ctx.beginPath();ctx.ellipse(180,299,94,37,0,0,Math.PI*2);ctx.clip();ctx.drawImage(images.dough,62,197,391,164,85,261,190,78);ctx.restore();}
    function bubbles(p,strength=1){for(let j=0;j<25;j++){const phase=(p*7+j*.137)%1;const a=j*2.4,r=20+(j%5)*15;const x=178+Math.cos(a)*r,y=311+Math.sin(a)*r*.42-phase*4;ctx.strokeStyle=j%2?'#f9df9c':'#e9bb59';ctx.globalAlpha=(1-phase)*strength;ctx.lineWidth=1;ctx.strokeRect(Math.round(x),Math.round(y),2+Math.round(phase*3),2+Math.round(phase*3));}ctx.globalAlpha=1;}
    function spoonAt(x,y){prop('spoon',x-45,y-100,245,136);}
    function serving(x,y,scale=1,count=8){
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);prop('serving',0,0,330,96);
      for(let j=0;j<count;j++){const row=Math.floor(j/4),col=j%4;gold(ctx,156+col*36,32+row*26,31,19,(j%2?1:-1)*.06);}
      ctx.restore();
    }
    function tower(){prop('tower',91,64,178,343);}
    function cap(x,y){gold(ctx,x,y,63,30,-.03);}
    function cheese(){const chunks=[[160,43,-.3],[170,37,.3],[180,35,-.1],[190,39,.4],[200,47,.5]];ctx.strokeStyle='#9b7544';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(159,47);ctx.quadraticCurveTo(180,25,202,50);ctx.stroke();chunks.forEach(([x,y,a])=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#9b7544';ctx.fillRect(-4,-5,8,11);ctx.fillStyle='#f6e7be';ctx.fillRect(-3,-4,6,9);ctx.restore();});}
    function intro(i,p){
      background(i<4);
      if(i===0){slab();const roll=Math.sin(p*Math.PI*4)*(options.reduced?7:17);prop('rolling',33,170+roll,294,146);ctx.globalAlpha=.23;ctx.fillStyle='#ffe0a1';ctx.fillRect(123,280+roll+Math.sin(p*20)*5,113,2);ctx.globalAlpha=1;}
      else if(i===1){const f=ease((p-.1)/.76);dough(180,289,f,1.18,0);}
      else if(i===2){
        prop('pan',25,236,310,160);
        let sx=170,sy=309,foodOnSpoon=true,brown=0;
        if(p<.24){const u=ease(p/.24);sx=lerp(142,170,u);sy=lerp(197,309,u);}
        else if(p<.40){const u=ease((p-.24)/.16);sx=lerp(170,220,u);sy=lerp(309,229,u);foodOnSpoon=false;}
        else if(p<.66){sx=220;sy=229;foodOnSpoon=false;brown=clamp((p-.4)/.26);}
        else if(p<.79){const u=ease((p-.66)/.13);sx=lerp(220,170,u);sy=lerp(229,312,u);foodOnSpoon=false;brown=1;}
        else{const u=ease((p-.79)/.21);sx=lerp(170,183,u);sy=lerp(312,210,u);brown=1;}
        spoonAt(sx,sy);
        dough(foodOnSpoon?sx:170,(foodOnSpoon?sy:309)-4,1,.36,brown);
        if(p>.22&&p<.81)bubbles(p,1);else if(p>.81){ctx.fillStyle='#e4ae40';for(let j=0;j<3;j++)ctx.fillRect(sx-12+j*10,sy+24+((p*130+j*9)%28),2,3);}
      }else if(i===3){serving(lerp(-110,-18,ease((p-.1)/.75)),289,1,8);}
      else if(i===4){
        tower();const put=ease((p-.12)/.52),x=lerp(284,180,put),y=lerp(7,56,put),leave=ease((p-.69)/.28);
        cap(x,y);prop('placing',x+21+leave*145,y-54-leave*36,144,66,1-ease((p-.88)/.1));
      }else{
        tower();cap(180,56);cheese();
        ctx.fillStyle='#2f2021d9';ctx.fillRect(54,170,252,67);ctx.strokeStyle='#cfaa59';ctx.lineWidth=1;ctx.strokeRect(54.5,170.5,251,66);
        ctx.textAlign='center';ctx.fillStyle='#ffe3a0';ctx.font='bold 16px "Songti SC", serif';ctx.fillText('取出八块，收下八份祝愿',180,196);ctx.fillStyle='#e6cfa9';ctx.font='11px "Songti SC", serif';ctx.fillText('轻轻抽取，让饼塔站稳',180,219);
      }
    }
    function paintEnding(){
      background();const p=clamp(elapsed/ENDING_DURATION),move=ease(p/.66),scale=lerp(.85,1.06,move);
      serving(lerp(-110,-32,move),lerp(271,301,move),scale,collected);
      const reveal=ease((p-.3)/.38);copy.style.opacity=String(reveal);copy.style.transform='translateY('+Math.round((1-reveal)*6)+'px)';
      if(p>.62){ctx.fillStyle='#efcb68';[[104,123],[257,167],[72,196]].forEach(([x,y],j)=>{if(Math.sin(p*8+j)>0){ctx.fillRect(x-2,y,5,1);ctx.fillRect(x,y-2,1,5);}});}
    }
    function render(){
      if(dead||!ready||(!active&&!held))return;
      ctx.clearRect(0,0,360,430);ctx.imageSmoothingEnabled=false;
      if(mode==='ending'){paintEnding();return;}
      const f=frameAt(elapsed);
      if(previous!==f.index){previous=f.index;title.textContent=f.title;caption.textContent=f.caption;canvas.setAttribute('aria-label',f.title+'：'+f.caption);dots.forEach((dot,i)=>dot.classList.toggle('current',i===f.index));}
      intro(f.index,f.progress);if(elapsed>=DURATION)layer.style.opacity=String(1-clamp((elapsed-DURATION)/FADE));
    }
    function finish(){if(dead)return;active=false;held=false;layer.hidden=true;options.onComplete?.();}
    const networkTimeout=window.CookieHostBridge?.networkTimeout||window.setTimeout.bind(window),clearNetworkTimeout=window.CookieHostBridge?.clearNetworkTimeout||window.clearTimeout.bind(window);
    let remaining=Object.keys(files).length+1,failed=false;
    const loadingDeadline=networkTimeout(()=>{if(dead||ready)return;failed=true;finish();},12000);
    function loaded(){if(dead)return;if(--remaining===0){clearNetworkTimeout(loadingDeadline);ready=Object.values(images).every(img=>img.naturalWidth>0);failed=!ready;if(ready)render();else finish();}}
    Object.entries({...files,gold:'../khapse-atlas.webp'}).forEach(([key,file])=>{const img=new Image();images[key]=img;img.onload=loaded;img.onerror=()=>{failed=true;loaded();};img.src=options.assets?.[key]||new URL(file,options.assetBase||new URL('assets/story-v3/',location.href)).href;});
    return {
      advance(ms){if(dead||!active||!ready)return;elapsed+=Math.max(0,ms);if(mode==='ending'){elapsed=Math.min(ENDING_DURATION,elapsed);render();if(elapsed>=ENDING_DURATION){active=false;held=true;options.onEndingComplete?.();}return;}
        elapsed=Math.min(DURATION+FADE,elapsed);if(elapsed>=DURATION&&!ending){ending=true;options.onTransition?.();}render();if(elapsed>=DURATION+FADE)finish();},
      render,skip:finish,
      replay(){if(dead)return;mode='intro';held=false;elapsed=0;previous='';ending=false;active=true;layer.hidden=false;layer.classList.remove('is-ending');layer.style.opacity='1';copy.hidden=true;actions.hidden=true;skip.hidden=false;layer.querySelector('.story-dots').hidden=false;if(failed)finish();else render();},
      end(result,count){if(dead)return;mode='ending';outcome=result;collected=Math.max(0,Math.min(8,count));elapsed=0;active=true;held=false;layer.hidden=false;layer.classList.add('is-ending');layer.style.opacity='1';title.textContent='新年卡塞 · 送给你';skip.hidden=true;copy.hidden=false;actions.hidden=false;layer.querySelector('.story-dots').hidden=true;copy.querySelector('h2').textContent=result==='stable'?'八份祝愿，送给你。':'饼塔散了，祝福还在。';caption.textContent=result==='stable'?'卡塞已取出，祝愿也收好了。':'这一盘新年心意，仍然送给你。';canvas.setAttribute('aria-label',result==='stable'?'把八块卡塞推向观众，送出新年祝愿':'饼塔倒塌后，仍把取出的卡塞送给观众');if(failed)finish();else render();},
      collection(target,count){const g=target.getContext('2d');g.clearRect(0,0,target.width,target.height);g.imageSmoothingEnabled=false;g.fillStyle='#6b4730';g.fillRect(8,12,184,36);g.fillStyle='#f1dca6';g.fillRect(10,13,180,32);g.strokeStyle='#a67a39';g.strokeRect(13.5,16.5,173,26);for(let j=0;j<8;j++){const x=28+(j%4)*48,y=23+Math.floor(j/4)*14;if(j<count)gold(g,x,y,35,17);else{g.fillStyle='#bda57b';g.fillRect(x-2,y,4,2);}}},
      state(){return{active,elapsed,ready,scene:frameAt(elapsed).index,mode,held,outcome};},
      destroy(){if(dead)return;clearNetworkTimeout(loadingDeadline);dead=true;active=false;held=false;abort.abort();Object.values(images).forEach(img=>{img.onload=null;img.onerror=null;img.src='';});layer.remove();}
    };
  }
  global.KhapseStory=Object.freeze({create,frameAt,DURATION,FADE,ENDING_DURATION,scenes,WISHES});
})(window);
