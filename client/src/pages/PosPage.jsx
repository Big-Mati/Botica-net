import React, { useState, useEffect } from 'react';
import { getProductImage } from '../utils/productImages';

export default function PosPage() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeVenta, setMensajeVenta] = useState(null);

  // Estados del proceso de pago sincronizados con el Visor de Cliente (CFD)
  const [cliente, setCliente] = useState('Público General');
  const [metodoPago, setMetodoPago] = useState('Efectivo'); // 'Efectivo' | 'Yape / Plin' | 'Tarjeta'
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [comprobanteEmitido, setComprobanteEmitido] = useState(null);

  useEffect(() => {
    fetch('/api/productos')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo conectar con la API de Express');
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

  const total = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotalNeto = Number((total / 1.18).toFixed(2));
  const igv = Number((total - subtotalNeto).toFixed(2));
  const numEfectivo = Number(efectivoRecibido) || 0;
  const vuelto = numEfectivo > total ? Number((numEfectivo - total).toFixed(2)) : 0;

  // =========================================================================
  // 🔌 EMISOR REACTIVO OMNI-SYNC HACIA EL VISOR DE CLIENTE (5A)
  // Emite automáticamente cada cambio de carrito, método de pago o comprobante
  // =========================================================================
  useEffect(() => {
    let modo = 'IDLE';
    if (comprobanteEmitido) {
      modo = 'COMPROBANTE';
    } else if (carrito.length === 0) {
      modo = 'IDLE';
    } else if (metodoPago === 'Yape' || metodoPago === 'Yape / Plin') {
      modo = 'PAGO_YAPE';
    } else if (metodoPago === 'Tarjeta') {
      modo = 'PAGO_TARJETA';
    } else {
      modo = 'CARRITO';
    }

    const payload = {
      modo,
      items: carrito.map((i) => ({
        id_producto: i.id_producto,
        nombre: i.nombre,
        categoria: i.categoria || 'Medicamento',
        precio: i.precio,
        cantidad: i.cantidad,
        subtotal: i.subtotal,
        imagen: getProductImage(i.nombre)
      })),
      total,
      subtotalNeto,
      igv,
      metodoPago,
      efectivoRecibido: numEfectivo,
      vuelto,
      cliente: cliente.trim() || 'Público General',
      comprobante: comprobanteEmitido,
      updatedAt: Date.now()
    };

    // Canal 1: BroadcastChannel (0 ms en la misma PC / simulador)
    try {
      const bc = new BroadcastChannel('botica_visor_channel');
      bc.postMessage(payload);
      bc.close();
    } catch {}

    // Canal 2: LocalStorage (respaldo cross-tab)
    try {
      localStorage.setItem('botica_visor_payload', JSON.stringify(payload));
    } catch {}

    // Canal 3: POST /api/visor-estado (para smartphone por Wi-Fi / Hotspot)
    fetch('/api/visor-estado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }, [carrito, metodoPago, numEfectivo, vuelto, subtotalNeto, igv, cliente, comprobanteEmitido, total]);

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      alert('Producto sin stock disponible.');
      return;
    }
    // Si había un comprobante mostrado, al agregar producto iniciamos nueva venta
    if (comprobanteEmitido) {
      setComprobanteEmitido(null);
    }

    const existe = carrito.find((item) => item.id_producto === producto.id_producto);
    if (existe) {
      if (existe.cantidad >= producto.stock) {
        alert('No puedes superar el stock disponible.');
        return;
      }
      setCarrito(
        carrito.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio }
            : item
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          categoria: producto.categoria || 'Medicamento',
          precio: producto.precio,
          cantidad: 1,
          subtotal: producto.precio
        }
      ]);
    }
  };

  const quitarDelCarrito = (id_producto) => {
    setCarrito(carrito.filter((item) => item.id_producto !== id_producto));
  };

  const limpiarVenta = () => {
    setCarrito([]);
    setComprobanteEmitido(null);
    setEfectivoRecibido('');
    setMensajeVenta(null);
  };

  const emitirComprobante = async () => {
    if (carrito.length === 0) {
      alert('El ticket está vacío.');
      return;
    }
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: cliente.trim() || 'Público General',
          items: carrito.map((i) => ({
            id_producto: i.id_producto,
            cantidad: i.cantidad,
            precio_unitario: i.precio
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        const comp = {
          numero: data.comprobante,
          cliente: cliente.trim() || 'Público General',
          metodoPago,
          total,
          subtotalNeto,
          igv,
          fecha: new Date().toLocaleString(),
          items: carrito.map((i) => ({
            id_producto: i.id_producto,
            nombre: i.nombre,
            categoria: i.categoria,
            cantidad: i.cantidad,
            precio: i.precio,
            subtotal: i.subtotal
          }))
        };
        setComprobanteEmitido(comp);
        setMensajeVenta(`¡Venta procesada con éxito! Comprobante: ${data.comprobante}`);
        setCarrito([]);
        setEfectivoRecibido('');

        // Recargar productos para ver stock actualizado
        fetch('/api/productos')
          .then((r) => r.json())
          .then((p) => setProductos(p));
      } else {
        alert(data.message || 'Error al emitir venta.');
      }
    } catch (err) {
      alert('Error de conexión al emitir comprobante.');
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '24px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#f8fafc', margin: '0 0 5px 0', fontSize: '1.75rem' }}>🛒 Terminal POS de Farmacia</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>
            Despacho rápido con emisión y sincronización automática hacia la Pantalla de Cliente
          </p>
        </div>
      </div>

      {mensajeVenta && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
        }}>
          <div>
            <strong>✓ Operación confirmada:</strong> {mensajeVenta}
            <span style={{ display: 'block', fontSize: '12px', color: '#6ee7b7', marginTop: '2px' }}>
              El comprobante electrónico se está mostrando en vivo en la pantalla del cliente.
            </span>
          </div>
          <button
            onClick={() => setMensajeVenta(null)}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>
      )}

      {cargando && <p style={{ color: '#94a3b8' }}>Cargando catálogo desde MySQL (Express)...</p>}
      {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: '24px' }}>
        {/* Catálogo de Productos con Miniaturas */}
        <div>
          <h3 style={{ color: '#cbd5e1', marginBottom: '14px', fontSize: '1rem', letterSpacing: '0.04em' }}>
            Catálogo de Medicamentos Disponibles
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '14px'
          }}>
            {productos.map((prod) => {
              const imgProd = getProductImage(prod.nombre);
              return (
                <div
                  key={prod.id_producto}
                  style={{
                    background: '#1e293b',
                    borderRadius: '12px',
                    padding: '14px',
                    border: prod.en_alerta ? '1.5px solid #f59e0b' : '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: '#0f172a',
                        color: '#94a3b8',
                        textTransform: 'uppercase'
                      }}>
                        {prod.categoria}
                      </span>
                      {prod.en_alerta && (
                        <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold' }}>⚠️ Stock Crítico</span>
                      )}
                    </div>

                    {/* Foto WebP del Medicamento */}
                    <div style={{
                      width: '100%',
                      height: '80px',
                      background: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      padding: '6px'
                    }}>
                      <img
                        src={imgProd}
                        alt={prod.nombre}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.src = '/favicon.svg'; }}
                      />
                    </div>

                    <h4 style={{ color: '#f8fafc', margin: '0 0 4px 0', fontSize: '14px', lineHeight: 1.3 }}>{prod.nombre}</h4>
                    <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#10b981', margin: '4px 0' }}>
                      S/ {Number(prod.precio).toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                      <span>Stock: <strong style={{ color: prod.en_alerta ? '#f59e0b' : '#f8fafc' }}>{prod.stock} und.</strong></span>
                      <span style={{ color: '#64748b' }}>Mín: {prod.stock_minimo} und.</span>
                    </div>
                    {prod.ubicacion && (
                      <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '5px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📍</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.ubicacion}>
                          {prod.ubicacion}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => agregarAlCarrito(prod)}
                    disabled={prod.stock <= 0}
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: prod.stock > 0 ? '#10b981' : '#475569',
                      color: '#0f172a',
                      fontWeight: 'bold',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: prod.stock > 0 ? 'pointer' : 'not-allowed',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {prod.stock > 0 ? '+ Agregar al Ticket' : 'Agotado'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral: Ticket POS + Sincronización en Vivo */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #334155',
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
        }}>
          {/* Cabecera del Ticket */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
            <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.1rem' }}>
              🧾 Ticket de Despacho
            </h3>
            {carrito.length > 0 && (
              <button
                type="button"
                onClick={limpiarVenta}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                title="Vaciar ticket"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          {/* Campo de Cliente */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
              Cliente / Paciente:
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Público General o DNI..."
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Lista de Medicamentos en el Ticket */}
          {carrito.length === 0 ? (
            <div style={{
              padding: '30px 16px',
              textAlign: 'center',
              border: '1px dashed #334155',
              borderRadius: '10px',
              color: '#94a3b8',
              fontSize: '13px'
            }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🛒</span>
              Ningún medicamento agregado.
              <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                La pantalla del cliente se encuentra en modo <strong>IDLE (Espera)</strong>.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {carrito.map((item) => (
                <div
                  key={item.id_producto}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: '#e2e8f0',
                    background: '#0f172a',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.nombre}
                    </div>
                    <small style={{ color: '#94a3b8' }}>
                      {item.cantidad} x S/ {item.precio.toFixed(2)}
                    </small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>S/ {item.subtotal.toFixed(2)}</span>
                    <button
                      onClick={() => quitarDelCarrito(item.id_producto)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '13px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Desglose de Totales */}
          {carrito.length > 0 && (
            <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>Op. Gravada:</span>
                <span>S/ {subtotalNeto.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                <span>I.G.V. (18%):</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 'bold', color: '#ffffff', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                <span>Total a Cobrar:</span>
                <span style={{ color: '#10b981' }}>S/ {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Selector de Método de Pago (Controla el Estado 3 en el Celular) */}
          {carrito.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                Método de Pago del Cliente:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setMetodoPago('Efectivo')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: metodoPago === 'Efectivo' ? '1.5px solid #10b981' : '1px solid #334155',
                    background: metodoPago === 'Efectivo' ? 'rgba(16, 185, 129, 0.2)' : '#0f172a',
                    color: metodoPago === 'Efectivo' ? '#10b981' : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('Yape / Plin')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: metodoPago === 'Yape / Plin' ? '1.5px solid #a855f7' : '1px solid #334155',
                    background: metodoPago === 'Yape / Plin' ? 'rgba(168, 85, 247, 0.2)' : '#0f172a',
                    color: metodoPago === 'Yape / Plin' ? '#d8b4fe' : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  💜 Yape / Plin
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('Tarjeta')}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: metodoPago === 'Tarjeta' ? '1.5px solid #38bdf8' : '1px solid #334155',
                    background: metodoPago === 'Tarjeta' ? 'rgba(56, 189, 248, 0.2)' : '#0f172a',
                    color: metodoPago === 'Tarjeta' ? '#38bdf8' : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  💳 Tarjeta
                </button>
              </div>

              {/* Controles Específicos para Efectivo */}
              {metodoPago === 'Efectivo' && (
                <div style={{ marginTop: '10px', background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Efectivo entregado por cliente:</span>
                    <input
                      type="number"
                      placeholder={`S/ ${total.toFixed(2)}`}
                      value={efectivoRecibido}
                      onChange={(e) => setEfectivoRecibido(e.target.value)}
                      style={{
                        width: '90px',
                        padding: '4px 8px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        textAlign: 'right'
                      }}
                    />
                  </div>

                  {/* Botones rápidos de billetes */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    {[10, 20, 50, 100].map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setEfectivoRecibido(String(billete))}
                        style={{
                          flex: 1,
                          padding: '3px 6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          color: '#cbd5e1',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        S/ {billete}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEfectivoRecibido(String(total))}
                      style={{
                        flex: 1,
                        padding: '3px 6px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        borderRadius: '4px',
                        color: '#10b981',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Exacto
                    </button>
                  </div>

                  {/* Vuelto calculado en vivo */}
                  {numEfectivo > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#10b981', borderTop: '1px dashed #334155', paddingTop: '6px' }}>
                      <span>Vuelto a entregar:</span>
                      <span>S/ {vuelto.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje Informativo para Yape / Plin */}
              {metodoPago === 'Yape / Plin' && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', borderRadius: '8px', fontSize: '11px', color: '#e9d5ff' }}>
                  📱 <strong>Visor de Cliente:</strong> Se está mostrando el código QR de Yape/Plin por <strong>S/ {total.toFixed(2)}</strong> con escaneo láser activo.
                </div>
              )}

              {/* Mensaje Informativo para Tarjeta */}
              {metodoPago === 'Tarjeta' && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', borderRadius: '8px', fontSize: '11px', color: '#bae6fd' }}>
                  💳 <strong>Visor de Cliente:</strong> Se está mostrando el radar contactless NFC por <strong>S/ {total.toFixed(2)}</strong>.
                </div>
              )}
            </div>
          )}

          {/* Botón de Emisión de Comprobante */}
          <button
            onClick={emitirComprobante}
            disabled={carrito.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: carrito.length > 0 ? '#10b981' : '#334155',
              color: carrito.length > 0 ? '#0f172a' : '#64748b',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: carrito.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              boxShadow: carrito.length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Emitir Boleta Electrónica (F12)
          </button>
        </div>
      </div>
    </div>
  );
}
