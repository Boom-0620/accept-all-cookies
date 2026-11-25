// Small, reversible toy gestures for the final cookie table. The gallery owns
// the clock, selection and sound; this module only paints the selected specimen.
const GESTURES = Object.freeze({
  twist: Object.freeze({id:'twist', label:'扭一扭', icon:'↻', caption:'咔哒，转开了。', duration:1.9}),
  fortune: Object.freeze({id:'fortune', label:'掰一掰', icon:'↔', caption:'里面藏了一张小纸条。', duration:2.1}),
  squish: Object.freeze({id:'squish', label:'捏一捏', icon:'↕', caption:'噗，又弹回来了。', duration:1.65}),
  crumble: Object.freeze({id:'crumble', label:'敲一敲', icon:'⋅', caption:'咔嚓！碎屑也会归队。', duration:1.8}),
  spin: Object.freeze({id:'spin', label:'转一转', icon:'⟳', caption:'转一圈，再转一圈。', duration:1.8}),
  sprinkle: Object.freeze({id:'sprinkle', label:'抖一抖', icon:'✧', caption:'沙沙，抖一抖。', duration:1.6}),
});

export function getCookieGesture(item) {
  if (item.id === '01_oreo' || item.style === 'cocoa') return GESTURES.twist;
  if (item.style === 'fortune') return GESTURES.fortune;
  if (['dubai','chips','macaron','alfajor'].includes(item.style)) return GESTURES.squish;
  if (['spiral','lace','ring','flower','clover','star','braid','knot'].includes(item.style)) return GESTURES.spin;
  if (['powder','crackle','grain','shortbread','hardtack','waffle','stamp','milk','biscotti','emboss'].includes(item.style)) return GESTURES.crumble;
  return GESTURES.sprinkle;
}

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const swell = (t, peak=.35, release=.68) => t < peak ? ease(t / peak) : 1 - ease((t-release) / (1-release));
const base = (g, p) => g.drawImage(p.image, -50, -50, 100, 100);
function path(g, points) { g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath(); }
function clipped(g, p, points, dx, dy, rotation=0) {
  g.save();g.translate(dx,dy);g.rotate(rotation);path(g,points);g.clip();base(g,p);g.restore();
}
function grain(g, x, y, size, color) {
  g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),size,size);
}
function crumbs(g, p, t, amount=12) {
  const travel=ease(t/.76),alpha=Math.sin(Math.PI*clamp(t/.94));
  if(alpha<=0)return;
  g.save();g.globalAlpha=alpha*.9;
  for(let i=0;i<amount;i++) {
    const angle=i*2.399963+1.1, radius=33+(i%4)*3+travel*(9+i%5),
      x=Math.cos(angle)*radius,y=Math.sin(angle)*radius+travel*travel*11;
    grain(g,x,y,i%3===0?2.5:1.5,i%3===0?'#fff1c6':i%3===1?(p.item.color||'#cf9850'):'#805028');
  }
  g.restore();
}
function sparkle(g, x, y, size) {
  g.fillStyle='#fff5c6';
  g.fillRect(Math.round(x)-size,Math.round(y),size*2+1,1);
  g.fillRect(Math.round(x),Math.round(y)-size,1,size*2+1);
}

/**
 * Paint a complete, front-facing selected cookie, including its gesture.
 * p = {item, image, x, y, w, h, angle}; age is elapsed seconds.
 * Returns false once settled (and paints the intact cookie on that call).
 * No canvas is retained, so callers may replay freely or discard the effect.
 */
export function drawCookieGesture(g, p, age, reduced=false) {
  const gesture=getCookieGesture(p.item), duration=reduced?.32:gesture.duration,
    t=clamp(age/duration), active=Number.isFinite(age)&&age>=0&&age<duration;
  g.save();g.imageSmoothingEnabled=false;
  g.translate(p.x,p.y);g.rotate(p.angle||0);g.scale(p.w/100,p.h/100);
  if(!active||age<=0)base(g,p);
  else if(reduced) {
    base(g,p);g.save();g.globalAlpha=Math.sin(Math.PI*t)*.8;
    sparkle(g,-36,-37,3);sparkle(g,39,27,2);g.restore();
  } else if(gesture.id==='twist') {
    const a=swell(t,.36,.58);
    g.save();g.translate(-a*8,a*4);g.rotate(-a*.15);base(g,p);
    // The white middle is a flat top view, never an extruded or tilted disc.
    g.fillStyle='#fff4d6';for(let y=-31;y<=31;y++) {const x=Math.floor(Math.sqrt(31*31-y*y));g.fillRect(-x,y,x*2+1,1);}
    g.fillStyle='#ead5af';g.fillRect(-8,-17,4,2);g.fillRect(13,9,3,2);g.restore();
    g.save();g.translate(a*18,-a*8);g.rotate(a*1.1);base(g,p);g.restore();
    if(t>.2&&t<.7){g.save();g.globalAlpha=a;sparkle(g,-39,4,3);g.restore();}
  } else if(gesture.id==='fortune') {
    const a=swell(t,.38,.66), width=30*a;
    g.fillStyle='#896431';g.fillRect(-width/2,8,width,12);
    g.fillStyle='#fff4cc';g.fillRect(-width/2-1,6,width,11);
    g.fillStyle='#d4af6e';g.fillRect(-width/2+3,9,Math.max(0,width-6),1);
    clipped(g,p,[[-55,-55],[0,-55],[0,55],[-55,55]],-8*a,-2*a,-a*.14);
    clipped(g,p,[[0,-55],[55,-55],[55,55],[0,55]],8*a,-2*a,a*.14);
    if(a>.6){sparkle(g,0,29,2);}
  } else if(gesture.id==='squish') {
    const compression=Math.sin(Math.PI*clamp(t/.42))*(t<.42?1:0),
      spring=t>.42?Math.sin((t-.42)*Math.PI*7)*Math.pow(1-t,2):0,
      sx=1+compression*.16+spring*.12, sy=1-compression*.18-spring*.10;
    g.save();g.translate(0,(1-sy)*30);g.scale(sx,sy);base(g,p);g.restore();
    if(t>.24&&t<.8){g.save();g.globalAlpha=Math.sin(Math.PI*(t-.24)/.56)*.65;
      for(const side of[-1,1])for(let i=0;i<3;i++)grain(g,side*(46+(t-.24)*20+i*3),20-i*5,2,'#fff2cd');g.restore();}
  } else if(gesture.id==='crumble') {
    const a=swell(t,.28,.58);
    if(a<.005)base(g,p);
    else {
      const pieces=[
        {points:[[-55,-55],[0,-55],[-2,-27],[3,-17],[-1,-5],[0,0],[-22,2],[-36,-1],[-55,0]],x:-1,y:-1},
        {points:[[0,-55],[55,-55],[55,0],[30,-2],[17,2],[0,0],[-1,-5],[3,-17],[-2,-27]],x:1,y:-1},
        {points:[[-55,0],[-36,-1],[-22,2],[0,0],[2,17],[-2,35],[0,55],[-55,55]],x:-1,y:1},
        {points:[[0,0],[17,2],[30,-2],[55,0],[55,55],[0,55],[-2,35],[2,17]],x:1,y:1},
      ];
      for(const piece of pieces)clipped(g,p,piece.points,piece.x*a*4,piece.y*a*4,piece.x*piece.y*a*.025);
    }
    crumbs(g,p,t,14);
  } else if(gesture.id==='spin') {
    const turn=ease(t),stretch=1+Math.sin(Math.PI*t)*.025;
    g.save();g.rotate(turn*Math.PI*4);g.scale(stretch,stretch);base(g,p);g.restore();
    if(t>.1&&t<.9){g.save();g.globalAlpha=Math.sin(Math.PI*t)*.7;
      for(let i=0;i<3;i++){const angle=turn*Math.PI*4+i*Math.PI*2/3;sparkle(g,Math.cos(angle)*54,Math.sin(angle)*54,2);}g.restore();}
  } else {
    const a=Math.sin(Math.PI*t),rock=Math.sin(t*Math.PI*10)*a;
    g.save();g.translate(rock*3,Math.sin(t*Math.PI*8)*a*1.5);g.rotate(rock*.065);base(g,p);g.restore();
    crumbs(g,p,t,10);
  }
  g.restore();
  return active;
}
