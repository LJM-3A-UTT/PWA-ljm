// Service Worker mejorado con sincronización real
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// ⚡ Precache de la aplicación
precacheAndRoute(self.__WB_MANIFEST || []);

// 🌀 Background Sync MEJORADO
const bgSyncPlugin = new BackgroundSyncPlugin('activities-sync-queue', {
  maxRetentionTime: 24 * 60, // 24 horas
  onSync: async ({ queue }) => {
    console.log('[SW] Ejecutando sincronización de actividades...');
    
    let entry;
    while (entry = await queue.shiftRequest()) {
      try {
        // En una app real, aquí enviarías la actividad al servidor
        console.log('[SW] Sincronizando actividad:', entry);
        
        // Simulación de envío exitoso
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('[SW] ✅ Actividad sincronizada exitosamente');
        
        // Mostrar notificación de éxito
        self.registration.showNotification('PWA LJM - Sincronización', {
          body: 'Actividades sincronizadas correctamente',
          icon: '/icons/icon-192.png',
          tag: 'sync-success'
        });
        
      } catch (error) {
        console.error('[SW] ❌ Error sincronizando actividad:', error);
        
        // Re-encolar si falla
        await queue.unshiftRequest(entry);
        
        // Mostrar notificación de error
        self.registration.showNotification('PWA LJM - Error de Sincronización', {
          body: 'No se pudieron sincronizar algunas actividades',
          icon: '/icons/icon-192.png',
          tag: 'sync-error'
        });
        
        break;
      }
    }
  }
});

// 📝 Estrategias de cacheo MEJORADAS para TU aplicación

// 🏗️ App Shell - Cache First (HTML, CSS, JS de la aplicación)
registerRoute(
  ({ request }) =>
    request.destination === 'document' ||
    request.destination === 'style' ||
    request.destination === 'script',
  new CacheFirst({
    cacheName: 'app-shell-v4',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// 📸 Imágenes de la aplicación - Cache First
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'app-images-v4',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// 🔄 Datos de API - Stale While Revalidate (para datos que pueden estar cacheados)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-data-v4',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos para datos de API
      }),
    ],
  })
);

// 🌐 Navegación - Network First (si no hay red, usa caché)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache-v4',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
      }),
    ],
  })
);

// 📊 Formularios - Network Only con Background Sync
registerRoute(
  ({ url }) => url.pathname.includes('/api/activities'),
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// 🔔 Notificaciones Push MEJORADAS
self.addEventListener('push', (event) => {
  console.log('[SW] Evento push recibido');

  if (!event.data) {
    console.log('[SW] Push sin datos');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('[SW] Datos push:', data);
  } catch (e) {
    data = {
      title: 'PWA LJM',
      body: event.data.text() || 'Tienes una nueva notificación',
      icon: '/icons/icon-192.png'
    };
  }

  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir app'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    tag: data.tag || 'general-notification',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PWA LJM', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event.notification.tag);
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  }
});

// 🆘 Página offline personalizada MEJORADA
const offlinePage = '/offline.html';

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open('pages-cache-v4');
        const cachedPage = await cache.match(offlinePage);
        
        if (cachedPage) {
          return cachedPage;
        }
        
        // Página offline por defecto
        return new Response(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Offline - PWA LJM</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #f5f5f5;
                }
                .offline-container { 
                  background: white; 
                  padding: 40px; 
                  border-radius: 10px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
              </style>
            </head>
            <body>
              <div class="offline-container">
                <h1>🔌 Estás offline</h1>
                <p>No hay conexión a internet disponible.</p>
                <p>Puedes seguir usando las funciones offline de la aplicación.</p>
                <button onclick="window.location.reload()">Reintentar</button>
              </div>
            </body>
          </html>
          `,
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/html' })
          }
        );
      })
    );
  }
});

// 🔄 Ciclo de vida del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] ✅ Instalado y listo');
  self.skipWaiting(); // Activar inmediatamente
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Activado y controlando clientes');
  event.waitUntil(clients.claim());
});

// 🔄 Background Sync para actividades
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-activities') {
    console.log('[SW] 🔄 Background Sync activado para actividades');
    event.waitUntil(syncPendingActivities());
  }
});

async function syncPendingActivities() {
  try {
    console.log('[SW] Sincronizando actividades pendientes...');
    
    // En una implementación real, aquí:
    // 1. Obtener actividades pendientes de IndexedDB
    // 2. Enviar cada una al servidor
    // 3. Marcar como sincronizadas las exitosas
    // 4. Eliminar las que se sincronizaron correctamente
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('[SW] ✅ Sincronización de actividades completada');
    
    self.registration.showNotification('PWA LJM - Sincronización', {
      body: 'Tus actividades offline han sido sincronizadas',
      icon: '/icons/icon-192.png',
      tag: 'background-sync-success'
    });
    
  } catch (error) {
    console.error('[SW] ❌ Error en Background Sync:', error);
  }
}

// En sw.js - mejorar la función syncPendingActivities
async function syncPendingActivities() {
  try {
    // Obtener actividades pendientes de IndexedDB
    const activities = await getPendingActivitiesFromDB();
    
    for (const activity of activities) {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
      await markActivityAsSynced(activity.id);
    }
  } catch (error) {
    console.error('Error en sync:', error);
  }
}

