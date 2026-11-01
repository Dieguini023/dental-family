// Service worker: permite abrir la app sin conexión.
const CACHE = 'df-v2';
const SHELL = ['./', './index.html', './styles.css', './app.js', './data.js', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firestore/Auth van directo a la red (Firebase maneja su propio modo sin conexión)
  if (u.hostname.includes('googleapis.com') && !u.hostname.startsWith('fonts')) return;
  const cacheable = u.origin === location.origin || u.hostname === 'www.gstatic.com' || u.hostname.startsWith('fonts.') || u.hostname === 'cdnjs.cloudflare.com';
  if (!cacheable) return;
  // Red primero (para recibir actualizaciones), caché si no hay internet
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
