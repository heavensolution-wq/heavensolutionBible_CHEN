const CACHE = 'bible-unified-v14';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-180.png', './icon-maskable-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' || e.request.destination === 'document';
  if (isPage) {
    // 앱 화면(index.html)은 인터넷이 되면 항상 최신본을 받고, 안 되면 저장본으로 연다
    e.respondWith(
      fetch(e.request, {cache: 'no-cache'}).then(resp => {
        if (resp.ok) { const copy = resp.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(()=>{}); }
        return resp;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // 아이콘 등 나머지는 저장본 우선
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
