// Service worker: rende il gioco installabile e giocabile anche offline.
const CACHE = 'giochiamo-v39';
const VOICE_CACHE = 'giochiamo-voce-1';   // le voci registrate: si scaricano una volta sola
const FILES = ['./', 'index.html', 'game.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

async function saveVoices() {
  const c = await caches.open(VOICE_CACHE);
  for (const l of ['it', 'en']) {
    try {
      const list = await (await fetch(`voce/${l}/elenco.json`, { cache: 'no-cache' })).json();
      const missing = [];
      for (const f of list) if (!(await c.match(`voce/${l}/${f}`))) missing.push(`voce/${l}/${f}`);
      await c.addAll(missing);
    } catch (e) { /* riproverà al prossimo aggiornamento */ }
  }
}

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(FILES)).then(() => saveVoices()).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== VOICE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // statistiche e altri siti: passano diretti
  // voci registrate: prima la copia salvata (non cambiano)
  if (/\/voce\/(it|en)\/.+\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.open(VOICE_CACHE).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) c.put(e.request, r.clone()); return r;
    }))));
    return;
  }
  // tutto il resto: rete prima (così gli aggiornamenti arrivano subito), cache se offline
  e.respondWith(fetch(new Request(e.request.url, { cache: 'no-cache' })).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
