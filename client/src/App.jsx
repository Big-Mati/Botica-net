import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PosPage from './pages/PosPage';
import InventarioPage from './pages/InventarioPage';
import AlertasPage from './pages/AlertasPage';
import KardexPage from './pages/KardexPage';
import ComprobantesPage from './pages/ComprobantesPage';
import LoginHUD from './components/LoginHUD';
import CustomerDisplay from './components/CustomerDisplay';
import VisorModal from './components/VisorModal';
import CommandPalette from './components/CommandPalette';
import './App.css';

function MainLayout({ sesion, onLock, alertasCount, actualizarConteoAlertas }) {
  const [mostrarModalVisor, setMostrarModalVisor] = useState(false);
  const [mostrarCommandPalette, setMostrarCommandPalette] = useState(false);
  const navigate = useNavigate();

  // Atajos globales de teclado SPA: Ctrl+K, Alt+L y F2 Global
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setMostrarCommandPalette((prev) => !prev);
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        onLock();
      } else if (e.key === 'F2') {
        e.preventDefault();
        // Si no estamos en la raíz '/', navegar al terminal POS SPA
        if (window.location.pathname !== '/') {
          navigate('/?focusSearch=true');
        } else {
          // Si ya estamos en POS, disparar evento de foco inmediato
          window.dispatchEvent(new CustomEvent('enfocar-buscador-pos'));
        }
      }
    };

    const handleCustomOpen = () => setMostrarCommandPalette(true);
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('abrir-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('abrir-command-palette', handleCustomOpen);
    };
  }, [navigate, onLock]);

  return (
    <div className="erp-app-shell">
      <Navbar
        sesion={sesion}
        alertasCount={alertasCount}
        onOpenVisor={() => setMostrarModalVisor(true)}
        onLock={onLock}
      />

      <main className="erp-main-stage">
        <Routes>
          <Route
            path="/"
            element={<PosPage sesion={sesion} onInventoryMutated={actualizarConteoAlertas} />}
          />
          <Route
            path="/inventario"
            element={<InventarioPage onInventoryMutated={actualizarConteoAlertas} />}
          />
          <Route
            path="/alertas"
            element={<AlertasPage onInventoryMutated={actualizarConteoAlertas} />}
          />
          <Route path="/kardex" element={<KardexPage />} />
          <Route path="/comprobantes" element={<ComprobantesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <VisorModal
        isOpen={mostrarModalVisor}
        onClose={() => setMostrarModalVisor(false)}
      />

      <CommandPalette
        isOpen={mostrarCommandPalette}
        onClose={() => setMostrarCommandPalette(false)}
        onOpenVisor={() => setMostrarModalVisor(true)}
        onLock={onLock}
      />
    </div>
  );
}

function OperatorShell() {
  const [alertasCount, setAlertasCount] = useState(0);

  const [sesion, setSesion] = useState(() => {
    try {
      const stored = sessionStorage.getItem('botica_sesion_activa');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const bloquearPantalla = useCallback(() => {
    try {
      sessionStorage.removeItem('botica_sesion_activa');
    } catch {
      // Ignorar error de storage restringido
    }
    setSesion(null);
  }, []);

  const actualizarConteoAlertas = useCallback(() => {
    fetch('/api/productos')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAlertasCount(data.filter((p) => Number(p.stock) <= 15).length);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sesion) {
      actualizarConteoAlertas();
    }
  }, [sesion, actualizarConteoAlertas]);

  // Watchdog de Auto-Bloqueo por Inactividad (120,000 ms = 2 minutos - PLAN.md 2.A)
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

  if (!sesion) {
    return <LoginHUD onLoginSuccess={(nuevaSesion) => setSesion(nuevaSesion)} />;
  }

  return (
    <BrowserRouter>
      <MainLayout
        sesion={sesion}
        onLock={bloquearPantalla}
        alertasCount={alertasCount}
        actualizarConteoAlertas={actualizarConteoAlertas}
      />
    </BrowserRouter>
  );
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isVisor =
    urlParams.get('visor') === 'cliente' ||
    window.location.hash === '#visor' ||
    window.location.pathname === '/visor';

  if (isVisor) {
    return <CustomerDisplay />;
  }

  return <OperatorShell />;
}
