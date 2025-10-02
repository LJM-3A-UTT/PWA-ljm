// Importa Workbox desde CDN si no usas bundling
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// ⚡ Precache: App Shell + assets estáticos
// self.__WB_MANIFEST es inyectado automáticamente por Workbox CLI
precacheAndRoute(self.__WB_MANIFEST || []);

// 🌀 Estrategia: assets estáticos (imágenes, íconos, CSS, JS)
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// 📸 Imágenes (cache-first con límite de 60 archivos)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// 🌐 APIs externas (stale-while-revalidate para frescura)
registerRoute(
  ({ url }) => url.origin.includes('api.example.com'), // cámbialo si usas otra API
  new StaleWhileRevalidate({
    cacheName: 'api-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 día
      }),
    ],
  })
);

// 📡 HTML (network-first → si no hay red, usa caché)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
      }),
    ],
  })
);

// 🔄 Ciclo de vida del SW
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  self.skipWaiting(); // Forzar activación inmediata
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activado y listo para controlar clientes');
  event.waitUntil(clients.claim());
});
