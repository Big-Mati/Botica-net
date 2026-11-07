import React, { useState, useEffect } from 'react';

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/alertas')
      .then((res) => {
        if (!res.ok) throw new Error('Error al consultar alertas');
        return res.json();
      })
      .then((data) => {
        setAlertas(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f59e0b', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span> Panel de Alertas de Reposición
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
          Medicamentos con stock crítico (Existencias menores o iguales al stock mínimo requerido)
        </p>
      </div>

      {cargando && <p style={{ color: '#94a3b8' }}>Analizando existencias críticas...</p>}
      {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}

      {!cargando && alertas.length === 0 ? (
        <div style={{
          padding: '40px',
          background: '#1e293b',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#10b981',
          border: '1px solid #10b981'
        }}>
          <h3>✅ ¡Inventario Óptimo!</h3>
          <p style={{ color: '#94a3b8' }}>No hay medicamentos que requieran reposición urgente en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {alertas.map((item) => (
            <div
              key={item.id_producto}
              style={{
                background: '#1e293b',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '20px',
                color: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  borderRadius: '6px'
                }}>
                  URGENTE
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID: #{item.id_producto}</span>
              </div>

              <h3 style={{ margin: '12px 0 6px 0', fontSize: '16px' }}>{item.nombre}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>{item.categoria}</p>

              <div style={{
                background: '#0f172a',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-around',
                marginBottom: '14px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Stock Actual</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>{item.stock}</div>
                </div>
                <div style={{ borderRight: '1px solid #334155' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mínimo</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cbd5e1' }}>{item.stock_minimo}</div>
                </div>
                <div style={{ borderRight: '1px solid #334155' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sugerido Pedir</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                    +{item.brecha_reposicion || (item.stock_minimo * 2 - item.stock)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#f59e0b', textAlign: 'center' }}>
                ⚠️ Déficit de stock: faltan al menos {Math.max(0, item.stock_minimo - item.stock)} unidades para el mínimo
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

