/* Claire : l'appli s'ouvre tout de suite, même avec un réseau lent ou absent.
   Les fichiers de l'appli viennent du téléphone (cache) et se mettent à jour en arrière-plan ;
   la conversation, elle, a toujours besoin d'internet. */
const C = 'claire-v43', FILES = ['./', 'index.html', 'claire.js', 'claire-mobile.js', 'reglages.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'logo-claire.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(caches.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then(hit => hit || net).catch(() => caches.match('./')));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => l.length ? l[0].focus() : self.clients.openWindow('./')));
});
