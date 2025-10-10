
# Funcionalidad Offline, Sincronización en Segundo Plano y Notificaciones Push en PWAs

## 📘 Objetivo de Aprendizaje
Investigar el uso de PWAs en el sector empresarial y las características que han impulsado su adopción.  
Implementar en la PWA del proyecto capacidades avanzadas como almacenamiento offline, sincronización en segundo plano, notificaciones push y estrategias de cacheo adaptadas.  
Documentar el proceso con evidencias técnicas y justificar las decisiones de diseño y negocio.

---

## 🔍 Investigación Inicial

### Casos Empresariales Reales

| Empresa | Problema Inicial | Resultados Tras Implementar PWA | Fuente |
|----------|------------------|----------------------------------|--------|
| **AliExpress** | Pérdida de usuarios por baja velocidad y mala experiencia móvil. | +104% en conversiones de nuevos usuarios, el doble de páginas por sesión. | [Google Developers Showcase](https://developers.google.com/web/showcase/2017/aliexpress) |
| **Forbes** | Baja retención móvil y tiempos de carga elevados. | +43% en sesiones por usuario, +20% en visibilidad de anuncios, 2x en compromiso. | [Google Developers Showcase](https://developers.google.com/web/showcase/2017/forbes) |
| **BookMyShow** | Aplicación móvil pesada y lenta para mercados emergentes. | 80% de aumento en conversiones, carga <3s. | [Google Web.dev Case Study](https://web.dev/showcase/bookmyshow/) |
| **Lancôme** | Experiencia móvil limitada en sitios tradicionales. | +50% en sesiones móviles, +17% en conversiones. | [Google Developers Showcase](https://developers.google.com/web/showcase/2017/lancome) |

---

## 💾 Almacenamiento y Sincronización Offline

### **IndexedDB**
- Base de datos NoSQL asíncrona para almacenar grandes volúmenes de datos.  
- Ideal para guardar formularios, perfiles o catálogos sin conexión.

### **Cache Storage API**
- Permite almacenar recursos estáticos (HTML, CSS, JS, imágenes).  
- Mejora el rendimiento y la experiencia offline mediante `caches.open()` y `cache.put()`.

### **Background Sync API**
- Permite diferir tareas hasta que el dispositivo recupere la conexión.  
- Ejemplo:
```js
navigator.serviceWorker.ready.then((registration) => {
  return registration.sync.register('sync-data');
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(enviarDatosPendientes());
  }
});
```

---

## ⚙️ Estrategias de Cacheo Avanzadas

| Estrategia | Descripción | Uso Recomendado |
|-------------|--------------|----------------|
| **Cache First** | Usa primero el cache y solo va a red si no existe el recurso. | Recursos estáticos (CSS, logos, íconos). |
| **Network First** | Prioriza la red y usa el cache como respaldo. | Datos dinámicos (API, listados de productos). |
| **Stale-While-Revalidate** | Usa cache inmediato y actualiza en segundo plano. | Páginas de contenido semi‑dinámico (noticias, productos). |

---

## 🔔 Notificaciones Push

### Beneficios
- Mantienen a los usuarios informados aun sin abrir la app.
- Aumentan la retención y el engagement.

### Pasos de Implementación
1. Servir la app en **HTTPS**.
2. Registrar un **Service Worker**.
3. Solicitar permiso con `Notification.requestPermission()`.
4. Usar la **Push API** para recibir mensajes.
5. Manejar el evento push en el Service Worker:

```js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon.png'
  });
});
```

---

## 🔒 Seguridad y Buenas Prácticas

- Los **Service Workers** solo funcionan bajo **HTTPS**.  
- Validar todos los **inputs** para evitar inyección de datos.  
- Restringir el **alcance** del Service Worker.  
- Usar **HTTPS** y cabeceras de seguridad (CSP, HSTS).

---

## 📚 Referencias
- [Google Developers – PWA Case Studies](https://developers.google.com/web/showcase)
- [Web.dev – PWA Learning Path](https://web.dev/learn/pwa/)
- [MDN Web Docs – Service Workers & Caching](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google Chrome Developers – Background Sync API](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/)