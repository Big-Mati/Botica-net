import React, { useState, useEffect } from 'react';

export default function InventarioPage() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/productos')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar inventario');
        return res.json();
      })
      .then((data) => {
        setProductos(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', margin: '0 0 5px 0' }}>📦 Catálogo e Inventario</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Control de existencias y precios en tiempo real</p>
        </div>

        <input
          type="search"
          placeholder="🔍 Buscar medicamento o categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#fff',
            minWidth: '280px'
          }}
        />
      </div>

      {cargando && <p style={{ color: '#94a3b8' }}>Cargando datos desde la API...</p>}
      {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}

      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' }}>
              <th style={{ padding: '14px 16px' }}>ID</th>
              <th style={{ padding: '14px 16px' }}>Medicamento</th>
              <th style={{ padding: '14px 16px' }}>Categoría</th>
              <th style={{ padding: '14px 16px' }}>Precio</th>
              <th style={{ padding: '14px 16px' }}>Stock Actual</th>
              <th style={{ padding: '14px 16px' }}>Stock Mínimo</th>
              <th style={{ padding: '14px 16px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((prod) => (
              <tr
                key={prod.id_producto}
                style={{
                  borderBottom: '1px solid #334155',
                  fontSize: '14px'
                }}
              >
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>#{prod.id_producto}</td>
                <td style={{ padding: '12px 16px', fontWeight: '600' }}>{prod.nombre}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#0f172a',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    {prod.categoria}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 'bold' }}>
                  S/ {Number(prod.precio).toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{prod.stock}</td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{prod.stock_minimo}</td>
                <td style={{ padding: '12px 16px' }}>
                  {prod.en_alerta ? (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ⚠️ Stock Crítico
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      🟢 Normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {productosFiltrados.length === 0 && !cargando && (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron medicamentos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

