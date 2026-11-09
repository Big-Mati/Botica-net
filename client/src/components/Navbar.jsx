import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  IconTerminal,
  IconBox,
  IconAlert,
  IconKardex,
  IconReceipt,
  IconMonitor,
  IconLock
} from './Icons';

function obtenerIniciales(nombreCompleto) {
  const partes = String(nombreCompleto || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return 'OP';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export default function Navbar({ sesion, alertasCount = 0, onOpenVisor, onLock }) {
  const navClass = ({ isActive }) => `erp-nav-item${isActive ? ' active' : ''}`;
  const operadorNombre = sesion?.nombre || sesion?.usuario || 'Operador';
  const operadorTurno = sesion?.turno || 'Turno Activo';
  const iniciales = obtenerIniciales(operadorNombre);

  return (
    <header className="erp-topbar">
      <div className="erp-topbar-inner">
        <div className="erp-topbar-left">
          <NavLink to="/" className="erp-brand-block" end>
            <div className="erp-brand-logo-container">
              <div className="erp-brand-logo-glow" />
              <span className="erp-brand-particle p1" />
              <span className="erp-brand-particle p2" />
              <span className="erp-brand-particle p3" />
              <span className="erp-brand-particle p4" />
              <img
                src="/favicon.svg"
                alt="Botica Nova"
                width="30"
                height="30"
                className="erp-brand-logo"
              />
            </div>
            <div className="erp-brand-text">
              <span className="erp-brand-name">Botica Nova</span>
              <span className="erp-brand-sub">ERP · POS Clínico</span>
            </div>
          </NavLink>

          <span className="erp-topbar-divider erp-brand-divider" aria-hidden="true" />
        </div>

        <nav className="erp-nav-links" aria-label="Módulos del sistema">
          <NavLink to="/" className={navClass} end>
            <IconTerminal size={15} />
            <span>Terminal POS</span>
          </NavLink>
          <NavLink to="/inventario" className={navClass}>
            <IconBox size={15} />
            <span>Inventario</span>
          </NavLink>
          <NavLink to="/alertas" className={navClass}>
            <IconAlert size={15} />
            <span>Alertas</span>
            {alertasCount > 0 && <span className="erp-nav-counter">{alertasCount}</span>}
          </NavLink>
          <NavLink to="/kardex" className={navClass}>
            <IconKardex size={15} />
            <span>Kardex</span>
          </NavLink>
          <NavLink to="/comprobantes" className={navClass}>
            <IconReceipt size={15} />
            <span>Comprobantes</span>
          </NavLink>
        </nav>

        <div className="erp-topbar-actions">
          <div
            className="erp-operator-chip"
            title={`Operador autenticado: ${operadorNombre} (${operadorTurno})`}
          >
            <div className="erp-operator-avatar" aria-hidden="true">
              <span>{iniciales}</span>
              <span className="erp-live-dot" />
            </div>
            <div className="erp-operator-meta">
              <span className="erp-operator-name">{operadorNombre}</span>
              <span className="erp-operator-shift">{operadorTurno}</span>
            </div>
          </div>

          <span className="erp-topbar-divider erp-actions-divider" aria-hidden="true" />

          <button
            type="button"
            onClick={onOpenVisor}
            className="erp-cmd-btn erp-cmd-visor"
            title="Configurar o abrir Pantalla de Cliente (Smartphone / Simulador PC)"
          >
            <span className="erp-visor-beacon" aria-hidden="true" />
            <IconMonitor size={15} />
            <span>Visor Cliente</span>
          </button>

          <button
            type="button"
            onClick={onLock}
            className="erp-cmd-btn erp-cmd-lock"
            title="Bloquear terminal activa (Atajo Alt + L)"
          >
            <IconLock size={14} />
            <span>Bloquear</span>
            <kbd className="erp-kbd">Alt+L</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
