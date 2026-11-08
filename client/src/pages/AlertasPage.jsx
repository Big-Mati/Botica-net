import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getProductImage } from '../utils/productImages';
import {
  IconAlert,
  IconCheck,
  IconPlus,
  IconLocation,
  IconRefresh,
  IconClose,
  IconSearch
} from '../components/Icons';

function clasificarSemafaroStock(stock) {
  const s = Number(stock) || 0;
  if (s <= 15) {
    return {
      clave: 'ROJO',
      etiqueta: 'CRÍTICO · ≤ 15 UND.',
      cardClass: 'nivel-rojo',
      badgeClass: 'badge-danger',
      fillClass: 'fill-rojo',
      colorValor: 'var(--crimson-400)',
      sugerido: Math.max(35 - s, 15)
    };
  }
  if (s <= 30) {
    return {
      clave: 'AMARILLO',
      etiqueta: 'PREVENTIVO · 16–30 UND.',
      cardClass: 'nivel-amarillo',
      badgeClass: 'badge-warn',
      fillClass: 'fill-amarillo',
      colorValor: 'var(--amber-400)',
      sugerido: Math.max(40 - s, 10)
    };
  }
  return {
    clave: 'VERDE',
    etiqueta: 'ABASTECIDO · > 30 UND.',
    cardClass: 'nivel-verde',
    badgeClass: 'badge-ok',
    fillClass: 'fill-verde',
    colorValor: 'var(--emerald-400)',
    sugerido: 10
  };
}

export default function AlertasPage({ onInventoryMutated }) {
  const [productos, setProductos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('TODOS'); // 'TODOS' | 'ROJO' | 'AMARILLO' | 'VERDE'
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cargarMonitorStock = useCallback(() => {
    fetch('/api/productos')
      .then((res) => {
        if (!res.ok) throw new Error('No fue posible consultar el inventario de medicamentos.');
        return res.json();
      })
      .then((data) => {
        const listaOrdenada = (Array.isArray(data) ? [...data] : []).sort(
          (a, b) => Number(a.stock) - Number(b.stock) || a.nombre.localeCompare(b.nombre)
        );
        setProductos(listaOrdenada);

        const mapInicial = {};
        for (const item of listaOrdenada) {
          const info = clasificarSemafaroStock(item.stock);
          mapInicial[item.id_producto] = String(info.sugerido);
        }
        setCantidades(mapInicial);
        setCargando(false);
      })
      .catch((err) => {
        setAviso({ tipo: 'error', texto: err.message });
        setCargando(false);
      });
  }, []);

  const handleRefrescar = () => {
    setCargando(true);
    cargarMonitorStock();
  };

  useEffect(() => {
    cargarMonitorStock();
  }, [cargarMonitorStock]);

  const metricas = useMemo(() => {
    let rojos = 0;
    let amarillos = 0;
    let verdes = 0;

    for (const item of productos) {
      const s = Number(item.stock) || 0;
      if (s <= 15) rojos += 1;
      else if (s <= 30) amarillos += 1;
      else verdes += 1;
    }

    return {
      total: productos.length,
      rojos,
      amarillos,
      verdes
    };
  }, [productos]);

  const productosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((item) => {
      const nivel = clasificarSemafaroStock(item.stock).clave;
      if (filtroNivel !== 'TODOS' && nivel !== filtroNivel) return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        (item.categoria || '').toLowerCase().includes(q) ||
        (item.lote || '').toLowerCase().includes(q) ||
        (item.ubicacion || '').toLowerCase().includes(q)
      );
    });
  }, [productos, filtroNivel, busqueda]);

  const ejecutarReposicion = async (item) => {
    if (procesandoId) return;
    const cant = Number.parseInt(cantidades[item.id_producto], 10);
    if (!Number.isInteger(cant) || cant <= 0) {
      setAviso({ tipo: 'warn', texto: 'Ingrese una cantidad entera positiva de unidades a ingresar.' });
      return;
    }

    setProcesandoId(item.id_producto);
    try {
      const res = await fetch(`/api/productos/${item.id_producto}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: cant })
      });
      const data = await res.json();
      if (data.success) {
        setAviso({
          tipo: 'success',
          texto: `Reposición completada: +${cant} und. ingresadas para "${item.nombre}" (asentado en Kardex).`
        });
        cargarMonitorStock();
        if (onInventoryMutated) onInventoryMutated();
      } else {
        setAviso({ tipo: 'error', texto: data.message || 'No se pudo actualizar el stock.' });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'Error de conexión al ejecutar la orden de reposición.' });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <section>
      <div className="erp-page-header">
        <div>
          <div className="erp-eyebrow">
            <IconAlert size={14} />
            <span>Semáforo Clínico de Abastecimiento · Catálogo Completo</span>
          </div>
          <h1 className="erp-page-title">Monitor de Stock y Alertas de Reposición</h1>
          <p className="erp-page-subtitle">
            Supervisión integral de todos los medicamentos clasificados por nivel de cobertura: crítico (≤ 15), preventivo (16 a 30) y óptimo (&gt; 30).
          </p>
        </div>

        <div className="erp-header-controls">
          <button
            type="button"
            onClick={handleRefrescar}
            disabled={cargando}
            className="erp-btn erp-btn-secondary"
          >
            <IconRefresh size={15} />
            <span>Actualizar Niveles</span>
          </button>
        </div>
      </div>

      {/* KPIs del Semáforo (Rojo <= 15 | Amarillo 16-30 | Verde > 30) */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card kpi-danger">
          <span className="erp-kpi-label">Crítico · 15 o menos</span>
          <span className="erp-kpi-value val-crimson">{metricas.rojos} SKUs</span>
          <span className="erp-kpi-foot">Alerta roja: requieren reposición prioritaria</span>
        </div>

        <div className="erp-kpi-card kpi-warn">
          <span className="erp-kpi-label">Preventivo · 16 a 30 und.</span>
          <span className="erp-kpi-value val-amber">{metricas.amarillos} SKUs</span>
          <span className="erp-kpi-foot">Alerta amarilla: cobertura media en observación</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Óptimo · Más de 30 und.</span>
          <span className="erp-kpi-value val-emerald">{metricas.verdes} SKUs</span>
          <span className="erp-kpi-foot">Estado verde: stock saludable en anaquel</span>
        </div>
      </div>

      {aviso && (
        <div
          className={`erp-banner ${
            aviso.tipo === 'success'
              ? 'erp-banner-success'
              : aviso.tipo === 'warn'
              ? 'erp-banner-warn'
              : 'erp-banner-error'
          }`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            {aviso.tipo === 'success' ? <IconCheck size={16} /> : <IconAlert size={16} />}
            <span>{aviso.texto}</span>
          </div>
          <button type="button" className="erp-banner-close" onClick={() => setAviso(null)}>
            <IconClose size={15} />
          </button>
        </div>
      )}

      {/* Barra de Búsqueda + Filtros por Color del Semáforo */}
      <div className="erp-toolbar">
        <div className="erp-search-box">
          <span className="erp-search-icon">
            <IconSearch size={16} />
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar medicamento, categoría, lote o ubicación..."
            className="erp-input with-icon"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        <div className="erp-filter-group">
          <button
            type="button"
            onClick={() => setFiltroNivel('TODOS')}
            className={`erp-filter-pill ${filtroNivel === 'TODOS' ? 'active' : ''}`}
          >
            Todos ({metricas.total})
          </button>
          <button
            type="button"
            onClick={() => setFiltroNivel('ROJO')}
            className={`erp-filter-pill pill-rojo ${filtroNivel === 'ROJO' ? 'active' : ''}`}
          >
            Rojo ≤ 15 ({metricas.rojos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroNivel('AMARILLO')}
            className={`erp-filter-pill pill-amarillo ${filtroNivel === 'AMARILLO' ? 'active' : ''}`}
          >
            Amarillo 16–30 ({metricas.amarillos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroNivel('VERDE')}
            className={`erp-filter-pill pill-verde ${filtroNivel === 'VERDE' ? 'active' : ''}`}
          >
            Verde &gt; 30 ({metricas.verdes})
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="erp-panel" style={{ padding: '44px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Evaluando niveles de stock de todo el catálogo...
        </div>
      ) : productosVisibles.length === 0 ? (
        <div className="erp-panel" style={{ padding: '42px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay medicamentos que coincidan con el filtro seleccionado.
        </div>
      ) : (
        <div className="alertas-cards-grid">
          {productosVisibles.map((item) => {
            const semaforo = clasificarSemafaroStock(item.stock);
            const ratioPct = Math.min(100, Math.max(6, Math.round((Number(item.stock) / 45) * 100)));
            const imgSrc = getProductImage(item.nombre, item.id_producto);
            const metaVerde = Math.max(0, 31 - Number(item.stock));

            return (
              <article key={item.id_producto} className={`alerta-card ${semaforo.cardClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span className={`erp-badge ${semaforo.badgeClass}`}>
                    <span className="erp-badge-dot" />
                    <span>{semaforo.etiqueta}</span>
                  </span>
                  <span className="erp-mono" style={{ fontSize: '0.71rem', color: 'var(--text-dim)' }}>
                    SKU-{String(item.id_producto).padStart(3, '0')} · {item.lote}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={imgSrc}
                      alt={item.nombre}
                      width="40"
                      height="40"
                      loading="lazy"
                      style={{ objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.src = '/favicon.svg';
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 3px', fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.nombre}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{item.categoria}</span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <IconLocation size={12} />
                        {item.ubicacion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra de Cobertura de Semáforo */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Nivel de abastecimiento</span>
                    <span className="erp-mono" style={{ color: semaforo.colorValor, fontWeight: 700 }}>
                      {item.stock} und.
                    </span>
                  </div>
                  <div className="alerta-progress-track">
                    <div
                      className={`alerta-progress-fill ${semaforo.fillClass}`}
                      style={{ width: `${ratioPct}%` }}
                    />
                  </div>
                </div>

                {/* Métricas Contiguas */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 8px',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stock Actual</div>
                    <div className="erp-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: semaforo.colorValor }}>
                      {item.stock}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Mínimo Base</div>
                    <div className="erp-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {item.stock_minimo}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Para Nivel Verde</div>
                    <div
                      className="erp-mono"
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: metaVerde > 0 ? semaforo.colorValor : 'var(--emerald-400)'
                      }}
                    >
                      {metaVerde > 0 ? `+${metaVerde}` : 'OK'}
                    </div>
                  </div>
                </div>

                {/* Acción Directa de Ingreso a Almacén + Kardex */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={cantidades[item.id_producto] || ''}
                    onChange={(e) =>
                      setCantidades({ ...cantidades, [item.id_producto]: e.target.value })
                    }
                    className="erp-input erp-mono"
                    style={{ width: '88px', textAlign: 'center' }}
                    aria-label={`Cantidad a reponer para ${item.nombre}`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    disabled={procesandoId === item.id_producto}
                    onClick={() => ejecutarReposicion(item)}
                    className={`erp-btn ${
                      semaforo.clave === 'VERDE' ? 'erp-btn-secondary' : 'erp-btn-primary'
                    }`}
                    style={{ flex: 1 }}
                  >
                    <IconPlus size={15} />
                    <span>
                      {procesandoId === item.id_producto
                        ? 'Ingresando...'
                        : semaforo.clave === 'VERDE'
                        ? 'Sumar Stock'
                        : 'Ingresar Reposición'}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
