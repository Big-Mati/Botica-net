import React, { useState, useEffect } from 'react';

export default function ComprobantesPage() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    fetch('/api/ventas')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar ventas');
        return res.json();
      })
      .then((data) => {
        setVentas(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  const verDetalle = async (id_venta) => {
    setCargandoDetalle(true);
    try {
      const res = await fetch(`/api/ventas/${id_venta}`);
      const data = await res.json();
      if (data.success) {
        setDetalleVenta(data.venta);
      } else {
        alert(data.message || 'Error al obtener detalle');
      }
    } catch (e) {
      alert('Error de conexión al obtener comprobante');
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#f8fafc', margin: '0 0 6px 0' }}>🧾 Historial de Comprobantes Emitidos</h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
          Registro correlativo de ventas, tickets de atención y auditoría comercial
        </p>
      </div>

      {cargando && <p style={{ color: '#94a3b8' }}>Cargando historial de comprobantes...</p>}
      {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: detalleVenta ? '3fr 2fr' : '1fr', gap: '24px' }}>
        {/* Tabla de Comprobantes */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
            <thead>
              <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' }}>
                <th style={{ padding: '14px 16px' }}>N° Comprobante</th>
                <th style={{ padding: '14px 16px' }}>Cliente</th>
                <th style={{ padding: '14px 16px' }}>Fecha y Hora</th>
                <th style={{ padding: '14px 16px' }}>Total</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id_venta} style={{ borderBottom: '1px solid #334155', fontSize: '14px' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 'bold', color: '#38bdf8' }}>
                    {v.numero_comprobante}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{v.cliente}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>
                    {new Date(v.fecha).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 'bold' }}>
                    S/ {Number(v.total).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => verDetalle(v.id_venta)}
                      style={{
                        padding: '6px 12px',
                        background: '#334155',
                        border: 'none',
                        color: '#f8fafc',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      👁️ Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && !cargando && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No hay comprobantes registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal / Panel lateral de detalle del comprobante */}
        {detalleVenta && (
          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            border: '1px solid #10b981',
            padding: '24px',
            color: '#f8fafc',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#10b981' }}>Detalle de Comprobante</h3>
              <button
                onClick={() => setDetalleVenta(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '16px' }}>
              <div><strong>Comprobante:</strong> <span style={{ color: '#38bdf8' }}>{detalleVenta.numero_comprobante}</span></div>
              <div><strong>Cliente:</strong> {detalleVenta.cliente}</div>
              <div><strong>Fecha:</strong> {new Date(detalleVenta.fecha).toLocaleString()}</div>
            </div>

            <h4 style={{ color: '#cbd5e1', fontSize: '13px', margin: '12px 0 8px 0', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
              Medicamentos Despachados:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {detalleVenta.items?.map((item) => (
                <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{item.cantidad}x {item.nombre}</span>
                  <span style={{ fontWeight: 'bold' }}>S/ {Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 'bold',
              borderTop: '1px solid #334155',
              paddingTop: '12px',
              color: '#10b981'
            }}>
              <span>Total Pagado:</span>
              <span>S/ {Number(detalleVenta.total).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

