import React, { useState, useEffect } from 'react';
import { db } from '../utils/indexedDB';

const OfflineForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Conexión restaurada - Recargando actividades');
      setIsOnline(true);
      loadActivities();
    };
    
    const handleOffline = () => {
      console.log('🔴 Sin conexión - Modo offline activado');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadActivities();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadActivities = async () => {
    try {
      const storedActivities = await db.getActivities();
      console.log('📋 Actividades cargadas:', storedActivities.length);
      setActivities(storedActivities);
    } catch (error) {
      console.error('❌ Error cargando actividades:', error);
    }
  };

  // Función mejorada para Background Sync
  const registerBackgroundSync = async () => {
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Usar una verificación más segura para la propiedad sync
        if ('sync' in registration) {
          // @ts-ignore - Ignorar error de TypeScript para sync
          await registration.sync.register('sync-activities');
          console.log('📱 Background Sync registrado exitosamente');
          return true;
        } else {
          console.log('⚠️ SyncManager no disponible en este navegador');
          return false;
        }
      } else {
        console.log('⚠️ Service Worker o SyncManager no soportados');
        return false;
      }
    } catch (syncError) {
      console.log('❌ Error registrando Background Sync:', syncError);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    const activity = {
      title: title.trim(),
      description: description.trim(),
      date: new Date().toISOString(),
    };

    try {
      // ✅ SIEMPRE guardar en IndexedDB (tanto online como offline)
      await db.addActivity(activity);
      console.log('💾 Actividad guardada en IndexedDB:', activity);

      if (isOnline) {
        // ✅ Si está online, intentar sincronizar con servidor
        try {
          console.log('🔄 Intentando sincronizar con servidor...');
          // Simulación de envío al servidor
          await new Promise(resolve => setTimeout(resolve, 800));
          console.log('✅ Sincronización exitosa');
        } catch (serverError) {
          console.error('❌ Error de sincronización:', serverError);
        }
      } else {
        // ✅ Registrar Background Sync para cuando recupere conexión
        const syncRegistered = await registerBackgroundSync();
        
        if (syncRegistered) {
          console.log('🔄 Actividad programada para sincronización automática');
        } else {
          console.log('ℹ️ La actividad se sincronizará manualmente cuando recuperes conexión');
        }
      }

      // ✅ Actualizar UI inmediatamente
      setTitle('');
      setDescription('');
      await loadActivities(); // 🔄 Recargar lista
      
      // ✅ Mostrar feedback al usuario
      alert(isOnline 
        ? '✅ Actividad guardada y sincronizada' 
        : '📱 Actividad guardada offline. Se sincronizará automáticamente.'
      );
      
    } catch (error) {
      console.error('❌ Error guardando actividad:', error);
      alert('Error al guardar la actividad');
    } finally {
      setIsLoading(false);
    }
  };

  const clearActivity = async (id: number) => {
    if (window.confirm('¿Eliminar esta actividad?')) {
      try {
        await db.deleteActivity(id);
        await loadActivities();
      } catch (error) {
        console.error('Error eliminando actividad:', error);
      }
    }
  };

  const clearAllActivities = async () => {
    if (activities.length === 0) return;
    
    if (window.confirm(`¿Estás seguro de eliminar todas las ${activities.length} actividades?`)) {
      try {
        await db.clearActivities();
        await loadActivities();
        alert('Todas las actividades han sido eliminadas');
      } catch (error) {
        console.error('Error eliminando actividades:', error);
        alert('Error al eliminar las actividades');
      }
    }
  };

  return (
    <div className="offline-form">
      <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 EN LÍNEA - Datos se sincronizan' : '🔴 OFFLINE - Datos guardados localmente'}
      </div>
      
      <form onSubmit={handleSubmit}>
        <h3>📝 Reporte de Actividades</h3>
        
        <div className="form-group">
          <label>Título de la actividad:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Tarea de Matemáticas"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Descripción:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe la actividad realizada..."
            rows={4}
            disabled={isLoading}
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
          {isLoading ? '⏳ Guardando...' : (isOnline ? '💾 Guardar Actividad' : '📱 Guardar Offline')}
        </button>
      </form>

      <div className="activities-list">
        <div className="activities-header">
          <h4>📋 Actividades Guardadas ({activities.length})</h4>
          {activities.length > 0 && (
            <button onClick={clearAllActivities} className="btn-clear-all">
              🗑️ Limpiar Todo
            </button>
          )}
        </div>
        
        {activities.length === 0 ? (
          <div className="empty-state">
            <p>📭 No hay actividades guardadas</p>
            <small>Las actividades que guardes aparecerán aquí</small>
          </div>
        ) : (
          <div className="activities-container">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-header">
                  <strong>{activity.title}</strong>
                  <button 
                    onClick={() => clearActivity(activity.id!)}
                    className="btn-delete"
                    title="Eliminar actividad"
                  >
                    🗑️
                  </button>
                </div>
                <p>{activity.description}</p>
                <div className="activity-footer">
                  <small>
                    📅 {new Date(activity.date).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                  <span className={`sync-status ${activity.synced ? 'synced' : 'pending'}`}>
                    {activity.synced ? '✅ Sincronizada' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineForm;