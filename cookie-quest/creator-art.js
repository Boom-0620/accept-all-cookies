import { cookieSprite } from './ending-art.js';
import { COOKIE_CATALOG } from './cookie-catalog.js';

// Local, deterministic recipe illustrations. No image generation or remote assets.
export const CREATOR_INGREDIENTS = [
  {id:'butter',label:'黄油',color:'#edbd59',description:'金黄的小黄油粒'},
  {id:'chocolate',label:'巧克力',color:'#60331f',description:'深色巧克力碎块'},
  {id:'matcha',label:'抹茶',color:'#779b42',description:'绿色茶粉与小茶叶'},
  {id:'strawberry',label:'草莓',color:'#e66575',description:'带小籽的红色果粒'},
  {id:'coffee',label:'咖啡',color:'#8b583b',description:'有中缝的烘焙咖啡豆'},
  {id:'sesame',label:'芝麻',color:'#c6af74',description:'黑白相间的小芝麻'},
  {id:'almond',label:'杏仁',color:'#d5ad70',description:'浅奶油色杏仁片'},
  {id:'honey',label:'蜂蜜',color:'#d99b24',description:'弯弯曲曲的金色蜜线'}
];

export const CREATOR_OBJECTS = [
  {id:'star',label:'星星',color:'#f3c342',description:'一块有尖尖角的小星星',shape:'star'},
  {id:'cloud',label:'云朵',color:'#fff1da',description:'松软的云朵轮廓',shape:'cloud'},
  {id:'vinyl',label:'唱片',color:'#343448',description:'同心唱片纹与彩色圆心',shape:'vinyl'},
  {id:'wave',label:'海浪',color:'#529fa7',description:'卷起来的浪花与泡沫',shape:'wave'},
  {id:'gear',label:'齿轮',color:'#c48a43',description:'一圈小齿与中央圆孔',shape:'gear'},
  {id:'flower',label:'花朵',color:'#df7895',description:'围着花心盛开的花瓣',shape:'flower'},
  {id:'moon',label:'月亮',color:'#efc973',description:'弯弯的月牙',shape:'moon'},
  {id:'leaf',label:'树叶',color:'#7f9b48',description:'尖尖叶片与清楚的叶脉',shape:'leaf'},
  {id:'button',label:'纽扣',color:'#c86b56',description:'四个小洞的圆纽扣',shape:'button'},
  {id:'rainbow',label:'彩虹',color:'#e39b58',description:'一座彩色的小拱桥',shape:'rainbow'}
];

export const CREATOR_COLORS = [
  {id:'vanilla',label:'香草白',color:'#fff0ce',description:'浅奶油色糖霜'},
  {id:'cocoa',label:'可可棕',color:'#693822',description:'巧克力色糖霜'},
  {id:'strawberry',label:'草莓粉',color:'#ef83a1',description:'柔和的草莓粉糖霜'},
  {id:'matcha',label:'抹茶绿',color:'#9ab558',description:'茶叶绿色糖霜'},
  {id:'lemon',label:'柠檬黄',color:'#f6d55b',description:'明亮的柠檬黄糖霜'},
  {id:'lavender',label:'紫罗兰',color:'#b7a1d5',description:'浅紫色糖霜'}
];

const SIZE = 128;
const catalog = new Map(COOKIE_CATALOG.map(item => [item.id,item]));
const ingredientsById = new Map(CREATOR_INGREDIENTS.map(item => [item.id,item]));
const objectsById = new Map(CREATOR_OBJECTS.map(item => [item.id,item]));
const specimenCache = new Map();
const validColor = value => typeof value === 'string' && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value);
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const ids = (values,map) => [...new Set(Array.isArray(values) ? values.filter(id => map.has(id)) : [])];

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let n = Math.imul(value ^ value >>> 15,value | 1);
    n ^= n + Math.imul(n ^ n >>> 7,n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function normalize(recipe = {}) {
  const mode = recipe.mode === 'mix' ? 'mix' : 'diy';
  const objects = ids(recipe.objects,objectsById);
  return {
    mode,
    baseId:catalog.has(recipe.baseId) ? recipe.baseId : '02_chocolate_chunk',
    icing:validColor(recipe.icing) ? recipe.icing : null,
    ingredients:ids(recipe.ingredients,ingredientsById),
    objects:mode === 'mix' && !objects.length ? ['star','cloud'] : objects,
    seed:Number.isFinite(recipe.seed) ? recipe.seed >>> 0 : 1,
    strokes:(Array.isArray(recipe.strokes) ? recipe.strokes : []).slice(0,512).map(stroke => ({
      color:validColor(stroke?.color) ? stroke.color : '#693822',
      points:(Array.isArray(stroke?.points) ? stroke.points : []).filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y)).slice(0,4096).map(point => ({x:clamp(point.x,0,1),y:clamp(point.y,0,1)}))
    }))
  };
}

function surface(document) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  canvas.getContext('2d').imageSmoothingEnabled = false;
  return canvas;
}

function specimen(item,document) {
  if (specimenCache.has(item.id)) return specimenCache.get(item.id);
  const source = cookieSprite(item), g = source.getContext('2d');
  const pixels = g.getImageData(0,0,source.width,source.height).data;
  let l=source.width,t=source.height,r=0,b=0;
  for (let y=0;y<source.height;y++) for (let x=0;x<source.width;x++) if (pixels[(y*source.width+x)*4+3]>32) {
    l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
  }
  const canvas=document.createElement('canvas');canvas.width=r-l+1;canvas.height=b-t+1;
  canvas.getContext('2d').drawImage(source,l,t,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
  specimenCache.set(item.id,canvas);return canvas;
}

function originalBase(item,document) {
  const canvas=surface(document),g=canvas.getContext('2d'),image=specimen(item,document);
  const scale=108/Math.max(image.width,image.height),w=Math.round(image.width*scale),h=Math.round(image.height*scale);
  g.drawImage(image,Math.round((SIZE-w)/2),Math.round((SIZE-h)/2),w,h);
  return canvas;
}

function blend(a,b,amount) {
  const hex = value => {const s=value.slice(1);return s.length===3?s.split('').map(c=>c+c).join(''):s;};
  const aa=hex(a),bb=hex(b);
  return '#'+[0,2,4].map(i=>Math.round(parseInt(aa.slice(i,i+2),16)*(1-amount)+parseInt(bb.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');
}

function objectPath(id,x,y,r,variant=0) {
  const p=new Path2D();
  const point=(a,radius)=>[x+Math.cos(a)*radius,y+Math.sin(a)*radius];
  const polygon=points=>{points.forEach(([px,py],i)=>i?p.lineTo(px,py):p.moveTo(px,py));p.closePath();};
  const circle=(cx,cy,radius)=>{p.moveTo(cx+radius,cy);p.arc(cx,cy,radius,0,Math.PI*2);p.closePath();};
  if(id==='star') {
    const tips=5+variant%2;
    polygon(Array.from({length:tips*2},(_,i)=>point(-Math.PI/2+i*Math.PI/tips,r*(i%2?.48:1))));
  } else if(id==='cloud') {
    p.moveTo(x-r*.78,y+r*.52);
    p.bezierCurveTo(x-r*1.2,y+r*.32,x-r*1.08,y-r*.24,x-r*.62,y-r*.24);
    p.bezierCurveTo(x-r*.68,y-r*.98,x+r*.05,y-r*1.02,x+r*.3,y-r*.55);
    p.bezierCurveTo(x+r*.84,y-r*.8,x+r*1.09,y-r*.18,x+r*.78,y+r*.04);
    p.bezierCurveTo(x+r*1.2,y+r*.35,x+r*.77,y+r*.72,x+r*.49,y+r*.57);
    p.bezierCurveTo(x+r*.1,y+r*.72,x-r*.42,y+r*.66,x-r*.78,y+r*.52);p.closePath();
  } else if(id==='wave') {
    p.moveTo(x-r,y+r*.68);
    p.bezierCurveTo(x-r,y-r*.45,x+r*.2,y-r*1.2,x+r*.88,y-r*.36);
    p.bezierCurveTo(x+r*.18,y-r*.72,x-r*.1,y-r*.14,x+r*.2,y+r*.22);
    p.bezierCurveTo(x+r*.46,y+r*.55,x+r*.84,y+r*.4,x+r,y+r*.15);
    p.lineTo(x+r,y+r*.73);p.quadraticCurveTo(x,y+r*.96,x-r,y+r*.68);p.closePath();
  } else if(id==='gear') {
    const teeth=8+variant%4;
    polygon(Array.from({length:teeth*4},(_,i)=>point(-Math.PI/2+i*Math.PI/(teeth*2),r*(i%4<2?1:.79))));
    circle(x,y,r*.2);
  } else if(id==='flower') {
    const petals=6+variant%3;
    polygon(Array.from({length:96},(_,i)=>{const a=i*Math.PI/48;return point(a,r*(.79+.21*Math.cos(petals*a)));}));
  } else if(id==='moon') {
    p.moveTo(x+r*.51,y-r*.85);
    p.bezierCurveTo(x-r*1.3,y-r*1.02,x-r*1.22,y+r*1.05,x+r*.5,y+r*.88);
    p.bezierCurveTo(x-r*.3,y+r*.58,x-r*.42,y-r*.32,x+r*.51,y-r*.85);p.closePath();
  } else if(id==='leaf') {
    p.moveTo(x,y-r);
    p.bezierCurveTo(x+r*.92,y-r*.2,x+r*.73,y+r*.6,x,y+r);
    p.bezierCurveTo(x-r*.86,y+r*.36,x-r*.7,y-r*.38,x,y-r);p.closePath();
  } else if(id==='rainbow') {
    p.moveTo(x-r,y+r*.65);p.lineTo(x-r,y);
    p.arc(x,y,r,Math.PI,Math.PI*2);p.lineTo(x+r,y+r*.65);p.lineTo(x+r*.47,y+r*.65);
    p.lineTo(x+r*.47,y);p.arc(x,y,r*.47,0,-Math.PI,true);p.lineTo(x-r*.47,y+r*.65);p.closePath();
  } else {
    circle(x,y,r);
    if(id==='vinyl') circle(x,y,r*.11);
    if(id==='button') for(const dx of [-1,1]) for(const dy of [-1,1]) circle(x+dx*r*.24,y+dy*r*.24,r*.12);
  }
  return p;
}

function line(g,points,color,width=1) {
  g.beginPath();g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';
  points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
}

function dot(g,x,y,r,color) {
  g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
}

function motif(g,id,x,y,r,variant=0) {
  const item=objectsById.get(id),path=objectPath(id,x,y,r,variant);
  g.fillStyle=item.color;g.fill(path,'evenodd');g.strokeStyle='#66402b';g.lineWidth=Math.max(.7,r*.055);g.stroke(path);
  if(id==='vinyl') {
    g.strokeStyle='#817589';g.lineWidth=.7;
    for(const k of [.46,.65,.82]){g.beginPath();g.arc(x,y,r*k,0,Math.PI*2);g.stroke();}
    dot(g,x,y,r*.29,['#ecbd62','#e37f84','#87b28c'][variant%3]);dot(g,x,y,r*.08,'#44313a');
  } else if(id==='wave') {
    line(g,[[x-r*.76,y+r*.42],[x-r*.46,y-r*.15],[x+r*.02,y-r*.57],[x+r*.51,y-r*.45]],'#f8f0d7',r*.16);
    dot(g,x-r*.1,y-r*.22,r*.08,'#fff3d9');dot(g,x+r*.63,y+r*.32,r*.075,'#fff3d9');
  } else if(id==='flower') {
    dot(g,x,y,r*.34,'#f2cd65');dot(g,x-r*.1,y-r*.02,r*.045,'#513027');dot(g,x+r*.1,y-r*.02,r*.045,'#513027');
  } else if(id==='leaf') {
    line(g,[[x,y-r*.72],[x,y+r*.8]],'#e5df9c',r*.08);
    for(let i=-1;i<=1;i++){line(g,[[x-r*.37,y+i*r*.35-r*.13],[x,y+i*r*.35+r*.15],[x+r*.37,y+i*r*.35-r*.13]],'#c2d38a',r*.06);}
  } else if(id==='button') {
    g.strokeStyle='#ffd599';g.lineWidth=r*.065;g.beginPath();g.arc(x,y,r*.79,0,Math.PI*2);g.stroke();
  } else if(id==='rainbow') {
    for(const [i,color] of ['#d96d74','#f4c858','#89ac79'].entries()) {
      g.beginPath();g.strokeStyle=color;g.lineWidth=r*.15;g.arc(x,y,r*(.89-i*.18),Math.PI,Math.PI*2);g.stroke();
    }
  } else if(id==='gear') {
    g.strokeStyle='#f1cf8b';g.lineWidth=r*.065;g.beginPath();g.arc(x,y,r*.56,0,Math.PI*2);g.stroke();
  } else if(id==='cloud') {
    dot(g,x-r*.18,y+r*.1,r*.045,'#634d49');dot(g,x+r*.18,y+r*.1,r*.045,'#634d49');
    line(g,[[x-r*.07,y+r*.25],[x,y+r*.29],[x+r*.07,y+r*.25]],'#bd8d80',r*.04);
  } else if(id==='star') {
    line(g,[[x,y-r*.72],[x-r*.1,y-r*.16],[x-r*.52,y+r*.36]],'#ffe7a1',r*.09);
  } else if(id==='moon') {
    dot(g,x-r*.42,y-r*.18,r*.1,'#d9a94e');dot(g,x-r*.35,y+r*.3,r*.06,'#d9a94e');
  }
}

function primaryObject(recipe) {return recipe.objects[recipe.seed%recipe.objects.length] || 'star';}

function mixedBase(recipe,item,document,rng) {
  const canvas=surface(document),g=canvas.getContext('2d');
  const primary=primaryObject(recipe),path=objectPath(primary,64,65,49,recipe.seed%12);
  const ingredient=ingredientsById.get(recipe.ingredients[recipe.seed%Math.max(1,recipe.ingredients.length)]);
  const dough=blend(ingredient?.color || item.color || '#e8ad61','#f5d88b',.15+rng()*.12);
  g.fillStyle=dough;g.fill(path,'evenodd');
  const image=specimen(item,document);
  g.save();g.globalCompositeOperation='source-atop';g.globalAlpha=.18;
  g.drawImage(image,12,12,104,104);g.globalAlpha=1;
  for(let i=0;i<200;i++) {
    g.fillStyle=i%3?'#6e3c2025':'#fff0bd48';const size=rng()<.12?2:1;
    g.fillRect(Math.floor(12+rng()*105),Math.floor(12+rng()*105),size,size);
  }
  g.restore();g.lineWidth=2;g.strokeStyle=blend(dough,'#4e2c20',.54);g.stroke(path);
  return canvas;
}

function addIcing(layer,base,color,document,rng) {
  const icing=surface(document),g=icing.getContext('2d');
  g.drawImage(base,9,9,110,110);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,SIZE,SIZE);
  g.globalCompositeOperation='source-atop';
  for(let i=0;i<90;i++){g.fillStyle=i%3?'#fffbe91c':'#6c392512';g.fillRect(Math.floor(rng()*SIZE),Math.floor(rng()*SIZE),1,1);}
  layer.getContext('2d').drawImage(icing,0,0);
}

export function drawCreatorSymbol(canvas,id,kind='object') {
 const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);g.save();g.scale(canvas.width/64,canvas.height/64);g.imageSmoothingEnabled=false;
 if(kind==='object')motif(g,id,32,32,24,3);
 else if(id==='honey'){g.fillStyle='#d99b24';g.beginPath();g.moveTo(32,9);g.bezierCurveTo(24,23,12,39,25,51);g.bezierCurveTo(52,63,52,32,32,9);g.fill();line(g,[[28,32],[24,40],[27,46]],'#ffe59a',3);}
 else{g.translate(32,32);g.scale(4,4);ingredientPiece(g,id,0,0,random(31));}g.restore();
}
function ingredientPiece(g,id,x,y,rng) {
  g.save();g.translate(Math.round(x),Math.round(y));
  if(id==='chocolate') {
    const s=3+rng()*3;g.fillStyle='#482317';g.beginPath();g.moveTo(-s,-s*.65);g.lineTo(s*.6,-s);g.lineTo(s,s*.7);g.lineTo(-s*.7,s);g.closePath();g.fill();
    g.fillStyle='#8d5332';g.fillRect(-s+1,-s*.45,Math.max(1,s-1),2);
  } else if(id==='strawberry') {
    g.fillStyle='#be3e4b';g.beginPath();g.moveTo(-3,-3);g.quadraticCurveTo(0,-5,3,-3);g.quadraticCurveTo(5,1,0,5);g.quadraticCurveTo(-5,1,-3,-3);g.fill();
    g.fillStyle='#f28b83';g.fillRect(-2,-2,2,3);g.fillStyle='#f9da8c';g.fillRect(1,0,1,1);g.fillRect(-1,2,1,1);
    g.fillStyle='#708642';g.fillRect(-2,-4,4,1);
  } else if(id==='coffee') {
    g.fillStyle='#603624';g.beginPath();g.ellipse(0,0,3,4.5,.4,0,Math.PI*2);g.fill();
    line(g,[[1,-3],[-1,0],[0,3]],'#b78356',1);
  } else if(id==='almond') {
    g.fillStyle='#ac773e';g.beginPath();g.ellipse(0,0,3,5,-.5,0,Math.PI*2);g.fill();
    g.fillStyle='#f0d99c';g.beginPath();g.ellipse(0,-.5,2,4,-.5,0,Math.PI*2);g.fill();
    line(g,[[-1,-3],[1,3]],'#bc955c',.6);
  } else if(id==='matcha') {
    for(let i=0;i<10;i++){g.fillStyle=i%3?'#789646':'#a7ba62';g.fillRect(Math.floor(rng()*10-5),Math.floor(rng()*8-4),1,1);}
    if(rng()>.55){g.fillStyle='#66833b';g.beginPath();g.ellipse(0,0,2,4,.6,0,Math.PI*2);g.fill();line(g,[[-1,2],[1,-2]],'#b4c478',.7);}
  } else if(id==='sesame') {
    for(let i=0;i<5;i++){g.fillStyle=i%2?'#ead8a4':'#47332a';g.fillRect(Math.floor(rng()*9-4),Math.floor(rng()*9-4),i%2?1:2,i%2?3:1);}
  } else if(id==='butter') {
    g.fillStyle='#bc8531';g.fillRect(-3,-2,6,5);g.fillStyle='#f3d781';g.fillRect(-2,-2,4,3);g.fillStyle='#ffe9ab';g.fillRect(-2,-2,2,1);
  }
  g.restore();
}

function addIngredients(layer,recipe,rng) {
  const g=layer.getContext('2d'),count=5+Math.floor(12/Math.max(1,recipe.ingredients.length));
  for(const id of recipe.ingredients) {
    if(id==='honey') {
      for(let row=0;row<3;row++) {
        const y=38+row*22+(rng()-.5)*6,points=Array.from({length:8},(_,i)=>[23+i*12,y+Math.sin(i*1.2+row)*4]);
        line(g,points,'#c48825',3);line(g,points.map(([x,yy])=>[x,yy-1]),'#f0c76a',1);
      }
    } else for(let i=0;i<count;i++) {
      const a=rng()*Math.PI*2,r=Math.sqrt(rng())*47;
      ingredientPiece(g,id,64+Math.cos(a)*r,64+Math.sin(a)*r,rng);
    }
  }
}

function primaryTexture(g,id,seed) {
  // Treat the first object as the pastry itself, leaving its centre for the other choices.
  if(id==='vinyl') {
    g.strokeStyle='#6a4d395f';g.lineWidth=1;
    for(const r of [25,31,37,43]){g.beginPath();g.arc(64,65,r,0,Math.PI*2);g.stroke();}
    dot(g,64,65,13,['#d97971','#8caf87','#efd08c'][seed%3]);
  } else if(id==='wave') {
    line(g,[[25,84],[29,63],[43,42],[65,29],[84,33],[94,42]],'#58a3a8',7);
    line(g,[[27,83],[31,63],[45,44],[65,32],[84,36],[94,43]],'#fff2d5',3);
  } else if(id==='leaf') {
    line(g,[[64,26],[64,104]],'#6e823b',2);
    for(let i=-1;i<=1;i++)line(g,[[47,62+i*19],[64,74+i*19],[82,60+i*19]],'#91a556',1.5);
  } else if(id==='rainbow') {
    for(const [i,color] of ['#df7e77','#eac65d','#94ac76'].entries()) {
      g.beginPath();g.strokeStyle=color;g.lineWidth=5;g.arc(64,65,43-i*7,Math.PI,Math.PI*2);g.stroke();
    }
  } else if(id==='moon') {
    dot(g,35,56,4,'#c7984f');dot(g,39,83,2,'#e8c17b');dot(g,48,35,2.5,'#c7984f');
  } else if(id==='flower') {
    dot(g,64,65,8,'#f0c46b');
    for(let i=0;i<6;i++)dot(g,64+Math.cos(i*Math.PI/3)*11,65+Math.sin(i*Math.PI/3)*11,1,'#bc8946');
  } else if(id==='button'||id==='gear') {
    g.strokeStyle='#b17e4c';g.lineWidth=1;
    g.beginPath();g.arc(64,65,id==='button'?41:29,0,Math.PI*2);g.stroke();
  } else if(id==='star') {
    line(g,[[64,26],[62,44]],'#fff1b7',2);
  }
}

function motifFootprint(id,r,variant,document) {
  const canvas=surface(document),g=canvas.getContext('2d');
  motif(g,id,64,64,r,variant);
  const data=g.getImageData(0,0,SIZE,SIZE).data,points=[];
  for(let y=0;y<SIZE;y+=2)for(let x=0;x<SIZE;x+=2)if(data[(y*SIZE+x)*4+3]>64)points.push([x-64,y-64]);
  return points;
}

function addObjectMotifs(layer,base,recipe,rng,document) {
  const g=layer.getContext('2d'),primary=primaryObject(recipe);
  const others=recipe.objects.filter(id=>id!==primary),count=others.length;
  primaryTexture(g,primary,recipe.seed);
  if(!count)return;
  const alpha=base.getContext('2d').getImageData(0,0,SIZE,SIZE).data;
  const occupied=new Uint8Array(SIZE*SIZE),phase=-Math.PI/2+(rng()-.5)*.25;
  others.forEach((id,i)=>{
    const angle=phase+i*Math.PI*2/count;
    const target=count===1?23:count===2?18:count<5?14:count<8?11:9;
    const preferred=count===1?[64,66]:[64+Math.cos(angle)*(count<3?18:27),65+Math.sin(angle)*(count<3?18:27)];
    const variant=(recipe.seed+i)%12;
    let placed=null;
    // Score the actual icing silhouette against the actual pastry alpha, including its holes.
    for(let size=target;size>=5&&!placed;size--) {
      const footprint=motifFootprint(id,size,variant,document);let best=null;
      for(let y=18;y<=110;y+=2)for(let x=18;x<=110;x+=2) {
        let outside=0,overlap=0;
        for(const [dx,dy] of footprint) {
          const px=x+dx,py=y+dy,index=py*SIZE+px;
          if(px<0||px>=SIZE||py<0||py>=SIZE||alpha[index*4+3]<160)outside++;
          else if(occupied[index])overlap++;
          if(outside>footprint.length*.015||overlap>footprint.length*.04)break;
        }
        if(outside>footprint.length*.015||overlap>footprint.length*.04)continue;
        const score=(x-preferred[0])**2+(y-preferred[1])**2+overlap*80;
        if(!best||score<best.score)best={x,y,size,score,footprint};
      }
      if(best)placed=best;
    }
    if(!placed)return;
    motif(g,id,placed.x,placed.y,placed.size,variant);
    for(const [dx,dy]of placed.footprint)for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++) {
      const x=placed.x+dx+xx,y=placed.y+dy+yy;if(x>=0&&x<SIZE&&y>=0&&y<SIZE)occupied[y*SIZE+x]=1;
    }
  });
}

function addStrokes(layer,strokes) {
  const g=layer.getContext('2d');
  for(const stroke of strokes) {
    if(!stroke.points.length)continue;
    const points=stroke.points.map(point=>[point.x*SIZE,point.y*SIZE]);
    if(points.length===1)dot(g,points[0][0],points[0][1],1.6,stroke.color);
    else line(g,points,stroke.color,3.2);
  }
}

/** Draw onto a caller-sized canvas. Coordinates in recipe.strokes are relative to its square artwork. */
export function drawCreation(canvas,recipe) {
  if(!canvas?.getContext)throw new TypeError('drawCreation needs a canvas');
  const document=canvas.ownerDocument || globalThis.document,output=canvas.getContext('2d');
  if(!output)throw new TypeError('A 2D canvas context is required');
  const normalized=normalize(recipe),item=catalog.get(normalized.baseId),rng=random(normalized.seed);
  const base=normalized.mode==='mix'?mixedBase(normalized,item,document,rng):originalBase(item,document);
  const decor=surface(document),g=decor.getContext('2d');
  if(normalized.icing)addIcing(decor,base,normalized.icing,document,rng);
  addIngredients(decor,normalized,rng);
  if(normalized.mode==='mix')addObjectMotifs(decor,base,normalized,rng,document);
  addStrokes(decor,normalized.strokes);
  // Original alpha, including holes, clips icing, toppings and the user's brush strokes.
  g.globalCompositeOperation='destination-in';g.drawImage(base,0,0);
  base.getContext('2d').drawImage(decor,0,0);
  output.save();output.setTransform(1,0,0,1,0,0);output.globalAlpha=1;output.globalCompositeOperation='source-over';
  output.shadowBlur=0;output.shadowColor='transparent';output.filter='none';output.imageSmoothingEnabled=false;
  output.clearRect(0,0,canvas.width,canvas.height);
  const side=Math.min(canvas.width,canvas.height);
  output.drawImage(base,Math.floor((canvas.width-side)/2),Math.floor((canvas.height-side)/2),side,side);output.restore();
  return describeCreation(normalized);
}

export function describeCreation(recipe) {
  const normalized=normalize(recipe),item=catalog.get(normalized.baseId);
  const flavors=normalized.ingredients.map(id=>ingredientsById.get(id).label);
  if(normalized.mode==='mix') {
    const primary=primaryObject(normalized),others=normalized.objects.filter(id=>id!==primary).map(id=>objectsById.get(id).label);
    const prefix=['咔嚓','晚安','漂流','晴天','小小','奇遇'][normalized.seed%6];
    return {name:prefix+objectsById.get(primary).label+'曲奇',description:objectsById.get(primary).label+'的轮廓'+(others.length?'，配上'+others.join('、')+'糖霜图案':'')+'。'+(flavors.length?flavors.join('、')+'风味的想象配方。':'一份可爱的想象配方。')};
  }
  const name=item.name.split(' · ')[0];
  return {name:(flavors[0]?flavors[0]+'·':'')+name+' DIY',description:'以'+name+'为底'+(flavors.length?'，加上'+flavors.join('、'):'')+(normalized.icing?'和一层糖霜':'')+(normalized.strokes.length?'，留下你的手绘线条':'')+'。'};
}

/** Repeated calls with the same arguments/seed produce exactly the same recipe. */
export function createRandomRecipe({baseId,ingredients,objects,seed} = {}) {
  const resolvedSeed=Number.isFinite(seed)?seed>>>0:Math.floor(Math.random()*4294967296);
  const rng=random(resolvedSeed),chosenObjects=ids(objects,objectsById),chosenIngredients=ids(ingredients,ingredientsById);
  if(!chosenObjects.length) {
    const first=Math.floor(rng()*CREATOR_OBJECTS.length),second=(first+1+Math.floor(rng()*(CREATOR_OBJECTS.length-1)))%CREATOR_OBJECTS.length;
    chosenObjects.push(CREATOR_OBJECTS[first].id,CREATOR_OBJECTS[second].id);
  }
  if(!chosenIngredients.length)chosenIngredients.push('butter',CREATOR_INGREDIENTS[1+Math.floor(rng()*(CREATOR_INGREDIENTS.length-1))].id);
  return {
    mode:'mix',baseId:catalog.has(baseId)?baseId:COOKIE_CATALOG[Math.floor(rng()*COOKIE_CATALOG.length)].id,
    icing:rng()<.5?null:CREATOR_COLORS[Math.floor(rng()*CREATOR_COLORS.length)].color,
    ingredients:chosenIngredients,objects:chosenObjects,seed:resolvedSeed,strokes:[]
  };
}
