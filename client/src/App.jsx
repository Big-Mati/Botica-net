import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PosPage from './pages/PosPage';
import InventarioPage from './pages/InventarioPage';
import AlertasPage from './pages/AlertasPage';
import ComprobantesPage from './pages/ComprobantesPage';
import LoginHUD from './components/LoginHUD';
import CustomerDisplay from './components/CustomerDisplay';
import VisorModal from './components/VisorModal';
import './App.css';

function App() {
  // 1. Detección directa de Pantalla de Cliente Mobile-First (Sin pasar por LoginHUD)
  const urlParams = new URLSearchParams(window.location.search);
  const isVisor = urlParams.get('visor') === 'cliente' || 
                  window.location.hash === '#visor' || 
                  window.location.pathname === '/visor';

  if (isVisor) {
    return <CustomerDisplay />;
  }

  // Estado del modal del visor de cliente
  const [mostrarModalVisor, setMostrarModalVisor] = useState(false);

  // Estado de persistencia de sesión
  const [sesion, setSesion] = useState(() => {
    try {
      const stored = sessionStorage.getItem('botica_sesion_activa');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Función para bloquear pantalla
  const bloquearPantalla = useCallback(() => {
    try {
      sessionStorage.removeItem('botica_sesion_activa');
    } catch {
      // Ignorar error de storage
    }
    setSesion(null);
  }, []);

  // Atajo global de teclado: Alt + L para bloquear
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        bloquearPantalla();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [bloquearPantalla]);

  // Watchdog de Auto-Bloqueo por Inactividad (2 Minutos = 120,000 ms - Carta 4A)
  useEffect(() => {
    if (!sesion) return;

    let idleTimer = null;
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        bloquearPantalla();
      }, 120000);
    };

    resetIdleTimer();

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [sesion, bloquearPantalla]);

  // Si no hay sesión activa, desplegar el Cockpit Espacial LoginHUD 3D
  if (!sesion) {
    return <LoginHUD onLoginSuccess={(nuevaSesion) => setSesion(nuevaSesion)} />;
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#0b1120', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Barra superior del POS: Indicador de Turno y Bloqueo Rápido (Alt+L) */}
        <header className="pos-session-bar">
          <div className="pos-session-left">
            <span style={{ color: '#10b981', fontWeight: 800, letterSpacing: '0.1em' }}>● BOTICANET+ NOVA</span>
            <span>OPERADOR: <span className="pos-session-user">{sesion.usuario.toUpperCase()}</span></span>
            <span className="pos-session-shift">TURNO: {sesion.turno}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setMostrarModalVisor(true)}
              className="pos-visor-btn"
              title="Abrir Pantalla de Cliente en Celular o Simulador PC"
            >
              📱 Visor Cliente
            </button>
            <button
              type="button"
              onClick={bloquearPantalla}
              className="pos-lock-btn"
              title="Bloquear pantalla del terminal POS (Alt+L)"
            >
              [🔒 Bloquear (Alt+L)]
            </button>
          </div>
        </header>

        <Navbar />

        <main>
          <Routes>
            <Route path="/" element={<PosPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="/comprobantes" element={<ComprobantesPage />} />
            <Route
              path="/login"
              element={<LoginHUD onLoginSuccess={(nuevaSesion) => setSesion(nuevaSesion)} />}
            />
            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Modal de Doble Acción para el Visor de Cliente */}
        <VisorModal
          isOpen={mostrarModalVisor}
          onClose={() => setMostrarModalVisor(false)}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
