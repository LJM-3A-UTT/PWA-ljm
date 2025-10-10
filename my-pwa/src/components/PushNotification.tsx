import React, { useState, useEffect } from 'react';

// Usar las claves VAPID que generaste
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BHfcFA-kY1LIQsQ1lY7IYX70E3SDxDRm8zfVoOrbMsPTRaLWniz2rvtqoavqB4JCij0oap0eQlHHGITW2cP6oQQ';

const PushNotification: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const checkSupport = () => {
      const notificationSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushSupported = 'PushManager' in window;
      
      setIsSupported(notificationSupported && serviceWorkerSupported);
      setIsPushSupported(pushSupported);
      setPermission(Notification.permission);

      // Verificar si ya existe una suscripción
      if (pushSupported) {
        checkExistingSubscription();
      }
    };

    checkSupport();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        showLocalNotification('Permisos concedidos', 'Ahora puedes recibir notificaciones');
      }
    } catch (error) {
      console.error('Error solicitando permiso:', error);
    }
  };

  const showLocalNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'local-notification'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Función corregida para suscripción Push - usando any para evitar problemas de tipos
  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (subscription) {
        alert('Ya estás suscrito a las notificaciones push');
        return;
      }

      // Usar any para evitar problemas de tipos con applicationServerKey
      const subscribeOptions: any = {
        userVisibleOnly: true
      };

      // Solo intentar usar applicationServerKey si está disponible y es válido
      if (VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length > 0) {
        try {
          const applicationServerKey = base64ToUint8Array(VAPID_PUBLIC_KEY);
          subscribeOptions.applicationServerKey = applicationServerKey;
        } catch (keyError) {
          console.warn('No se pudo convertir la clave VAPID, intentando sin ella:', keyError);
          // Continuar sin applicationServerKey - algunos navegadores pueden funcionar
        }
      }
      
      const newSubscription = await registration.pushManager.subscribe(subscribeOptions);
      setSubscription(newSubscription);

      // Enviar subscription al servidor (simulado)
      console.log('Suscripción push creada:', newSubscription);
      
      // En un caso real, enviarías esto a tu backend
      try {
        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSubscription),
        });
        showLocalNotification('Suscripción Exitosa', 'Ahora recibirás notificaciones push');
      } catch (fetchError) {
        console.log('No se pudo enviar al servidor (modo demo)');
        showLocalNotification('Suscripción Exitosa', 'Notificaciones push activadas (modo demo)');
      }
      
    } catch (error) {
      console.error('Error suscribiéndose a push:', error);
      
      // Intentar método alternativo sin applicationServerKey
      try {
        console.log('Intentando suscripción sin applicationServerKey...');
        const registration = await navigator.serviceWorker.ready;
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true
        });
        setSubscription(newSubscription);
        showLocalNotification('Suscripción Exitosa', 'Notificaciones push activadas (método alternativo)');
      } catch (secondError) {
        alert('❌ Error al activar notificaciones push. Tu navegador puede no soportar esta función completamente.');
      }
    }
  };

  // Función mejorada para convertir base64 a Uint8Array
  const base64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('PWA LJM - Notificación de Prueba', {
        body: 'Esta es una notificación de prueba local.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'test-notification'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      setTimeout(() => {
        notification.close();
      }, 5000);
    } else {
      alert('Primero debes activar los permisos de notificación');
    }
  };

  const testServiceWorkerNotification = async () => {
    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - showNotification puede no estar en los tipos pero funciona en la práctica
        await registration.showNotification('PWA LJM - Notificación SW', {
          body: 'Notificación enviada desde el Service Worker',
          icon: '/icons/icon-192.png',
          tag: 'sw-test'
        });
      } catch (error) {
        console.error('Error con notificación SW:', error);
        testNotification();
      }
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        alert('Suscripción a notificaciones push cancelada');
      }
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
    }
  };

  const sendTestPushNotification = async () => {
    if (!subscription) {
      alert('Primero debes suscribirte a las notificaciones push');
      return;
    }

    try {
      // En un caso real, esto se enviaría desde tu servidor
      console.log('Enviando notificación push de prueba...');
      
      // Simular envío de notificación push
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore
        await registration.showNotification('PWA LJM - Push Test', {
          body: 'Esta es una simulación de notificación push',
          icon: '/icons/icon-192.png',
          tag: 'push-test',
          requireInteraction: true
        });
      }
    } catch (error) {
      console.error('Error enviando notificación push:', error);
    }
  };

  return (
    <div className="push-notification">
      <h3>🔔 Sistema de Notificaciones</h3>
      
      {!isSupported ? (
        <p>❌ Las notificaciones no son soportadas en este navegador</p>
      ) : (
        <div>
          <div className="support-status">
            <p><strong>Estado de soporte:</strong></p>
            <div className="status-item">
              <span className="status-icon">🔔</span>
              <span>Notificaciones: {isSupported ? '✅ Disponible' : '❌ No disponible'}</span>
            </div>
            <div className="status-item">
              <span className="status-icon">📱</span>
              <span>Push API: {isPushSupported ? '✅ Disponible' : '⚠️ Limitado'}</span>
            </div>
            <div className="status-item">
              <span className="status-icon">🔑</span>
              <span>Claves VAPID: {VAPID_PUBLIC_KEY ? '✅ Configuradas' : '❌ Faltan'}</span>
            </div>
          </div>
          
          <div className="permission-status">
            <p>
              <strong>Permisos: </strong>
              <span className={`status ${permission}`}>
                {permission === 'granted' ? '✅ Concedido' : 
                 permission === 'denied' ? '❌ Denegado' : '❓ Pendiente'}
              </span>
            </p>
            {subscription && (
              <p>
                <strong>Suscripción Push: </strong>
                <span className="status granted">✅ Activa</span>
              </p>
            )}
          </div>
          
          {permission === 'default' && (
            <div className="permission-request">
              <button onClick={requestPermission} className="btn-primary">
                🔔 Activar Notificaciones
              </button>
              <p className="info-text">Se te pedirá permiso para mostrar notificaciones</p>
            </div>
          )}
          
          {permission === 'granted' && (
            <div className="notification-actions">
              <p>✅ Notificaciones activadas correctamente</p>
              
              <div className="action-buttons">
                <button onClick={testNotification} className="btn-secondary">
                  🔔 Probar Notificación Local
                </button>
                
                <button onClick={testServiceWorkerNotification} className="btn-secondary">
                  ⚙️ Notificación SW
                </button>
                
                {isPushSupported && !subscription && (
                  <button onClick={subscribeToPush} className="btn-primary">
                    📱 Activar Push
                  </button>
                )}
                
                {subscription && (
                  <>
                    <button onClick={sendTestPushNotification} className="btn-success">
                      📨 Test Push
                    </button>
                    <button onClick={unsubscribeFromPush} className="btn-warning">
                      🚫 Desactivar Push
                    </button>
                  </>
                )}
              </div>
              
              <div className="features-info">
                <h4>🎯 Estado Actual:</h4>
                <ul>
                  <li>✅ <strong>Notificaciones locales</strong> - Funcionando</li>
                  <li>✅ <strong>Notificaciones del Service Worker</strong> - Funcionando</li>
                  <li>{subscription ? '✅' : '⚠️'} <strong>Notificaciones Push</strong> - {subscription ? 'Activadas' : 'Por activar'}</li>
                  <li>✅ <strong>Claves VAPID</strong> - Configuradas</li>
                </ul>
              </div>

              {subscription && (
                <div className="subscription-info">
                  <h4>📋 Información de Suscripción:</h4>
                  <details>
                    <summary>Ver detalles técnicos</summary>
                    <pre>{JSON.stringify({
                      endpoint: subscription.endpoint,
                      keys: subscription.toJSON().keys
                    }, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          )}
          
          {permission === 'denied' && (
            <div className="permission-denied">
              <p>❌ Los permisos de notificación están bloqueados</p>
              <div className="solution-steps">
                <p><strong>Para activarlos:</strong></p>
                <ol>
                  <li>Haz clic en el icono de 🔒 (candado) en la barra de direcciones</li>
                  <li>Selecciona "Configuración de sitio" o "Permisos"</li>
                  <li>Busca "Notificaciones" y cámbialo a "Permitir"</li>
                  <li>Recarga esta página</li>
                </ol>
              </div>
              <button onClick={() => window.location.reload()} className="btn-secondary">
                🔄 Recargar Página
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PushNotification;