import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IconReceipt,
  IconSearch,
  IconEye,
  IconPrinter,
  IconClose,
  IconRefresh,
  IconAlert
} from '../components/Icons';

export default function ComprobantesPage() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [cargandoDetalleId, setCargandoDetalleId] = useState(null);

  const cargarVentas = useCallback(() => {
    fetch('/api/ventas')
      .then((res) => {
        if (!res.ok) throw new Error('No fue posible consultar el historial de comprobantes.');
        return res.json();
      })
      .then((data) => {
        setVentas(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch((err) => {
        setAviso({ tipo: 'error', texto: err.message });
        setCargando(false);
      });
  }, []);

  const handleRefrescarVentas = () => {
    setCargando(true);
    cargarVentas();
  };

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  // Atajo de teclado: Cerrar visor de comprobante con tecla Escape
  useEffect(() => {
    if (!detalleVenta) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setDetalleVenta(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detalleVenta]);

  const metricas = useMemo(() => {
    let recaudacion = 0;
    let unidades = 0;
    for (const v of ventas) {
      recaudacion += Number(v.total) || 0;
      unidades += Number(v.total_unidades) || 0;
    }
    return {
      cantidad: ventas.length,
      recaudacion,
      unidades
    };
  }, [ventas]);

  const ventasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return ventas;
    return ventas.filter(
      (v) =>
        (v.numero_comprobante || '').toLowerCase().includes(q) ||
        (v.cliente || '').toLowerCase().includes(q) ||
        (v.metodo_pago || '').toLowerCase().includes(q) ||
        (v.vendedor || '').toLowerCase().includes(q)
    );
  }, [ventas, busqueda]);

  const verDetalle = async (id_venta) => {
    if (cargandoDetalleId) return;
    setCargandoDetalleId(id_venta);
    try {
      const res = await fetch(`/api/ventas/${id_venta}`);
      const data = await res.json();
      if (data.success) {
        setDetalleVenta(data.venta);
      } else {
        setAviso({ tipo: 'error', texto: data.message || 'No se encontró el detalle del comprobante.' });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'Error de red al recuperar el comprobante electrónico.' });
    } finally {
      setCargandoDetalleId(null);
    }
  };

  const subtotalDetalle = detalleVenta ? Number((detalleVenta.total / 1.18).toFixed(2)) : 0;
  const igvDetalle = detalleVenta ? Number((detalleVenta.total - subtotalDetalle).toFixed(2)) : 0;

  return (
    <section>
      <div className="erp-page-header no-print">
        <div>
          <div className="erp-eyebrow">
            <IconReceipt size={14} />
            <span>Facturación Electrónica · Registro Tributario SUNAT</span>
          </div>
          <h1 className="erp-page-title">Historial de Comprobantes Emitidos</h1>
          <p className="erp-page-subtitle">
            Auditoría correlativa de boletas electrónicas, métodos de recaudación y desglose de despacho.
          </p>
        </div>

        <div className="erp-header-controls">
          <button
            type="button"
            onClick={handleRefrescarVentas}
            disabled={cargando}
            className="erp-btn erp-btn-secondary"
          >
            <IconRefresh size={15} />
            <span>Actualizar Registro</span>
          </button>
        </div>
      </div>

      {/* KPIs Comerciales */}
      <div className="erp-kpi-grid no-print">
        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Boletas Registradas</span>
          <span className="erp-kpi-value">{metricas.cantidad}</span>
          <span className="erp-kpi-foot">Últimas operaciones confirmadas</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Importe Total Auditado</span>
          <span className="erp-kpi-value val-emerald">S/ {metricas.recaudacion.toFixed(2)}</span>
          <span className="erp-kpi-foot">Incluye I.G.V. 18% de ley</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Unidades Dispensadas</span>
          <span className="erp-kpi-value">{metricas.unidades} und.</span>
          <span className="erp-kpi-foot">Fármacos entregados en mostrador</span>
        </div>
      </div>

      {aviso && (
        <div className="erp-banner erp-banner-error no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlert size={16} />
            <span>{aviso.texto}</span>
          </div>
          <button type="button" className="erp-banner-close" onClick={() => setAviso(null)}>
            <IconClose size={15} />
          </button>
        </div>
      )}

      <div className="erp-toolbar no-print">
        <div className="erp-search-box">
          <span className="erp-search-icon">
            <IconSearch size={16} />
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar por serie B001, paciente, operador o modalidad de pago..."
            className="erp-input with-icon"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className={detalleVenta ? 'comprobantes-split' : ''}>
        {/* Tabla Principal */}
        <div className="erp-panel no-print">
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Paciente / Cliente</th>
                  <th>Modalidad</th>
                  <th>Operador</th>
                  <th>Unid.</th>
                  <th>Emisión</th>
                  <th>Importe Total</th>
                  <th style={{ textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Cargando registro correlativo de ventas...
                    </td>
                  </tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No existen comprobantes que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((v) => {
                    const seleccionado = detalleVenta?.id_venta === v.id_venta;
                    return (
                      <tr
                        key={v.id_venta}
                        style={
                          seleccionado
                            ? { background: 'rgba(16, 185, 129, 0.08)' }
                            : undefined
                        }
                      >
                        <td className="erp-mono" style={{ fontWeight: 700, color: 'var(--emerald-400)' }}>
                          {v.numero_comprobante}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.cliente}</td>
                        <td>
                          <span className="erp-badge badge-neutral">{v.metodo_pago || 'Efectivo'}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{v.vendedor}</td>
                        <td className="erp-mono">{v.total_unidades}</td>
                        <td className="erp-mono" style={{ fontSize: '0.77rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(v.fecha).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="erp-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          S/ {Number(v.total).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            disabled={cargandoDetalleId === v.id_venta}
                            onClick={() => verDetalle(v.id_venta)}
                            className="erp-btn erp-btn-secondary erp-btn-sm"
                          >
                            <IconEye size={14} />
                            <span>
                              {cargandoDetalleId === v.id_venta ? 'Abriendo...' : 'Inspeccionar'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Representación Electrónica del Comprobante */}
        {detalleVenta && (
          <aside
            className="erp-panel"
            style={{
              padding: '22px',
              borderColor: 'var(--border-emerald)',
              position: 'sticky',
              top: '84px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '14px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '14px'
              }}
            >
              <div>
                <div className="erp-mono" style={{ fontSize: '0.68rem', color: 'var(--emerald-400)', fontWeight: 700 }}>
                  BOTICA NOVA S.A.C. · RUC 20608493021
                </div>
                <h3 style={{ margin: '3px 0 0', fontSize: '1.08rem', fontWeight: 800 }}>
                  Boleta Electrónica {detalleVenta.numero_comprobante}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetalleVenta(null)}
                className="erp-banner-close no-print"
                aria-label="Cerrar detalle"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paciente / Cliente:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{detalleVenta.cliente}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Modalidad de pago:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{detalleVenta.metodo_pago}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Operador responsable:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{detalleVenta.vendedor}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fecha de emisión:</span>
                <span className="erp-mono" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(detalleVenta.fecha).toLocaleString('es-PE')}
                </span>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px dashed var(--border-strong)',
                borderBottom: '1px dashed var(--border-strong)',
                padding: '12px 0',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px'
              }}
            >
              {detalleVenta.items?.map((item) => (
                <div
                  key={item.id_producto}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '10px',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.cantidad}x {item.nombre}
                    </div>
                    <div className="erp-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      P.U. S/ {Number(item.precio_unitario).toFixed(2)}
                    </div>
                  </div>
                  <span className="erp-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    S/ {Number(item.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' }}>
              <div className="pos-tax-line">
                <span>Op. Gravada:</span>
                <span className="erp-mono">S/ {subtotalDetalle.toFixed(2)}</span>
              </div>
              <div className="pos-tax-line">
                <span>I.G.V. (18%):</span>
                <span className="erp-mono">S/ {igvDetalle.toFixed(2)}</span>
              </div>
              <div className="pos-grand-line">
                <span>Importe Total</span>
                <span className="pos-grand-amount">S/ {Number(detalleVenta.total).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="erp-btn erp-btn-primary no-print"
              style={{ width: '100%' }}
            >
              <IconPrinter size={16} />
              <span>Imprimir Representación</span>
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}
