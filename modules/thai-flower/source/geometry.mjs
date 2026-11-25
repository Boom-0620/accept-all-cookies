export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const signedArea=p=>p.reduce((n,a,i)=>{const b=p[(i+1)%p.length];return n+a.x*b.y-b.x*a.y;},0)/2;
export function resample(p,count,closed=true){
 const n=closed?p.length:p.length-1,lens=Array.from({length:n},(_,i)=>distance(p[i],p[(i+1)%p.length]));
 const total=lens.reduce((a,b)=>a+b,0);if(total<.001)return p.slice();
 let edge=0,acc=0;return Array.from({length:count},(_,i)=>{const target=total*i/(closed?count:count-1);while(edge<lens.length-1&&acc+lens[edge]<target)acc+=lens[edge++];const t=(target-acc)/(lens[edge]||1),a=p[edge],b=p[(edge+1)%p.length];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};});
}
function ribbon(p,r=6){
 const left=[],right=[];
 for(let i=0;i<p.length;i++){const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)],d=distance(a,b)||1;const nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;left.push({x:p[i].x+nx*r,y:p[i].y+ny*r});right.push({x:p[i].x-nx*r,y:p[i].y-ny*r});}
 return [...left,...right.reverse()];
}
// Ignore accidental dots and tiny tracking jitter. Near-closed outlines are gently joined. Long open
// strokes become a closed ribbon along the stroke, never a replacement flower.
function cleanStroke(s){const out=[];for(const p of s){if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!out.length||distance(p,out.at(-1))>.25))out.push(p);}return out;}
function usableStroke(p){
 if(p.length<2)return false;
 let length=0,minX=p[0].x,maxX=minX,minY=p[0].y,maxY=minY;
 for(let i=1;i<p.length;i++){length+=distance(p[i-1],p[i]);minX=Math.min(minX,p[i].x);maxX=Math.max(maxX,p[i].x);minY=Math.min(minY,p[i].y);maxY=Math.max(maxY,p[i].y);}
 return length>=18&&Math.max(maxX-minX,maxY-minY)>=14;
}
export function hasDrawing(strokes){return strokes.some(s=>usableStroke(cleanStroke(s)));}
export function prepareShape(strokes){
 const cleaned=strokes.map(cleanStroke).filter(usableStroke);
 if(!cleaned.length)return {error:'再画长一点吧，单个小点还不能做模具。'};
 let joins=0,ribbons=0;
 const contours=cleaned.map(p=>{
  const length=p.slice(1).reduce((n,v,i)=>n+distance(v,p[i]),0),gap=distance(p[0],p.at(-1));
  if(p.length>3&&Math.abs(signedArea(p))>80&&(gap<32||gap/Math.max(1,length)<.32)){joins+=gap>3?1:0;return p;}
  ribbons++;return ribbon(resample(p,Math.min(80,Math.max(8,Math.ceil(length/4))),false),Math.max(4,Math.min(7,length*.025)));
 });
 const all=contours.flat(),xs=all.map(p=>p.x),ys=all.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const size=Math.max(20,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
 const budget=Math.max(8,Math.floor(180/contours.length));
 const paths=contours.map(p=>Object.freeze(resample(p,budget).map(v=>Object.freeze({x:+((v.x-cx)/size).toFixed(5),y:+((v.y-cy)/size).toFixed(5)}))));
 return {shape:Object.freeze({paths:Object.freeze(paths)}),joins,ribbons};
}
export function pathsOf(shape){return shape?.paths||[shape];}
export function sampleShape(kind='flower'){return Array.from({length:120},(_,i)=>{const t=i/120*Math.PI*2-Math.PI/2;if(kind==='heart')return{x:Math.sin(t)**3*.5,y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/34};const r=kind==='star'?.32+.16*Math.cos(5*(t+Math.PI/2)):.37+.12*Math.cos(5*(t+Math.PI/2));return{x:Math.cos(t)*r,y:Math.sin(t)*r};});}
export class OnceCookie{constructor(send){this.send=send;this.sent=false;}made(){if(this.sent)return false;this.sent=true;this.send({type:'cookie',projectId:'thai-flower',outcome:'made'});return true;}}
