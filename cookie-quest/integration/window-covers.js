import { mountSnowGlobe } from './snow-globe.js';
/* Host-only invitations. These covers never start, complete or alter a story. */
const COVER_STYLES = '/accept-all-cookies/cookie-quest/styles/window-covers.css';
const FORTUNE_PHOTO = '/accept-all-cookies/cookie%20%E5%AE%9E%E9%AA%8C/45%E7%A7%8D%E6%9B%B2%E5%A5%87_%E7%B4%A0%E6%9D%90%E4%B8%8E%E4%BF%A1%E6%81%AF_v01/%E5%9B%BE%E7%89%87/03_fortune.webp';
let fortuneArtwork;

function originalFortuneArtwork(document) {
  if (fortuneArtwork) return fortuneArtwork;
  // Same atlas section and colour key as the delivered Fortune Cookie module.
  fortuneArtwork = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const scratch = document.createElement('canvas');
        scratch.width = 760; scratch.height = 504;
        const ctx = scratch.getContext('2d', {willReadFrequently:true});
        ctx.drawImage(image, 772, 4, 760, 504, 0, 0, 760, 504);
        const pixels = ctx.getImageData(0, 0, 760, 504), data = pixels.data;
        let minX = 760, minY = 504, maxX = 0, maxY = 0;
        for (let y = 0; y < 504; y++) for (let x = 0; x < 760; x++) {
          const i = (y * 760 + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
          if (b > r * .63 && b > g * 1.6 && r > g * 1.6) data[i + 3] = 0;
          else { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
        }
        ctx.putImageData(pixels, 0, 0);
        const crop = document.createElement('canvas');
        crop.width = maxX - minX + 1; crop.height = maxY - minY + 1;
        crop.getContext('2d').drawImage(scratch, minX, minY, crop.width, crop.height, 0, 0, crop.width, crop.height);
        resolve(crop);
      } catch (error) { reject(error); }
    };
    image.onerror = reject;
    image.src = '/accept-all-cookies/modules/fortune-cookie/assets/fortune-atlas.webp';
  });
  return fortuneArtwork;
}

function installStyles(document) {
  if (document.querySelector('link[data-cookie-window-covers]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = COVER_STYLES;
  link.dataset.cookieWindowCovers = '';
  document.head.append(link);
}

function letters() {
  return [...'kungukungungu'].map((letter, i) =>
    `<i style="--x:${5 + (i * 29 % 89)}%;--delay:${-(i * .63).toFixed(2)}s;--duration:${(4.4 + (i % 4) * .7).toFixed(1)}s;--drift:${i % 2 ? 9 : -7}px">${letter}</i>`
  ).join('');
}

const covers = {
  'thai-flower': {
    label: '进入花形酥饼小摊，画一块自己的酥饼',
    content: () => `<span class="v2-thai-mast">DRAW & FRY <small>ขนมดอกจอก</small></span><span class="v2-thai-main"><span class="v2-thai-photo" aria-hidden="true"></span><span class="v2-thai-copy"><strong>你画什么，<br>我们炸什么。</strong><span>画一笔 →</span></span><i aria-hidden="true">✿</i></span>`
  },
  'octopus-senbei': {
    label: '进入海边仙贝工场',
    content: () => `<span class="paper98-browser-menu" aria-hidden="true">File　Edit　View　Go　Favorites　Help</span><span class="paper98-browser-tools" aria-hidden="true"><i>←</i> Back　 <i>→</i>　 <i>×</i> Stop　 <i>↻</i> Refresh　 <i>⌂</i> Home</span><span class="v2-ocean-address">Address: <b>http://www.senbei-umi.co.jp/</b></span><span class="v2-ocean-head"><strong>海辺のせんべい工場</strong><small>たこのせんべいを、海のそばから。</small></span><span class="v2-ocean-nav">ホーム　｜　工場のようす　｜　せんべいの話</span><span class="v2-ocean-main"><span class="v2-ocean-film"><img class="v2-harbor" src="/accept-all-cookies/modules/octopus-senbei/assets/harbor.jpg" alt="海边工场"><img class="v2-octopus" src="/accept-all-cookies/modules/octopus-senbei/assets/octopus-sprite.webp" alt="章鱼"><span class="v2-film-controls">▶　▰ ━━━━━━━━━　00:12</span></span><span class="v2-ocean-side"><b>海のたこで<br>つくる、<br>香ばしい<br>せんべい。</b><img src="/accept-all-cookies/modules/octopus-senbei/assets/senbei-real.webp" alt="章鱼仙贝"><span>工場へ →</span></span></span>`
  },

  kungu: {
    label: '进入吃掉这些字母，拿起平底锅',
    content: () => `
      <span class="cq-cover-kungu-heading"><strong>吃掉这些字母</strong><small>EAT THESE LETTERS</small></span>
      <span class="cq-cover-kungu-links">湖边厨房 <b>·</b> 字母食谱 <b>·</b> 关于 KUNGU</span>
      <span class="cq-cover-kungu-lake">
        <img class="cq-cover-lake-image" src="/accept-all-cookies/modules/kungu/assets/lake-scan.webp" alt="湖面与远山" draggable="false">
        <span class="cq-cover-water" aria-hidden="true"></span>
        <span class="cq-cover-letters" aria-hidden="true">${letters()}</span>
        <img class="cq-cover-pan" src="/accept-all-cookies/modules/kungu/assets/pan.svg" alt="一口等待字母落下的平底锅" draggable="false">
      </span>
      <span class="cq-cover-kungu-enter">拿起平底锅 <b aria-hidden="true">▸</b></span>`
  },
  gingerbread: {
    label: '播放姜饼人的圣诞影片',
    content: () => `
      <span class="cq-cover-christmas-head"><small>A VERY SWEET</small><strong>CHRISTMAS</strong><span class="cq-cover-lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></span>
      <span class="cq-cover-christmas-nav">★ Home <b>·</b> Film <b>·</b> Gifts ★</span>
      <span class="cq-cover-christmas-body">
        <span class="cq-cover-christmas-photo"><img src="/accept-all-cookies/modules/gingerbread/assets/poster.jpg" alt="姜饼一家围坐在圣诞礼物旁" draggable="false"><span class="cq-cover-film-enter">▶ PLAY FILM</span></span>
        <span class="cq-cover-christmas-copy"><span class="cq-cover-holly" aria-hidden="true">✦</span><strong>把甜蜜<br>送回家。</strong><em>A little gift.<br>A lot of love.</em></span>
      </span>
      <span class="cq-cover-christmas-foot">THE GINGERBREAD FAMILY <span aria-hidden="true">✦</span></span>`
  },
  'fortune-cookie': {
    label: '打开幸运饼干，看看你的签语',
    content: () => `
      <span class="cq-cover-fortune-title">FORTUNE COOKIE<small>幸 运 饼 干</small></span>
      <span class="cq-cover-fortune-scene">
        <span class="cq-cover-fortune-orbit" aria-hidden="true"></span>
        <img class="cq-cover-fortune-cookie" src="${FORTUNE_PHOTO}" alt="金黄的幸运饼干" draggable="false">
        <span class="cq-cover-fortune-stars" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>·</i></span>
      </span>
      <span class="cq-cover-fortune-enter">打开饼干 <b aria-hidden="true">▸</b></span>`
  }
};

/** Mount in a window's content container, never the complete window/chrome. */
export function mountWindowCover({id, container, onEnter, available = true}) {
  const spec = covers[id];
  if (!spec || !container?.ownerDocument) return null;
  const document = container.ownerDocument;
  installStyles(document);
  const element = document.createElement('div');
  element.className = `cq-window-cover cq-window-cover-${id}`;
  element.dataset.coverProject = id;
  element.setAttribute('aria-label', spec.label);
  // Reserve only this positioning property, and restore it when this cover leaves.
  const oldPosition = container.style.position;
  const ownsPosition = getComputedStyle(container).position === 'static';
  if (ownsPosition) container.style.position = 'relative';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cq-cover-open';
  button.setAttribute('aria-label', available ? spec.label : '幸运饼干正在接入');
  button.innerHTML = spec.content();
  if (!available) {
    element.classList.add('cq-cover-unavailable');
    button.disabled = true;
    const status = button.querySelector('[class$="-enter"]');
    if (status) status.textContent = '即将开启';
  }
  element.append(button);
  container.append(element);
  element.addEventListener('error',event=>{const img=event.target;if(!(img instanceof HTMLImageElement)||!img.src)return;const attempt=Number(img.dataset.cqRetry||0);if(attempt>=2)return;img.dataset.cqRetry=String(attempt+1);setTimeout(()=>{if(!img.isConnected)return;const url=new URL(img.src);url.searchParams.set('cq-retry',String(attempt+1));img.src=url.href;},1500*(attempt+1));},true);
  const snow = id === 'gingerbread' ? mountSnowGlobe(button.querySelector('.cq-cover-christmas-photo')) : null;
  let dead = false, entering = false;
  if (id === 'fortune-cookie') originalFortuneArtwork(document).then(art => {
    if (dead) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'cq-cover-fortune-cookie';
    canvas.width = art.width; canvas.height = art.height;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '金黄的幸运饼干');
    canvas.getContext('2d').drawImage(art, 0, 0);
    button.querySelector('.cq-cover-fortune-cookie')?.replaceWith(canvas);
  }).catch(() => { /* Retain the existing transparent library photograph. */ });
  const enter = event => {
    if (dead || entering || !available) return;
    event.stopPropagation();
    entering = true;
    try { onEnter?.(); }
    finally { entering = false; }
  };
  button.addEventListener('click', enter);
  return {
    element,
    sync(state) { snow?.sync(state); },
    destroy() {
      if (dead) return;
      dead = true;
      snow?.destroy();
      button.removeEventListener('click', enter);
      element.remove();
      if (ownsPosition && container.style.position === 'relative') container.style.position = oldPosition;
    }
  };
}
