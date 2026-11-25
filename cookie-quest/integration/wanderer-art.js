import { cookieSprite } from '../cookie-art.js';
import { COOKIE_CATALOG } from '../cookie-catalog.js';

// Host-owned, transparent character art. Nothing is written into a module.
// Bodies end at y=52; the desktop layer supplies their walking legs.
const sprites = new Map();
const INK = '#282018';
const catalog = new Map(COOKIE_CATALOG.map(item => [item.id, item]));
let drawingPose = null;

function canvas() {
  const image = document.createElement('canvas');
  image.width = 48; image.height = 56;
  const g = image.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  return { image, g };
}

function shape(g, points, fill, outline = null, width = 1.4) {
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath(); g.fillStyle = fill; g.fill();
  if (outline) { g.strokeStyle = outline; g.lineWidth = width; g.stroke(); }
}

function oval(g, x, y, rx, ry, fill, outline = null, width = 1.3) {
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = fill; g.fill();
  if (outline) { g.strokeStyle = outline; g.lineWidth = width; g.stroke(); }
}

function line(g, points, color = INK, width = 2) {
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.strokeStyle = color; g.lineWidth = width; g.stroke();
}

function arms(g, y = 37, width = 17) {
  if (drawingPose) {
    const { reaction: pose, frame } = drawingPose;
    if (pose === 'sip' || pose === 'dunk') {
      // Keep the tiny hands beside the original silhouette while the host
      // leans the whole cookie towards the mug. No extra limb is overlaid.
      line(g, [[24 - width, y], [4, y + 3], [7, y + 7]], INK, 3.4);
      line(g, [[24 + width, y], [44, y + (frame === 2 ? 1 : -2)],
        [42, y - (frame === 2 ? 3 : 8)]], INK, 3.4);
      return;
    }
    const reaction = pose === 'music' || pose === 'burst' ? 'cheer'
      : pose === 'greet' ? (frame ? 'bow' : 'wave') : pose;
    const left = 24 - width, right = 24 + width;
    if (reaction === 'dash') {
      line(g, [[left, y], [3 + frame * 2, y - 4], [8, y - 10]], INK, 3.4);
      line(g, [[right, y], [45, y + 3], [42 - frame * 2, y + 7]], INK, 3.4);
    } else if (reaction === 'cheer' || reaction === 'struggle') {
      const lift = reaction === 'struggle' ? 4 + frame * 5 : frame * 3;
      line(g, [[left, y], [3, y - 5], [5 + frame * 2, y - 13 - lift]], INK, 3.4);
      line(g, [[right, y], [45, y - 5], [43 - frame * 2, y - 13 + lift]], INK, 3.4);
      oval(g, 5 + frame * 2, y - 13 - lift, 2, 2.2, INK);
      oval(g, 43 - frame * 2, y - 13 + lift, 2, 2.2, INK);
    } else if (reaction === 'wave' || reaction === 'kiss') {
      line(g, [[left, y], [3, y + 4]], INK, 3.4);
      line(g, [[right, y], [45, y - 5], [40 + frame * 4, y - 14]], INK, 3.4);
      oval(g, 40 + frame * 4, y - 14, 2.1, 2.6, INK);
    } else if (reaction === 'shy') {
      line(g, [[left, y], [3, y - 1], [8, y - 8 - frame]], INK, 3.4);
      line(g, [[right, y], [45, y - 1], [40, y - 8 + frame]], INK, 3.4);
    } else {
      // Arms tuck politely beside the body while the desktop layer bows it.
      line(g, [[left, y], [4, y + 4], [8, y + 9 - frame]], INK, 3.4);
      line(g, [[right, y], [44, y + 4], [40, y + 9 - frame]], INK, 3.4);
    }
    return;
  }
  line(g, [[24 - width, y], [4, y + 4]], INK, 3.4);
  line(g, [[24 + width, y], [44, y + 3]], INK, 3.4);
}

function reactionFace(g, { y, dark, spread }) {
  const { reaction: pose, frame } = drawingPose;
  const reaction = pose === 'music' || pose === 'burst' ? 'cheer'
    : pose === 'greet' ? (frame ? 'bow' : 'wave') : pose;
  const eyeColor = dark ? '#fff1d4' : INK;
  const eye = (x, closed = false) => {
    if (closed) {
      g.beginPath(); g.moveTo(x - 2.8, y + .5);
      g.quadraticCurveTo(x, y + (reaction === 'cheer' ? -3 : 2.6), x + 2.8, y + .5);
      g.strokeStyle = eyeColor; g.lineWidth = 1.9; g.stroke();
    } else {
      if (dark) oval(g, x, y, 3, 3.8, '#fff4dc', INK, .8);
      oval(g, x + (reaction === 'shy' ? frame - .5 : 0), y, 1.8, 2.6, '#211d18');
      oval(g, x - .5, y - .9, .6, .8, '#fff9e7');
    }
  };
  const bothClosed = reaction === 'bow' || reaction === 'cheer' || reaction === 'shy' && frame === 1;
  eye(24 - spread, bothClosed || reaction === 'struggle' && frame === 1);
  eye(24 + spread, bothClosed || reaction === 'kiss' || reaction === 'wave' && frame === 1);
  if (reaction === 'kiss') {
    // A small puckered mouth is legible without covering the original eyes.
    shape(g, [[22, y + 5], [24, y + 4], [27, y + 6], [24, y + 8], [22, y + 7], [24, y + 6]], '#d95869');
    oval(g, 14, y + 4, 3, 1.5, '#ed8e83');
    oval(g, 34, y + 4, 3, 1.5, '#ed8e83');
  } else if (reaction === 'cheer') {
    g.beginPath(); g.moveTo(18.5, y + 4.5); g.lineTo(29.5, y + 4.5);
    g.bezierCurveTo(29.5, y + 13.5, 18.5, y + 13.5, 18.5, y + 4.5);
    g.fillStyle = '#24211b'; g.fill();
    oval(g, 24, y + 9.5, 3.1, 1.6, '#f38c9a');
  } else if (reaction === 'struggle') {
    oval(g, 24, y + 7, 3.4, 3.9 - frame, '#31201b');
    oval(g, 24, y + 8.6, 1.8, 1, '#f48f86');
  } else {
    g.beginPath(); g.moveTo(20.5, y + 6);
    g.quadraticCurveTo(24, y + (reaction === 'bow' ? 8.5 : 10), 27.5, y + 6);
    g.strokeStyle = eyeColor; g.lineWidth = 1.8; g.stroke();
    const blush = reaction === 'shy' ? 3.4 : 2;
    oval(g, 14, y + 4, blush, 1.5, '#ed8e83');
    oval(g, 34, y + 4, blush, 1.5, '#ed8e83');
  }
}

function face(g, { y = 29, dark = false, open = false, spread = 6 } = {}) {
  if (drawingPose?.reaction === 'sip' || drawingPose?.reaction === 'dunk') {
    feedingFace(g, { y, dark, spread }); return;
  }
  if (drawingPose) { reactionFace(g, {y, dark, spread}); return; }
  for (const x of [24 - spread, 24 + spread]) {
    if (dark) oval(g, x, y, 3, 3.8, '#fff4dc', INK, .8);
    oval(g, x, y, 1.8, 2.6, '#211d18');
    oval(g, x - .45, y - .9, .55, .8, '#fff9e7');
  }
  if (open) {
    g.beginPath(); g.moveTo(18.5, y + 4.5); g.lineTo(29.5, y + 4.5);
    g.bezierCurveTo(29.5, y + 13.5, 18.5, y + 13.5, 18.5, y + 4.5);
    g.fillStyle = '#24211b'; g.fill();
    oval(g, 24, y + 9.5, 3.1, 1.6, '#f38c9a');
  } else {
    g.beginPath(); g.moveTo(20, y + 6);
    g.quadraticCurveTo(24, y + 11, 28, y + 6);
    g.strokeStyle = dark ? '#fff1d4' : INK; g.lineWidth = 1.9; g.stroke();
    oval(g, 14, y + 4, 2, 1, '#e8a080');
    oval(g, 34, y + 4, 2, 1, '#e8a080');
  }
}

function feedingFace(g, { y, dark, spread }) {
  const {reaction, frame} = drawingPose, cream = dark ? '#fff1d4' : INK;
  for (const x of [24 - spread, 24 + spread]) {
    if (frame > 0) {
      g.beginPath(); g.moveTo(x - 2.7, y);
      g.quadraticCurveTo(x, y - 2.6, x + 2.7, y);
      g.strokeStyle = cream; g.lineWidth = 2; g.stroke();
    } else {
      if (dark) oval(g, x, y, 3, 3.8, '#fff4dc', INK, .8);
      oval(g, x, y, 1.8, 2.6, '#211d18');
      oval(g, x - .5, y - .9, .6, .8, '#fff9e7');
    }
  }
  if (reaction === 'sip' && frame < 2) {
    oval(g, 24, y + 6, 2.3, 2.6 - frame * .4, '#fff1d4');
    oval(g, 24, y + 6, 1.2, 1.5, '#34241b');
  } else {
    g.beginPath(); g.moveTo(20, y + 5);
    g.quadraticCurveTo(24, y + 10, 28, y + 5);
    g.strokeStyle = cream; g.lineWidth = 2; g.stroke();
  }
  oval(g, 14, y + 4, frame > 0 ? 3 : 2, 1.5, '#e99580');
  oval(g, 34, y + 4, frame > 0 ? 3 : 2, 1.5, '#e99580');
}

function biscuit(g, id, box = [5, 12, 38, 40]) {
  const original = cookieSprite(catalog.get(id));
  // Each source has the same ten-pixel outer margin. Trim that margin so
  // all silhouettes meet the shared baseline used by the walking layer.
  g.drawImage(original, 8, 8, 144, 144, ...box);
}

function dubaiCharacter(kind) {
  const { image, g } = canvas();
  arms(g, 39, kind === 'marshmallow' ? 14 : 17);
  if (kind === 'pistachio') {
    const shell = g.createLinearGradient(8, 0, 40, 0);
    shell.addColorStop(0, '#bc995e'); shell.addColorStop(.38, '#f0d39a'); shell.addColorStop(1, '#bc985c');
    oval(g, 24, 33, 16, 19, shell, '#72582d');
    g.beginPath(); g.moveTo(22, 21);
    g.bezierCurveTo(13, 27, 17, 45, 24, 51);
    g.bezierCurveTo(31, 45, 35, 27, 26, 21);
    g.closePath(); g.fillStyle = '#97b92b'; g.fill();
    shape(g, [[16, 19], [32, 19], [31, 29], [24, 34], [17, 29]], '#ebcc90');
    // The pointed green cap and two green hanging panels distinguish it
    // from the cookie's rounded yellow cap in the original model sheet.
    shape(g, [[7, 15], [24, 4], [41, 15], [42, 29], [35, 22], [32, 16], [16, 16], [12, 24], [6, 29]], '#809d26', '#56671b');
    shape(g, [[8, 15], [24, 4], [24, 15]], '#a3be35');
    shape(g, [[24, 4], [41, 15], [24, 15]], '#91ac2a');
    line(g, [[7, 15], [41, 15]], '#25271b', 2.8);
    face(g, { y: 24.5, spread: 4.5, open: true });
  } else if (kind === 'cookie') {
    const brown = g.createRadialGradient(20, 27, 3, 25, 34, 23);
    brown.addColorStop(0, '#b97a4f'); brown.addColorStop(1, '#774326');
    oval(g, 24, 33, 19, 19, brown, '#4f2c1d');
    if (drawingPose?.reaction === 'burst') {
      const open = drawingPose.frame;
      // The joke is the chocolate coat springing open to show a bright
      // pistachio filling. The character remains a round, edible cookie.
      oval(g, 24, 36, 10 + open * 3, 15, '#98c43b', '#536b22', 1.1);
      oval(g, 24, 39, 7 + open * 2, 10, '#b2d44d');
      for (let n = 0; n < 6; n++) {
        const x = 18 + (n % 3) * 5, y = 31 + Math.floor(n / 3) * 12;
        line(g, [[x, y], [x - 1, y + 4]], '#e0c063', .9);
      }
      shape(g, [[15, 20], [10 - open * 3, 25], [4 - open, 36], [9 - open * 3, 47], [18, 51], [15, 43], [18, 36], [15, 30]], brown, '#4f2c1d', 1.3);
      shape(g, [[33, 20], [38 + open * 3, 25], [44 + open, 36], [39 + open * 3, 47], [30, 51], [33, 43], [30, 36], [33, 30]], brown, '#4f2c1d', 1.3);
      line(g, [[15, 25], [17, 31], [15, 37], [17, 44]], '#c19157', 1.3);
      line(g, [[33, 25], [31, 31], [33, 37], [31, 44]], '#c19157', 1.3);
    }
    g.beginPath(); g.moveTo(7, 14); g.bezierCurveTo(8, 3, 39, 3, 41, 14);
    g.closePath(); g.fillStyle = '#f6c64a'; g.fill();
    shape(g, [[7, 14], [41, 14], [43, 24], [34, 18], [24, 16], [14, 18], [5, 24]], '#e8b33d', '#a37c22', .8);
    shape(g, [[7, 14], [23, 14], [14, 18], [5, 24]], '#ffd56a');
    line(g, [[7, 14], [41, 14]], '#28251b', 2.8);
    face(g, { y: 29, open: true });
  } else {
    const cream = g.createLinearGradient(9, 0, 40, 0);
    cream.addColorStop(0, '#d6d1bc'); cream.addColorStop(.35, '#fff8e6'); cream.addColorStop(1, '#ded8c5');
    g.beginPath(); g.roundRect(10, 16, 28, 36, 5);
    g.fillStyle = cream; g.fill(); g.strokeStyle = '#817c67'; g.lineWidth = 1.4; g.stroke();
    shape(g, [[9, 15], [39, 15], [41, 25], [34, 21], [29, 17], [18, 18], [7, 25]], '#efe9d5', '#b1aa94', .7);
    shape(g, [[11, 13], [37, 13], [40, 16], [8, 16]], '#fff9e9');
    line(g, [[9, 16], [39, 16]], '#26271e', 2.8);
    face(g, { y: 29, spread: 5, open: true });
  }
  return { image, name: { pistachio: '开心果小舞者', cookie: '曲奇小舞者', marshmallow: '棉花糖小舞者' }[kind] };
}

function gingerbread() {
  const { image, g } = canvas();
  arms(g, 34, 12);
  const body = new Path2D();
  body.moveTo(17, 27); body.bezierCurveTo(10, 23, 11, 10, 18, 7);
  body.bezierCurveTo(29, 1, 40, 13, 33, 24); body.lineTo(30, 28);
  body.lineTo(37, 46); body.quadraticCurveTo(39, 52, 32, 52);
  body.lineTo(16, 52); body.quadraticCurveTo(9, 52, 11, 46);
  body.closePath();
  g.fillStyle = '#c98342'; g.fill(body);
  g.save(); g.clip(body); biscuit(g, '17_gingersnap', [0, 0, 48, 56]); g.restore();
  g.strokeStyle = '#683b22'; g.lineWidth = 1.6; g.stroke(body);
  face(g, { y: 18, spread: 5 });
  line(g, [[15, 42], [18, 44], [21, 42], [24, 44], [27, 42], [30, 44], [33, 42]], '#fff1d0', 1.7);
  for (const y of [33, 39]) oval(g, 24, y, 2, 2, '#cd5142', '#82382b', .6);
  shape(g, [[17, 29], [24, 31], [31, 29], [31, 33], [24, 31], [17, 33]], '#4d9c76');
  return { image, name: '圣诞姜饼人' };
}

function timtam() {
  const { image, g } = canvas(); arms(g, 35, 13);
  // The two opposite corners are bitten away for the Tim Tam Slam.
  // Build the actual silhouette, rather than painting over it, so the bites
  // remain transparent against every desktop window behind the character.
  const topBite = new Path2D();
  topBite.moveTo(28, 9);
  topBite.quadraticCurveTo(26.5, 13.5, 31, 14);
  topBite.quadraticCurveTo(29.5, 18, 34, 18);
  topBite.quadraticCurveTo(33, 21.5, 38, 22);
  const bottomBite = new Path2D();
  bottomBite.moveTo(21, 52);
  bottomBite.quadraticCurveTo(22, 47.5, 17, 47);
  bottomBite.quadraticCurveTo(19, 43, 14, 43);
  bottomBite.quadraticCurveTo(15, 39, 10, 40);
  const body = new Path2D();
  body.moveTo(15, 9); body.lineTo(28, 9);
  body.quadraticCurveTo(26.5, 13.5, 31, 14);
  body.quadraticCurveTo(29.5, 18, 34, 18);
  body.quadraticCurveTo(33, 21.5, 38, 22);
  body.lineTo(38, 47); body.quadraticCurveTo(38, 52, 33, 52);
  body.lineTo(21, 52);
  body.quadraticCurveTo(22, 47.5, 17, 47);
  body.quadraticCurveTo(19, 43, 14, 43);
  body.quadraticCurveTo(15, 39, 10, 40);
  body.lineTo(10, 14); body.quadraticCurveTo(10, 9, 15, 9); body.closePath();
  g.save(); g.clip(body);
  g.fillStyle = '#693d29'; g.fillRect(10, 9, 28, 43);
  const original = cookieSprite(catalog.get('01_oreo'));
  g.globalAlpha = .45; g.drawImage(original, 38, 32, 84, 96, 10, 9, 28, 43); g.globalAlpha = 1;
  for (let y = 15; y < 50; y += 8) line(g, [[12, y], [19, y - 2], [29, y + 1], [36, y - 1]], '#976343', 1.5);
  // A narrow pale wafer rim distinguishes the bites from dark decoration.
  g.strokeStyle = '#d8a96e'; g.lineWidth = 5;
  g.stroke(topBite); g.stroke(bottomBite);
  g.strokeStyle = '#f0c78e'; g.lineWidth = 2.4;
  g.stroke(topBite); g.stroke(bottomBite);
  g.restore(); g.strokeStyle = '#41251c'; g.lineWidth = 1.7; g.stroke(body);
  line(g, [[13, 14], [13, 35]], '#bd8a61', 1.1);
  if (drawingPose?.reaction === 'sip' && drawingPose.frame > 0) {
    // Milk wets the lower bitten wafer edge, without filling the transparent bite.
    g.save(); g.clip(body);
    g.strokeStyle = '#fff5da'; g.lineWidth = drawingPose.frame === 1 ? 2.4 : 1.7;
    g.stroke(bottomBite); g.restore();
  }
  face(g, { y: 28, dark: true, spread: 6 });
  return { image, name: 'Tim Tam 小方饼' };
}

function mosquitoCourier() {
  const { image, g } = canvas();
  // Six delicate legs, with the lower pair visibly holding the little cake.
  line(g, [[23, 15], [15, 19], [11, 24]], '#42362c', 1.2);
  line(g, [[25, 15], [33, 19], [37, 24]], '#42362c', 1.2);
  line(g, [[23, 18], [15, 24], [16, 32]], '#42362c', 1.4);
  line(g, [[25, 18], [33, 24], [32, 32]], '#42362c', 1.4);
  line(g, [[23, 13], [15, 12], [11, 16]], '#42362c', 1.1);
  line(g, [[25, 13], [33, 12], [37, 16]], '#42362c', 1.1);
  // Pale wings keep the insect readable above its darker biscuit payload.
  const flutter = drawingPose ? (drawingPose.frame ? .36 : -.2) : 0;
  g.save(); g.translate(18, 12); g.rotate(-.48 - flutter);
  oval(g, 0, 0, 8, 3.8, '#d4f4ec', '#548e8c', 1);
  line(g, [[-6, 0], [6, 0]], '#8fc3bd', .8); g.restore();
  g.save(); g.translate(30, 12); g.rotate(.48 + flutter);
  oval(g, 0, 0, 8, 3.8, '#d4f4ec', '#548e8c', 1);
  line(g, [[-6, 0], [6, 0]], '#8fc3bd', .8); g.restore();
  oval(g, 24, 16, 2.6, 7, '#625141', '#302c26', 1.1);
  for (const y of [15, 18, 21]) line(g, [[22, y], [26, y]], '#c5aa70', .8);
  oval(g, 24, 8, 3.6, 3.5, '#675a43', '#302c26', 1);
  for (const x of [22.3, 25.7]) oval(g, x, 7.5, 1.25, 1.7, '#fff1ba');
  line(g, [[24, 5], [25, 2], [28, 1]], '#3c342b', 1);
  line(g, [[22, 5], [20, 2]], '#3c342b', .9);
  biscuit(g, '10_kungu', [11, 28, 26, 26]);
  face(g, { y: 38, dark: true, spread: 4 });
  // The feet overlap the cake's top edge instead of ending in empty space.
  line(g, [[16, 31], [18, 33]], '#302c26', 1.8);
  line(g, [[32, 31], [30, 33]], '#302c26', 1.8);
  return { image, name: '小蚊子叼着的 Kungu 饼' };
}

function fortuneOracle() {
  const { image, g } = canvas();
  const purple = g.createLinearGradient(7, 0, 40, 0);
  purple.addColorStop(0, '#4d2b75'); purple.addColorStop(.45, '#9264b6'); purple.addColorStop(1, '#4b2b70');
  // A gold-edged hood surrounds the folded cookie, leaving its two lobes clear.
  g.beginPath(); g.moveTo(24, 3); g.bezierCurveTo(13, 9, 7, 22, 8, 38);
  g.lineTo(40, 38); g.bezierCurveTo(41, 22, 35, 9, 24, 3); g.closePath();
  g.fillStyle = purple; g.fill(); g.strokeStyle = '#d5ad48'; g.lineWidth = 1.7; g.stroke();
  oval(g, 24, 26, 12.8, 14, '#352343', '#eac767', 1.1);
  biscuit(g, '03_fortune', [9, 14, 30, 28]);
  face(g, { y: 25, spread: 4.8 });
  shape(g, [[13, 36], [35, 36], [42, 51], [6, 51]], purple, '#d5ad48', 1.5);
  line(g, [[22, 37], [20, 51]], '#edc76b', 1.5);
  line(g, [[26, 37], [28, 51]], '#edc76b', 1.5);
  line(g, [[12, 43], [36, 43]], '#dfbb58', 1.3);
  shape(g, [[24, 39], [27, 42], [24, 45], [21, 42]], '#f4d879', '#9d7431', .7);
  shape(g, [[11, 34], [3, 40], [7, 44], [16, 39]], '#69408e', '#ddbc65', 1.1);
  if (drawingPose?.reaction === 'kiss') {
    // Replace the leaflet arm, rather than adding a third arm on top of it.
    if (drawingPose.frame === 0) {
      shape(g, [[35, 35], [41, 33], [36, 28], [31, 33]], '#69408e', '#ddbc65', 1.1);
      oval(g, 33, 29, 2.5, 2, '#e8bd75');
    } else {
      shape(g, [[35, 35], [43, 27], [46, 31], [37, 39]], '#69408e', '#ddbc65', 1.1);
      oval(g, 44, 27, 2.1, 2.5, '#e8bd75');
    }
  } else {
    shape(g, [[36, 34], [45, 38], [42, 42], [32, 39]], '#69408e', '#ddbc65', 1.1);
    oval(g, 43, 37, 2, 1.7, '#e8bd75');
    g.save(); g.translate(42, 32); g.rotate(.14);
    g.fillStyle = '#fff7dd'; g.fillRect(-3, -2, 6, 10);
    g.strokeStyle = '#b3915f'; g.lineWidth = .7; g.strokeRect(-3, -2, 6, 10);
    line(g, [[-1.5, 1], [1.5, 1]], '#856295', .8);
    line(g, [[-1.5, 3], [1.5, 3]], '#856295', .8); g.restore();
  }
  // A small moon on the hood and star on the hem read even at desktop size.
  oval(g, 24, 10, 2.2, 2.7, '#f6d77e');
  oval(g, 25, 9.2, 1.8, 2.1, '#7b4e9d');
  line(g, [[34, 46], [34, 49]], '#f5d778', 1);
  line(g, [[32.5, 47.5], [35.5, 47.5]], '#f5d778', 1);
  return { image, name: '紫金占卜袍幸运饼干' };
}

function senbeiNinja() {
  const { image, g } = canvas();
  arms(g, 37);
  biscuit(g, '07_tako');
  const frame = drawingPose?.frame || 0;
  const moving = drawingPose?.reaction === 'dash';
  // Cloth leaves the outer biscuit and its red octopus print visible.
  // No weapons: this little ninja's special move is running away.
  shape(g, [[8, 16], [13, 11], [35, 11], [40, 16], [39, 23], [9, 23]], '#273748', '#17222e', 1.2);
  line(g, [[10, 18], [38, 18]], '#546b7b', 1.3);
  oval(g, 40, 19, 3, 3, '#34465b', '#17222e', 1);
  shape(g, [[41, 19], [47, moving ? 11 + frame * 3 : 23], [45, moving ? 17 + frame * 3 : 29], [39, 23]], '#26394e', '#17222e', .8);
  shape(g, [[40, 20], [47, moving ? 25 - frame * 4 : 35], [42, moving ? 26 - frame * 4 : 32], [38, 22]], '#476174', '#17222e', .8);
  // The small red motif is an octopus, retaining the senbei identity.
  oval(g, 24, 17, 2.5, 2, '#d96e57');
  for (const dx of [-3, 0, 3]) line(g, [[24 + dx * .55, 18], [24 + dx, 20]], '#d96e57', 1);
  if (moving) {
    for (const x of [18, 30]) {
      g.fillStyle = '#fff4ce'; g.fillRect(x - 3, 26, 6, 4);
      g.fillStyle = '#22252a'; g.fillRect(x - 1 + frame, 26, 2, 4);
    }
    line(g, [[15, 25], [21, 26.5]], '#273748', 1.8);
    line(g, [[27, 26.5], [33, 25]], '#273748', 1.8);
  } else {
    for (const x of [18, 30]) {
      oval(g, x, 28, 2, 2.7, '#202833');
      oval(g, x - .5, 27, .6, .9, '#fff8db');
    }
  }
  shape(g, [[10, 33], [18, 32], [24, 34], [30, 32], [38, 33], [36, 40], [12, 40]], '#2c3d51', '#17222e', 1);
  line(g, [[15, 35], [23, 37], [33, 35]], '#526a7d', .9);
  line(g, [[11, 45], [37, 45]], '#26394e', 3.4);
  shape(g, [[34, 43], [39, 43], [40, 48], [36, 47]], '#627e8a', '#243442', .8);
  return { image, name: '章鱼仙贝小忍者' };
}

function khapseRobe() {
  const { image, g } = canvas();
  const greeting = drawingPose?.reaction === 'greet', frame = drawingPose?.frame || 0;
  // A plain wrap robe, broad cuffs and a colored woven belt give a gentle
  // costume cue; the food's knotted silhouette stays clearly visible above it.
  const robe = '#783e4c', cuff = '#d6ac69', outline = '#442d37';
  shape(g, [[15, 30], [33, 30], [36, 51], [12, 51]], robe, outline, 1.4);
  if (greeting && frame === 0) {
    shape(g, [[32, 31], [36, 35], [43, 25], [39, 22]], robe, outline, 1.2);
    line(g, [[39, 23], [43, 26]], cuff, 2.2);
    oval(g, 42, 21, 2.8, 3.2, '#e4b65b', '#76502c', .8);
  } else {
    shape(g, [[32, 31], [42, 37], [39, 43], [31, 38]], robe, outline, 1.2);
    line(g, [[38, 39], [41, 36]], cuff, 2.2);
    oval(g, 39, 42, 2.6, 2.2, '#e4b65b', '#76502c', .8);
  }
  shape(g, [[16, 31], [7, 37], [10, 43], [17, 38]], robe, outline, 1.2);
  line(g, [[8, 36], [11, 39]], cuff, 2.2);
  oval(g, 9, 42, 2.6, 2.2, '#e4b65b', '#76502c', .8);
  biscuit(g, '28_khapse', [7, 5, 34, 33]);
  face(g, {y:22.5, spread:5});
  // Crossing lapel and two simple stripes are intentionally non-symbolic.
  line(g, [[17, 32], [28, 40], [27, 50]], '#e2be82', 1.8);
  line(g, [[14, 41], [34, 41]], '#497c7a', 3.3);
  line(g, [[14, 40], [34, 40]], '#dfb55d', 1);
  line(g, [[14, 43], [34, 43]], '#be6e65', 1.4);
  line(g, [[18, 48], [31, 48]], '#b76e77', 1.1);
  return { image, name: '穿长袍的卡塞小伙伴' };
}

const identities = {
  oreo: ['01_oreo', '奥利奥小伙伴', true],
  'fortune-cookie': ['03_fortune', '幸运饼干小伙伴', false],
  'thai-flower': ['05_pizzelle', '花形酥饼小伙伴', false],
  khapse: ['28_khapse', '卡塞小伙伴', false],
  'octopus-senbei': ['07_tako', '章鱼仙贝小伙伴', false],
  kungu: ['10_kungu', 'Kungu 小伙伴', true],
  'cookie-band': ['02_chocolate_chunk', '曲奇小乐手', false]
};

function cookieCharacter(id) {
  const [cookieId, name, dark] = identities[id];
  const { image, g } = canvas(); arms(g, 36, id === 'khapse' ? 10 : 17);
  biscuit(g, cookieId);
  if (id === 'oreo' && drawingPose?.reaction === 'dunk' && drawingPose.frame > 0) {
    // A bright, irregular milk edge sits on the cookie itself. Intersect the
    // existing alpha and circular body, so no opaque rectangle spills outside.
    g.save();
    g.beginPath(); g.ellipse(24, 32, 18.5, 20, 0, 0, Math.PI * 2); g.clip();
    g.globalCompositeOperation = 'source-atop';
    shape(g, [[5, 44], [10, 42], [16, 45], [21, 43], [27, 45], [34, 42],
      [43, 44], [43, 54], [5, 54]], '#fff5df');
    line(g, [[9, 47], [16, 49], [24, 49], [32, 47], [38, 47]], '#d5e8e8', 1.2);
    g.restore();
  }
  face(g, { y: id === 'fortune-cookie' ? 26 : 29, dark });
  if (id === 'cookie-band') {
    line(g, [[8, 27], [8, 23], [12, 15], [20, 11], [28, 11], [36, 15], [40, 23], [40, 27]], '#3b4962', 2.8);
    for (const x of [7, 38]) {
      g.fillStyle = '#697fa5'; g.fillRect(x, 24, 4, 8);
      g.strokeStyle = '#2c3548'; g.lineWidth = 1; g.strokeRect(x, 24, 4, 8);
    }
    line(g, [[37, 11], [37, 4], [42, 2], [42, 9]], '#735a93', 1.7);
    oval(g, 35.8, 11, 2.2, 1.5, '#735a93');
    oval(g, 40.8, 9, 2.2, 1.5, '#735a93');
  }
  return { image, name };
}

const reactions = {
  timtam: 'bow', gingerbread: 'cheer', 'fortune-cookie': 'kiss',
  kungu: 'struggle', oreo: 'wave', 'thai-flower': 'shy', khapse: 'greet',
  'octopus-senbei': 'dash', 'cookie-band': 'music'
};

function withReaction(make, reaction) {
  const sprite = make();
  sprite.reaction = reaction;
  sprite.reactionFrames = [];
  try {
    for (let frame = 0; frame < 2; frame++) {
      drawingPose = {reaction, frame};
      sprite.reactionFrames.push(make().image);
    }
  } finally { drawingPose = null; }
  return sprite;
}

function withFeeding(sprite, make, feedKind) {
  sprite.feedKind = feedKind;
  sprite.feedingFrames = [];
  try {
    for (let frame = 0; frame < 3; frame++) {
      drawingPose = {reaction:feedKind, frame};
      sprite.feedingFrames.push(make().image);
    }
  } finally { drawingPose = null; }
  return sprite;
}

/** Transparent cast plus two redraws for its grab reaction (Dubai returns 3). */
export async function makeWandererSprites(projectId) {
  const id = ({ 'desert-disco': 'dubai-disco', 'cookie-orchestra': 'cookie-band' })[projectId] || projectId;
  if (!sprites.has(id)) {
    const makers = id === 'dubai-disco'
      ? ['pistachio', 'cookie', 'marshmallow'].map(kind => () => dubaiCharacter(kind))
      : reactions[id] ? [
        id === 'gingerbread' ? gingerbread
        : id === 'timtam' ? timtam
        : id === 'kungu' ? mosquitoCourier
        : id === 'fortune-cookie' ? fortuneOracle
        : id === 'octopus-senbei' ? senbeiNinja
        : id === 'khapse' ? khapseRobe
        : () => cookieCharacter(id)] : [];
    const cast = makers.map((make, i) => {
      const sprite = withReaction(make, id === 'dubai-disco' ? ['cheer', 'burst', 'shy'][i] : reactions[id]);
      const feedKind = ['oreo', 'gingerbread'].includes(id) ? 'dunk'
        : id === 'timtam' || (id === 'dubai-disco' && i === 2) ? 'sip' : null;
      return feedKind ? withFeeding(sprite, make, feedKind) : sprite;
    });
    sprites.set(id, cast);
  }
  return sprites.get(id);
}
