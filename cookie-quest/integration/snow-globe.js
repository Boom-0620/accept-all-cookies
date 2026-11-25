// Host cover decoration: finite particles and a bounded bank, never story progress.
export function mountSnowGlobe(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cq-cover-snow';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = 256; canvas.height = 144;
  container.append(canvas);
  const g = canvas.getContext('2d'), columns = 64;
  const bank = new Float32Array(columns).fill(1);
  const flakes = Array.from({length:36}, () => ({x:Math.random()*256,y:Math.random()*140,s:Math.random()>.7?2:1,v:13+Math.random()*17,phase:Math.random()*6.28}));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, last = 0, elapsed = 0, hidden = false, dead = false;
  function draw() {
    g.clearRect(0,0,256,144);
    // Shadowed lower edge and a pale, uneven snowy surface.
    for(let i=0;i<columns;i++) {
      const height = Math.round(bank[i]);
      g.fillStyle='#c7d9dc';g.fillRect(i*4,144-height,4,height);
      g.fillStyle='#fff9e9';g.fillRect(i*4,144-height,4,Math.max(1,height-2));
      if(height>4 && i%3===0){g.fillStyle='#e0e9e6';g.fillRect(i*4+1,146-height,1,1);}
    }
    for(const f of flakes){
      g.fillStyle=f.s===2?'#fffdf5':'#eef4efcc';
      const x=Math.round(f.x),y=Math.round(f.y);
      g.fillRect(x,y,f.s,f.s);
      if(f.s===2){g.fillRect(x-1,y+1,4,1);g.fillRect(x+1,y-1,1,4);}
    }
    // A subtle glass rim, not a new frame or a sphere-shaped crop.
    g.strokeStyle='#fff8df33';g.lineWidth=1;g.strokeRect(.5,.5,255,143);
  }
  function tick(now) {
    frame=0;
    if(dead||hidden||document.hidden||reduced.matches)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;
    for(const f of flakes) {
      f.x=(f.x+Math.sin(elapsed*.8+f.phase)*5*dt+256)%256;
      f.y+=f.v*dt;
      const bin=Math.min(columns-1,Math.floor(f.x/4));
      if(f.y+f.s>=144-bank[bin]) {
        for(let j=-2;j<=2;j++) {
          const k=bin+j;if(k<0||k>=columns)continue;
          const cap=13+5*Math.sin(k*.15)**2+3*Math.cos(k*.37)**2;
          bank[k]=Math.min(cap,bank[k]+(3-Math.abs(j))*.32*f.s);
        }
        f.y=-4-Math.random()*12;f.x=Math.random()*256;
      }
    }
    // Settle the grains into small soft drifts without an ever-growing pile.
    for(let i=1;i<columns-1;i++)bank[i]+=(bank[i-1]+bank[i+1]-2*bank[i])*dt*.7;
    draw();frame=requestAnimationFrame(tick);
  }
  function sync(next={hidden}) {
    hidden=next.hidden;cancelAnimationFrame(frame);frame=0;last=0;
    if(!dead&&!hidden&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);
    else if(!dead)draw();
  }
  const change=()=>sync();
  document.addEventListener('visibilitychange',change);reduced.addEventListener('change',change);
  draw();sync();
  return {sync,destroy(){dead=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',change);reduced.removeEventListener('change',change);canvas.remove();}};
}
