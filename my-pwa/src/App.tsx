import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import OfflineForm from './components/OfflineForm'
import PushNotification from './components/PushNotification'

function App() {
  const [count, setCount] = useState(0)
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="app-container">
      <div className="app-header">
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        
        <h1>Luis Jiménez Maffuz - PWA Avanzada</h1>
      </div>
      
      <nav className="tabs">
        <button 
          className={activeTab === 'home' ? 'active' : ''}
          onClick={() => setActiveTab('home')}
        >
          Inicio
        </button>
        <button 
          className={activeTab === 'form' ? 'active' : ''}
          onClick={() => setActiveTab('form')}
        >
          Formulario Offline
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          Notificaciones
        </button>
      </nav>

      <div className="content">
        {activeTab === 'home' && (
          <div className="card">
            <button onClick={() => setCount((count) => count + 10)}>
              count is {count}
            </button>
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>
        )}

        {activeTab === 'form' && <OfflineForm />}
        {activeTab === 'notifications' && <PushNotification />}
      </div>
      
      <p className="read-the-docs">
        PWA con funcionalidad offline, sync en segundo plano y notificaciones push
      </p>
    </div>
  )
}

export default App