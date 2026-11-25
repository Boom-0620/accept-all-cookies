/* Pure state/geometry helpers. Shared by the browser and Node checks. */
(function (g) {
  'use strict';
  const transitions = {
    ready: ['ocean'], ocean: ['approach'], approach: ['escape'], escape: ['free','dragging'],
    free: ['dragging'], dragging: ['free', 'loaded'], loaded: ['coated'],
    coated: ['carrying'], carrying: ['coated','inpress'], inpress: ['closing'],
    closing: ['pressing'], pressing: ['baking'], baking: ['readyToOpen'],
    readyToOpen: ['opening'], opening: ['complete'], complete: []
  };
  function createMachine(onTransition = () => {}) {
    let state = 'ready', sent = false, dead = false;
    return {
      get state() { return dead ? 'destroyed' : state; },
      transition(next) {
        if (dead || !transitions[state].includes(next)) return false;
        const prev = state; state = next; onTransition(next, prev); return true;
      },
      claimCookie() {
        if (dead || state !== 'complete' || sent) return null;
        sent = true;
        return Object.freeze({ type: 'cookie', projectId: 'octopus-senbei', outcome: 'pressed' });
      },
      destroy() { dead = true; }
    };
  }
  function inDropZone(x, y, rect, padding = 38) {
    return x >= rect.left - padding && x <= rect.right + padding && y >= rect.top - padding && y <= rect.bottom + padding;
  }
  function clampPoint(x, y, rect, radius = 45) {
    const rx = Math.min(radius, rect.width / 2), ry = Math.min(radius, rect.height / 2);
    return { x: Math.max(rect.left + rx, Math.min(rect.right - rx, x)), y: Math.max(rect.top + ry, Math.min(rect.bottom - ry, y)) };
  }
  function createCoverage(columns=8, rows=5) {
    const visited=new Set();
    return {
      add(x,y,radius=.13) {
        if(!Number.isFinite(x)||!Number.isFinite(y)) return this.fraction;
        for(let iy=0;iy<rows;iy++)for(let ix=0;ix<columns;ix++){
          if(Math.hypot((ix+.5)/columns-x,(iy+.5)/rows-y)<=radius)visited.add(iy*columns+ix);
        }
        return this.fraction;
      },
      get fraction(){return visited.size/(columns*rows);}
    };
  }

  // Every photographed part uses the same 571×820 machine coordinates.
  const PRESS = Object.freeze({width:571,height:820,
    hinge:[[90,572],[315,560]],
    plate:[[85,590],[302,566],[445,674],[118,711]],
    food:[[119,600],[298,582],[392,657],[144,682]],
    inner:[[65,312],[388,312],[329,530],[70,531]],
    outer:[[107,623],[499,537],[347,436],[92,454]]
  });
  function pressPose(progress) {
    const p=Math.max(0,Math.min(1,progress)),a=p*Math.PI/2;
    const cx=202.5+65*Math.sin(a),cy=566-245*Math.cos(a)+122*Math.sin(a);
    const front=[[cx-165,cy+8.8],[cx+165,cy-8.8]];
    return {quad:[front[0],front[1],PRESS.hinge[1],PRESS.hinge[0]],
      front:[cx,cy],outer:cy>566-(cx-202.5)*12/225,
      handle:{x:cx,y:cy+2,angle:p*100}};
  }
  // Homography: real-photo corners -> moving plane corners (CSS matrix3d).
  function quadMatrix(source,target) {
    const a=[];
    for(let i=0;i<4;i++){
      const [x,y]=source[i],[u,v]=target[i];
      a.push([x,y,1,0,0,0,-u*x,-u*y,u]);
      a.push([0,0,0,x,y,1,-v*x,-v*y,v]);
    }
    for(let c=0;c<8;c++){
      let pivot=c;for(let r=c+1;r<8;r++)if(Math.abs(a[r][c])>Math.abs(a[pivot][c]))pivot=r;
      [a[c],a[pivot]]=[a[pivot],a[c]];
      const d=a[c][c];if(Math.abs(d)<1e-11)return null;
      for(let k=c;k<9;k++)a[c][k]/=d;
      for(let r=0;r<8;r++)if(r!==c){const n=a[r][c];for(let k=c;k<9;k++)a[r][k]-=n*a[c][k];}
    }
    const [h0,h1,h2,h3,h4,h5,h6,h7]=a.map(r=>r[8]);
    return [h0,h3,0,h6,h1,h4,0,h7,0,0,1,0,h2,h5,0,1];
  }
  const api = { createMachine, inDropZone, clampPoint, createCoverage, PRESS, pressPose, quadMatrix };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else g.OctopusSenbeiCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
