import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuario || !password) {
      setMensaje('Por favor ingrese usuario y contraseña.');
      return;
    }

    // Simulación de autenticación sencilla
    sessionStorage.setItem('botica_usuario', usuario);
    setMensaje(`¡Bienvenido, ${usuario}! Redirigiendo al POS...`);
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '60px auto',
      background: '#1e293b',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
      color: '#f8fafc',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
      <h2 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Acceso al Sistema</h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
        Identificación de Químico Farmacéutico / Vendedor
      </p>

      {mensaje && (
        <div style={{
          padding: '10px',
          marginBottom: '16px',
          borderRadius: '6px',
          backgroundColor: mensaje.includes('Bienvenido') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: mensaje.includes('Bienvenido') ? '#10b981' : '#f87171',
          fontSize: '14px'
        }}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Usuario:</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Ej: farmaceutico1"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: '8px',
            backgroundColor: '#10b981',
            color: '#0f172a',
            fontWeight: 'bold',
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Ingresar al Turno
        </button>
      </form>
    </div>
  );
}

