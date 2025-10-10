const webpush = require('web-push');
const express = require('express');
const cors = require('cors');
const app = express();

// Tus claves VAPID
const vapidKeys = {
  publicKey: 'BHfcFA-kY1LIQsQ1lY7IYX70E3SDxDRm8zfVoOrbMsPTRaLWniz2rvtqoavqB4JCij0oap0eQlHHGITW2cP6oQQ',
  privateKey: 'S7oJ3tDzvEaA7iAPDeuA5Lycly0d9H0eV7U0TQSkfFQ'
};

// Configurar web-push
webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(cors());
app.use(express.json());

// Almacenar suscripciones (en producción usa una base de datos)
let pushSubscriptions = [];

// Endpoint para guardar suscripciones
app.post('/api/push-subscription', (req, res) => {
  const subscription = req.body;
  pushSubscriptions.push(subscription);
  console.log('Nueva suscripción guardada');
  res.status(201).json({ message: 'Suscripción guardada' });
});

// Endpoint para enviar notificaciones
app.post('/api/send-notification', (req, res) => {
  const { title, body } = req.body;

  const notificationPayload = {
    title: title || 'Notificación de PWA LJM',
    body: body || 'Esta es una notificación push de prueba',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };

  const promises = pushSubscriptions.map(subscription =>
    webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
      .catch(error => {
        console.error('Error enviando notificación:', error);
        // Remover suscripciones inválidas
        if (error.statusCode === 410) {
          pushSubscriptions = pushSubscriptions.filter(s => s !== subscription);
        }
      })
  );

  Promise.all(promises)
    .then(() => {
      res.json({ 
        message: `Notificación enviada a ${pushSubscriptions.length} dispositivos` 
      });
    })
    .catch(error => {
      console.error('Error enviando notificaciones:', error);
      res.status(500).json({ error: 'Error enviando notificaciones' });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor de notificaciones running en puerto ${PORT}`);
  console.log(`Clave pública VAPID: ${vapidKeys.publicKey}`);
});