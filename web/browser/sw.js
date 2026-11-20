/* VERDIX Browser service worker — offline UI + navegación network-first */
const CACHE = 'verdix-browser-v2';
const ASSETS = [
  '/browser.html', '/index.html', '/search.html', '/ai.html',
  '/assets/css/style.css', '/assets/css/verdix-delights.css', '/assets/css/browser.css',
  '/assets/js/app.js', '/assets/js/browser.js', '/browser/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png', '/assets/icons/nox-infinity.svg'
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
    e.respondWith(fetch(e.request).catch(() => caches.match('/browser.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === self.location.origin) {
      caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    }
    return res;
  }).catch(() => hit)));
});
