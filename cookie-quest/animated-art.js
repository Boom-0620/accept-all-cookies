/* Runtime sprite separation: preserve the supplied artwork and animate its layers. */
export function separateArtwork(image,rect,parts){
 const [sx,sy,w,h]=rect,background=document.createElement('canvas');background.width=w;background.height=h;
 const g=background.getContext('2d',{willReadFrequently:true});g.drawImage(image,sx,sy,w,h,0,0,w,h);
 const raw=g.getImageData(0,0,w,h),data=raw.data,mask=new Uint8Array(w*h),layers=[];
 for(const part of parts){
  const [x,y,pw,ph]=part.rect,c=document.createElement('canvas');c.width=pw;c.height=ph;
  const cg=c.getContext('2d'),pixels=cg.createImageData(pw,ph);
  let selected=new Uint8Array(pw*ph);
  for(let yy=0;yy<ph;yy++)for(let xx=0;xx<pw;xx++){
   const idx=((y+yy)*w+x+xx)*4;
   if(part.test(data[idx],data[idx+1],data[idx+2]))selected[yy*pw+xx]=1;
  }
  if(part.kind==='cloud'){
   // Keep the connected cloud silhouette, including its shaded pixels and texture.
   // Isolated pale sky speckles must not become a moving rectangular patch.
   const seen=new Uint8Array(pw*ph);let largest=[];
   for(let seed=0;seed<selected.length;seed++)if(selected[seed]&&!seen[seed]){
    const stack=[seed],component=[];seen[seed]=1;
    while(stack.length){const n=stack.pop();component.push(n);const xx=n%pw,yy=Math.floor(n/pw);
     for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=xx+dx,ny=yy+dy,k=ny*pw+nx;if(nx>=0&&nx<pw&&ny>=0&&ny<ph&&selected[k]&&!seen[k]){seen[k]=1;stack.push(k);}}
    }
    if(component.length>largest.length)largest=component;
   }
   selected.fill(0);for(const n of largest)selected[n]=1;
   for(let xx=0;xx<pw;xx++){
    let first=ph,last=-1;for(let yy=0;yy<ph;yy++)if(selected[yy*pw+xx]){first=Math.min(first,yy);last=yy;}
    for(let yy=first;yy<=last;yy++)selected[yy*pw+xx]=1;
   }
   const full=selected.slice();for(let yy=0;yy<ph;yy++)for(let xx=0;xx<pw;xx++)if(selected[yy*pw+xx]){
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=xx+dx,ny=yy+dy;if(nx>=0&&nx<pw&&ny>=0&&ny<ph)full[ny*pw+nx]=1;}
   }
   selected=full;
  }
  for(let yy=0;yy<ph;yy++)for(let xx=0;xx<pw;xx++)if(selected[yy*pw+xx]){
   const idx=((y+yy)*w+x+xx)*4,p=(yy*pw+xx)*4;
   pixels.data.set(data.subarray(idx,idx+4),p);mask[(y+yy)*w+x+xx]=1;
  }
  cg.putImageData(pixels,0,0);layers.push({...part,canvas:c});
 }
 // Clear the old outlines as well; nearby untouched sky supplies the repair colors.
 const expanded=mask.slice();
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(mask[y*w+x]){
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)expanded[(y+dy)*w+x+dx]=1;
 }
 const original=data.slice();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(expanded[y*w+x]){
  const samples=[];
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
   for(let d=1;d<100;d++){
    const xx=x+dx*d,yy=y+dy*d;if(xx<0||xx>=w||yy<0||yy>=h)break;
    if(!expanded[yy*w+xx]){samples.push({i:(yy*w+xx)*4,weight:1/(d*d)});break;}
   }
  }
  const total=samples.reduce((s,v)=>s+v.weight,0),i=(y*w+x)*4;
  if(total){
   const rand=Math.sin(x*127.1+y*311.7)*43758.5453,grain=((rand-Math.floor(rand))-.5)*7;
   for(let k=0;k<3;k++)data[i+k]=Math.max(0,Math.min(255,Math.round(samples.reduce((s,v)=>s+original[v.i+k]*v.weight,0)/total+grain)));
  }
 }
 g.putImageData(raw,0,0);
 return {background,layers};
}
export function paintSeparatedLayer(g,layer,t=0,kind=layer.kind){
 const [x,y,w,h]=layer.rect;
 if(kind==='cloud'){
  g.drawImage(layer.canvas,x+Math.sin(t*.13+(layer.phase||0))*(layer.drift||16),y);
 }else if(kind==='flag'){
  for(let xx=0;xx<w;xx++){
   const bend=Math.sin(t*5-xx*.19)*(xx/w)*(layer.wave||2.5);
   g.drawImage(layer.canvas,xx,0,1,h,x+xx,y+bend,1,h);
  }
 }else g.drawImage(layer.canvas,x,y);
}
export function drawBirds(g,t,width=432){
 const cycle=t%19;if(cycle<7||cycle>14)return;
 const progress=(cycle-7)/7;
 for(let i=0;i<3;i++){
  const x=Math.round(-25+progress*(width+80)-i*14),y=Math.round(29+i*7+Math.sin(t*.65+i)*3);
  const wing=Math.sin(t*13-i*.8)>0?-2:1;
  g.fillStyle='#8d6267';g.fillRect(x,y,2,1);g.fillRect(x-2,y+wing,2,1);g.fillRect(x+2,y+wing,2,1);
  g.fillRect(x-3,y+wing*2,1,1);g.fillRect(x+4,y+wing*2,1,1);
 }
}
