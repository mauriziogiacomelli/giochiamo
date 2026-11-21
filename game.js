'use strict';
// =====================================================================
//  GIOCHIAMO! — gioco touch in stile retrò
//  Per personalizzare: scrivi qui il nome della bambina (es. 'Sofia').
// =====================================================================
const NOME = '';

// ---------- lingua: italiano / inglese ----------
let LANG = (() => { try { return localStorage.getItem('lingua') || 'it'; } catch (e) { return 'it'; } })();
const EN = {
  'Giochiamo!': "Let's play!", 'Colorare disegni': 'Coloring', 'Dipingere con le dita': 'Finger painting',
  'Trova le differenze': 'Spot the difference', 'Gioco dei vestiti': 'Dress up', 'Trova i particolari': 'Find the details',
  'Fattoria': 'Farm', 'Veicoli': 'Vehicles', 'Frutta': 'Fruit', 'Spazio': 'Space', 'Fiori': 'Flowers',
  'Scegli la musica': 'Choose the music', 'Carillon delle stelle': 'Star music box', 'Ninna nanna': 'Lullaby',
  'Onde del mare': 'Ocean waves', 'Nuvole': 'Clouds', 'Silenzio': 'Silence', 'Fatto': 'Done', 'Musica': 'Music',
  'Indietro': 'Back', 'Ancora!': 'Again!', 'Ricarica': 'Reload', 'Chiudi': 'Close', 'Ciao ciao!': 'Bye bye!',
  "Per uscire usa il tasto Home<br>o scorri verso l'alto dal basso.": 'To exit, press the Home button<br>or swipe up from the bottom.',
  'Resta': 'Stay', 'Voce': 'Voice', 'Ricomincia': 'Start over', 'Salva': 'Save', 'Cancella': 'Clear',
  'MODELLO': 'ORIGINAL', 'COPIA': 'COPY', 'Originale': 'Original', 'Copia': 'Copy', 'Trovate:': 'Found:', 'BRAVISSIMA!': 'WELL DONE!', 'HAI TROVATO TUTTO!': 'YOU FOUND THEM ALL!',
  'Gonna e pantaloni': 'Skirts & pants', 'Capelli': 'Hair', 'Accessori': 'Accessories', 'Maglia': 'Tops', 'Pantaloni': 'Pants',
  'Scarpe': 'Shoes', 'Occhi': 'Eyes', 'Pelle': 'Skin', 'Colori': 'Colors', 'Bambina': 'Girl', 'Bambino': 'Boy',
  'A caso': 'Random', 'Foto': 'Photo', 'Giardino': 'Garden', 'Mare': 'Sea', 'Cameretta': 'Bedroom',
  'Difficile (genitori)': 'Hard (parents)', 'Facile': 'Easy', 'Nuova': 'New',
};
const EN_KEYS = Object.keys(EN).sort((a, b) => b.length - a.length);
// traduce tutte le scritte note dentro un testo/HTML
function tr(html) {
  if (LANG !== 'en' || typeof html !== 'string') return html;
  for (const k of EN_KEYS) if (html.includes(k)) html = html.split(k).join(EN[k]);
  return html;
}

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
  { id: 'fiori', name: 'Fiori', frame: '#ff66cc', bg: '#c9f7c9',
    items: ['🌼', '🌷', '🌻', '🌹', '🌸', '💐', '🦋', '🐞', '🌺', '🍀'] },
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
  if (html !== undefined) e.innerHTML = tr(String(html));
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

// ---------- disegni fatti a mano (sostituiscono l'emoji) ----------
// La giraffa, vista di fronte, fa la linguaccia! 32x32 pixel.
const CUSTOM = {
  '🦒': {
    colors: { Y: '#ffc828', O: '#c86414', H: '#8b4513', E: '#e0a020', K: '#000000', W: '#ffffff',
      M: '#ffe08a', N: '#5a280a', P: '#ff5a8c', R: '#c81e50', C: '#ff9696' },
    map: [
      '................................',
      '..........HHH......HHH..........',
      '..........HHH......HHH..........',
      '...........H........H...........',
      '...........H........H...........',
      '...........YYYYYYYYYY...........',
      '..........YYYYYYYYYYYY..........',
      '....EEEE.YYYYOOYYOOYYYY.EEEE....',
      '..EEPPPEEYYYYYOYYOYYYYYEEPPPEE..',
      '...EEEEEYYYYYYYYYYYYYYYYEEEEE...',
      '........YYKWKYYYYYYKWKYY........',
      '........YYKKKYYYYYYKKKYY........',
      '........YYKKKYYYYYYKKKYY........',
      '........YOYYYYYYYYYYYYOY........',
      '........OOYYYYYYYYYYYYOO........',
      '........YCCYYYYYYYYYYCCY........',
      '.........YYYYYYYYYYYYYY.........',
      '........MMMMMMMMMMMMMMMM........',
      '.......MMMMMMMMMMMMMMMMMM.......',
      '.......MMMMNNMMMMMMNNMMMM.......',
      '.......MMMMMMMMMMMMMMMMMM.......',
      '.......MMKMMMMMMMMMMMMKMM.......',
      '........MMKKKKKKKKKKKKMM........',
      '........MMMMPPPPPPPPMMMM........',
      '.........MMMPPPPPPPPMMM.........',
      '..........YYPPPRRPPPYY..........',
      '..........YYPPPRRPPPYY..........',
      '..........YYYPPPPPPYYY..........',
      '..........YOYYPPPPYYOY..........',
      '..........OOYYYYYYYYOO..........',
      '..........YOYYYYYYYYOY..........',
      '..........YYYYYYYYYYYY..........',
    ],
  },
};
// Animazione della linguaccia: la lingua esce, resta fuori, rientra in bocca.
function tongueFrame(maxRow) {
  // tiene la lingua solo fino a maxRow; il resto torna muso (sopra) o collo (sotto)
  return CUSTOM['🦒'].map.map((row, y) => {
    if (y <= maxRow) return row;
    return row.replace(/[PR]/g, y <= 24 ? 'M' : 'Y');
  });
}
const TONGUE = { fuori: tongueFrame(99), meta: tongueFrame(25), dentro: tongueFrame(22) };
// rendo arrotondata la punta quando la lingua è a metà
TONGUE.meta = TONGUE.meta.map((row, y) => y === 25 ? row.replace(/YP/, 'YY').replace(/PY(?!.*PY)/, 'YY') : row);
CUSTOM['🦒'].frames = [TONGUE.dentro, TONGUE.dentro, TONGUE.meta, TONGUE.fuori, TONGUE.fuori, TONGUE.fuori, TONGUE.meta];
const ANIM_STEPS = 7;          // fotogrammi del ciclo
let animFrame = 0;             // fotogramma corrente (avanza da solo)

const customCache = new Map();
function customCanvas(emoji, frame = 0) {
  const key = emoji + frame;
  if (customCache.has(key)) return customCache.get(key);
  const { map, colors, frames } = CUSTOM[emoji];
  const m = frames ? frames[frame % frames.length] : map;
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d');
  m.forEach((row, y) => [...row].forEach((ch, xx) => { if (colors[ch]) { x.fillStyle = colors[ch]; x.fillRect(xx, y, 1, 1); } }));
  customCache.set(key, c);
  return c;
}
const isAnimated = emoji => !!(CUSTOM[emoji] && CUSTOM[emoji].frames);
// disegna un soggetto (emoji o disegno personalizzato) riempiendo un canvas res x res
function drawSubject(x, emoji, res, scale, frame = 0) {
  if (CUSTOM[emoji]) {
    x.imageSmoothingEnabled = false;
    x.drawImage(customCanvas(emoji, frame), 0, 0, res, res);
    return;
  }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${Math.round(res * scale)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  x.fillText(emoji, res / 2, res / 2 + res * 0.06);
}

// ---------- musica di sottofondo (composta dal gioco, calma e leggera) ----------
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const CH = {
  C: [48, 55, 60, 64], Am: [45, 52, 57, 60], F: [41, 48, 53, 57], G: [43, 50, 55, 59],
  Fmaj7: [41, 48, 52, 57], Em7: [40, 47, 50, 55], Dm7: [38, 45, 48, 53], Cmaj7: [36, 43, 47, 52],
};
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88];
const Music = {
  id: 'off', out: null, padBus: null, timer: null, nextT: 0, step: 0, keep: [], walk: 3,
  ctx() {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  },
  bus() {
    const ac = this.ctx();
    const out = ac.createGain(); out.gain.value = 0;
    out.connect(ac.destination);
    // eco morbida per un suono "sognante"
    const d = ac.createDelay(1); d.delayTime.value = 0.38;
    const fb = ac.createGain(); fb.gain.value = 0.32;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const wet = ac.createGain(); wet.gain.value = 0.3;
    out.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(ac.destination);
    const padBus = ac.createBiquadFilter(); padBus.type = 'lowpass'; padBus.frequency.value = 900;
    padBus.connect(out);
    return { out, padBus, extra: [d, fb, lp, wet] };
  },
  play(id) {
    this.stop();
    this.id = id; store('musica', id);
    if (id === 'off') return;
    const tr = TRACKS.find(t => t.id === id);
    if (!tr) return;
    try {
      const ac = this.ctx();
      const b = this.bus();
      this.out = b.out; this.padBus = b.padBus; this.keep = b.extra;
      this.out.gain.setValueAtTime(0, ac.currentTime);
      this.out.gain.linearRampToValueAtTime(0.5, ac.currentTime + 2);
      if (tr.init) tr.init();
      this.nextT = ac.currentTime + 0.15; this.step = 0;
      this.timer = setInterval(() => this.tick(tr), 100);
      this.tick(tr);
    } catch (e) { /* audio non disponibile */ }
  },
  tick(tr) {
    if (!AC || AC.state !== 'running') return;
    while (this.nextT < AC.currentTime + 0.7) {
      tr.step(this.step, this.nextT);
      this.nextT += tr.beat; this.step++;
    }
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    if (this.out && AC) {
      const o = this.out, k = this.keep, t = AC.currentTime;
      o.gain.cancelScheduledValues(t); o.gain.setValueAtTime(o.gain.value, t); o.gain.linearRampToValueAtTime(0, t + 0.6);
      setTimeout(() => { try { o.disconnect(); k.forEach(n => { if (n.stop) n.stop(); n.disconnect(); }); } catch (e) {} }, 900);
    }
    this.out = null; this.keep = [];
  },
};
// strumenti
function musicBox(t, m, vol = 0.3, dur = 1.8) {
  const f = mf(m);
  [[1, 1], [2, 0.22], [3.01, 0.07]].forEach(([h, a]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = f * h;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.sqrt(h));
    o.connect(g); g.connect(Music.out); o.start(t); o.stop(t + dur + 0.1);
  });
}
function softPiano(t, m, vol = 0.25, dur = 2.4) {
  const f = mf(m), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(Music.out);
  [['triangle', 1, 1], ['sine', 2, 0.3]].forEach(([type, h, a]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f * h;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.1);
  });
}
function pad(t, notes, dur, vol = 0.16) {
  notes.forEach(m => [-5, 5].forEach(det => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'triangle'; o.frequency.value = mf(m); o.detune.value = det;
    const v = vol / notes.length;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35);
    g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur + 0.9);
    o.connect(g); g.connect(Music.padBus); o.start(t); o.stop(t + dur + 1);
  }));
}
// le 4 musiche
const NINNA = (() => {
  const A = [[76, 2], [74, 1], [72, 3], [74, 2], [76, 1], [67, 3], [69, 2], [72, 1], [76, 2], [74, 1], [72, 3], [null, 3]];
  const B = [[72, 2], [74, 1], [76, 2], [79, 1], [77, 3], [76, 3], [74, 2], [72, 1], [69, 2], [71, 1], [72, 6]];
  const notes = {}; let b = 0;
  A.concat(B).forEach(([m, d]) => { if (m) notes[b] = m; b += d; });
  return { notes, len: b, chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'C', 'G', 'C', 'F', 'C', 'G', 'C'] };
})();
const TRACKS = [
  { id: 'ninna', name: 'Ninna nanna', icon: '🌙', beat: 60 / 66,
    step(i, t) {
      const b = i % NINNA.len;
      if (b % 3 === 0) {
        const ch = CH[NINNA.chords[b / 3]];
        pad(t, ch.slice(1), 3 * this.beat);
        musicBox(t, ch[0] + 12, 0.12, 2.5);
      }
      if (NINNA.notes[b]) musicBox(t, NINNA.notes[b], 0.26, 2.2);
    } },
  { id: 'stelle', name: 'Carillon delle stelle', icon: '⭐', beat: 60 / 76 / 2,
    step(i, t) {
      if (i % 16 === 0) pad(t, (i / 16) % 2 ? [43, 50, 55] : [48, 55, 60], 16 * this.beat, 0.12);
      if (Math.random() < 0.55) {
        Music.walk = Math.max(0, Math.min(PENTA.length - 1, Music.walk + [-2, -1, -1, 1, 1, 2][rnd(6)]));
        musicBox(t, PENTA[Music.walk], 0.2, 2.6);
      }
    } },
  { id: 'mare', name: 'Onde del mare', icon: '🌊', beat: 1,
    init() {
      // rumore delle onde: rumore bianco filtrato che sale e scende lentamente
      const ac = AC, len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const g = ac.createGain(); g.gain.value = 0.12;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.09;
      const lg = ac.createGain(); lg.gain.value = 0.1;
      const lfo2 = ac.createOscillator(); lfo2.frequency.value = 0.09;
      const lg2 = ac.createGain(); lg2.gain.value = 300;
      lfo.connect(lg); lg.connect(g.gain); lfo2.connect(lg2); lg2.connect(lp.frequency);
      src.connect(lp); lp.connect(g); g.connect(Music.out);
      src.start(); lfo.start(); lfo2.start();
      Music.keep.push(src, lfo, lfo2, lp, g, lg, lg2);
    },
    step(i, t) {
      if (i % 8 === 0) pad(t, CH[['Am', 'F', 'C', 'G'][(i / 8) % 4]].slice(1), 8.5, 0.13);
      if (i % 2 === 1 && Math.random() < 0.35) musicBox(t, PENTA[rnd(5)], 0.12, 3);
    } },
  { id: 'nuvole', name: 'Nuvole', icon: '☁️', beat: 0.5,
    step(i, t) {
      const ch = CH[['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'][Math.floor(i / 16) % 4]];
      if (i % 16 === 0) { pad(t, ch.map(m => m + 12), 8.2, 0.09); softPiano(t, ch[0], 0.22, 4); }
      const tones = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 24];
      softPiano(t, tones[[0, 1, 2, 3, 4, 3, 2, 1][i % 8]], i % 8 === 4 ? 0.16 : 0.12, 2.6);
    } },
];
// in background (app nascosta) la musica si ferma, poi riparte
document.addEventListener('visibilitychange', () => {
  if (!AC) return;
  if (document.hidden) AC.suspend(); else if (Music.id !== 'off') AC.resume();
});
// la musica scelta riparte al primo tocco (i browser non la fanno partire da sola)
(() => {
  const saved = store('musica');
  if (!saved || saved === 'off') return;
  const startOnce = () => { document.removeEventListener('pointerdown', startOnce, true); if (Music.id === 'off') Music.play(saved); };
  document.addEventListener('pointerdown', startOnce, true);
})();

function musicPicker() {
  const o = el('div', { position: 'absolute', inset: '0', zIndex: '600', background: 'rgba(0,0,40,.6)' });
  const box = el('div', { position: 'absolute', left: '22px', top: '90px', width: '980px', height: '560px', background: '#ffec3d',
    border: '10px solid #ff2a1a', boxShadow: '0 0 0 6px #222, 10px 10px 0 rgba(0,0,0,.4)', boxSizing: 'border-box' }, o);
  el('div', { position: 'absolute', left: '0', right: '0', top: '20px', textAlign: 'center' }, box,
    '<span class="title" style="font-size:48px">🎵 Scegli la musica</span>');
  const opts = TRACKS.concat([{ id: 'off', name: 'Silenzio', icon: '🔇' }]);
  const cards = [];
  opts.forEach((tr, i) => {
    const c = el('div', { left: px(24 + i * 188), top: '120px', width: '172px', height: '250px', borderColor: '#1fb890', background: '#fff',
      boxShadow: 'inset 0 0 0 6px #fff, 6px 6px 0 rgba(0,0,0,.35)' }, box);
    c.className = 'tile';
    spriteImg(tr.icon, 120, c, { position: 'absolute', left: '16px', top: '18px' });
    el('div', { position: 'absolute', left: '4px', right: '4px', top: '152px', textAlign: 'center', fontSize: '22px', lineHeight: '26px', color: '#c8100a',
      textShadow: '2px 2px 0 #5a1000' }, c, tr.name);
    const mark = () => cards.forEach((q, j) => { q.style.borderColor = opts[j].id === Music.id ? '#ff2a1a' : '#1fb890'; q.style.background = opts[j].id === Music.id ? '#fff6b0' : '#fff'; });
    cards.push(c);
    tap(c, () => { Music.play(tr.id); mark(); if (tr.id === 'off') SFX.tap(); });
    mark();
  });
  const ok = tap(el('div', { left: '340px', top: '410px', width: '280px', height: '100px', fontSize: '40px' }, box, '✔ Fatto'), () => { SFX.tap(); o.remove(); });
  ok.className = 'btn green';
}

// ---------- sprite pixel-art dagli emoji ----------
const spriteCache = new Map();
function sprite(emoji, res = 32, frame) {
  if (frame === undefined) frame = isAnimated(emoji) ? animFrame : 0;
  frame = isAnimated(emoji) ? frame % ANIM_STEPS : 0;
  const key = emoji + res + '/' + frame;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = res;
  const x = c.getContext('2d');
  drawSubject(x, emoji, res, 0.78, frame);
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
const urlCache = new Map();
function spriteURL(emoji, frame) {
  const key = emoji + '/' + frame;
  if (!urlCache.has(key)) urlCache.set(key, sprite(emoji, 32, frame).toDataURL());
  return urlCache.get(key);
}
function spriteImg(emoji, size, parent, css) {
  const img = el('img', Object.assign({ width: px(size), height: px(size) }, css || {}), parent);
  img.className = 'px'; img.draggable = false;
  img.src = spriteURL(emoji, isAnimated(emoji) ? animFrame : 0);
  if (isAnimated(emoji)) { img.dataset.anim = emoji; }
  return img;
}
// orologio delle animazioni: aggiorna le immagini animate e i canvas registrati
let animHooks = [];
function onAnim(fn) { animHooks.push(fn); }
setInterval(() => {
  animFrame = (animFrame + 1) % ANIM_STEPS;
  document.querySelectorAll('img[data-anim]').forEach(img => { img.src = spriteURL(img.dataset.anim, animFrame); });
  animHooks.forEach(fn => { try { fn(); } catch (e) {} });
}, 220);
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
    case 'fiori':
      R('#bfe9ff', 0, 0, w, h); R('#ffe81a', w - 16, 4, 10, 10);
      R('#5ad15a', 0, h * 0.55, w, h * 0.45);
      for (let i = 0; i < w * h / 160; i++) {
        const fx = Math.floor(r() * w), fy = Math.floor(h * 0.58 + r() * h * 0.4);
        R(['#ff66cc', '#ffffff', '#ffe81a', '#ff2a1a'][i % 4], fx, fy, 2, 2); R('#ffe81a', fx, fy, 1, 1);
      }
      break;
  }
}

// ---------- gestione schermate ----------
let cleanup = null;
function show(fn, ...args) {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  stage.innerHTML = '';
  stage.classList.remove('modern');
  animHooks = [];
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

// Timbrini misti per "Dipingere con le dita"
const MIX = { id: 'mix', name: 'Tutti', bg: '#ffb3d1', items: ['🦒', '🐱', '🐄', '🚗', '🚀', '🍓', '🍌', '🐘', '🌙', '⭐'] };
const randomTheme = () => THEMES[rnd(THEMES.length)];

// =====================================================================
//  SCHERMATA INIZIALE: i 5 giochi
// =====================================================================
const GAMES = [
  { name: 'Memory', icon: null, x: 80, y: 110, go: () => show(themePick, memoryScreen) },
  { name: 'Colorare disegni', icon: '🖍️', x: 392, y: 100, go: () => show(themePick, colorScreen) },
  { name: 'Dipingere con le dita', icon: '🎨', x: 704, y: 110, go: () => show(paintScreen, MIX) },
  { name: 'Trova le differenze', icon: '🔍', x: 80, y: 404, go: () => show(diffPick) },
  { name: 'Gioco dei vestiti', icon: '👗', x: 392, y: 394, go: () => show(dressScreen) },
  { name: 'Trova i particolari', icon: '👀', x: 704, y: 404, go: () => show(seekPick) },
];
function homeScreen() {
  bg('#ffec3d');
  el('div', { position: 'absolute', left: '0', right: '0', top: '16px', textAlign: 'center' }, stage,
    `<span class="title" style="font-size:52px">${NOME ? 'Il gioco di ' + NOME : 'Giochiamo!'}</span>`);
  const zoo = THEMES.find(t => t.id === 'zoo');
  GAMES.forEach(a => {
    const tile = el('div', { left: px(a.x), top: px(a.y), width: '240px', height: '220px', borderColor: '#1fb890',
      background: '#fff', boxShadow: 'inset 0 0 0 6px #ff2a1a, 6px 6px 0 rgba(0,0,0,.35)' }, stage);
    tile.className = 'tile';
    if (a.icon) {
      spriteImg(a.icon, 150, tile, { position: 'absolute', left: '35px', top: '25px' });
    } else {
      // mini griglia memory (con la giraffa!)
      const cols = ['#ffe81a', '#c9e8ff', '#99ff88', '#ff9ad8', '#00e0e0', '#ffcc99'];
      const pics = ['🦒', '🍓', null, '🚀', null, '🦒'];
      for (let i = 0; i < 6; i++) {
        const cell = el('div', { position: 'absolute', left: px(14 + (i % 3) * 68), top: px(18 + Math.floor(i / 3) * 86), width: '62px', height: '78px',
          background: pics[i] ? cols[i] : 'repeating-linear-gradient(45deg,#fff 0 6px,#ffcc22 6px 12px)', border: '2px solid #333', boxSizing: 'border-box' }, tile);
        if (pics[i]) spriteImg(pics[i], 54, cell, { margin: '10px 2px' });
      }
    }
    el('div', { position: 'absolute', left: '-30px', right: '-30px', bottom: '-50px', textAlign: 'center' }, tile,
      `<span class="title" style="font-size:24px">${a.name}</span>`);
    tap(tile, () => { SFX.flip(); a.go(); });
  });
  // pulsante schermo intero
  const fs = tap(el('div', { left: '904px', top: '700px', width: '100px', height: '54px', fontSize: '26px' }, stage, '⛶'), () => {
    const d = document.documentElement;
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {});
    else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  });
  fs.className = 'btn blue';
  const mu = tap(el('div', { left: '724px', top: '700px', width: '170px', height: '54px', fontSize: '24px' }, stage, '🎵 Musica'), () => { SFX.tap(); musicPicker(); });
  mu.className = 'btn';
  // ricarica: con internet prende l'ultima versione del gioco, senza internet ricarica e basta
  const rl = tap(el('div', { left: '20px', top: '700px', width: '190px', height: '54px', fontSize: '24px' }, stage, '↻ Ricarica'), async () => {
    SFX.tap();
    rl.textContent = '⏳ ...';
    try {
      if (navigator.onLine) {
        const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
        if (window.caches) for (const k of await caches.keys()) if (!k.startsWith('giochiamo-voce')) await caches.delete(k);   // le voci restano
      }
    } catch (e) { /* si ricarica comunque */ }
    location.reload();
  });
  rl.className = 'btn green';
  // lingua
  const lg = tap(el('div', { left: '20px', top: '16px', width: '190px', height: '54px', fontSize: '24px' }, stage, LANG === 'en' ? '🌍 Italiano' : '🌍 English'), () => {
    LANG = LANG === 'en' ? 'it' : 'en'; store('lingua', LANG);
    Voice.loadClips(LANG); SFX.flip(); show(homeScreen);
    Voice.say('Ciao! Giochiamo!');
  });
  lg.className = 'btn blue';
  // chiudi: funziona nell'app installata (Android/PC); dove il sistema non lo permette spiega come uscire
  const cl = tap(el('div', { left: '226px', top: '700px', width: '170px', height: '54px', fontSize: '24px' }, stage, '✖ Chiudi'), () => {
    SFX.no();
    Music.stop();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    window.close();
    setTimeout(() => {   // se siamo ancora qui, il sistema non ha permesso di chiudere
      if (document.getElementById('bye')) return;
      const o = el('div', { position: 'absolute', inset: '0', zIndex: '700', background: 'rgba(0,0,40,.7)' });
      o.id = 'bye';
      const box = el('div', { position: 'absolute', left: '162px', top: '200px', width: '700px', height: '330px', background: '#ffec3d',
        border: '10px solid #ff2a1a', boxShadow: '0 0 0 6px #222', boxSizing: 'border-box', textAlign: 'center' }, o);
      el('div', { marginTop: '34px' }, box, '<span class="title" style="font-size:52px">Ciao ciao! 👋</span>');
      el('div', { margin: '22px 40px 0', fontSize: '26px', color: '#5a1000', fontFamily: 'sans-serif', fontWeight: '700' }, box,
        'Per uscire usa il tasto Home<br>o scorri verso l\'alto dal basso.');
      const back = tap(el('div', { left: '220px', top: '220px', width: '240px', height: '70px', fontSize: '30px' }, box, '◀ Resta'), () => { SFX.tap(); o.remove(); });
      back.className = 'btn green';
    }, 400);
  });
  cl.className = 'btn';
}

// =====================================================================
//  SCELTA DELLE FIGURE (per Memory e Colorare): i 5 temi
// =====================================================================
function themePick(game) {
  bg('linear-gradient(#2fd38b,#18b070)');
  const pos = [[90, 50], [392, 50], [694, 50], [90, 380], [392, 380], [694, 380]];
  THEMES.forEach((t, i) => {
    const tile = el('div', { left: px(pos[i][0]), top: px(pos[i][1]), width: '240px', height: '240px', borderColor: t.frame }, stage);
    tile.className = 'tile';
    const c = pxCanvas(80, 80, 2.75, { left: '0', top: '0' }, tile);
    const x = c.getContext('2d');
    const spots = [[6, 22], [44, 16], [10, 50], [46, 48]];
    const paint = () => {
      drawScene(x, 80, 80, t, i + 3);
      spots.forEach(([sx, sy], k) => x.drawImage(sprite(t.items[k * 2], 32), sx, sy, 32, 32));
    };
    paint();
    if (spots.some((_, k) => isAnimated(t.items[k * 2]))) onAnim(paint);
    el('div', { position: 'absolute', left: '0', right: '0', bottom: '-56px', textAlign: 'center' }, tile,
      `<span class="title" style="font-size:30px">${t.name}</span>`);
    tap(tile, () => { SFX.flip(); show(game, t); });
  });
  backBtn(() => show(homeScreen));
}

// =====================================================================
//  MEMORY
// =====================================================================
// ---------- voce guida (sintesi vocale del telefono, in italiano) ----------
const NAMES = {
  '🐄': 'la mucca', '🐖': 'il maiale', '🐔': 'la gallina', '🐑': 'la pecora', '🐴': 'il cavallo', '🐱': 'il gatto', '🐶': 'il cane',
  '🦆': "l'anatra", '🐰': 'il coniglio', '🐐': 'la capra',
  '🚗': 'la macchina', '🚌': "l'autobus", '🚒': 'il camion dei pompieri', '🚑': "l'ambulanza", '🚜': 'il trattore', '✈️': "l'aereo",
  '🚁': "l'elicottero", '🚢': 'la nave', '🚂': 'il treno', '🚲': 'la bicicletta',
  '🍎': 'la mela', '🍌': 'la banana', '🍇': "l'uva", '🍐': 'la pera', '🍊': "l'arancia", '🍓': 'la fragola', '🍒': 'le ciliegie',
  '🍉': "l'anguria", '🍍': "l'ananas", '🍋': 'il limone',
  '🚀': 'il razzo', '🛸': 'il disco volante', '🪐': 'il pianeta', '🌙': 'la luna', '👩‍🚀': "l'astronauta", '🛰️': 'il satellite',
  '⭐': 'la stella', '☄️': 'la cometa', '🌍': 'la Terra', '👽': "l'alieno",
  '🦒': 'la giraffa', '🐘': "l'elefante", '🦁': 'il leone', '🐊': 'il coccodrillo', '🐵': 'la scimmia', '🦓': 'la zebra', '🐻': "l'orso",
  '🐧': 'il pinguino', '🦛': "l'ippopotamo", '🐯': 'la tigre',
  '🌼': 'la margherita', '🌷': 'il tulipano', '🌻': 'il girasole', '🌹': 'la rosa', '🌸': 'il fiore di ciliegio', '💐': 'il mazzo di fiori',
  '🦋': 'la farfalla', '🐞': 'la coccinella', '🌺': "l'ibisco", '🍀': 'il quadrifoglio',
};
const NAMES_EN = {
  '🐄': 'the cow', '🐖': 'the pig', '🐔': 'the hen', '🐑': 'the sheep', '🐴': 'the horse', '🐱': 'the cat', '🐶': 'the dog',
  '🦆': 'the duck', '🐰': 'the bunny', '🐐': 'the goat',
  '🚗': 'the car', '🚌': 'the bus', '🚒': 'the fire truck', '🚑': 'the ambulance', '🚜': 'the tractor', '✈️': 'the airplane',
  '🚁': 'the helicopter', '🚢': 'the ship', '🚂': 'the train', '🚲': 'the bicycle',
  '🍎': 'the apple', '🍌': 'the banana', '🍇': 'the grapes', '🍐': 'the pear', '🍊': 'the orange', '🍓': 'the strawberry', '🍒': 'the cherries',
  '🍉': 'the watermelon', '🍍': 'the pineapple', '🍋': 'the lemon',
  '🚀': 'the rocket', '🛸': 'the flying saucer', '🪐': 'the planet', '🌙': 'the moon', '👩‍🚀': 'the astronaut', '🛰️': 'the satellite',
  '⭐': 'the star', '☄️': 'the comet', '🌍': 'the Earth', '👽': 'the alien',
  '🦒': 'the giraffe', '🐘': 'the elephant', '🦁': 'the lion', '🐊': 'the crocodile', '🐵': 'the monkey', '🦓': 'the zebra', '🐻': 'the bear',
  '🐧': 'the penguin', '🦛': 'the hippo', '🐯': 'the tiger',
  '🌼': 'the daisy', '🌷': 'the tulip', '🌻': 'the sunflower', '🌹': 'the rose', '🌸': 'the cherry blossom', '💐': 'the bouquet',
  '🦋': 'the butterfly', '🐞': 'the ladybug', '🌺': 'the hibiscus', '🍀': 'the four-leaf clover',
  '🐌': 'the snail', '🐝': 'the bee', '🐦': 'the little bird', '🐸': 'the frog', '🍄': 'the mushroom', '⚽': 'the ball', '🪁': 'the kite',
  '🐿️': 'the squirrel', '🕊️': 'the dove', '🎈': 'the balloon', '🐠': 'the tropical fish', '🐟': 'the fish', '🐙': 'the octopus',
  '🐬': 'the dolphin', '🐳': 'the whale', '🐢': 'the turtle', '🦑': 'the squid', '⛵': 'the sailboat', '🦀': 'the crab',
  '🐚': 'the seashell', '🏐': 'the beach ball', '🍦': 'the ice cream', '🕶️': 'the sunglasses', '⛱️': 'the beach umbrella', '🏰': 'the castle',
  '🦩': 'the flamingo', '👒': 'the hat', '🖼️': 'the picture', '⏰': 'the alarm clock', '🌈': 'the rainbow', '🧸': 'the teddy bear',
  '🧩': 'the puzzle', '📚': 'the books', '🎁': 'the present', '👟': 'the shoe', '🧦': 'the socks', '🖍️': 'the crayons', '🎨': 'the paint palette',
  '🪀': 'the yo-yo', '📖': 'the book', '🌟': 'the little star', '🔭': 'the telescope', '🦔': 'the hedgehog', '🌳': 'the tree',
};
const PRAISE_EN = ['Good job!', 'Well done!', 'Great!', 'Awesome!', 'Super!', 'Hooray!'];
const RETRY_EN = ['Almost… try again!', 'Oops… try again!', 'Not a match… try again!', 'So close… try again!'];
// frasi fisse: italiano -> inglese
const SAY_EN = {
  'Bravissima! Hai trovato tutte le coppie!': 'Well done! You found all the pairs!',
  'Bravissima! Hai trovato tutti i particolari!': 'Well done! You found all the details!',
  'Trova i particolari!': 'Find the details!', 'Trova le differenze!': 'Spot the differences!',
  'Bravissima! Hai trovato tutte le differenze!': 'Well done! You found all the differences!', 'Livello difficile. Pronti? Via!': 'Hard level. Ready? Go!',
  'Guarda bene!': 'Look carefully!', 'Cerca ancora!': 'Keep looking!', 'Non è qui… riprova!': "It's not here… try again!",
  'Trovato!': 'Found it!', 'Sì!': 'Yes!', 'Bene!': 'Good!', 'Ciao! Giochiamo!': "Hi! Let's play!",
  'Bravissimi! Tutti trovati!': 'Great job! All found!', 'Nuovo record!': 'New record!',
};
const PRAISE = ['Brava!', 'Bravissima!', 'Che brava!', 'Molto bene!', 'Ben fatto!', 'Evviva!'];
const RETRY = ['Quasi… riprova!', 'Peccato… prova ancora!', 'Non sono uguali… riprova!', 'Ops… riprova!'];
const pick = a => a[rnd(a.length)];
const Voice = {
  on: store('voce') !== 'off',
  voice: null,
  ok: 'speechSynthesis' in window,
  choose() {
    if (!this.ok) return;
    const vs = speechSynthesis.getVoices().filter(v => /^it/i.test(v.lang));
    // voce femminile e più naturale possibile; niente voci maschili
    const male = /cosimo|luca|diego|giorgio|paolo|roberto|male\b|uomo/i;
    const female = /alice|federica|paola|elsa|isabella|emma|bianca|carla|silvia|google italiano|female|donna/i;
    const quality = /natural|neural|premium|enhanced|migliorat|siri|online/i;
    const score = v => (female.test(v.name) ? 4 : 0) + (quality.test(v.name) ? 3 : 0) + (v.localService ? 1 : 0) - (male.test(v.name) ? 10 : 0);
    this.voice = vs.sort((a, b) => score(b) - score(a))[0] || null;
  },
  clips: {},        // per lingua: insieme dei file audio registrati disponibili
  audio: null,
  loadClips(lang) {
    if (this.clips[lang]) return;
    this.clips[lang] = new Set();
    fetch(`voce/${lang}/elenco.json`).then(r => r.json()).then(l => { this.clips[lang] = new Set(l); }).catch(() => {});
  },
  slug: t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  duck(on) { if (Music.out && AC) Music.out.gain.setTargetAtTime(on ? 0.15 : 0.5, AC.currentTime, on ? 0.1 : 0.3); },
  stop() {
    if (this.audio) { this.audio.onended = null; this.audio.pause(); this.audio = null; }
    if (this.ok) speechSynthesis.cancel();
  },
  // frase fissa (scritta in italiano): viene tradotta se il gioco è in inglese
  say(text) {
    if (LANG === 'en') text = SAY_EN[text] || text;
    this.speak(text);
  },
  praise(emoji) {
    const n = (LANG === 'en' ? NAMES_EN : NAMES)[emoji];
    this.speak(pick(LANG === 'en' ? PRAISE_EN : PRAISE) + (n ? ' ' + capFirst(n) + '!' : ''));
  },
  retry() { this.speak(pick(LANG === 'en' ? RETRY_EN : RETRY)); },
  speak(text) {
    if (!this.on) return;
    this.stop();
    // 1) voce registrata: frase intera o pezzo per pezzo
    const have = this.clips[LANG] || new Set();
    const whole = this.slug(text) + '.mp3';
    const parts = have.has(whole) ? [whole] : (text.match(/[^!?.…]+[!?.…]+/g) || [text]).map(x => this.slug(x.trim()) + '.mp3');
    if (parts.every(f => have.has(f))) {
      this.duck(true);
      const play = i => {
        if (i >= parts.length) { this.audio = null; this.duck(false); return; }
        const a = new Audio(`voce/${LANG}/${parts[i]}`);
        this.audio = a; a.volume = 0.95;
        a.onended = () => play(i + 1);
        a.onerror = () => { this.duck(false); this.tts(text); };
        a.play().catch(() => { this.duck(false); this.tts(text); });
      };
      play(0);
      return;
    }
    // 2) riserva: sintesi vocale del telefono
    this.tts(text);
  },
  tts(text) {
    if (!this.ok) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG === 'en' ? 'en-US' : 'it-IT'; u.rate = 0.82; u.pitch = 1.15; u.volume = 0.9;   // calma e dolce
      if (LANG === 'it') { if (!this.voice) this.choose(); if (this.voice) u.voice = this.voice; }
      this.duck(true);
      u.onend = u.onerror = () => this.duck(false);
      speechSynthesis.speak(u);
    } catch (e) { /* niente voce: pazienza */ }
  },
};
Voice.loadClips(LANG);
if (Voice.ok) { Voice.choose(); speechSynthesis.onvoiceschanged = () => Voice.choose(); }
const capFirst = t => t.charAt(0).toUpperCase() + t.slice(1);

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
        const all = ++found === nCards / 2;
        const nome = NAMES[t.items[a.k]];
        if (all) Voice.say('Bravissima! Hai trovato tutte le coppie!'); else Voice.praise(t.items[a.k]);
        if (all) setTimeout(() => party('BRAVISSIMA!', () => show(memoryScreen, t, nCards), () => show(themePick, memoryScreen)), 900);
      } else {
        busy = true;
        Voice.retry();
        setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); busy = false; }, 1300);
      }
    });
  });
  backBtn(() => show(themePick, memoryScreen));
  // voce guida accesa/spenta
  if (Voice.ok) {
    const vb = tap(el('div', { left: '262px', top: '700px', width: '170px', height: '56px', fontSize: '24px' }, stage, Voice.on ? '🔊 Voce' : '🔇 Voce'), () => {
      Voice.on = !Voice.on; store('voce', Voice.on ? 'on' : 'off');
      vb.innerHTML = tr(Voice.on ? '🔊 Voce' : '🔇 Voce'); vb.className = 'btn ' + (Voice.on ? 'green' : 'blue');
      SFX.tap(); if (Voice.on) Voice.say('Ciao! Giochiamo!'); else Voice.stop();
    });
    vb.className = 'btn ' + (Voice.on ? 'green' : 'blue');
  }
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
// Disegni da colorare fatti a mano (coordinate su 64x64): contorni chiusi e zone grandi
const ART = (() => {
  const E = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); x.fill(); x.stroke(); };
  const stem = (x, cx, y0, y1) => { x.beginPath(); x.rect(cx - 1.8, y0, 3.6, y1 - y0); x.fill(); x.stroke(); };
  const leaf = (x, sx, sy, dir, len = 16) => {
    x.beginPath(); x.moveTo(sx, sy);
    x.quadraticCurveTo(sx + dir * len * 0.8, sy - len * 0.75, sx + dir * len, sy - 2);
    x.quadraticCurveTo(sx + dir * len * 0.55, sy + len * 0.35, sx, sy); x.fill(); x.stroke();
  };
  const smallFlower = (x, cx, cy, r) => {
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; E(x, cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.8, r * 0.8); }
    E(x, cx, cy, r * 0.6, r * 0.6);
  };
  return {
    '🌼': x => { // margherita
      stem(x, 32, 34, 63); leaf(x, 32, 52, -1); leaf(x, 32, 46, 1);
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; E(x, 32 + Math.cos(a) * 12.5, 22 + Math.sin(a) * 12.5, 4.3, 8, a + Math.PI / 2); }
      E(x, 32, 22, 7, 7);
    },
    '🌷': x => { // tulipano
      stem(x, 32, 36, 63); leaf(x, 32, 58, -1, 18); leaf(x, 32, 54, 1, 18);
      x.beginPath(); x.moveTo(18, 12); x.lineTo(25, 22); x.lineTo(32, 8); x.lineTo(39, 22); x.lineTo(46, 12);
      x.quadraticCurveTo(48, 36, 32, 39); x.quadraticCurveTo(16, 36, 18, 12); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(25, 22); x.quadraticCurveTo(26, 34, 32, 39); x.moveTo(39, 22); x.quadraticCurveTo(38, 34, 32, 39); x.stroke();
    },
    '🌻': x => { // girasole
      stem(x, 32, 36, 63); leaf(x, 32, 56, -1, 18); leaf(x, 32, 50, 1, 18);
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; E(x, 32 + Math.cos(a) * 15.5, 24 + Math.sin(a) * 15.5, 3.8, 7.5, a + Math.PI / 2); }
      E(x, 32, 24, 10.5, 10.5); E(x, 32, 24, 5, 5);
    },
    '🌹': x => { // rosa
      stem(x, 32, 32, 63); leaf(x, 32, 50, -1); leaf(x, 32, 42, 1);
      x.beginPath(); x.moveTo(30, 56); x.lineTo(27, 54); x.lineTo(30, 52); x.fill(); x.stroke();
      E(x, 32, 15, 13, 9);
      x.beginPath(); x.arc(32, 15, 6, 0.3, Math.PI * 1.7); x.stroke();
      x.beginPath(); x.arc(32, 15, 2.6, 0, Math.PI * 1.5); x.stroke();
      x.beginPath(); x.moveTo(17, 16); x.quadraticCurveTo(15, 36, 32, 38); x.quadraticCurveTo(49, 36, 47, 16);
      x.quadraticCurveTo(40, 25, 32, 21); x.quadraticCurveTo(24, 25, 17, 16); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(32, 21); x.quadraticCurveTo(30, 30, 32, 38); x.stroke();
    },
    '🌸': x => { // fiore di ciliegio
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        E(x, 32 + Math.cos(a) * 14, 32 + Math.sin(a) * 14, 11, 11);
      }
      E(x, 32, 32, 8, 8);
    },
    '💐': x => { // vaso di fiori
      x.beginPath(); x.moveTo(24, 40); x.lineTo(17, 22); x.moveTo(32, 40); x.lineTo(32, 16); x.moveTo(40, 40); x.lineTo(47, 22); x.stroke();
      leaf(x, 28, 36, -1, 12); leaf(x, 36, 34, 1, 12);
      smallFlower(x, 16, 18, 6.5); smallFlower(x, 32, 11, 6.5); smallFlower(x, 48, 18, 6.5);
      x.beginPath(); x.moveTo(21, 46); x.lineTo(43, 46); x.lineTo(40, 62); x.lineTo(24, 62); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.rect(18, 40, 28, 6); x.fill(); x.stroke();
    },
    '🦋': x => { // farfalla
      x.beginPath(); x.moveTo(31, 21); x.quadraticCurveTo(26, 8, 22, 9); x.moveTo(33, 21); x.quadraticCurveTo(38, 8, 42, 9); x.stroke();
      E(x, 19, 25, 13, 11, -0.5); E(x, 45, 25, 13, 11, 0.5);
      E(x, 22, 44, 10, 9, 0.4); E(x, 42, 44, 10, 9, -0.4);
      E(x, 17, 24, 4, 4); E(x, 47, 24, 4, 4); E(x, 21, 45, 3.5, 3.5); E(x, 43, 45, 3.5, 3.5);
      E(x, 32, 36, 3.5, 15); E(x, 32, 21, 4, 4);
    },
    '🐞': x => { // coccinella
      for (const side of [-1, 1]) for (const yy of [30, 38, 46]) { x.beginPath(); x.moveTo(32 + side * 14, yy); x.lineTo(32 + side * 24, yy + 3); x.stroke(); }
      x.beginPath(); x.moveTo(29, 12); x.quadraticCurveTo(24, 4, 20, 6); x.moveTo(35, 12); x.quadraticCurveTo(40, 4, 44, 6); x.stroke();
      E(x, 32, 18, 9, 8);
      E(x, 32, 38, 19, 19);
      x.beginPath(); x.moveTo(32, 20); x.lineTo(32, 57); x.stroke();
      E(x, 24, 30, 4, 4); E(x, 40, 30, 4, 4); E(x, 22, 43, 3.6, 3.6); E(x, 42, 43, 3.6, 3.6);
    },
  };
})();

function lineArt(emoji, res) {
  if (ART[emoji]) {
    const c = document.createElement('canvas'); c.width = c.height = res;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, res, res);
    x.save(); x.scale(res / 64, res / 64);
    x.lineWidth = 2; x.strokeStyle = '#000'; x.fillStyle = '#fff'; x.lineJoin = 'round'; x.lineCap = 'round';
    ART[emoji](x);
    x.restore();
    const im = x.getImageData(0, 0, res, res), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3 < 150 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    return im;
  }
  const c = document.createElement('canvas'); c.width = c.height = res;
  const x = c.getContext('2d');
  drawSubject(x, emoji, res, 0.8);
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
  // nero "quasi nero": sembra nero ma è diverso dalle linee, così la zona si può sempre ricolorare
  const pal = PALETTE.map(c => c === '#000000' ? '#1e1e1e' : c);
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
  backBtn(() => show(themePick, colorScreen));
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
    // nome unico per ogni salvataggio (data e ora locali), così non sovrascrive i precedenti
    const d = new Date(), z = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}-${z(d.getMinutes())}-${z(d.getSeconds())}`;
    a.download = `${name}-${stamp}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
}

// =====================================================================
//  DIPINGERE CON LE DITA
// =====================================================================
// ---------- formine e figure geometriche ----------
const SHAPES = ['cerchio', 'quadrato', 'triangolo', 'rombo', 'esagono', 'stella', 'cuore', 'luna', 'fiore', 'pesce'];
function shapePath(x, kind, c, r) {
  const poly = pts => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(c + a * r, c + b * r) : x.moveTo(c + a * r, c + b * r)); x.closePath(); x.fill(); };
  const circle = (a, b, rr) => { x.beginPath(); x.arc(c + a * r, c + b * r, rr * r, 0, Math.PI * 2); x.fill(); };
  const reg = (n, inner, rot) => {
    const m = n * (inner ? 2 : 1), p = [];
    for (let i = 0; i < m; i++) { const ang = rot + i * Math.PI * 2 / m; const k = inner && i % 2 ? inner : 1; p.push([Math.cos(ang) * k, Math.sin(ang) * k]); }
    return p;
  };
  switch (kind) {
    case 'cerchio': circle(0, 0, 1); break;
    case 'quadrato': poly([[-.85, -.85], [.85, -.85], [.85, .85], [-.85, .85]]); break;
    case 'triangolo': poly([[0, -1], [.95, .8], [-.95, .8]]); break;
    case 'rombo': poly([[0, -1], [.72, 0], [0, 1], [-.72, 0]]); break;
    case 'esagono': poly(reg(6, 0, 0)); break;
    case 'stella': poly(reg(5, .45, -Math.PI / 2)); break;
    case 'cuore':
      x.beginPath(); x.moveTo(c, c + r * .95);
      x.bezierCurveTo(c - r * 1.3, c + r * .1, c - r * .75, c - r * 1.05, c, c - r * .45);
      x.bezierCurveTo(c + r * .75, c - r * 1.05, c + r * 1.3, c + r * .1, c, c + r * .95); x.fill(); break;
    case 'luna':
      circle(0, 0, 1); x.globalCompositeOperation = 'destination-out'; circle(.45, -.25, .85); x.globalCompositeOperation = 'source-over'; break;
    case 'fiore':
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; circle(Math.cos(a) * .55, Math.sin(a) * .55, .45); }
      circle(0, 0, .4); break;
    case 'pesce':
      x.beginPath(); x.ellipse(c - r * .15, c, r * .75, r * .5, 0, 0, Math.PI * 2); x.fill();
      poly([[.45, 0], [1, -.6], [1, .6]]);
      x.globalCompositeOperation = 'destination-out'; circle(-.5, -.12, .1); x.globalCompositeOperation = 'source-over'; break;
  }
}
const shapeCache = new Map();
// forma a pixel netti (niente sfumature), del colore scelto
function shapeCanvas(kind, d, color) {
  const key = kind + d + color;
  if (shapeCache.has(key)) return shapeCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = d;
  const x = c.getContext('2d'); x.fillStyle = '#000';
  shapePath(x, kind, d / 2, d / 2 - 1);
  const im = x.getImageData(0, 0, d, d), D = im.data, [r, g, b] = hex2rgb(color);
  for (let i = 0; i < D.length; i += 4) { const on = D[i + 3] > 127; D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = on ? 255 : 0; }
  x.putImageData(im, 0, 0);
  shapeCache.set(key, c);
  return c;
}
const SHAPE_SIZE = { 1: 14, 3: 24, 7: 38 };

function paintScreen(t) {
  bg('#ffb3d1');
  // Bottoni grandi per le dita (anche sul cellulare): il foglio è 640x480
  const RW = 160, RH = 120, SC = 4;
  const frame = el('div', { position: 'absolute', left: '196px', top: '16px', width: px(RW * SC), height: px(RH * SC),
    border: '8px solid #1fb890', boxShadow: '0 0 0 5px #222, 8px 8px 0 rgba(0,0,0,.35)' });
  const c = pxCanvas(RW, RH, SC, { left: '0', top: '0' }, frame);
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, RW, RH);
  let color = '#1a5cff', size = 3, stamp = null, shape = null;
  const sws = [], tools = [];
  const selectSw = s => { sws.concat(tools).forEach(q => q.classList.remove('sel')); s.classList.add('sel'); };
  // tavolozza: 2 colonne x 8 righe
  PALETTE.forEach((col, i) => {
    const s = el('div', { left: px(12 + (i % 2) * 88), top: px(12 + Math.floor(i / 2) * 93), width: '82px', height: '86px', background: col });
    s.className = 'sw' + (col === color ? ' sel' : '');
    sws.push(s);
    tap(s, () => {
      color = col; stamp = null; SFX.tap();
      if (shape) { sws.forEach(q => q.classList.remove('sel')); s.classList.add('sel'); drawShapeIcons(); }
      else selectSw(s);
    });
  });
  // timbrini: 2 colonne x 5 righe
  const grid = el('div', { position: 'absolute', left: '856px', top: '92px', width: '162px', height: '460px' });
  const shapeIcons = [];
  const eraserRef = { el: null };
  function drawShapeIcons() {
    shapeIcons.forEach(({ img, k }) => { img.src = shapeCanvas(k, 32, color).toDataURL(); img.parentNode.style.background = color === '#ffffff' ? '#ccc' : '#fff'; });
  }
  function fillGrid(which) {
    grid.innerHTML = ''; shapeIcons.length = 0;
    tools.length = 0; if (eraserRef.el) tools.push(eraserRef.el);
    const list = which === 'forme' ? SHAPES : t.items;
    list.forEach((e, i) => {
      const b = el('div', { left: px((i % 2) * 84), top: px(Math.floor(i / 2) * 92), width: '78px', height: '86px', background: '#fff' }, grid);
      b.className = 'sw'; tools.push(b);
      if (which === 'forme') {
        const img = el('img', { width: '60px', height: '60px', margin: '13px 9px' }, b); img.className = 'px'; img.draggable = false;
        shapeIcons.push({ img, k: e });
        if (shape === e) b.classList.add('sel');
        tap(b, () => { shape = e; stamp = null; tools.forEach(q => q.classList.remove('sel')); b.classList.add('sel'); SFX.tap(); });
      } else {
        spriteImg(e, 64, b, { margin: '10px 5px' });
        if (stamp === e) b.classList.add('sel');
        tap(b, () => { stamp = e; shape = null; selectSw(b); SFX.tap(); });
      }
    });
    drawShapeIcons();
  }
  // linguette: timbrini / forme
  const tabEls = [];
  [['timbri', t.items[0]], ['forme', null]].forEach(([k, ic], i) => {
    const tb = el('div', { left: px(856 + i * 84), top: '12px', width: '78px', height: '70px', background: i ? '#fff' : '#ffec3d' });
    tb.className = 'sw';
    if (ic) spriteImg(ic, 52, tb, { margin: '6px 10px' });
    else { const im = el('img', { width: '52px', height: '52px', margin: '6px 10px' }, tb); im.className = 'px'; im.src = shapeCanvas('stella', 26, '#ff2a1a').toDataURL(); }
    tabEls.push(tb);
    tap(tb, () => { tabEls.forEach((q, j) => { q.style.background = j === i ? '#ffec3d' : '#fff'; }); fillGrid(k); SFX.flip(); });
  });
  // pennelli + gomma
  const sizes = [[1, 12], [3, 26], [7, 46]];
  const sb = [];
  const pickSize = (b, s) => { size = s; sb.forEach(q => q.classList.remove('sel')); b.classList.add('sel'); };
  sizes.forEach(([s, d], i) => {
    const b = el('div', { left: px(196 + i * 162), top: '530px', width: '150px', height: '100px', background: '#fff' });
    b.className = 'sw' + (s === size ? ' sel' : '');
    el('div', { width: px(d), height: px(d), background: '#000', borderRadius: '2px', margin: px((94 - d) / 2) + ' auto 0' }, b);
    sb.push(b);
    tap(b, () => { pickSize(b, s); SFX.tap(); if (stamp) { stamp = null; selectSw(sws[PALETTE.indexOf(color)] || sws[0]); } });
  });
  const eraser = el('div', { left: '682px', top: '530px', width: '150px', height: '100px', background: '#fff', fontSize: '60px',
    display: 'flex', alignItems: 'center', justifyContent: 'center' }, stage, '🧽');
  eraser.className = 'sw'; tools.push(eraser); eraserRef.el = eraser;
  fillGrid('timbri');
  tap(eraser, () => { color = '#ffffff'; stamp = null; shape = null; selectSw(eraser); pickSize(sb[2], 7); drawShapeIcons(); SFX.tap(); });

  const back = tap(el('div', { left: '196px', top: '648px', width: '300px', height: '104px', fontSize: '36px' }, stage, '◀ Indietro'), () => { SFX.tap(); show(homeScreen); });
  back.className = 'btn';
  const clear = tap(el('div', { left: '512px', top: '648px', width: '320px', height: '104px', fontSize: '36px' }, stage, '🗑 Cancella'), () => {
    SFX.no(); x.fillStyle = '#fff'; x.fillRect(0, 0, RW, RH);
  });
  clear.className = 'btn blue';
  const save = tap(el('div', { left: '856px', top: '568px', width: '162px', height: '184px', fontSize: '34px', flexDirection: 'column' }, stage, '<span style="font-size:64px">💾</span>Salva'), () => { SFX.ok(); saveCanvas(c, 'disegno', 6); });
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
    if (shape) { const d = SHAPE_SIZE[size]; x.drawImage(shapeCanvas(shape, d, color), px_ - (d >> 1), py_ - (d >> 1)); snd([[500 + rnd(500), .05], [900, .04]]); return; }
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
}

// =====================================================================
//  GIOCO DEI VESTITI (grafica moderna, vettoriale)
// =====================================================================
const DOLL = {
  cats: [
    { k: 'capelli', name: 'Capelli', icon: '💇‍♀️', styles: ['lunghi', 'coda', 'trecce', 'caschetto', 'chignon'] },
    { k: 'accessori', name: 'Accessori', icon: '👑', styles: ['niente', 'fiocco', 'corona', 'cappello', 'cerchietto', 'gattina'] },
    { k: 'sopra', name: 'Maglia', icon: '👚', styles: ['maglietta', 'felpa', 'canottiera', 'cuore', 'pois'] },
    { k: 'sotto', name: 'Gonna e pantaloni', icon: '👗', styles: ['gonna', 'tutù', 'pantaloni', 'pantaloncini', 'vestito lungo', 'pois'] },
    { k: 'scarpe', name: 'Scarpe', icon: '👟', styles: ['ballerine', 'stivali', 'sneakers', 'sandali'] },
    { k: 'occhi', name: 'Occhi', icon: '👀', styles: null },
    { k: 'pelle', name: 'Pelle', icon: '✋', styles: null },
  ],
  colors: ['#ff4f81', '#ff8fb1', '#ffc2d4', '#c77dff', '#7b5cff', '#4d96ff', '#7fd3f7',
    '#2ec4b6', '#7bd389', '#ffd23f', '#ff9f1c', '#ff5d5d', '#ffffff', '#2b2d42'],
  hair: ['#3b2219', '#6b3e26', '#a0663c', '#d9a066', '#f2d16b', '#e85d3f', '#ff8fb1'],
  skin: ['#ffe3d1', '#f6c9a8', '#e0a47a', '#b9784e', '#8a5532', '#5c3720'],
  eyes: ['#6b4430', '#3d7bd9', '#2e9e6a', '#7a5cff', '#2b2d42', '#b07a45'],
  crop: { capelli: '60 10 280 380', accessori: '60 10 280 240', sopra: '96 250 208 170', sotto: '86 350 228 230', scarpe: '130 455 140 125' },
};
DOLL.catsM = [
  { k: 'capelli', name: 'Capelli', icon: '💇‍♂️', styles: ['corti', 'spettinati', 'riccioli', 'ciuffo', 'rasati'] },
  { k: 'accessori', name: 'Accessori', icon: '🧢', styles: ['niente', 'cappellino', 'occhiali', 'bandana', 'corona'] },
  { k: 'sopra', name: 'Maglia', icon: '👕', styles: ['maglietta', 'felpa', 'canottiera', 'righe', 'stella'] },
  { k: 'sotto', name: 'Pantaloni', icon: '👖', styles: ['pantaloni', 'jeans', 'pantaloncini', 'salopette'] },
  { k: 'scarpe', name: 'Scarpe', icon: '👟', styles: ['scarpe', 'sneakers', 'stivali', 'sandali'] },
  { k: 'occhi', name: 'Occhi', icon: '👀', styles: null },
  { k: 'pelle', name: 'Pelle', icon: '✋', styles: null },
];
DOLL.catsOf = g => g === 'm' ? DOLL.catsM : DOLL.cats;
DOLL.palette = k => k === 'pelle' ? DOLL.skin : k === 'occhi' ? DOLL.eyes : k === 'capelli' ? DOLL.hair.concat(DOLL.colors) : DOLL.colors;

function shade(h, a) {
  const f = v => Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a)));
  const [r, g, b] = hex2rgb(h);
  return '#' + [r, g, b].map(v => f(v).toString(16).padStart(2, '0')).join('');   // esadecimale: si può ri-sfumare
}

// Restituisce il codice SVG della bambina (S.g = 'f') o del bambino (S.g = 'm') vestiti secondo lo stato S
function dollSVG(S, vb = '0 0 400 600', id = 'd') {
  const C = S.color, boy = S.g === 'm', st = k => DOLL.catsOf(S.g).find(c => c.k === k).styles[S.style[k]];
  const line = c => shade(c, -0.28);
  const P = (part, d, color, fill) => `<path data-part="${part}" d="${d}" fill="${fill || color}" stroke="${line(color)}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  const E = (part, cx, cy, rx, ry, color, extra = '') => `<ellipse data-part="${part}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}" stroke="${line(color)}" stroke-width="3" ${extra}/>`;
  const limb = (d, w) => `<path data-part="pelle" d="${d}" fill="none" stroke="${line(C.pelle)}" stroke-width="${w + 6}" stroke-linecap="round"/>` +
    `<path data-part="pelle" d="${d}" fill="none" stroke="${C.pelle}" stroke-width="${w}" stroke-linecap="round"/>`;
  const pois = k => `<pattern id="${id}-pois-${k}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${C[k]}"/>` +
    `<circle cx="6" cy="6" r="4.5" fill="#fff" opacity=".9"/><circle cx="18" cy="18" r="4.5" fill="#fff" opacity=".9"/></pattern>`;
  const righe = `<pattern id="${id}-righe" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${C.sopra}"/>` +
    `<rect y="12" width="20" height="7" fill="#fff" opacity=".9"/></pattern>`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${pois('sopra')}${pois('sotto')}${righe}` +
    `<radialGradient id="${id}-hl" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  const H = C.capelli, hair = st('capelli');

  // --- capelli dietro ---
  const cap = 'M108,182 C100,72 300,72 292,182 Z';
  if (hair === 'lunghi') s += P('capelli', 'M104,178 C96,64 304,64 296,178 L306,330 C292,348 278,330 264,348 C250,330 236,348 222,336 L178,336 C164,348 150,330 136,348 C122,330 108,348 94,330 Z', H);
  if (hair === 'coda') s += P('capelli', cap, H) + P('capelli', 'M262,104 C340,80 368,170 336,262 C324,300 302,322 290,300 C318,240 312,168 262,140 Z', H);
  if (hair === 'trecce') {
    s += P('capelli', cap, H);
    for (const side of [-1, 1]) {
      const x = 200 + side * 96;
      for (let y = 206; y <= 318; y += 28) s += E('capelli', x, y, 19, 17, H);
      s += E('accessori', x, 344, 11, 9, C.accessori);
    }
  }
  if (hair === 'caschetto') s += P('capelli', 'M100,182 C92,66 308,66 300,182 L302,266 C272,280 250,266 238,272 L162,272 C150,266 128,280 98,266 Z', H);
  if (hair === 'chignon') s += P('capelli', cap, H) + E('capelli', 200, 70, 42, 38, H);
  const capM = 'M106,184 C98,74 302,74 294,184 Z';
  if (hair === 'corti' || hair === 'spettinati' || hair === 'ciuffo') s += P('capelli', capM, H);
  if (hair === 'riccioli') {
    s += P('capelli', capM, H);
    for (let a = 160; a <= 380; a += 20) s += E('capelli', 200 + 100 * Math.cos(a * Math.PI / 180), 176 + 92 * Math.sin(a * Math.PI / 180), 24, 24, H);
  }

  // --- gambe e piedi ---
  s += limb('M183,380 L181,540', 26) + limb('M217,380 L219,540', 26);
  s += E('pelle', 177, 550, 19, 10, C.pelle) + E('pelle', 223, 550, 19, 10, C.pelle);

  // --- scarpe ---
  const sh = st('scarpe'), cs = C.scarpe;
  if (sh === 'ballerine') s += E('scarpe', 176, 550, 23, 13, cs) + E('scarpe', 224, 550, 23, 13, cs) +
    `<circle data-part="scarpe" cx="176" cy="542" r="5" fill="${shade(cs, .5)}"/><circle data-part="scarpe" cx="224" cy="542" r="5" fill="${shade(cs, .5)}"/>`;
  if (sh === 'stivali') s += P('scarpe', 'M164,468 h34 v74 q0,18 -16,18 h-22 q-12,0 -12,-10 q0,-8 16,-10 Z', cs) +
    P('scarpe', 'M202,468 h34 v74 q0,10 12,10 q4,8 -10,8 h-20 q-16,0 -16,-18 Z', cs);
  if (sh === 'sneakers') {
    for (const x of [176, 224]) {
      s += P('scarpe', `M${x - 26},552 q0,-22 18,-22 h14 q20,0 20,22 Z`, cs);
      s += `<rect data-part="scarpe" x="${x - 27}" y="550" width="56" height="9" rx="4.5" fill="#fff" stroke="${line(cs)}" stroke-width="2"/>`;
      s += `<path d="M${x - 6},536 h10 M${x - 8},542 h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  if (sh === 'scarpe') for (const x of [176, 224]) {
    s += P('scarpe', `M${x - 24},554 q0,-22 16,-23 h14 q20,0 20,23 Z`, cs);
    s += `<rect data-part="scarpe" x="${x - 25}" y="552" width="52" height="7" rx="3.5" fill="${shade(cs, -.35)}"/>`;
    s += `<path d="M${x - 4},538 l8,4 M${x - 4},544 l8,-4" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (sh === 'sandali') for (const x of [177, 223]) s += `<rect data-part="scarpe" x="${x - 20}" y="540" width="40" height="7" rx="3.5" fill="${cs}" stroke="${line(cs)}" stroke-width="2"/>` +
    E('scarpe', x, 560, 24, 6, cs);

  // --- sotto ---
  const bo = st('sotto'), cb = C.sotto, fb = bo === 'pois' ? `url(#${id}-pois-sotto)` : null;
  if (bo === 'gonna' || bo === 'pois') s += P('sotto', 'M158,366 L242,366 L274,452 Q200,472 126,452 Z', cb, fb);
  if (bo === 'tutù') {
    const tut = y0 => { let d = `M155,${y0 - 70} L245,${y0 - 70} L289,${y0}`; for (let i = 0; i < 7; i++) d += ' q-13,15 -26,0'; return d + ' Z'; };
    s += P('sotto', tut(446), shade(cb, .35)) + P('sotto', tut(428), cb);
  }
  if (bo === 'pantaloni' || bo === 'jeans' || bo === 'salopette') s += P('sotto', 'M160,364 L240,364 L244,540 L207,540 L200,420 L193,540 L156,540 Z', cb);
  if (bo === 'jeans') s += `<path d="M176,420 L174,536 M224,420 L226,536 M162,380 Q178,392 190,380 M210,380 Q222,392 238,380" fill="none" stroke="${shade(cb, .45)}" stroke-width="2.5" stroke-dasharray="6 4"/>` +
    `<path d="M157,528 L193,528 M207,528 L243,528" stroke="${shade(cb, -.2)}" stroke-width="5"/>`;
  if (bo === 'pantaloncini') s += P('sotto', 'M160,364 L240,364 L248,430 L207,430 L200,402 L193,430 L152,430 Z', cb);
  if (bo === 'vestito lungo') s += P('sotto', 'M160,356 L240,356 L286,498 Q200,520 114,498 Z', cb) +
    `<path d="M134,468 Q200,486 266,468" fill="none" stroke="${shade(cb, .45)}" stroke-width="6" stroke-linecap="round"/>`;

  // --- braccia ---
  s += limb('M158,292 C140,330 132,360 130,390', 24) + limb('M242,292 C260,330 268,360 270,390', 24);
  s += E('pelle', 130, 397, 15, 15, C.pelle) + E('pelle', 270, 397, 15, 15, C.pelle);

  // --- sopra ---
  const to = st('sopra'), ct = C.sopra, ft = to === 'pois' ? `url(#${id}-pois-sopra)` : to === 'righe' ? `url(#${id}-righe)` : null;
  const torso = 'M150,284 Q200,270 250,284 L247,382 Q200,392 153,382 Z';
  if (to === 'maglietta' || to === 'cuore' || to === 'pois' || to === 'righe' || to === 'stella') {
    s += P('sopra', 'M154,284 L122,318 L144,336 L164,314 Z', ct, ft) + P('sopra', 'M246,284 L278,318 L256,336 L236,314 Z', ct, ft);
    s += P('sopra', torso, ct, ft);
    s += `<path d="M182,279 Q200,298 218,279" fill="none" stroke="${line(ct)}" stroke-width="3"/>`;
    if (to === 'stella') {
      const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; pts.push((200 + Math.cos(a) * r).toFixed(1) + ',' + (334 + Math.sin(a) * r).toFixed(1)); }
      s += `<polygon points="${pts.join(' ')}" fill="#ffd23f" stroke="${line('#ffd23f')}" stroke-width="2" stroke-linejoin="round"/>`;
    }
    if (to === 'cuore') s += `<path d="M200,352 C176,334 178,312 192,312 C198,312 200,318 200,320 C200,318 202,312 208,312 C222,312 224,334 200,352 Z" fill="#fff" stroke="${line(ct)}" stroke-width="2"/>`;
  }
  if (to === 'felpa') {
    s += P('sopra', 'M154,282 C136,322 124,352 116,386 L144,394 C150,362 158,336 168,312 Z', ct);
    s += P('sopra', 'M246,282 C264,322 276,352 284,386 L256,394 C250,362 242,336 232,312 Z', ct);
    s += P('sopra', torso, ct);
    s += `<rect data-part="sopra" x="172" y="342" width="56" height="26" rx="10" fill="${shade(ct, -.1)}" stroke="${line(ct)}" stroke-width="2"/>`;
    s += `<path d="M190,286 v26 M210,286 v26" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (to === 'canottiera') {
    s += P('sopra', 'M162,292 Q200,282 238,292 L244,382 Q200,392 156,382 Z', ct);
    s += `<rect data-part="sopra" x="166" y="270" width="9" height="26" rx="4" fill="${ct}"/><rect data-part="sopra" x="225" y="270" width="9" height="26" rx="4" fill="${ct}"/>`;
  }

  if (bo === 'salopette') {
    s += P('sotto', 'M166,302 L234,302 L236,374 L164,374 Z', cb);
    s += `<path data-part="sotto" d="M170,304 L162,280 M230,304 L238,280" stroke="${cb}" stroke-width="10" stroke-linecap="round"/>`;
    s += `<circle cx="172" cy="310" r="5" fill="#ffd23f"/><circle cx="228" cy="310" r="5" fill="#ffd23f"/>`;
  }

  // --- collo, orecchie, testa ---
  s += `<rect data-part="pelle" x="186" y="252" width="28" height="34" rx="12" fill="${C.pelle}" stroke="${line(C.pelle)}" stroke-width="3"/>`;
  s += E('pelle', 112, 192, 16, 18, C.pelle) + E('pelle', 288, 192, 16, 18, C.pelle);
  s += E('pelle', 200, 182, 90, 86, C.pelle);
  // occhi
  for (const x of [163, 237]) {
    s += E('occhi', x, 194, 16, 20, C.occhi);
    s += `<ellipse data-part="occhi" cx="${x}" cy="198" rx="9" ry="12" fill="#1d1b2c"/>`;
    s += `<circle data-part="occhi" cx="${x - 6}" cy="187" r="6" fill="#fff"/><circle data-part="occhi" cx="${x + 5}" cy="204" r="2.8" fill="#fff"/>`;
    const o = x < 200 ? -1 : 1;
    if (!boy) s += `<path d="M${x + o * 13},180 l${o * 9},-7 M${x + o * 16},188 l${o * 10},-3" stroke="#1d1b2c" stroke-width="3" stroke-linecap="round"/>`;
  }
  s += boy ? `<path d="M146,163 Q163,156 180,161 M220,161 Q237,156 254,163" fill="none" stroke="${line(H)}" stroke-width="6.5" stroke-linecap="round"/>`
    : `<path d="M148,164 Q163,154 178,162 M222,162 Q237,154 252,164" fill="none" stroke="${line(H)}" stroke-width="4.5" stroke-linecap="round"/>`;
  s += `<ellipse cx="140" cy="226" rx="17" ry="10" fill="#ff7aa2" opacity="${boy ? .28 : .45}"/><ellipse cx="260" cy="226" rx="17" ry="10" fill="#ff7aa2" opacity="${boy ? .28 : .45}"/>`;
  s += `<path d="M195,216 Q200,220 205,216" fill="none" stroke="${line(C.pelle)}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<path d="M182,232 Q200,256 218,232 Z" fill="#e0446a" stroke="#b8264f" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M190,243 Q200,236 210,243 Q200,252 190,243 Z" fill="#ff8fab"/>`;

  // --- frangia ---
  const FRONT_M = {
    corti: 'M108,170 C102,82 298,82 292,170 C282,140 250,124 222,130 C204,120 172,122 152,134 C130,140 114,152 108,170 Z',
    spettinati: 'M106,176 L98,124 L130,130 L122,86 L160,104 L168,62 L200,94 L226,56 L242,98 L278,76 L272,124 L304,120 L294,176 C280,140 240,126 200,134 C160,126 120,140 106,176 Z',
    ciuffo: 'M108,172 C100,96 160,70 230,72 C290,74 306,120 292,172 C282,136 246,120 206,126 C166,120 126,140 108,172 Z',
    rasati: 'M112,158 C110,84 290,84 288,158 C262,122 138,122 112,158 Z',
  };
  if (boy) {
    if (FRONT_M[hair]) s += P('capelli', FRONT_M[hair], H);
    if (hair === 'ciuffo') s += P('capelli', 'M128,112 C140,56 236,40 286,70 C300,80 296,100 280,104 C250,80 196,84 128,112 Z', H);
    if (hair === 'riccioli') [[128, 132], [160, 110], [200, 102], [240, 110], [272, 132]].forEach(([cx, cy]) => { s += E('capelli', cx, cy, 23, 23, H); });
  } else if (hair === 'caschetto') s += P('capelli', 'M106,190 C98,78 302,78 294,190 C290,160 280,140 270,132 L130,132 C120,140 110,160 106,190 Z', H);
  else s += P('capelli', 'M108,188 C98,80 302,80 292,188 C284,152 268,128 246,122 C238,142 218,150 200,140 C182,152 160,148 152,126 C130,135 114,160 108,188 Z', H);
  s += `<path d="M150,104 Q200,78 250,104" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="8" stroke-linecap="round"/>`;
  if (!boy && (hair === 'coda' || hair === 'chignon')) s += E('accessori', hair === 'coda' ? 270 : 200, hair === 'coda' ? 116 : 104, 11, 9, C.accessori);

  // --- accessori ---
  const ac = st('accessori'), ca = C.accessori;
  if (ac === 'fiocco') s += P('accessori', 'M262,104 C236,74 226,122 262,112 Z', ca) + P('accessori', 'M262,104 C288,74 298,122 262,112 Z', ca) + E('accessori', 262, 108, 9, 9, shade(ca, -.1));
  if (ac === 'corona') s += P('accessori', 'M140,108 L148,54 L174,86 L200,42 L226,86 L252,54 L260,108 Q200,96 140,108 Z', ca) +
    `<circle cx="200" cy="90" r="7" fill="#fff"/><circle cx="166" cy="98" r="5" fill="#fff" opacity=".85"/><circle cx="234" cy="98" r="5" fill="#fff" opacity=".85"/>`;
  if (ac === 'cappello') s += E('accessori', 200, 112, 146, 28, ca) + P('accessori', 'M134,112 C134,36 266,36 266,112 Z', ca) +
    `<path d="M136,98 Q200,86 264,98" fill="none" stroke="#fff" stroke-width="10"/>` + E('accessori', 240, 96, 12, 10, '#ff8fb1');
  if (ac === 'cerchietto') s += `<path data-part="accessori" d="M110,160 C126,62 274,62 290,160" fill="none" stroke="${line(ca)}" stroke-width="18" stroke-linecap="round"/>` +
    `<path data-part="accessori" d="M110,160 C126,62 274,62 290,160" fill="none" stroke="${ca}" stroke-width="12" stroke-linecap="round"/>` +
    [0, 72, 144, 216, 288].map(a => E('accessori', 252 + 12 * Math.cos(a * Math.PI / 180), 88 + 12 * Math.sin(a * Math.PI / 180), 8, 8, '#fff')).join('') + E('accessori', 252, 88, 6, 6, '#ffd23f');
  if (ac === 'cappellino') s += P('accessori', 'M110,148 C108,70 292,70 290,148 Z', ca) +
    P('accessori', 'M96,142 Q200,206 304,142 Q200,168 96,142 Z', shade(ca, -.12)) + E('accessori', 200, 76, 9, 6, shade(ca, -.15));
  if (ac === 'occhiali') s += `<rect data-part="accessori" x="136" y="174" width="54" height="40" rx="14" fill="#2b2d42" fill-opacity=".88" stroke="${ca}" stroke-width="6"/>` +
    `<rect data-part="accessori" x="210" y="174" width="54" height="40" rx="14" fill="#2b2d42" fill-opacity=".88" stroke="${ca}" stroke-width="6"/>` +
    `<path data-part="accessori" d="M190,190 Q200,182 210,190" fill="none" stroke="${ca}" stroke-width="6"/>` +
    `<path d="M146,184 l14,-4 M220,184 l14,-4" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
  if (ac === 'bandana') s += P('accessori', 'M106,150 C150,120 250,120 294,150 L292,170 C250,142 150,142 108,170 Z', ca) +
    P('accessori', 'M288,152 L320,138 L314,172 Z', ca) + P('accessori', 'M288,162 L318,184 L294,188 Z', ca);
  if (ac === 'gattina') {
    s += P('accessori', 'M128,118 L132,48 L184,92 Z', ca) + P('accessori', 'M272,118 L268,48 L216,92 Z', ca);
    s += `<path d="M140,104 L142,70 L168,92 Z M260,104 L258,70 L232,92 Z" fill="#ffc2d4"/>`;
  }
  // luce morbida sulla testa
  s += `<ellipse cx="200" cy="170" rx="90" ry="86" fill="url(#${id}-hl)" pointer-events="none"/>`;
  return s + '</svg>';
}

let dressState = null;
function dressDefault() {
  return {
    g: 'f',
    style: { capelli: 0, accessori: 1, sopra: 3, sotto: 1, scarpe: 0 },
    color: { capelli: '#a0663c', accessori: '#ff4f81', sopra: '#c77dff', sotto: '#ff8fb1', scarpe: '#ff4f81', occhi: '#6b4430', pelle: '#ffe3d1' },
  };
}
function dressDefaultM() {
  return {
    g: 'm',
    style: { capelli: 0, accessori: 0, sopra: 3, sotto: 2, scarpe: 1 },
    color: { capelli: '#6b3e26', accessori: '#4d96ff', sopra: '#4d96ff', sotto: '#2b2d42', scarpe: '#ff5d5d', occhi: '#6b4430', pelle: '#ffe3d1' },
  };
}
function dressScreen() {
  if (!dressState) {
    try { dressState = JSON.parse(store('vestiti3') || 'null'); } catch (e) { dressState = null; }
    if (!dressState || !dressState.f || !dressState.m) {
      let old = null;
      try { old = JSON.parse(store('vestiti2') || 'null'); } catch (e) { old = null; }
      const f = old && old.style && old.style.capelli !== undefined ? Object.assign(old, { g: 'f' }) : dressDefault();
      dressState = { g: 'f', f, m: dressDefaultM() };
    }
  }
  let S = dressState[dressState.g];
  let cat = 'sopra';
  stage.classList.add('modern');
  bg('radial-gradient(circle at 25% 35%, #fff0f7 0%, #ffd6ec 35%, #e7c6ff 75%, #c8b6ff 100%)');
  // brillantini
  [[60, 120], [420, 90], [90, 520], [460, 430], [250, 40], [40, 330]].forEach(([x, y], i) => {
    const t = el('div', { left: px(x), top: px(y), fontSize: px(22 + (i % 3) * 8), animationDelay: (i * 0.4) + 's' }, stage, '✨');
    t.className = 'twinkle';
  });
  // pedana
  el('div', { position: 'absolute', left: '80px', top: '648px', width: '360px', height: '50px', borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(123,44,191,.35), rgba(123,44,191,0) 70%)' });
  const doll = el('div', { position: 'absolute', left: '54px', top: '72px', width: '413px', height: '620px' });

  const panel = el('div', { left: '520px', top: '20px', width: '484px', height: '728px' }); panel.className = 'm-panel';
  const tabs = el('div', { position: 'absolute', left: '18px', top: '18px', right: '18px', height: '60px' }, panel);
  const title = el('div', { left: '24px', top: '92px' }, panel); title.className = 'm-label';
  const body = el('div', { position: 'absolute', left: '0', top: '136px', right: '0', bottom: '0' }, panel);

  function save() { store('vestiti3', JSON.stringify(dressState)); }
  function drawDoll(pop) {
    doll.innerHTML = dollSVG(S, '0 0 400 600', 'main');
    doll.firstChild.style.width = '100%'; doll.firstChild.style.height = '100%';
    if (pop) { doll.classList.remove('mpop'); void doll.offsetWidth; doll.classList.add('mpop'); }
    save();
  }
  function drawPanel() {
    tabs.innerHTML = '';
    DOLL.catsOf(S.g).forEach((c, i) => {
      const b = el('div', { left: px(i * 64), top: '0' }, tabs, c.icon);
      b.className = 'm-tab' + (c.k === cat ? ' on' : '');
      tap(b, () => { cat = c.k; SFX.tap(); drawPanel(); });
    });
    const c = DOLL.catsOf(S.g).find(c => c.k === cat);
    title.textContent = tr(c.name);
    body.innerHTML = '';
    let y = 0;
    if (c.styles) {
      c.styles.forEach((name, i) => {
        const t = el('div', { left: px(24 + (i % 3) * 148), top: px(y + Math.floor(i / 3) * 148), width: '136px', height: '136px' }, body);
        t.className = 'm-thumb' + (S.style[cat] === i ? ' on' : '');
        const preview = { g: S.g, style: Object.assign({}, S.style, { [cat]: i }), color: S.color };
        if (cat === 'scarpe') preview.style.sotto = S.g === 'm' ? 2 : 3;   // nelle anteprime le scarpe si vedono bene
        t.innerHTML = dollSVG(preview, cat === 'sotto' && S.g === 'm' ? '86 286 228 294' : DOLL.crop[cat], 't' + cat + i);
        tap(t, () => { S.style[cat] = i; SFX.flip(); drawDoll(true); drawPanel(); });
      });
      y += Math.ceil(c.styles.length / 3) * 148 + 8;
    }
    const pal = DOLL.palette(cat);
    const lab = el('div', { left: '24px', top: px(y), fontSize: '20px' }, body, 'Colori'); lab.className = 'm-label';
    y += 40;
    pal.forEach((col, i) => {
      const sw = el('div', { left: px(28 + (i % 7) * 62), top: px(y + Math.floor(i / 7) * 62), background: col }, body);
      sw.className = 'm-sw' + (S.color[cat] === col ? ' on' : '');
      tap(sw, () => { S.color[cat] = col; SFX.fill(); drawDoll(true); drawPanel(); });
    });
  }
  // scelta: bambina o bambino
  const who = [];
  [['f', '👧 Bambina', 20], ['m', '👦 Bambino', 200]].forEach(([g, label, x]) => {
    const b = tap(el('div', { left: px(x), top: '16px', width: '170px', height: '54px', fontSize: '22px' }, stage, label), () => {
      if (dressState.g === g) return;
      dressState.g = g; S = dressState[g];
      who.forEach(q => { q.className = 'm-btn' + (q.dataset.g === dressState.g ? ' primary' : ''); });
      SFX.flip(); drawDoll(true); drawPanel();
    });
    b.dataset.g = g; b.className = 'm-btn' + (g === dressState.g ? ' primary' : '');
    who.push(b);
  });
  // tocco sul personaggio: seleziona la parte toccata
  doll.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    const p = ev.target.closest && ev.target.closest('[data-part]');
    if (!p) return;
    cat = p.dataset.part; SFX.tap(); drawPanel();
  });

  // pulsanti in basso
  const back = tap(el('div', { left: '20px', top: '692px', width: '160px', height: '58px' }, stage, '← Indietro'), () => {
    SFX.tap(); show(homeScreen);
  });
  back.className = 'm-btn';
  const rand = tap(el('div', { left: '196px', top: '692px', width: '150px', height: '58px' }, stage, '🎲 A caso'), () => {
    for (const c of DOLL.catsOf(S.g)) {
      if (c.styles) S.style[c.k] = rnd(c.styles.length);
      if (c.k !== 'pelle' && c.k !== 'occhi') { const p = DOLL.palette(c.k); S.color[c.k] = p[rnd(p.length)]; }
    }
    if (rnd(2)) S.style.accessori = 0;
    SFX.ok(); drawDoll(true); drawPanel();
  });
  rand.className = 'm-btn primary';
  const photo = tap(el('div', { left: '362px', top: '692px', width: '140px', height: '58px' }, stage, '📸 Foto'), () => {
    SFX.win();
    const svg = dollSVG(S, '0 0 400 600', 'foto').replace('<defs>',
      '<defs><radialGradient id="bgf" cx="35%" cy="35%" r="80%"><stop offset="0" stop-color="#fff0f7"/><stop offset=".5" stop-color="#ffd6ec"/><stop offset="1" stop-color="#c8b6ff"/></radialGradient>')
      .replace('</defs>', '</defs><rect x="-50" y="-50" width="500" height="700" fill="url(#bgf)"/>');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 800; c.height = 1200;
      c.getContext('2d').drawImage(img, 0, 0, 800, 1200);
      saveCanvas(c, 'vestiti', 1);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  photo.className = 'm-btn';

  drawDoll(false);
  drawPanel();
}

// =====================================================================
//  TROVA I PARTICOLARI (grafica moderna)
// =====================================================================
Object.assign(NAMES, {
  '🐌': 'la lumaca', '🐝': "l'ape", '🐦': "l'uccellino", '🐸': 'la rana', '🍄': 'il fungo', '⚽': 'il pallone', '🪁': "l'aquilone",
  '🐿️': 'lo scoiattolo', '🕊️': 'la colomba', '🎈': 'il palloncino', '🐠': 'il pesce tropicale', '🐟': 'il pesce', '🐙': 'il polpo',
  '🐬': 'il delfino', '🐳': 'la balena', '🐢': 'la tartaruga', '🦑': 'il calamaro', '⛵': 'la barca a vela', '🦀': 'il granchio',
  '🐚': 'la conchiglia', '🏐': 'la palla', '🍦': 'il gelato', '🕶️': 'gli occhiali da sole', '⛱️': "l'ombrellone", '🏰': 'il castello',
  '🦩': 'il fenicottero', '👒': 'il cappello', '🖼️': 'il quadro', '⏰': 'la sveglia', '🌈': "l'arcobaleno", '🧸': "l'orsacchiotto",
  '🧩': 'il puzzle', '📚': 'i libri', '🎁': 'il regalo', '👟': 'la scarpa', '🧦': 'i calzini', '🖍️': 'i pastelli', '🎨': 'la tavolozza',
  '🪀': 'lo yo-yo', '📖': 'il libro', '🌟': 'la stellina', '🔭': 'il telescopio', '🦔': 'il riccio', '🌳': "l'albero",
});

// Le scene: sfondo vettoriale + zone dove mettere gli oggetti
const SEEK = [
  { id: 'giardino', name: 'Giardino', icon: '🌳', grad: ['#bde7ff', '#7fd36b'],
    zones: { s: [70, 40, 930, 210], g: [60, 340, 940, 500] },
    items: [['🦋', 's'], ['🐝', 's'], ['🐦', 's'], ['🪁', 's'], ['🎈', 's'], ['🐞', 'g'], ['🐌', 'g'], ['🐱', 'g'], ['🐶', 'g'], ['🐰', 'g'],
      ['🍄', 'g'], ['🌻', 'g'], ['🌷', 'g'], ['🐸', 'g'], ['⚽', 'g'], ['🐿️', 'g'], ['🦔', 'g'], ['🍎', 'g']],
    bg: () => `
      <defs><linearGradient id="sk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8dcff"/><stop offset="1" stop-color="#e8f7ff"/></linearGradient>
      <linearGradient id="sk-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdc6a"/><stop offset="1" stop-color="#4fae3e"/></linearGradient></defs>
      <rect width="1000" height="546" fill="url(#sk-sky)"/>
      <circle cx="880" cy="80" r="80" fill="#fff3b0" opacity=".5"/><circle cx="880" cy="80" r="50" fill="#ffd93d"/>
      <g fill="#fff" opacity=".95"><ellipse cx="180" cy="90" rx="70" ry="26"/><ellipse cx="220" cy="72" rx="44" ry="28"/><ellipse cx="560" cy="60" rx="60" ry="20"/><ellipse cx="590" cy="46" rx="34" ry="22"/></g>
      <path d="M0,300 Q250,200 500,290 T1000,250 V546 H0 Z" fill="#a6e38a"/>
      <path d="M0,340 Q300,300 600,350 T1000,330 V546 H0 Z" fill="url(#sk-grass)"/>
      <path d="M420,546 C460,470 560,430 520,340 L560,340 C610,440 520,480 520,546 Z" fill="#f3d9a4" opacity=".9"/>
      <g><rect x="104" y="250" width="22" height="100" rx="8" fill="#9c6b3f"/><circle cx="115" cy="230" r="48" fill="#4caf50"/><circle cx="80" cy="260" r="34" fill="#5cbf55"/><circle cx="150" cy="258" r="36" fill="#43a047"/></g>
      <g><rect x="872" y="262" width="20" height="90" rx="8" fill="#9c6b3f"/><circle cx="882" cy="246" r="42" fill="#43a047"/><circle cx="850" cy="272" r="28" fill="#5cbf55"/><circle cx="914" cy="270" r="30" fill="#4caf50"/></g>
      <g fill="#3f9c3a"><ellipse cx="260" cy="535" rx="90" ry="40"/><ellipse cx="760" cy="540" rx="110" ry="42"/></g>` },
  { id: 'mare', name: 'Mare', icon: '🌊', grad: ['#ffd6a5', '#4fc3f7'],
    zones: { s: [70, 30, 930, 150], w: [50, 240, 950, 390], g: [60, 452, 940, 498] },
    items: [['🕊️', 's'], ['🪁', 's'], ['🎈', 's'], ['🐠', 'w'], ['🐟', 'w'], ['🐙', 'w'], ['🐬', 'w'], ['🐳', 'w'], ['🐢', 'w'], ['🦑', 'w'], ['⛵', 'w'],
      ['🦀', 'g'], ['🐚', 'g'], ['🏐', 'g'], ['🍦', 'g'], ['🕶️', 'g'], ['⛱️', 'g'], ['🏰', 'g'], ['👒', 'g']],
    bg: () => `
      <defs><linearGradient id="sk-msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf9e"/><stop offset="1" stop-color="#ffeedd"/></linearGradient>
      <linearGradient id="sk-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd3f7"/><stop offset="1" stop-color="#1e88e5"/></linearGradient></defs>
      <rect width="1000" height="546" fill="url(#sk-msky)"/>
      <circle cx="160" cy="150" r="60" fill="#ff9f68" opacity=".85"/>
      <rect y="190" width="1000" height="250" fill="url(#sk-sea)"/>
      <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55">
        <path d="M60,230 q30,-14 60,0 t60,0"/><path d="M520,260 q30,-14 60,0 t60,0"/><path d="M300,330 q30,-14 60,0 t60,0"/><path d="M760,350 q30,-14 60,0 t60,0"/></g>
      <path d="M0,430 C200,400 400,450 600,425 C780,405 900,430 1000,420 V546 H0 Z" fill="#f6d7a7"/>
      <path d="M0,430 C200,400 400,450 600,425 C780,405 900,430 1000,420" fill="none" stroke="#fff" stroke-width="8" opacity=".7"/>` },
  { id: 'cameretta', name: 'Cameretta', icon: '🧸', grad: ['#ffe4ec', '#e8c39e'],
    zones: { s: [70, 50, 660, 200], b: [90, 250, 380, 290], g: [60, 420, 940, 500] },
    items: [['🖼️', 's'], ['⏰', 's'], ['🎈', 's'], ['🌈', 's'], ['⭐', 's'], ['🐰', 'b'], ['📖', 'b'], ['🐶', 'b'],
      ['🧸', 'g'], ['⚽', 'g'], ['🚂', 'g'], ['🧩', 'g'], ['📚', 'g'], ['🎁', 'g'], ['👟', 'g'], ['🧦', 'g'], ['🖍️', 'g'], ['🎨', 'g'], ['🐱', 'g'], ['🪀', 'g']],
    bg: () => `
      <defs><linearGradient id="sk-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0ea"/><stop offset="1" stop-color="#fff2f6"/></linearGradient></defs>
      <rect width="1000" height="546" fill="url(#sk-wall)"/>
      <g opacity=".35" fill="#ffb3c7">${[...Array(12)].map((_, i) => `<circle cx="${60 + (i % 6) * 170}" cy="${40 + Math.floor(i / 6) * 150}" r="8"/>`).join('')}</g>
      <rect x="700" y="50" width="240" height="180" rx="16" fill="#bfe9ff" stroke="#fff" stroke-width="14"/>
      <path d="M820,50 V230 M700,140 H940" stroke="#fff" stroke-width="10"/>
      <ellipse cx="760" cy="110" rx="34" ry="14" fill="#fff"/>
      <rect y="390" width="1000" height="156" fill="#e8c39e"/>
      <g stroke="#d4a978" stroke-width="3">${[...Array(6)].map((_, i) => `<path d="M0,${410 + i * 24} H1000"/>`).join('')}</g>
      <rect x="40" y="250" width="380" height="150" rx="26" fill="#9fa8ff"/>
      <rect x="40" y="220" width="40" height="190" rx="14" fill="#7b5cff"/>
      <rect x="60" y="232" width="110" height="46" rx="20" fill="#fff"/>
      <path d="M180,270 Q300,250 420,270 V330 H180 Z" fill="#c7cdff"/>
      <ellipse cx="640" cy="490" rx="270" ry="44" fill="#ffb3c7" opacity=".8"/>` },
  { id: 'spazio', name: 'Spazio', icon: '🚀', grad: ['#3b2a7a', '#1a1446'],
    zones: { a: [70, 50, 930, 500] },
    items: [['🚀', 'a'], ['🛸', 'a'], ['🪐', 'a'], ['🌙', 'a'], ['👩‍🚀', 'a'], ['🛰️', 'a'], ['⭐', 'a'], ['☄️', 'a'], ['🌍', 'a'], ['👽', 'a'], ['🌟', 'a'], ['🔭', 'a']],
    bg: () => {
      const r = seeded(11);
      let st = '';
      for (let i = 0; i < 120; i++) st += `<circle cx="${(r() * 1000).toFixed(0)}" cy="${(r() * 546).toFixed(0)}" r="${(0.8 + r() * 1.8).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
      return `<defs><radialGradient id="sk-space" cx="30%" cy="30%" r="90%"><stop offset="0" stop-color="#4b3a9a"/><stop offset="1" stop-color="#140f38"/></radialGradient></defs>
        <rect width="1000" height="546" fill="url(#sk-space)"/>${st}
        <circle cx="880" cy="450" r="120" fill="#ff8fb1" opacity=".85"/><ellipse cx="880" cy="450" rx="190" ry="34" fill="none" stroke="#ffd23f" stroke-width="10" opacity=".8"/>
        <circle cx="110" cy="100" r="46" fill="#f5f0d8"/><circle cx="96" cy="90" r="9" fill="#ddd6b8"/><circle cx="124" cy="116" r="6" fill="#ddd6b8"/>`;
    } },
];

const fmtTime = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
// scelta della scena + livello, condivisa da "Trova i particolari" e "Trova le differenze"
function scenePick(cfg) {
  stage.classList.add('modern');
  bg('radial-gradient(circle at 30% 30%, #fff7e6 0%, #ffe3f1 45%, #d9ccff 100%)');
  el('div', { left: '0', right: '0', top: '40px', textAlign: 'center', fontSize: '50px' }, stage, cfg.title).className = 'm-label';
  const hard = store(cfg.level) === 'hard';
  SEEK.forEach((sc, i) => {
    const c = el('div', { position: 'absolute', left: px(70 + (i % 2) * 450), top: px(130 + Math.floor(i / 2) * 270), width: '420px', height: '240px', borderRadius: '32px',
      overflow: 'hidden', cursor: 'pointer', boxShadow: '0 14px 30px rgba(110,50,160,.25)', transition: 'transform .12s' });
    c.innerHTML = `<svg viewBox="0 0 1000 546" width="420" height="230" preserveAspectRatio="xMidYMid slice">${sc.bg()}</svg>`;
    const best = hard && store(cfg.best + sc.id);
    el('div', { position: 'absolute', left: '0', right: '0', bottom: '0', height: '64px', background: 'rgba(255,255,255,.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '32px', fontWeight: '800', color: '#5a189a' }, c,
      `<span style="font-size:38px">${sc.icon}</span>${sc.name}` + (best ? `<span style="font-size:22px;color:#b07a00">🏆 ${fmtTime(+best)}</span>` : ''));
    tap(c, () => { SFX.flip(); show(cfg.play, sc); });
  });
  const back = tap(el('div', { left: '20px', top: '692px', width: '170px', height: '58px' }, stage, '← Indietro'), () => { SFX.tap(); show(homeScreen); });
  back.className = 'm-btn';
  // livello: facile (bambini) o difficile (genitori)
  [['easy', '😊 Facile', 520, 190], ['hard', '🧠 Difficile (genitori)', 724, 280]].forEach(([lv, label, x, w]) => {
    const b = tap(el('div', { left: px(x), top: '692px', width: px(w), height: '58px', fontSize: '22px' }, stage, label), () => {
      store(cfg.level, lv); SFX.tap(); show(cfg.self);
    });
    b.className = 'm-btn' + ((lv === 'hard') === hard ? ' primary' : '');
  });
}
function seekPick() { scenePick({ title: '👀 Trova i particolari', play: seekScreen, level: 'seekLevel', best: 'seekBest-', self: seekPick }); }

function seekScreen(sc) {
  stage.classList.add('modern');
  bg('linear-gradient(#f6efff,#e9dcff)');
  const hard = store('seekLevel') === 'hard';
  // facile: 5 particolari grandi; difficile: 8 particolari piccoli, tanti oggetti in più e lenti molto ingrandite
  const L = hard ? { N: 8, min: 28, var: 14, gap: 6, view: 38, jit: 26, lens: 92, step: 101, fill: 46 }
                 : { N: 5, min: 50, var: 22, gap: 22, view: 140, jit: 30, lens: 150, step: 162, fill: 0 };
  const W0 = 1000, H0 = 546, N = L.N;
  const placed = [];
  const put = (e, z) => {
    const [x0, y0, x1, y1] = sc.zones[z];
    for (let k = 0; k < 80; k++) {
      const size = L.min + rnd(L.var), x = x0 + rnd(x1 - x0), y = y0 + rnd(y1 - y0);
      if (placed.every(o => Math.hypot(o.x - x, o.y - y) > (o.size + size) / 2 + L.gap)) {
        placed.push({ e, x, y, size, rot: rnd(hard ? 60 : 25) - (hard ? 30 : 12) }); return true;
      }
    }
    return false;
  };
  // ogni oggetto una volta sola
  for (const [e, z] of shuffle(sc.items.slice())) put(e, z);
  const targets = shuffle(placed.slice()).slice(0, N).map(o => Object.assign(o, { found: false,
    // il "particolare": un pezzetto della scena intorno all'oggetto, un po' spostato
    vx: Math.max(0, Math.min(W0 - L.view, o.x - L.view / 2 + rnd(L.jit) - L.jit / 2)),
    vy: Math.max(0, Math.min(H0 - L.view, o.y - L.view / 2 + rnd(L.jit) - L.jit / 2)) }));
  // difficile: tanti oggetti "di disturbo" (solo copie di quelli che NON sono da trovare)
  if (L.fill) {
    const tset = new Set(targets.map(t => t.e));
    const others = sc.items.filter(([e]) => !tset.has(e));
    for (let k = 0; k < 300 && placed.length < L.fill; k++) { const [e, z] = others[rnd(others.length)]; put(e, z); }
  }
  const shadow = `<filter id="sk-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".25"/></filter>`;
  const content = sc.bg().replace('<defs>', '<defs>' + shadow) +
    placed.map(o => `<text x="${o.x}" y="${o.y}" font-size="${o.size}" text-anchor="middle" dominant-baseline="central" filter="url(#sk-sh)" transform="rotate(${o.rot} ${o.x} ${o.y})">${o.e}</text>`).join('');

  const scene = el('div', { position: 'absolute', left: '12px', top: '12px', width: '1000px', height: '546px', borderRadius: '28px', overflow: 'hidden',
    boxShadow: '0 14px 30px rgba(110,50,160,.25)' });
  scene.innerHTML = `<svg viewBox="0 0 ${W0} ${H0}" width="1000" height="546">${content}<g id="sk-marks"></g></svg>`;
  const marks = scene.querySelector('#sk-marks');

  // le lenti con i particolari
  const lensTop = hard ? 612 : 584;
  const lenses = targets.map((t, i) => {
    const l = el('div', { position: 'absolute', left: px(198 + i * L.step), top: px(lensTop), width: px(L.lens), height: px(L.lens), borderRadius: '50%', overflow: 'hidden',
      border: (hard ? 4 : 6) + 'px solid #fff', boxSizing: 'border-box', boxShadow: '0 8px 20px rgba(110,50,160,.3)', background: '#fff', transition: 'transform .2s, opacity .3s' });
    const inner = L.lens - (hard ? 8 : 12);
    l.innerHTML = `<svg viewBox="${t.vx} ${t.vy} ${L.view} ${L.view}" width="${inner}" height="${inner}">${content}</svg>`;
    return l;
  });

  // cronometro (solo difficile)
  let secs = 0, timer = null, timerEl = null, misses = 0;
  if (hard) {
    timerEl = el('div', { left: '852px', top: '24px', width: '150px', height: '50px', fontSize: '22px', background: 'rgba(255,255,255,.9)' }, stage);
    timerEl.className = 'm-btn';
    const upd = () => { timerEl.textContent = '⏱ ' + fmtTime(secs) + (misses ? '  ✖' + misses : ''); };
    upd();
    timer = setInterval(() => { secs++; upd(); }, 1000);
    cleanup = () => clearInterval(timer);
    timerEl.upd = upd;
  }

  let done = 0;
  Voice.say(hard ? 'Livello difficile. Pronti? Via!' : 'Trova i particolari!');
  tap(scene, ev => {
    const r = scene.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W0, y = (ev.clientY - r.top) / r.height * H0;
    const i = targets.findIndex(t => !t.found && Math.hypot(t.x - x, t.y - y) < Math.max(24, t.size * 0.78));
    if (i < 0) {
      SFX.no();
      marks.insertAdjacentHTML('beforeend', `<text x="${x}" y="${y}" font-size="34" text-anchor="middle" dominant-baseline="central" class="sk-miss">✖️</text>`);
      const m = marks.lastChild; setTimeout(() => m.remove(), 700);
      misses++;
      if (hard) timerEl.upd();
      else if (misses % 3 === 0) Voice.say(pick(['Guarda bene!', 'Cerca ancora!', 'Non è qui… riprova!']));
      return;
    }
    const t = targets[i]; t.found = true; done++;
    SFX.ok();
    marks.insertAdjacentHTML('beforeend', `<circle cx="${t.x}" cy="${t.y}" r="${Math.max(26, t.size * 0.8)}" fill="none" stroke="#2ec4b6" stroke-width="${hard ? 5 : 7}" class="sk-hit"/>`);
    const l = lenses[i];
    l.style.opacity = '.55'; l.style.transform = 'scale(.9)';
    el('div', { position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: hard ? '50px' : '70px', color: '#2ec4b6',
      textShadow: '0 2px 0 #fff, 0 0 8px #fff' }, l, '✔');
    if (done === N) {
      if (hard) {
        clearInterval(timer);
        const key = 'seekBest-' + sc.id, best = +(store(key) || 0), record = !best || secs < best;
        if (record) store(key, String(secs));
        Voice.speak(LANG === 'en' ? 'Great job! All found!' + (record ? ' New record!' : '') : 'Bravissimi! Tutti trovati!' + (record ? ' Nuovo record!' : ''));
        setTimeout(() => party((record ? '🏆 RECORD ' : '⏱ ') + fmtTime(secs), () => show(seekScreen, sc), () => show(seekPick)), 900);
      } else {
        Voice.say('Bravissima! Hai trovato tutti i particolari!');
        setTimeout(() => party('BRAVISSIMA!', () => show(seekScreen, sc), () => show(seekPick)), 900);
      }
    } else if (hard) Voice.say(pick(['Trovato!', 'Sì!', 'Bene!']));
    else Voice.praise(t.e);
  });

  const bh = hard ? 66 : 70;
  const back = tap(el('div', { left: '16px', top: px(lensTop - (hard ? 28 : 0)), width: '170px', height: px(bh), fontSize: '22px' }, stage, '← Indietro'), () => { SFX.tap(); show(seekPick); });
  back.className = 'm-btn';
  const again = tap(el('div', { left: '16px', top: px(lensTop - (hard ? 28 : 0) + bh + 12), width: '170px', height: px(bh), fontSize: '22px' }, stage, '🔄 Nuova'), () => { SFX.flip(); show(seekScreen, sc); });
  again.className = 'm-btn primary';
}

// =====================================================================
//  TROVA LE DIFFERENZE (grafica moderna, livello facile e difficile)
// =====================================================================
function diffPick() { scenePick({ title: '🔍 Trova le differenze', play: diffScreen, level: 'diffLevel', best: 'diffBest-', self: diffPick }); }

function diffScreen(sc) {
  stage.classList.add('modern');
  bg('linear-gradient(#f6efff,#e9dcff)');
  const hard = store('diffLevel') === 'hard';
  const W0 = 1000, H0 = 546;
  const L = hard ? { N: 8, min: 34, var: 14, gap: 8, fill: 40, hit: 36, ring: 38 }
                 : { N: 5, min: 74, var: 20, gap: 26, fill: 0, hit: 60, ring: 62 };
  // --- oggetti nella scena ---
  const placed = [];
  const free = (x, y, size) => placed.every(o => Math.hypot(o.x - x, o.y - y) > (o.size + size) / 2 + L.gap);
  const spot = (z, size) => {
    const [x0, y0, x1, y1] = sc.zones[z];
    for (let k = 0; k < 80; k++) { const x = x0 + rnd(x1 - x0), y = y0 + rnd(y1 - y0); if (free(x, y, size)) return [x, y]; }
    return null;
  };
  const put = (e, z) => {
    const size = L.min + rnd(L.var), p = spot(z, size);
    if (p) placed.push({ e, z, x: p[0], y: p[1], size, rot: rnd(hard ? 40 : 16) - (hard ? 20 : 8), flip: false, hue: false, gone: false });
  };
  const uniq = shuffle(sc.items.slice());
  for (const [e, z] of hard ? uniq : uniq.slice(0, 12)) put(e, z);
  // --- le differenze ---
  const pale = new Set(['🐰', '⚽', '🕊️', '🐑', '🏐', '🐚', '🧦', '🐐', '🖼️', '📖', '🌙', '⭐', '🌟', '👽']);
  const types = hard ? ['hue', 'rot', 'move', 'size', 'flip', 'gone', 'swap', 'add'] : shuffle(['gone', 'swap', 'flip', 'add', 'size']);
  const candidates = shuffle(placed.slice());
  const copy = placed.map(o => Object.assign({}, o));
  const diffs = [];
  for (const type of types) {
    if (type === 'add') {
      const [e, z] = sc.items[rnd(sc.items.length)], size = L.min + rnd(L.var), p = spot(z, size);
      if (!p) continue;
      const o = { e, z, x: p[0], y: p[1], size, rot: 0, flip: false, hue: false, gone: false, onlyCopy: true };
      placed.push(Object.assign({}, o, { gone: true })); copy.push(o);
      diffs.push({ x: o.x, y: o.y, e }); continue;
    }
    // girare ha senso solo per gli oggetti non simmetrici
    const asym = new Set(['🐦', '🐌', '🐿️', '🦔', '🪁', '🐝', '🕊️', '🐠', '🐟', '🐬', '🐳', '🐢', '🦑', '⛵', '🦩', '🚀', '☄️', '🛰️', '🔭', '🚂',
      '👟', '🖍️', '🎈', '⛱️', '👒', '🍦', '⏰', '📚', '🎨', '🐶', '🐱', '🦋', '🌷', '🐸', '🍎', '🧦', '🧩', '🌙', '👩‍🚀', '🖼️']);
    const sym = new Set(['⚽', '🍄', '🐰', '🌻', '🐞', '🌍', '⭐', '🌟', '🪐', '👽', '🎁', '🏐', '🏰', '🌈', '🧸', '📖', '🛸', '🦀', '🐙', '🪀', '🐚']);
    const ok = o => !o.used && (type !== 'hue' || !pale.has(o.e)) && (type !== 'flip' || (asym.has(o.e) && !sym.has(o.e)));
    const i = candidates.findIndex(ok);
    if (i < 0) continue;
    const o = candidates[i]; o.used = true;
    const c = copy[placed.indexOf(o)];
    if (type === 'gone') c.gone = true;
    if (type === 'swap') { let e; do { e = sc.items[rnd(sc.items.length)][0]; } while (e === o.e); c.e = e; }
    if (type === 'flip') c.flip = true;
    if (type === 'hue') c.hue = true;
    if (type === 'rot') c.rot += (rnd(2) ? 1 : -1) * 28;
    if (type === 'size') c.size = Math.round(o.size * (hard ? (rnd(2) ? 1.35 : 0.72) : 1.5));
    if (type === 'move') { c.x += (rnd(2) ? 1 : -1) * 26; c.y += (rnd(2) ? 1 : -1) * 14; }
    diffs.push({ x: (o.x + c.x) / 2, y: (o.y + c.y) / 2, e: o.e });
  }
  // difficile: tanti oggetti di disturbo, uguali nelle due scene
  if (L.fill) for (let k = 0; k < 300 && placed.length < L.fill; k++) {
    const [e, z] = sc.items[rnd(sc.items.length)], size = L.min + rnd(L.var), p = spot(z, size);
    if (p && diffs.every(d => Math.hypot(d.x - p[0], d.y - p[1]) > L.hit * 1.6)) {
      const o = { e, z, x: p[0], y: p[1], size, rot: rnd(40) - 20, flip: false, hue: false, gone: false };
      placed.push(o); copy.push(Object.assign({}, o));
    }
  }
  const N = diffs.length;
  const defs = `<filter id="dh-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".25"/></filter>` +
    `<filter id="dh-hue" x="-30%" y="-30%" width="160%" height="160%"><feColorMatrix type="hueRotate" values="150"/><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".25"/></filter>`;
  const draw = list => sc.bg().replace('<defs>', '<defs>' + defs) + list.filter(o => !o.gone).map(o =>
    `<g transform="translate(${o.x} ${o.y}) rotate(${o.rot}) scale(${o.flip ? -1 : 1} 1)"><text font-size="${o.size}" text-anchor="middle" dominant-baseline="central" filter="url(#${o.hue ? 'dh-hue' : 'dh-sh'})">${o.e}</text></g>`).join('');

  // --- le due scene, una sopra l'altra ---
  const PW = 622, PH = 340;
  const panels = [[12, 'Originale', placed], [400, 'Copia', copy]].map(([top, label, list]) => {
    const d = el('div', { position: 'absolute', left: '12px', top: px(top), width: px(PW), height: px(PH), borderRadius: '24px', overflow: 'hidden',
      boxShadow: '0 12px 26px rgba(110,50,160,.25)' });
    d.innerHTML = `<svg viewBox="0 0 ${W0} ${H0}" width="${PW}" height="${PH}" preserveAspectRatio="none">${draw(list)}<g class="dh-marks"></g></svg>`;
    el('div', { position: 'absolute', left: '12px', top: '10px', padding: '4px 14px', borderRadius: '999px', background: 'rgba(255,255,255,.85)',
      fontSize: '18px', fontWeight: '800', color: '#5a189a' }, d, label);
    return d;
  });
  // linea "=" tra le due scene
  el('div', { position: 'absolute', left: '12px', top: '354px', width: px(PW), height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '30px', color: '#9d4edd' }, stage, '⇅');

  // --- colonna di destra ---
  el('div', { left: '650px', top: '24px', width: '362px', textAlign: 'center', fontSize: '34px', lineHeight: '40px' }, stage, '🔍 Trova le differenze').className = 'm-label';
  const stars = el('div', { position: 'absolute', left: '650px', top: '130px', width: '362px', textAlign: 'center', fontSize: hard ? '40px' : '52px',
    letterSpacing: '4px', color: '#ffb703', textShadow: '0 3px 0 #fff' });
  let done = 0, misses = 0, secs = 0, timer = null;
  const timerEl = hard ? el('div', { left: '716px', top: '300px', width: '230px', height: '60px', fontSize: '26px', background: 'rgba(255,255,255,.9)' }, stage) : null;
  if (timerEl) timerEl.className = 'm-btn';
  const upd = () => {
    stars.innerHTML = '★'.repeat(done) + '<span style="color:#d9ccff">' + '★'.repeat(N - done) + '</span>';
    if (timerEl) timerEl.textContent = '⏱ ' + fmtTime(secs) + (misses ? '  ✖' + misses : '');
  };
  upd();
  if (hard) { timer = setInterval(() => { secs++; upd(); }, 1000); cleanup = () => clearInterval(timer); }

  Voice.say(hard ? 'Livello difficile. Pronti? Via!' : 'Trova le differenze!');
  panels.forEach(pn => tap(pn, ev => {
    const r = pn.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W0, y = (ev.clientY - r.top) / r.height * H0;
    const d = diffs.find(d => !d.found && Math.hypot(d.x - x, d.y - y) < L.hit);
    if (!d) {
      SFX.no(); misses++; upd();
      const m = pn.querySelector('.dh-marks');
      m.insertAdjacentHTML('beforeend', `<text x="${x}" y="${y}" font-size="40" text-anchor="middle" dominant-baseline="central" class="sk-miss">✖️</text>`);
      const last = m.lastChild; setTimeout(() => last.remove(), 700);
      if (!hard && misses % 3 === 0) Voice.say(pick(['Guarda bene!', 'Cerca ancora!', 'Non è qui… riprova!']));
      return;
    }
    d.found = true; done++; upd(); SFX.ok();
    panels.forEach(q => q.querySelector('.dh-marks').insertAdjacentHTML('beforeend',
      `<circle cx="${d.x}" cy="${d.y}" r="${L.ring}" fill="none" stroke="#2ec4b6" stroke-width="${hard ? 6 : 8}" class="sk-hit"/>`));
    if (done === N) {
      if (hard) {
        clearInterval(timer);
        const key = 'diffBest-' + sc.id, best = +(store(key) || 0), record = !best || secs < best;
        if (record) store(key, String(secs));
        Voice.speak(LANG === 'en' ? 'Great job! All found!' + (record ? ' New record!' : '') : 'Bravissimi! Tutti trovati!' + (record ? ' Nuovo record!' : ''));
        setTimeout(() => party((record ? '🏆 RECORD ' : '⏱ ') + fmtTime(secs), () => show(diffScreen, sc), () => show(diffPick)), 900);
      } else {
        Voice.say('Bravissima! Hai trovato tutte le differenze!');
        setTimeout(() => party('BRAVISSIMA!', () => show(diffScreen, sc), () => show(diffPick)), 900);
      }
    } else if (hard) Voice.say(pick(['Trovato!', 'Sì!', 'Bene!']));
    else Voice.praise(d.e);
  }));

  const again = tap(el('div', { left: '680px', top: '560px', width: '300px', height: '78px', fontSize: '26px' }, stage, '🔄 Nuova'), () => { SFX.flip(); show(diffScreen, sc); });
  again.className = 'm-btn primary';
  const back = tap(el('div', { left: '680px', top: '656px', width: '300px', height: '78px', fontSize: '26px' }, stage, '← Indietro'), () => { SFX.tap(); show(diffPick); });
  back.className = 'm-btn';
}

// ---------- avvio ----------
show(homeScreen);
