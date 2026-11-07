import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkStyle = ({ isActive }) => ({
    color: isActive ? '#10b981' : '#cbd5e1',
    textDecoration: 'none',
    fontWeight: isActive ? '700' : '500',
    padding: '8px 12px',
    borderRadius: '6px',
    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    transition: 'all 0.2s ease'
  });

  return (
    <header style={{
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        {/* Logotipo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏥</span>
          <div>
            <strong style={{ color: '#fff', fontSize: '18px', letterSpacing: '-0.5px' }}>BoticaNet+</strong>
            <span style={{ display: 'block', fontSize: '10px', color: '#10b981', fontWeight: 600 }}>SISTEMA POS & ERP</span>
          </div>
        </div>

        {/* Enlaces de Navegación SPA */}
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <NavLink to="/" style={linkStyle} end>
            🛒 POS / Venta
          </NavLink>
          <NavLink to="/inventario" style={linkStyle}>
            📦 Inventario
          </NavLink>
          <NavLink to="/alertas" style={linkStyle}>
            ⚠️ Alertas
          </NavLink>
          <NavLink to="/comprobantes" style={linkStyle}>
            🧾 Comprobantes
          </NavLink>
          <NavLink to="/login" style={linkStyle}>
            🔐 Login
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

