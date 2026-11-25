import { drawChef, drawCookie, drawLandscape } from './scene-art.js';
import { drawTrophy, drawGoldSurface } from './ending-art.js';

const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function paintAward(g,time,reduced=false){
 const zoomProgress=ease((time-5.4)/2.5),zoom=reduced?1:Math.pow(110,zoomProgress);
 g.clearRect(0,0,864,576);g.save();g.imageSmoothingEnabled=false;
 g.translate(432,288);g.scale(2.4*zoom,2.4*zoom);g.translate(-(180-(reduced?0:2*zoomProgress)),-(120+(reduced?0:29*zoomProgress)));
 drawLandscape(g,'canyon',0,reduced?0:time);
 g.fillStyle='#89513e';g.fillRect(0,194,360,46);g.fillStyle='#ffe0bd';g.fillRect(0,194,360,5);
 g.fillStyle='#633a30';g.fillRect(143,158,74,40);g.fillStyle='#eab54f';g.fillRect(146,161,68,34);g.fillStyle='#fff1a3';g.fillRect(146,161,68,5);
 g.fillStyle='#633a30';g.fillRect(215,180,39,18);g.fillStyle='#eab54f';g.fillRect(218,183,33,12);
 g.fillStyle='#fff4ca';g.font='bold 18px monospace';g.textAlign='center';g.fillText('1',180,189);
 const arrival=ease(time/2.1),cookieX=310-88*arrival,handoff=ease((time-2.3)/1.5),lift=ease((time-4)/1.1);
 const bob=!reduced&&time>3.4&&time<5.4?-Math.round(Math.abs(Math.sin((time-3.4)*6))*2):0;
 drawChef(g,166,124+bob,{pose:time>3.4?'cheer':'idle',time:reduced?0:time});
 drawCookie(g,cookieX,163+(time<2.1&&!reduced?Math.sin(time*15):0));
 // Small dark hands carry the cup and remain visible during the handoff.
 g.fillStyle='#35231d';g.fillRect(cookieX-4,174,7,3);g.fillRect(cookieX+17,174,6,3);
 const cupX=(cookieX-13)*(1-handoff)+173*handoff,cupY=159*(1-handoff)+(148-3*lift+bob)*handoff;
 drawTrophy(g,cupX,cupY,.25);
 if(time>3.4&&!reduced){for(let i=0;i<12;i++){const x=100+(i*37)%160,y=38+((time*25+i*19)%90);g.fillStyle=['#ffe18a','#f48f9d','#fff5d9'][i%3];g.fillRect(x,y,2,3);}}
 g.restore();
 if(zoomProgress>.86){g.save();g.globalAlpha=(zoomProgress-.86)/.14;drawGoldSurface(g);g.restore();}
}
