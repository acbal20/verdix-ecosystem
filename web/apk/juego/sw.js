/* VERDIX JUEGO — cache offline de todos los recursos del juego */
const CACHE = 'verdix-juego-v2';
const ASSETS = [
  '/apk/juego/', '/apk/juego/index.html', '/apk/juego/style.css',
  '/apk/juego/boot.js', '/apk/juego/game.js', '/apk/juego/combat.js',
  '/apk/juego/data.js', '/apk/juego/engine.js', '/apk/juego/models.js',
  '/apk/juego/save.js', '/apk/juego/ui.js', '/apk/juego/audio.js',
  '/apk/juego/three.min.js', '/apk/juego/verdix-infinity.svg',
  '/apk/juego/manifest.webmanifest', '/icon-192.png', '/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/apk/juego/index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === self.location.origin) {
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    }
    return res;
  }).catch(() => hit)));
});
