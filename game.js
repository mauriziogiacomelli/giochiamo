'use strict';
// =====================================================================
//  GIOCHIAMO! — gioco touch in stile retrò
//  Per personalizzare: scrivi qui il nome della bambina (es. 'Sofia').
// =====================================================================
const NOME = '';

const W = 1024, H = 768;
const stage = document.getElementById('stage');

// ---------- adattamento allo schermo ----------
function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener('resize', fit); fit();
addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

// ---------- temi ----------
const THEMES = [
  { id: 'fattoria', name: 'Fattoria', frame: '#ff2a1a', bg: '#9be36b',
    items: ['🐄', '🐖', '🐔', '🐑', '🐴', '🐱', '🐶', '🦆', '🐰', '🐐'] },
  { id: 'veicoli', name: 'Veicoli', frame: '#1a5cff', bg: '#8fd0ff',
    items: ['🚗', '🚌', '🚒', '🚑', '🚜', '✈️', '🚁', '🚢', '🚂', '🚲'] },
  { id: 'frutta', name: 'Frutta', frame: '#22e0e0', bg: '#ffb3d1',
    items: ['🍎', '🍌', '🍇', '🍐', '🍊', '🍓', '🍒', '🍉', '🍍', '🍋'] },
  { id: 'spazio', name: 'Spazio', frame: '#ffe81a', bg: '#d6a0ea',
    items: ['🚀', '🛸', '🪐', '🌙', '👩‍🚀', '🛰️', '⭐', '☄️', '🌍', '👽'] },
  { id: 'zoo', name: 'Zoo', frame: '#22cc33', bg: '#ffd966',
    items: ['🦒', '🐘', '🦁', '🐊', '🐵', '🦓', '🐻', '🐧', '🦛', '🐯'] },
];

const PALETTE = ['#000000', '#ffffff', '#ff2a1a', '#ff8c00', '#ffe81a', '#22cc33', '#00e0e0', '#1a5cff',
  '#0a1a99', '#a020f0', '#ff66cc', '#8b4513', '#ffcc99', '#888888', '#99ff88', '#ff9999'];

// ---------- utilità ----------
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function seeded(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

function el(tag, css, parent, html) {
  const e = document.createElement(tag);
  if (css) Object.assign(e.style, css);
  if (html !== undefined) e.innerHTML = html;
  (parent || stage).appendChild(e);
  return e;
}
function tap(e, fn) { e.addEventListener('pointerdown', ev => { ev.preventDefault(); fn(ev); }); return e; }
function px(n) { return n + 'px'; }

// ---------- suoni 8-bit ----------
let AC = null;
function snd(notes, type = 'square', vol = 0.07) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    let t = AC.currentTime;
    for (const [f, d] of notes) {
      if (f) {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d);
      }
      t += d;
    }
  } catch (e) { /* niente audio: pazienza */ }
}
const SFX = {
  tap: () => snd([[660, .05]]),
  flip: () => snd([[440, .04], [660, .05]]),
  ok: () => snd([[523, .08], [659, .08], [784, .14]]),
  no: () => snd([[220, .12], [180, .16]], 'triangle', .12),
  fill: () => snd([[300, .03], [500, .03], [800, .05]], 'triangle', .1),
  win: () => snd([[523, .12], [659, .12], [784, .12], [1047, .25], [0, .06], [784, .1], [1047, .4]]),
};

// ---------- sprite pixel-art dagli emoji ----------
const spriteCache = new Map();
function sprite(emoji, res = 32) {
  const key = emoji + res;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = res;
  const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${Math.round(res * 0.78)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  x.fillText(emoji, res / 2, res / 2 + res * 0.06);
  const im = x.getImageData(0, 0, res, res), d = im.data;
  const solid = new Uint8Array(res * res);
  for (let i = 0; i < res * res; i++) {
    const a = d[i * 4 + 3];
    if (a > 110) {
      solid[i] = 1; d[i * 4 + 3] = 255;
      for (let k = 0; k < 3; k++) d[i * 4 + k] = Math.round(d[i * 4 + k] / 51) * 51; // posterizza (6 livelli)
    } else d[i * 4 + 3] = 0;
  }
  // contorno nero come nei vecchi giochi
  for (let y = 0; y < res; y++) for (let xx = 0; xx < res; xx++) {
    const i = y * res + xx;
    if (solid[i]) continue;
    if ((xx > 0 && solid[i - 1]) || (xx < res - 1 && solid[i + 1]) || (y > 0 && solid[i - res]) || (y < res - 1 && solid[i + res])) {
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 10; d[i * 4 + 3] = 255;
    }
  }
  x.putImageData(im, 0, 0);
  spriteCache.set(key, c);
  return c;
}
function spriteImg(emoji, size, parent, css) {
  const c = sprite(emoji, 32);
  const img = el('img', Object.assign({ width: px(size), height: px(size) }, css || {}), parent);
  img.className = 'px'; img.src = c.toDataURL(); img.draggable = false;
  return img;
}
function pxCanvas(res_w, res_h, scale, css, parent) {
  const c = el('canvas', Object.assign({ position: 'absolute', width: px(res_w * scale), height: px(res_h * scale) }, css || {}), parent);
  c.width = res_w; c.height = res_h;
  return c;
}
// coordinate pixel interne di un canvas dal tocco (tiene conto dello scaling)
function canvasPos(c, ev) {
  const r = c.getBoundingClientRect();
  return [Math.floor((ev.clientX - r.left) / r.width * c.width), Math.floor((ev.clientY - r.top) / r.height * c.height)];
}

// ---------- sfondi dei temi (disegnati a pixel) ----------
function drawScene(x, w, h, theme, seed = 7) {
  const r = seeded(seed);
  const R = (c, a, b, cw, ch) => { x.fillStyle = c; x.fillRect(a, b, cw, ch); };
  switch (theme.id) {
    case 'fattoria':
      R('#3a8cff', 0, 0, w, h); R('#ffe81a', w - 18, 5, 12, 12);
      for (let i = 0; i < 2; i++) { const cx = 8 + r() * (w - 40), cy = 6 + r() * 12; R('#fff', cx, cy, 22, 6); R('#fff', cx + 5, cy - 4, 12, 4); }
      R('#33cc33', 0, h * 0.5, w, h * 0.5);
      R('#ff6ad5', 0, h * 0.5, w, 4);
      for (let i = 0; i < w; i += 6) R('#1f9a1f', i, h * 0.5 + 8 + (i * 7 % 30), 2, 3);
      break;
    case 'veicoli':
      R('#c9f3ff', 0, 0, w, h); R('#ffe81a', 6, 6, 10, 10);
      R('#55dd44', 0, h * 0.45, w, h * 0.35);
      for (let i = 0; i < w; i += 4) R('#55dd44', i, h * 0.45 - 2 - Math.round(2 * Math.sin(i / 7)), 4, 4);
      R('#777', 0, h * 0.8, w, h * 0.2);
      for (let i = 2; i < w; i += 14) R('#fff', i, h * 0.89, 7, 2);
      break;
    case 'frutta':
      R('#1a5cff', 0, 0, w, h);
      for (let yy = Math.floor(h * 0.6); yy < h; yy += 8) for (let xx = 0; xx < w; xx += 8)
        R(((xx + yy) / 8) % 2 ? '#fff' : '#ff2a1a', xx, yy, 8, 8);
      break;
    case 'spazio':
      R('#b0309a', 0, 0, w, h);
      for (let i = 0; i < w * h / 90; i++) R('#fff', Math.floor(r() * w), Math.floor(r() * h), 1, 1);
      break;
    case 'zoo':
      R('#ff9ad8', 0, 0, w, h);
      R('#ffcc33', 0, h * 0.62, w, h * 0.38);
      for (let i = 0; i < w; i += 5) R('#cc8800', i, h * 0.62 + 4 + (i * 13 % 25), 1, 4);
      break;
  }
}

// ---------- gestione schermate ----------
let cleanup = null;
function show(fn, ...args) {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  stage.innerHTML = '';
  fn(...args);
}
function backBtn(onTap, label = 'Indietro') {
  return tap(el('div', { left: '12px', top: '696px', width: '230px', height: '60px' }, stage, '◀ ' + label), () => { SFX.tap(); onTap(); })
    .classList.add('btn') || null;
}
function bg(color) { el('div', { position: 'absolute', inset: '0', background: color }); }

function party(text, again, back) {
  SFX.win();
  const p = el('div', null, stage); p.id = 'party';
  el('div', null, p, `<span class="title yellow" style="font-size:96px">${text}</span>`).className = 'big';
  const stars = ['⭐', '🌟', '💖', '🎈', '✨'];
  for (let i = 0; i < 40; i++) {
    const s = spriteImg(stars[i % stars.length], 48, p, {});
    s.className = 'px fall';
    s.style.left = px(rnd(W - 40)); s.style.animationDuration = (2 + Math.random() * 2.5) + 's';
    s.style.animationDelay = (Math.random() * 2) + 's';
  }
  const b1 = tap(el('div', { left: '262px', top: '470px', width: '230px', height: '80px' }, p, '↻ Ancora!'), () => { SFX.tap(); again(); });
  b1.className = 'btn green';
  const b2 = tap(el('div', { left: '532px', top: '470px', width: '230px', height: '80px' }, p, '◀ Indietro'), () => { SFX.tap(); back(); });
  b2.className = 'btn';
}

// =====================================================================
//  MENU PRINCIPALE: i 5 temi
// =====================================================================
function homeScreen() {
  bg('linear-gradient(#2fd38b,#18b070)');
  const title = el('div', { position: 'absolute', left: '0', right: '0', top: '26px', textAlign: 'center' }, stage,
    `<span class="title yellow" style="font-size:56px">${NOME ? 'Il gioco di ' + NOME : 'Giochiamo!'}</span>`);
  const pos = [[90, 140], [392, 120], [694, 140], [240, 430], [544, 430]];
  THEMES.forEach((t, i) => {
    const tile = el('div', { left: px(pos[i][0]), top: px(pos[i][1]), width: '240px', height: '240px', borderColor: t.frame }, stage);
    tile.className = 'tile';
    const c = pxCanvas(80, 80, 2.75, { left: '0', top: '0' }, tile);
    const x = c.getContext('2d');
    drawScene(x, 80, 80, t, i + 3);
    const spots = [[6, 22], [44, 16], [10, 50], [46, 48]];
    spots.forEach(([sx, sy], k) => x.drawImage(sprite(t.items[k * 2], 32), sx, sy, 32, 32));
    el('div', { position: 'absolute', left: '0', right: '0', bottom: '-56px', textAlign: 'center' }, tile,
      `<span class="title" style="font-size:30px">${t.name}</span>`);
    tap(tile, () => { SFX.flip(); show(themeScreen, t); });
  });
  // pulsante schermo intero
  const fs = tap(el('div', { left: '904px', top: '700px', width: '100px', height: '54px', fontSize: '26px' }, stage, '⛶'), () => {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {});
    else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  });
  fs.className = 'btn blue';
}

// =====================================================================
//  MENU DEL TEMA: le 5 attività
// =====================================================================
function themeScreen(t) {
  bg('#ffec3d');
  el('div', { position: 'absolute', left: '0', right: '0', top: '16px', textAlign: 'center' }, stage,
    `<span class="title" style="font-size:46px">${t.name}</span>`);
  const acts = [
    { name: 'Memory', icon: null, x: 80, y: 130, fn: memoryScreen },
    { name: 'Colorare disegni', icon: '🖍️', x: 392, y: 110, fn: colorScreen },
    { name: 'Dipingere con le dita', icon: '🎨', x: 704, y: 130, fn: paintScreen },
    { name: 'Trova le differenze', icon: '🔍', x: 236, y: 420, fn: diffScreen },
    { name: 'Gioco dei vestiti', icon: '👗', x: 548, y: 420, fn: dressScreen },
  ];
  acts.forEach(a => {
    const tile = el('div', { left: px(a.x), top: px(a.y), width: '240px', height: '220px', borderColor: '#1fb890',
      background: '#fff', boxShadow: 'inset 0 0 0 6px #ff2a1a, 6px 6px 0 rgba(0,0,0,.35)' }, stage);
    tile.className = 'tile';
    if (a.icon) {
      spriteImg(a.icon, 150, tile, { position: 'absolute', left: '35px', top: '25px' });
    } else {
      // mini griglia memory
      const cols = ['#ffe81a', '#c9e8ff', '#99ff88', '#ff9ad8', '#00e0e0', '#ffcc99'];
      for (let i = 0; i < 6; i++) {
        const cell = el('div', { position: 'absolute', left: px(14 + (i % 3) * 68), top: px(18 + Math.floor(i / 3) * 86), width: '62px', height: '78px',
          background: i === 2 || i === 4 ? 'repeating-linear-gradient(45deg,#fff 0 6px,#ffcc22 6px 12px)' : cols[i], border: '2px solid #333', boxSizing: 'border-box' }, tile);
        if (!(i === 2 || i === 4)) spriteImg(t.items[[0, 1, 0, 1, 1, 0][i] + (i > 2 ? 2 : 0)], 54, cell, { margin: '10px 2px' });
      }
    }
    el('div', { position: 'absolute', left: '-30px', right: '-30px', bottom: '-50px', textAlign: 'center' }, tile,
      `<span class="title" style="font-size:24px">${a.name}</span>`);
    tap(tile, () => { SFX.flip(); show(a.fn, t); });
  });
  backBtn(() => show(homeScreen));
}

// =====================================================================
//  MEMORY
// =====================================================================
function memoryScreen(t, nCards) {
  nCards = nCards || +(store('memoryN') || 12);
  bg(t.bg);
  const layouts = { 6: [3, 2], 12: [4, 3], 20: [5, 4] };
  const [cols, rows] = layouts[nCards];
  const gap = 20, areaW = 980, areaH = 660;
  const size = Math.floor(Math.min((areaW - gap * (cols - 1)) / cols, (areaH - gap * (rows - 1)) / rows));
  const ox = (W - (cols * size + (cols - 1) * gap)) / 2, oy = 16 + (areaH - (rows * size + (rows - 1) * gap)) / 2;
  const colors = ['#ffe81a', '#c9e8ff', '#99ff88', '#ff9ad8', '#00e0e0', '#ffcc99', '#1a5cff', '#ff8c00', '#d6a0ea', '#ffffff'];
  const picks = shuffle(t.items.map((e, i) => i)).slice(0, nCards / 2);
  const deck = shuffle(picks.concat(picks));
  let open = [], busy = false, found = 0;
  deck.forEach((k, i) => {
    const card = el('div', { left: px(ox + (i % cols) * (size + gap)), top: px(oy + Math.floor(i / cols) * (size + gap)), width: px(size), height: px(size) }, stage);
    card.className = 'card';
    const inner = el('div', null, card); inner.className = 'in';
    const back = el('div', { fontSize: px(size * 0.45) }, inner, '?'); back.className = 'back';
    const face = el('div', { background: colors[k] }, inner); face.className = 'face';
    spriteImg(t.items[k], Math.floor(size * 0.8), face);
    card.k = k;
    tap(card, () => {
      if (busy || card.classList.contains('open')) return;
      SFX.flip();
      card.classList.add('open'); open.push(card);
      if (open.length < 2) return;
      const [a, b] = open; open = [];
      if (a.k === b.k) {
        a.classList.add('done'); b.classList.add('done');
        setTimeout(SFX.ok, 200);
        if (++found === nCards / 2) setTimeout(() => party('BRAVISSIMA!', () => show(memoryScreen, t, nCards), () => show(themeScreen, t)), 900);
      } else {
        busy = true;
        setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); busy = false; }, 1100);
      }
    });
  });
  backBtn(() => show(themeScreen, t));
  // scelta difficoltà
  [6, 12, 20].forEach((n, i) => {
    const b = tap(el('div', { left: px(724 + i * 100), top: '700px', width: '90px', height: '56px', fontSize: '24px' }, stage, n), () => {
      SFX.tap(); store('memoryN', n); show(memoryScreen, t, n);
    });
    b.className = 'btn blue' + (n === nCards ? ' on' : '');
  });
}

// =====================================================================
//  COLORARE DISEGNI (riempimento a secchiello su pixel-art)
// =====================================================================
function lineArt(emoji, res) {
  const c = document.createElement('canvas'); c.width = c.height = res;
  const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${Math.round(res * 0.8)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  x.fillText(emoji, res / 2, res / 2 + res * 0.06);
  const src = x.getImageData(0, 0, res, res).data;
  const out = x.createImageData(res, res), d = out.data;
  const op = i => src[i * 4 + 3] > 120;
  const diff = (i, j) => Math.abs(src[i * 4] - src[j * 4]) + Math.abs(src[i * 4 + 1] - src[j * 4 + 1]) + Math.abs(src[i * 4 + 2] - src[j * 4 + 2]);
  for (let y = 0; y < res; y++) for (let xx = 0; xx < res; xx++) {
    const i = y * res + xx;
    let black = false;
    if (op(i)) {
      if (xx < res - 1 && op(i + 1) && diff(i, i + 1) > 110) black = true;
      if (y < res - 1 && op(i + res) && diff(i, i + res) > 110) black = true;
      // tratti già scuri dell'emoji
      if (src[i * 4] + src[i * 4 + 1] + src[i * 4 + 2] < 120) black = true;
    } else {
      if ((xx > 0 && op(i - 1)) || (xx < res - 1 && op(i + 1)) || (y > 0 && op(i - res)) || (y < res - 1 && op(i + res))) black = true;
    }
    const v = black ? 0 : 255;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
  }
  return out;
}
function floodFill(img, sx, sy, rgb) {
  const w = img.width, h = img.height, d = img.data;
  const i0 = (sy * w + sx) * 4;
  const t = [d[i0], d[i0 + 1], d[i0 + 2]];
  if (t[0] + t[1] + t[2] === 0) return false;            // è una linea nera
  if (t[0] === rgb[0] && t[1] === rgb[1] && t[2] === rgb[2]) return false;
  const st = [sx, sy];
  while (st.length) {
    const y = st.pop(), x = st.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = (y * w + x) * 4;
    if (d[i] !== t[0] || d[i + 1] !== t[1] || d[i + 2] !== t[2]) continue;
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
    st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return true;
}
function colorScreen(t, pic = 0) {
  bg('#9ee6c4');
  const RES = 64, SC = 9;
  const pal = PALETTE.filter(c => c !== '#000000');
  let cur = '#ff2a1a';
  const frame = el('div', { position: 'absolute', left: '176px', top: '22px', width: px(RES * SC), height: px(RES * SC),
    border: '10px solid #ff2a1a', boxShadow: '0 0 0 6px #222, 8px 8px 0 rgba(0,0,0,.35)', background: '#fff' });
  const c = pxCanvas(RES, RES, SC, { left: '0', top: '0' }, frame);
  const x = c.getContext('2d');
  const img = lineArt(t.items[pic], RES);
  x.putImageData(img, 0, 0);
  tap(c, ev => {
    const [cx, cy] = canvasPos(c, ev);
    if (floodFill(img, cx, cy, hex2rgb(cur))) { x.putImageData(img, 0, 0); SFX.fill(); }
  });
  // tavolozza
  const sws = [];
  pal.forEach((col, i) => {
    const s = el('div', { left: px(24 + (i % 2) * 66), top: px(24 + Math.floor(i / 2) * 74), width: '58px', height: '66px', background: col });
    s.className = 'sw' + (col === cur ? ' sel' : '');
    sws.push(s);
    tap(s, () => { cur = col; sws.forEach(q => q.classList.remove('sel')); s.classList.add('sel'); SFX.tap(); });
  });
  // scelta del disegno
  t.items.forEach((e, i) => {
    const b = el('div', { left: px(800 + (i % 2) * 104), top: px(22 + Math.floor(i / 2) * 118), width: '96px', height: '106px',
      background: i === pic ? '#ffe81a' : '#fff', border: '4px solid #222', boxSizing: 'border-box', cursor: 'pointer' });
    b.className = 'sw';
    spriteImg(e, 80, b, { margin: '9px 4px' });
    tap(b, () => { SFX.flip(); show(colorScreen, t, i); });
  });
  backBtn(() => show(themeScreen, t));
  const r = tap(el('div', { left: '330px', top: '696px', width: '270px', height: '60px' }, stage, '↻ Ricomincia'), () => { SFX.tap(); show(colorScreen, t, pic); });
  r.className = 'btn blue';
  const s = tap(el('div', { left: '620px', top: '696px', width: '160px', height: '60px' }, stage, '💾 Salva'), () => { SFX.tap(); saveCanvas(c, 'colorato', 12); });
  s.className = 'btn green';
}

function saveCanvas(c, name, scale) {
  const big = document.createElement('canvas'); big.width = c.width * scale; big.height = c.height * scale;
  const b = big.getContext('2d'); b.imageSmoothingEnabled = false; b.drawImage(c, 0, 0, big.width, big.height);
  big.toBlob(blob => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}

// =====================================================================
//  DIPINGERE CON LE DITA
// =====================================================================
function paintScreen(t) {
  bg('#ffb3d1');
  const RW = 192, RH = 144, SC = 4;
  const frame = el('div', { position: 'absolute', left: '128px', top: '16px', width: px(RW * SC), height: px(RH * SC),
    border: '8px solid #1fb890', boxShadow: '0 0 0 5px #222, 8px 8px 0 rgba(0,0,0,.35)' });
  const c = pxCanvas(RW, RH, SC, { left: '0', top: '0' }, frame);
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, RW, RH);
  let color = '#1a5cff', size = 3, stamp = null;
  const sws = [], tools = [];
  const selectSw = s => { sws.concat(tools).forEach(q => q.classList.remove('sel')); s.classList.add('sel'); };
  PALETTE.forEach((col, i) => {
    const s = el('div', { left: px(16 + (i % 2) * 50), top: px(16 + Math.floor(i / 2) * 72), width: '44px', height: '64px', background: col });
    s.className = 'sw' + (col === color ? ' sel' : '');
    sws.push(s);
    tap(s, () => { color = col; stamp = null; selectSw(s); SFX.tap(); });
  });
  // timbrini col tema
  t.items.forEach((e, i) => {
    const b = el('div', { left: px(918 + (i % 2) * 52), top: px(16 + Math.floor(i / 2) * 72), width: '48px', height: '64px', background: '#fff' });
    b.className = 'sw'; tools.push(b);
    spriteImg(e, 40, b, { margin: '10px 1px' });
    tap(b, () => { stamp = e; selectSw(b); SFX.tap(); });
  });
  // pennelli
  const sizes = [[1, 10], [3, 20], [7, 34]];
  const sb = [];
  sizes.forEach(([s, d], i) => {
    const b = el('div', { left: px(260 + i * 84), top: '690px', width: '74px', height: '66px', background: '#fff' });
    b.className = 'sw' + (s === size ? ' sel' : '');
    el('div', { width: px(d), height: px(d), background: '#000', margin: px((60 - d) / 2) + ' auto 0' }, b);
    sb.push(b);
    tap(b, () => { size = s; sb.forEach(q => q.classList.remove('sel')); b.classList.add('sel'); SFX.tap(); if (stamp) { stamp = null; selectSw(sws[PALETTE.indexOf(color)]); } });
  });
  const clear = tap(el('div', { left: '532px', top: '690px', width: '210px', height: '66px' }, stage, '🗑 Cancella'), () => {
    SFX.no(); x.fillStyle = '#fff'; x.fillRect(0, 0, RW, RH);
  });
  clear.className = 'btn blue';
  const save = tap(el('div', { left: '760px', top: '690px', width: '160px', height: '66px' }, stage, '💾 Salva'), () => { SFX.ok(); saveCanvas(c, 'disegno', 6); });
  save.className = 'btn green';

  const dot = (px_, py_) => { const o = Math.floor(size / 2); x.fillRect(px_ - o, py_ - o, size, size); };
  const line = (x0, y0, x1, y1) => {  // Bresenham: niente sfumature, solo pixel pieni
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) { dot(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  };
  const last = new Map();
  c.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    const [px_, py_] = canvasPos(c, ev);
    if (stamp) { x.drawImage(sprite(stamp, 32), px_ - 16, py_ - 16); snd([[700 + rnd(400), .06]]); return; }
    try { c.setPointerCapture(ev.pointerId); } catch (e) {}
    x.fillStyle = color; dot(px_, py_); last.set(ev.pointerId, [px_, py_]);
  });
  c.addEventListener('pointermove', ev => {
    if (!last.has(ev.pointerId)) return;
    const [px_, py_] = canvasPos(c, ev); const [lx, ly] = last.get(ev.pointerId);
    x.fillStyle = color; line(lx, ly, px_, py_); last.set(ev.pointerId, [px_, py_]);
  });
  const end = ev => last.delete(ev.pointerId);
  c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  backBtn(() => show(themeScreen, t));
}

// =====================================================================
//  TROVA LE DIFFERENZE
// =====================================================================
function diffScreen(t) {
  bg('#ffec3d');
  const RES = 112, SC = 4, N_DIFF = 4;
  const seed = 1 + rnd(100000);
  const cells = shuffle([...Array(16).keys()]).slice(0, 8);
  const items = cells.map(cell => ({
    e: t.items[rnd(t.items.length)],
    x: (cell % 4) * 28 + 2 + rnd(3) - 1, y: (cell >> 2) * 28 + 2 + rnd(3) - 1, s: 24, flip: false, gone: false,
  }));
  const copy = items.map(o => Object.assign({}, o));
  const diffs = shuffle([...items.keys()]).slice(0, N_DIFF).map(k => {
    const o = copy[k], kind = rnd(4);
    if (kind === 0) o.gone = true;
    else if (kind === 1) { let e; do { e = t.items[rnd(t.items.length)]; } while (e === o.e); o.e = e; }
    else if (kind === 2) o.flip = true;
    else { o.s = 32; o.x -= 4; o.y -= 4; }
    return { cx: items[k].x + 12, cy: items[k].y + 12, found: false };
  });
  const panels = [];
  [[40, 'MODELLO', items], [536, 'COPIA', copy]].forEach(([left, label, list]) => {
    el('div', { position: 'absolute', left: px(left), width: px(RES * SC), top: '20px', textAlign: 'center' }, stage,
      `<span class="title" style="font-size:36px">${label}</span>`);
    const frame = el('div', { position: 'absolute', left: px(left), top: '90px', width: px(RES * SC), height: px(RES * SC),
      border: '6px solid #222', boxShadow: '0 0 0 6px #1fb890, 8px 8px 0 rgba(0,0,0,.35)', marginLeft: '-6px' });
    const c = pxCanvas(RES, RES, SC, { left: '0', top: '0' }, frame);
    panels.push({ c, list });
    tap(c, ev => check(...canvasPos(c, ev)));
  });
  const counter = el('div', { position: 'absolute', left: '300px', right: '40px', top: '700px', textAlign: 'center' });
  function draw() {
    for (const { c, list } of panels) {
      const x = c.getContext('2d');
      drawScene(x, RES, RES, t, seed);
      for (const o of list) {
        if (o.gone) continue;
        const sp = sprite(o.e, o.s);
        if (o.flip) { x.save(); x.translate(o.x + o.s, o.y); x.scale(-1, 1); x.drawImage(sp, 0, 0); x.restore(); }
        else x.drawImage(sp, o.x, o.y);
      }
      // cerchi rossi sugli errori trovati (a pixel)
      x.fillStyle = '#ff0000';
      for (const d of diffs) if (d.found) for (let a = 0; a < 64; a++) {
        const ang = a / 64 * Math.PI * 2;
        x.fillRect(Math.round(d.cx + Math.cos(ang) * 17) - 1, Math.round(d.cy + Math.sin(ang) * 17) - 1, 2, 2);
      }
    }
    const n = diffs.filter(d => d.found).length;
    counter.innerHTML = `<span class="title" style="font-size:34px">Trovate: ${'★'.repeat(n)}${'☆'.repeat(N_DIFF - n)}</span>`;
  }
  function check(x, y) {
    const d = diffs.find(d => !d.found && Math.hypot(d.cx - x, d.cy - y) < 17);
    if (!d) { SFX.no(); return; }
    d.found = true; SFX.ok(); draw();
    if (diffs.every(d => d.found)) setTimeout(() => party('HAI TROVATO TUTTO!', () => show(diffScreen, t), () => show(themeScreen, t)), 700);
  }
  draw();
  backBtn(() => show(themeScreen, t));
}

// =====================================================================
//  GIOCO DEI VESTITI
// =====================================================================
const DRESS_PARTS = {
  1: 'pelle', 2: 'capelli', 3: 'sopra', 4: 'sotto', 5: 'scarpe', 6: 'cappello', 7: 'occhi', 8: 'bocca', 9: 'guance',
};
const DRESS_STYLES = {
  cappello: ['niente', 'fiocco', 'corona', 'cappello', 'cerchietto'],
  capelli: ['lunghi', 'coda', 'trecce', 'corti'],
  sopra: ['maglietta', 'felpa', 'canottiera'],
  sotto: ['gonna', 'pantaloni', 'pantaloncini', 'vestito lungo'],
  scarpe: ['scarpe', 'stivali', 'sandali'],
};
let dressState = null;
function dressScreen(t) {
  if (!dressState) {
    const saved = store('vestiti');
    try { dressState = saved ? JSON.parse(saved) : null; } catch (e) { dressState = null; }
    dressState = dressState || {
      style: { cappello: 1, capelli: 0, sopra: 0, sotto: 0, scarpe: 0 },
      color: { 1: '#ffd2a8', 2: '#b0702e', 3: '#ff66cc', 4: '#1a5cff', 5: '#ff2a1a', 6: '#ff2a1a', 7: '#000000', 8: '#ff2a1a', 9: '#ff9999' },
    };
  }
  const S = dressState;
  bg('repeating-linear-gradient(45deg,#ffd6f0 0 24px,#ffc2e8 24px 48px)');
  const RW = 64, RH = 96, SC = 7;
  const frame = el('div', { position: 'absolute', left: '200px', top: '16px', width: px(RW * SC), height: px(RH * SC - 14),
    background: '#fff', border: '6px solid #222', boxShadow: '0 0 0 6px #1fb890, 8px 8px 0 rgba(0,0,0,.35)', overflow: 'hidden' });
  const c = pxCanvas(RW, RH, SC, { left: '0', top: '-14px' }, frame);
  const x = c.getContext('2d');
  let ids = new Uint8Array(RW * RH);
  let cur = '#a020f0';

  function render() {
    ids = new Uint8Array(RW * RH);
    const R = (id, x0, y0, w, h) => {
      for (let y = Math.max(0, y0); y < Math.min(RH, y0 + h); y++) for (let xx = Math.max(0, x0); xx < Math.min(RW, x0 + w); xx++) ids[y * RW + xx] = id;
    };
    const st = k => DRESS_STYLES[k][S.style[k]];
    const hair = st('capelli');
    // capelli dietro
    if (hair === 'lunghi') for (let y = 10; y < 50; y++) { const o = (y % 6 < 3) ? 0 : 1; R(2, 21 + o, y, 22 - o, 1); }
    if (hair === 'coda') { R(2, 39, 13, 6, 6); for (let y = 18; y < 40; y++) R(2, 42 + ((y % 6 < 3) ? 0 : 1), y, 5, 1); }
    if (hair === 'corti') R(2, 23, 10, 18, 18);
    if (hair === 'trecce') { R(2, 18, 18, 5, 26); R(2, 41, 18, 5, 26); R(6, 18, 42, 5, 2); R(6, 41, 42, 5, 2); }
    // gambe e braccia
    R(1, 26, 60, 5, 26); R(1, 33, 60, 5, 26);
    R(1, 17, 34, 5, 22); R(1, 42, 34, 5, 22);
    // scarpe
    const sh = st('scarpe');
    if (sh === 'scarpe') { R(5, 24, 84, 8, 4); R(5, 32, 84, 8, 4); }
    if (sh === 'stivali') { R(5, 25, 72, 7, 16); R(5, 32, 72, 7, 16); R(5, 24, 85, 8, 3); R(5, 32, 85, 8, 3); }
    if (sh === 'sandali') { R(5, 25, 83, 7, 1); R(5, 24, 86, 8, 2); R(5, 32, 83, 7, 1); R(5, 32, 86, 8, 2); }
    // sotto
    const bo = st('sotto');
    if (bo === 'gonna') for (let y = 52; y < 68; y++) { const e = Math.floor((y - 52) / 2); R(4, 23 - e, y, 18 + e * 2, 1); }
    if (bo === 'pantaloni') { R(4, 24, 52, 16, 8); R(4, 25, 60, 7, 24); R(4, 32, 60, 7, 24); }
    if (bo === 'pantaloncini') { R(4, 24, 52, 16, 8); R(4, 25, 60, 7, 6); R(4, 32, 60, 7, 6); }
    if (bo === 'vestito lungo') for (let y = 50; y < 82; y++) { const e = Math.floor((y - 50) / 3); R(4, 23 - e, y, 18 + e * 2, 1); }
    // sopra
    const to = st('sopra');
    if (to === 'maglietta') { R(3, 22, 32, 20, 22); R(3, 17, 32, 6, 8); R(3, 41, 32, 6, 8); }
    if (to === 'felpa') { R(3, 22, 32, 20, 23); R(3, 17, 32, 6, 21); R(3, 41, 32, 6, 21); R(1, 17, 53, 5, 3); R(1, 42, 53, 5, 3); }
    if (to === 'canottiera') { R(3, 24, 34, 16, 20); R(3, 25, 31, 3, 3); R(3, 36, 31, 3, 3); }
    // collo e testa
    R(1, 29, 29, 6, 4);
    R(1, 24, 13, 16, 16); R(1, 23, 15, 18, 12); R(1, 26, 12, 12, 19);
    R(7, 27, 19, 2, 3); R(7, 35, 19, 2, 3);           // occhi
    R(9, 25, 23, 3, 2); R(9, 36, 23, 3, 2);           // guance
    R(8, 30, 25, 4, 1); R(8, 29, 24, 1, 1); R(8, 34, 24, 1, 1); // sorriso
    // frangia
    if (hair !== 'corti') { R(2, 24, 10, 16, 5); R(2, 22, 12, 3, 12); R(2, 39, 12, 3, 12); }
    else { R(2, 24, 10, 16, 4); R(2, 23, 12, 2, 6); R(2, 39, 12, 2, 6); }
    // cappello
    const ha = st('cappello');
    if (ha === 'fiocco') { R(6, 36, 7, 5, 6); R(6, 44, 7, 5, 6); R(6, 41, 8, 3, 4); }
    if (ha === 'corona') { R(6, 25, 5, 14, 5); R(6, 25, 2, 2, 3); R(6, 31, 1, 2, 4); R(6, 37, 2, 2, 3); }
    if (ha === 'cappello') { R(6, 17, 9, 30, 3); R(6, 24, 1, 16, 8); }
    if (ha === 'cerchietto') { R(6, 23, 9, 18, 2); R(6, 22, 11, 2, 3); R(6, 40, 11, 2, 3); }

    const img = x.createImageData(RW, RH), d = img.data;
    const noLine = new Set([7, 8, 9]);
    for (let y = 0; y < RH; y++) for (let xx = 0; xx < RW; xx++) {
      const i = y * RW + xx, id = ids[i];
      let rgb;
      if (!id) {
        // contorno esterno nero
        const nb = [xx > 0 && ids[i - 1], xx < RW - 1 && ids[i + 1], y > 0 && ids[i - RW], y < RH - 1 && ids[i + RW]];
        if (nb.some(v => v)) rgb = [0, 0, 0]; else { d[i * 4 + 3] = 0; continue; }
      } else {
        rgb = hex2rgb(S.color[id]);
        if (!noLine.has(id)) {
          const nb = [xx < RW - 1 ? ids[i + 1] : 0, y < RH - 1 ? ids[i + RW] : 0];
          if (nb.some(v => v && v !== id && !noLine.has(v))) rgb = [0, 0, 0];
        }
      }
      d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = 255;
    }
    x.clearRect(0, 0, RW, RH);
    x.putImageData(img, 0, 0);
    store('vestiti', JSON.stringify(S));
  }
  tap(c, ev => {
    const [cx, cy] = canvasPos(c, ev);
    // cerca la parte toccata (con un po' di tolleranza per le dita)
    let id = 0;
    for (let r = 0; r <= 2 && !id; r++) for (let dy = -r; dy <= r && !id; dy++) for (let dx = -r; dx <= r && !id; dx++) {
      const xx = cx + dx, yy = cy + dy;
      if (xx >= 0 && yy >= 0 && xx < RW && yy < RH) id = ids[yy * RW + xx];
    }
    if (!id || id === 7) { SFX.no(); return; }
    S.color[id] = cur; SFX.fill(); render();
  });
  // tavolozza (+ colori pelle)
  const pal = PALETTE.concat(['#ffd2a8', '#e0a070', '#a0623a', '#6b3e1f']);
  const sws = [];
  pal.forEach((col, i) => {
    const s = el('div', { left: px(20 + (i % 3) * 56), top: px(16 + Math.floor(i / 3) * 96), width: '50px', height: '88px', background: col });
    s.className = 'sw' + (col === cur ? ' sel' : '');
    sws.push(s);
    tap(s, () => { cur = col; sws.forEach(q => q.classList.remove('sel')); s.classList.add('sel'); SFX.tap(); });
  });
  // frecce per cambiare i vestiti
  const rowsDef = [['cappello', '🎀'], ['capelli', '💇'], ['sopra', '👕'], ['sotto', '👗'], ['scarpe', '👟']];
  rowsDef.forEach(([k, ic], r) => {
    const y = 40 + r * 124;
    const lab = el('div', { position: 'absolute', left: '738px', top: px(y), width: '270px', height: '100px', background: '#fff',
      border: '4px solid #222', boxSizing: 'border-box', boxShadow: '5px 5px 0 rgba(0,0,0,.3)' });
    spriteImg(ic, 56, lab, { position: 'absolute', left: '105px', top: '6px' });
    const name = el('div', { position: 'absolute', left: '0', right: '0', bottom: '2px', textAlign: 'center', fontSize: '17px', color: '#222' }, lab);
    const upd = () => { name.textContent = DRESS_STYLES[k][S.style[k]]; };
    upd();
    [[-1, '◀', '0'], [1, '▶', '190px']].forEach(([dir, ch, l]) => {
      const a = tap(el('div', { left: l, top: '0', width: '72px', height: '92px', fontSize: '36px' }, lab, ch), () => {
        const n = DRESS_STYLES[k].length;
        S.style[k] = (S.style[k] + dir + n) % n; upd(); render(); SFX.flip();
      });
      a.className = 'btn blue';
    });
  });
  backBtn(() => show(themeScreen, t));
  render();
}

// ---------- avvio ----------
show(homeScreen);
