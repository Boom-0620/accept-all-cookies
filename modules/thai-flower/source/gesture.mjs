const dist=(a,b,aspect=1)=>Math.hypot((a.x-b.x)*aspect,a.y-b.y);
const alpha=(cutoff,dt)=>1/(1+1/(2*Math.PI*cutoff*dt));
export class AdaptivePointFilter{
 reset(){this.p=null;this.last=0;this.velocity={x:0,y:0};}
 constructor(){this.reset();}
 update(p,time){if(!this.p){this.p={...p};this.last=time;return {...p};}const dt=Math.max(.008,Math.min(.1,(time-this.last)/1000));this.last=time;const a=alpha(1,dt);for(const k of ['x','y']){const d=(p[k]-this.p[k])/dt;this.velocity[k]+=a*(d-this.velocity[k]);const smoothing=alpha(1.3+.035*Math.abs(this.velocity[k]),dt);this.p[k]+=smoothing*(p[k]-this.p[k]);}return {...this.p};}
}
// A deliberate pinch starts drawing; releasing it stops drawing immediately.
// Hands only control the pen. Completion always requires the on-screen button.
export class HandInput{
 constructor(){this.reset();}
 reset(){this.filter=new AdaptivePointFilter();this.pinched=false;this.candidate=null;this.candidateAt=0;this.wrist=null;this.lastSeen=-Infinity;this.lastPoint=null;}
 update(hands,time,{aspect=4/3}={}){
  if(!hands?.length){this.pinched=false;this.candidate=null;this.lastPoint=null;this.filter.reset();return {visible:false,draw:false,breakStroke:true,finish:false,hold:0};}
  const hand=this.wrist&&time-this.lastSeen<500?hands.reduce((a,b)=>dist(a[0],this.wrist)<dist(b[0],this.wrist)?a:b):hands[0];
  const reacquired=!this.lastPoint||time-this.lastSeen>140;this.lastSeen=time;this.wrist={...hand[0]};
  const palm=Math.max(.035,dist(hand[5],hand[17],aspect));const ratio=dist(hand[4],hand[8],aspect)/palm;
  const raw={x:Math.max(8,Math.min(312,(1-hand[8].x-.08)/.84*320)),y:Math.max(8,Math.min(312,(hand[8].y-.06)/.88*320))};
  const jumped=this.lastPoint&&Math.hypot(raw.x-this.lastPoint.x,raw.y-this.lastPoint.y)>85;
  if(reacquired||jumped){this.filter.reset();this.pinched=false;this.candidate=null;}
  if(ratio>=.46){this.pinched=false;this.candidate=null;}
  else if(!this.pinched){
   if(ratio<.30){if(this.candidate!==true){this.candidate=true;this.candidateAt=time;}else if(time-this.candidateAt>=65){this.pinched=true;this.candidate=null;this.filter.reset();}}
   else this.candidate=null;
  }
  const point=this.filter.update(raw,time);this.lastPoint=raw;
  return {visible:true,hand,point,draw:this.pinched&&!jumped,breakStroke:!!jumped||reacquired,finish:false,hold:0,ratio};
 }
}
