/* User-driven brush / pan / spatula model. No DOM or host side effects. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class KunguFlow {
 constructor(){this.reset();}
 reset(){this.stage='intro';this.pan={x:235,y:225,angle:0};this.oil=new Set();this.particles=[];this.travel=0;this.stirTravel=0;this.pressure=0;this.bites=0;this.serial=0;}
 pick(){if(this.stage!=='intro')return false;this.stage='oil';return true;}
 brush(x,y){if(this.stage!=='oil')return false;for(let row=-3;row<=3;row++)for(let col=-5;col<=5;col++){const px=col*18,py=row*13;if((px/96)**2+(py/44)**2<1&&Math.hypot(px-x,(py-y)*1.3)<31)this.oil.add(col+':'+row);}if(this.oil.size>=48){this.stage='catch';return true;}return false;}
 catchTravel(d){if(this.stage!=='catch'||!Number.isFinite(d))return[];this.travel+=Math.min(Math.abs(d),280);const target=Math.min(240,Math.floor(this.travel*.38));const added=[];while(this.particles.length<target){const i=this.serial++,angle=i*2.399963,r=Math.sqrt(((i*73)%239)/239);const p={char:'kungu'[i%5],x:Math.cos(angle)*94*r,y:Math.sin(angle)*40*r,angle:Math.sin(i*7.1)*1.1,press:0,index:i};this.particles.push(p);added.push(p);}if(this.particles.length===240)this.stage='gather';return added;}
 stir(x,y,dx,dy){if(this.stage!=='gather')return false;const movement=Math.hypot(dx,dy);if(movement<.25)return false;this.stirTravel+=Math.min(movement,45);for(const p of this.particles){const d=Math.hypot(p.x-x,(p.y-y)*1.25);if(d<65){const influence=(1-d/80)*Math.min(1,movement/12);p.x+=(dx*.55-p.x*.25)*influence;p.y+=(dy*.4-p.y*.24)*influence;p.x=clamp(p.x,-94,94);p.y=clamp(p.y,-40,40);}}const compact=this.particles.filter(p=>(p.x/66)**2+(p.y/27)**2<1).length/this.particles.length;if(compact>.84&&this.stirTravel>150){this.stage='press';return true;}return false;}
 press(x,y,dt){if(this.stage!=='press'||!Number.isFinite(dt)||Math.hypot(x,y*1.5)>95)return false;const amount=Math.min(dt,40)/1350;for(const p of this.particles){const proximity=Math.hypot(p.x-x,(p.y-y)*1.3);p.press=clamp(p.press+amount*(proximity<55?1:.18),0,1);p.x*=1-amount*.1;p.y*=1-amount*.08;}this.pressure=this.particles.reduce((s,p)=>s+p.press,0)/this.particles.length;if(this.pressure>.9){this.stage='fry';return true;}return false;}
 serve(){if(this.stage!=='fry')return false;this.stage='eat';return true;}
 bite(){if(this.stage!=='eat')return false;this.bites++;if(this.bites===3)this.stage='reveal';return true;}
 inform(){if(this.stage!=='reveal')return false;this.stage='info';return true;}
}
root.KunguFlow=KunguFlow;if(typeof module!=='undefined'&&module.exports)module.exports=KunguFlow;
})(typeof globalThis!=='undefined'?globalThis:window);
