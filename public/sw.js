const CACHE_NAME = 'guia-tacs-offline-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icone-192.png',
  './icone-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('Erro no precache inicial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignora requisições que não sejam GET ou esquemas como chrome-extension
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  // Estratégia de Cache com Fallback para Rede e Atualização Dinâmica
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Busca na rede em segundo plano para manter o cache atualizado
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Offline, usa o cache existente
        });
        return cachedResponse;
      }

      // Se não está em cache, busca na rede e guarda no cache para próximas visitas offline
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Se a requisição de página falhar totalmente e estiver offline, retorna index.html em cache
        if (req.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
