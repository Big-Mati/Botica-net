import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IconSearch,
  IconRefresh,
  IconArrowUpRight,
  IconArrowDownRight,
  IconShield,
  IconClose
} from '../components/Icons';

const TIPO_CONFIG = {
  ENTRADA_INICIAL: {
    label: 'ALTA INICIAL',
    badgeClass: 'badge-ok',
    sign: '+',
    group: 'ENTRADAS'
  },
  ENTRADA_COMPRA: {
    label: 'INGRESO ALMACÉN',
    badgeClass: 'badge-ok',
    sign: '+',
    group: 'ENTRADAS'
  },
  SALIDA_VENTA: {
    label: 'SALIDA POR VENTA',
    badgeClass: 'badge-danger',
    sign: '-',
    group: 'SALIDAS'
  },
  AJUSTE_MERMA: {
    label: 'AJUSTE / MERMA',
    badgeClass: 'badge-warn',
    sign: '-',
    group: 'MERMAS'
  }
};

export default function KardexPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS' | 'ENTRADAS' | 'SALIDAS' | 'MERMAS'

  const cargarKardex = useCallback(() => {
    fetch('/api/kardex')
      .then((res) => {
        if (!res.ok) throw new Error('No fue posible consultar el registro de Kardex.');
        return res.json();
      })
      .then((data) => {
        setMovimientos(Array.isArray(data) ? data : []);
        setError(null);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  const handleRefrescarKardex = () => {
    setCargando(true);
    cargarKardex();
  };

  useEffect(() => {
    cargarKardex();
  }, [cargarKardex]);

  const resumen = useMemo(() => {
    let totalEntradas = 0;
    let totalSalidas = 0;
    let discrepancias = 0;

    for (const m of movimientos) {
      const cant = Number(m.cantidad) || 0;
      const ant = Number(m.stock_anterior) || 0;
      const post = Number(m.stock_posterior) || 0;
      const cfg = TIPO_CONFIG[m.tipo_movimiento] || TIPO_CONFIG.ENTRADA_COMPRA;

      if (cfg.sign === '+') {
        totalEntradas += cant;
        if (ant + cant !== post) discrepancias += 1;
      } else {
        totalSalidas += cant;
        if (ant - cant !== post) discrepancias += 1;
      }
    }

    return {
      totalRegistros: movimientos.length,
      totalEntradas,
      totalSalidas,
      integridadOk: discrepancias === 0
    };
  }, [movimientos]);

  const movimientosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return movimientos.filter((m) => {
      const cfg = TIPO_CONFIG[m.tipo_movimiento] || TIPO_CONFIG.ENTRADA_COMPRA;
      if (filtroTipo !== 'TODOS' && cfg.group !== filtroTipo) return false;
      if (!q) return true;
      const prod = (m.producto || '').toLowerCase();
      const ref = (m.motivo_referencia || '').toLowerCase();
      const cat = (m.categoria || '').toLowerCase();
      return prod.includes(q) || ref.includes(q) || cat.includes(q);
    });
  }, [movimientos, busqueda, filtroTipo]);

  return (
    <section>
      <div className="erp-page-header">
        <div>
          <div className="erp-eyebrow">
            <IconShield size={14} />
            <span>Auditoría Contable · Trazabilidad DIGEMID</span>
          </div>
          <h1 className="erp-page-title">Kardex de Movimientos en Tiempo Real</h1>
          <p className="erp-page-subtitle">
            Verificación matemática inmutable de ingresos, despachos de caja y saldos resultantes por medicamento.
          </p>
        </div>

        <div className="erp-header-controls">
          <button
            type="button"
            onClick={handleRefrescarKardex}
            disabled={cargando}
            className="erp-btn erp-btn-secondary"
          >
            <IconRefresh size={15} />
            <span>{cargando ? 'Sincronizando...' : 'Actualizar Auditoría'}</span>
          </button>
        </div>
      </div>

      {/* KPIs de Trazabilidad */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Operaciones Auditadas</span>
          <span className="erp-kpi-value">{resumen.totalRegistros}</span>
          <span className="erp-kpi-foot">Últimos movimientos registrados en MySQL</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Unidades Ingresadas</span>
          <span className="erp-kpi-value val-emerald">+{resumen.totalEntradas}</span>
          <span className="erp-kpi-foot">Altas iniciales y compras de reposición</span>
        </div>

        <div className="erp-kpi-card kpi-danger">
          <span className="erp-kpi-label">Unidades Despachadas</span>
          <span className="erp-kpi-value val-crimson">-{resumen.totalSalidas}</span>
          <span className="erp-kpi-foot">Salidas automáticas por ventas POS y mermas</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Integridad Aritmética</span>
          <span className={`erp-kpi-value ${resumen.integridadOk ? 'val-emerald' : 'val-amber'}`}>
            {resumen.integridadOk ? '100% Exacta' : 'Revisar'}
          </span>
          <span className="erp-kpi-foot">Validación Stock Anterior ± Movimiento = Posterior</span>
        </div>
      </div>

      {error && (
        <div className="erp-banner erp-banner-error">
          <span>Error de conexión con Kardex: {error}</span>
          <button type="button" className="erp-banner-close" onClick={() => setError(null)}>
            <IconClose size={15} />
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros Rápidos (PLAN.md 2.G) */}
      <div className="erp-toolbar">
        <div className="erp-search-box">
          <span className="erp-search-icon">
            <IconSearch size={16} />
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar por medicamento, categoría o N° comprobante..."
            className="erp-input with-icon"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        <div className="erp-filter-group" role="tablist" aria-label="Filtro de tipo de movimiento">
          <button
            type="button"
            onClick={() => setFiltroTipo('TODOS')}
            className={`erp-filter-pill ${filtroTipo === 'TODOS' ? 'active' : ''}`}
          >
            Todos ({movimientos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('ENTRADAS')}
            className={`erp-filter-pill ${filtroTipo === 'ENTRADAS' ? 'active' : ''}`}
          >
            Solo Entradas
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('SALIDAS')}
            className={`erp-filter-pill ${filtroTipo === 'SALIDAS' ? 'active' : ''}`}
          >
            Salidas por Venta
          </button>
          <button
            type="button"
            onClick={() => setFiltroTipo('MERMAS')}
            className={`erp-filter-pill ${filtroTipo === 'MERMAS' ? 'active' : ''}`}
          >
            Ajustes y Mermas
          </button>
        </div>
      </div>

      {/* Tabla Contable de Kardex */}
      <div className="erp-panel">
        <div className="erp-table-scroll">
          <table className="erp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Medicamento</th>
                <th>Tipo de Operación</th>
                <th>Stock Anterior</th>
                <th>Movimiento</th>
                <th>Stock Posterior</th>
                <th>Documento / Referencia</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Consultando bitácora transaccional de Kardex...
                  </td>
                </tr>
              ) : movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No se registran movimientos para el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((mov) => {
                  const cfg = TIPO_CONFIG[mov.tipo_movimiento] || TIPO_CONFIG.ENTRADA_COMPRA;
                  const esIngreso = cfg.sign === '+';

                  return (
                    <tr key={mov.id_movimiento}>
                      <td className="erp-mono" style={{ color: 'var(--text-dim)' }}>
                        #{String(mov.id_movimiento).padStart(4, '0')}
                      </td>
                      <td className="erp-mono" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {new Date(mov.fecha).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{mov.producto}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {mov.categoria || 'General'}
                        </div>
                      </td>
                      <td>
                        <span className={`erp-badge ${cfg.badgeClass}`}>
                          {esIngreso ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
                          <span>{cfg.label}</span>
                        </span>
                      </td>
                      <td className="erp-mono" style={{ color: 'var(--text-muted)' }}>
                        {mov.stock_anterior} und.
                      </td>
                      <td
                        className="erp-mono"
                        style={{
                          fontWeight: 800,
                          color: esIngreso ? 'var(--emerald-400)' : 'var(--crimson-400)'
                        }}
                      >
                        {cfg.sign}{mov.cantidad} und.
                      </td>
                      <td className="erp-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {mov.stock_posterior} und.
                      </td>
                      <td>
                        <span className="erp-badge badge-neutral erp-mono" style={{ fontWeight: 600 }}>
                          {mov.motivo_referencia || 'Operación interna'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
