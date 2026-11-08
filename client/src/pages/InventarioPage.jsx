import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PRODUCT_IMAGE_CATALOG,
  getProductImage,
  saveCustomProductImage
} from '../utils/productImages';
import {
  IconBox,
  IconSearch,
  IconPlus,
  IconClose,
  IconCheck,
  IconAlert,
  IconLocation,
  IconKardex
} from '../components/Icons';

const INITIAL_FORM = {
  nombre: '',
  categoria: 'Analgésicos',
  precio: '',
  stock: '',
  stock_minimo: '15',
  ubicacion: 'Mostrador Principal · Nivel 1',
  imagenPath: PRODUCT_IMAGE_CATALOG[0].path
};

export default function InventarioPage({ onInventoryMutated }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'CRITICO' | 'NORMAL'
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);

  // Modal de Alta de Nuevo Medicamento (PLAN.md 2.D)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formProd, setFormProd] = useState(INITIAL_FORM);
  const [guardandoProd, setGuardandoProd] = useState(false);

  // Reabastecimiento rápido desde fila
  const [reponiendoId, setReponiendoId] = useState(null);

  const cargarDatos = useCallback(() => {
    Promise.all([
      fetch('/api/productos').then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el inventario.');
        return r.json();
      }),
      fetch('/api/categorias')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
    ])
      .then(([prods, cats]) => {
        setProductos(Array.isArray(prods) ? prods : []);
        setCategorias(Array.isArray(cats) ? cats : []);
        setCargando(false);
      })
      .catch((err) => {
        setAviso({ tipo: 'error', texto: err.message });
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const kpis = useMemo(() => {
    let unidades = 0;
    let valorizacion = 0;
    let rojos = 0;
    let amarillos = 0;
    let verdes = 0;
    for (const p of productos) {
      const s = Number(p.stock) || 0;
      unidades += s;
      valorizacion += s * (Number(p.precio) || 0);
      if (s <= 15) rojos += 1;
      else if (s <= 30) amarillos += 1;
      else verdes += 1;
    }
    return {
      totalSkus: productos.length,
      unidades,
      valorizacion,
      enAlerta: rojos,
      amarillos,
      verdes
    };
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const s = Number(p.stock) || 0;
      if (filtroEstado === 'CRITICO' && s > 15) return false;
      if (filtroEstado === 'MEDIO' && (s < 16 || s > 30)) return false;
      if (filtroEstado === 'NORMAL' && s <= 30) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q) ||
        (p.lote || '').toLowerCase().includes(q) ||
        (p.ubicacion || '').toLowerCase().includes(q)
      );
    });
  }, [productos, busqueda, filtroEstado]);

  const handleRegistrarProducto = async (e) => {
    e.preventDefault();
    if (guardandoProd) return;

    const nombreLimpio = formProd.nombre.trim();
    const precioNum = Number(formProd.precio);
    const stockNum = Number.parseInt(formProd.stock, 10);
    const stockMinNum = Number.parseInt(formProd.stock_minimo, 10);

    if (!nombreLimpio || !Number.isFinite(precioNum) || precioNum <= 0) {
      setAviso({ tipo: 'warn', texto: 'Ingrese un nombre válido y un precio unitario mayor a S/ 0.00.' });
      return;
    }

    setGuardandoProd(true);
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreLimpio,
          categoria: formProd.categoria,
          precio: precioNum,
          stock: Number.isInteger(stockNum) && stockNum >= 0 ? stockNum : 0,
          stock_minimo: Number.isInteger(stockMinNum) && stockMinNum >= 1 ? stockMinNum : 10,
          ubicacion: formProd.ubicacion.trim() || 'Mostrador Principal · Nivel 1'
        })
      });

      const data = await res.json();
      if (data.success) {
        saveCustomProductImage(data.id_producto, nombreLimpio, formProd.imagenPath);
        setModalAbierto(false);
        setFormProd(INITIAL_FORM);
        setAviso({
          tipo: 'success',
          texto: `Medicamento "${nombreLimpio}" registrado con lote inicial y trazabilidad en Kardex.`
        });
        cargarDatos();
        if (onInventoryMutated) onInventoryMutated();
      } else {
        setAviso({ tipo: 'error', texto: data.message || 'No se pudo registrar el medicamento.' });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'Error de red al registrar el nuevo medicamento.' });
    } finally {
      setGuardandoProd(false);
    }
  };

  const handleIngresoRapido = async (prod, cantidad = 20) => {
    if (reponiendoId) return;
    setReponiendoId(prod.id_producto);
    try {
      const res = await fetch(`/api/productos/${prod.id_producto}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad })
      });
      const data = await res.json();
      if (data.success) {
        setAviso({
          tipo: 'success',
          texto: `Reposición aplicada a "${prod.nombre}": +${cantidad} und. asentadas en almacén y Kardex.`
        });
        cargarDatos();
        if (onInventoryMutated) onInventoryMutated();
      } else {
        setAviso({ tipo: 'error', texto: data.message || 'Error al actualizar stock.' });
      }
    } catch {
      setAviso({ tipo: 'error', texto: 'Error de conexión al reabastecer stock.' });
    } finally {
      setReponiendoId(null);
    }
  };

  return (
    <section>
      <div className="erp-page-header">
        <div>
          <div className="erp-eyebrow">
            <IconBox size={14} />
            <span>Gestión de Existencias · Control FEFO</span>
          </div>
          <h1 className="erp-page-title">Catálogo Maestro e Inventario de Almacén</h1>
          <p className="erp-page-subtitle">
            Supervisión centralizada de medicamentos, lotes de caducidad, ubicación en anaquel y umbrales mínimos.
          </p>
        </div>

        <div className="erp-header-controls">
          <Link to="/kardex" className="erp-btn erp-btn-secondary" style={{ textDecoration: 'none' }}>
            <IconKardex size={15} />
            <span>Ver Auditoría Kardex</span>
          </Link>
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="erp-btn erp-btn-primary"
          >
            <IconPlus size={16} />
            <span>Registrar Medicamento</span>
          </button>
        </div>
      </div>

      {/* KPIs de Almacén */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <span className="erp-kpi-label">SKUs Activos</span>
          <span className="erp-kpi-value">{kpis.totalSkus}</span>
          <span className="erp-kpi-foot">Fármacos e insumos registrados</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Existencias Totales</span>
          <span className="erp-kpi-value val-emerald">{kpis.unidades} und.</span>
          <span className="erp-kpi-foot">Disponibilidad consolidada en anaqueles</span>
        </div>

        <div className="erp-kpi-card">
          <span className="erp-kpi-label">Valorización Comercial</span>
          <span className="erp-kpi-value">S/ {kpis.valorizacion.toFixed(2)}</span>
          <span className="erp-kpi-foot">Capital en inventario a precio de venta</span>
        </div>

        <div className={`erp-kpi-card ${kpis.enAlerta > 0 ? 'kpi-warn' : ''}`}>
          <span className="erp-kpi-label">Bajo Umbral Mínimo</span>
          <span className={`erp-kpi-value ${kpis.enAlerta > 0 ? 'val-amber' : 'val-emerald'}`}>
            {kpis.enAlerta} SKUs
          </span>
          <span className="erp-kpi-foot">Medicamentos con stock menor o igual al mínimo</span>
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

      {/* Barra de Búsqueda y Filtros */}
      <div className="erp-toolbar">
        <div className="erp-search-box">
          <span className="erp-search-icon">
            <IconSearch size={16} />
          </span>
          <input
            type="search"
            placeholder="Buscar medicamento, categoría, lote o anaquel..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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
            onClick={() => setFiltroEstado('TODOS')}
            className={`erp-filter-pill ${filtroEstado === 'TODOS' ? 'active' : ''}`}
          >
            Todos ({productos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('CRITICO')}
            className={`erp-filter-pill pill-rojo ${filtroEstado === 'CRITICO' ? 'active' : ''}`}
          >
            Rojo ≤ 15 ({kpis.enAlerta})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('MEDIO')}
            className={`erp-filter-pill pill-amarillo ${filtroEstado === 'MEDIO' ? 'active' : ''}`}
          >
            Amarillo 16–30 ({kpis.amarillos})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('NORMAL')}
            className={`erp-filter-pill pill-verde ${filtroEstado === 'NORMAL' ? 'active' : ''}`}
          >
            Verde &gt; 30 ({kpis.verdes})
          </button>
        </div>
      </div>

      {/* Tabla de Almacén */}
      <div className="erp-panel">
        <div className="erp-table-scroll">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Medicamento / Lote FEFO</th>
                <th>Categoría</th>
                <th>Ubicación en Anaquel</th>
                <th>Precio Unit.</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Estado / Brecha</th>
                <th style={{ textAlign: 'right' }}>Acción Rápida</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Consultando catálogo maestro en MySQL...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No se encontraron medicamentos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const imgSrc = getProductImage(prod.nombre, prod.id_producto);
                  return (
                    <tr key={prod.id_producto}>
                      <td className="erp-mono" style={{ color: 'var(--text-dim)' }}>
                        SKU-{String(prod.id_producto).padStart(3, '0')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
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
                              alt={prod.nombre}
                              width="32"
                              height="32"
                              loading="lazy"
                              style={{ objectFit: 'contain' }}
                              onError={(e) => {
                                e.currentTarget.src = '/favicon.svg';
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{prod.nombre}</div>
                            <div className="erp-mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              {prod.lote}
                              {prod.fecha_vencimiento ? ` · Vence ${prod.fecha_vencimiento}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="erp-badge badge-neutral">{prod.categoria}</span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <IconLocation size={13} />
                          <span>{prod.ubicacion}</span>
                        </span>
                      </td>
                      <td className="erp-mono" style={{ fontWeight: 700, color: 'var(--emerald-400)' }}>
                        S/ {Number(prod.precio).toFixed(2)}
                      </td>
                      <td
                        className="erp-mono"
                        style={{
                          fontWeight: 800,
                          color:
                            Number(prod.stock) <= 15
                              ? 'var(--crimson-400)'
                              : Number(prod.stock) <= 30
                              ? 'var(--amber-400)'
                              : 'var(--emerald-400)'
                        }}
                      >
                        {prod.stock} und.
                      </td>
                      <td className="erp-mono" style={{ color: 'var(--text-muted)' }}>
                        {prod.stock_minimo} und.
                      </td>
                      <td>
                        {Number(prod.stock) <= 15 ? (
                          <span className="erp-badge badge-danger">
                            <span className="erp-badge-dot" />
                            <span>Crítico ≤ 15</span>
                          </span>
                        ) : Number(prod.stock) <= 30 ? (
                          <span className="erp-badge badge-warn">
                            <span className="erp-badge-dot" />
                            <span>Medio 16–30</span>
                          </span>
                        ) : (
                          <span className="erp-badge badge-ok">
                            <span className="erp-badge-dot" />
                            <span>Óptimo &gt; 30</span>
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          disabled={reponiendoId === prod.id_producto}
                          onClick={() =>
                            handleIngresoRapido(
                              prod,
                              prod.en_alerta && prod.brecha_reposicion > 0 ? prod.brecha_reposicion : 15
                            )
                          }
                          className={`erp-btn erp-btn-sm ${
                            prod.en_alerta ? 'erp-btn-amber' : 'erp-btn-secondary'
                          }`}
                        >
                          <IconPlus size={13} />
                          <span>
                            {reponiendoId === prod.id_producto
                              ? 'Aplicando...'
                              : `+${prod.en_alerta && prod.brecha_reposicion > 0 ? prod.brecha_reposicion : 15} und.`}
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

      {/* MODAL DE ALTA CON SELECTOR VISUAL DE IMÁGENES WEBP (PLAN.md 2.D) */}
      {modalAbierto && (
        <div className="erp-modal-backdrop" onClick={() => !guardandoProd && setModalAbierto(false)}>
          <div className="erp-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="erp-modal-header">
              <div>
                <div className="erp-eyebrow" style={{ marginBottom: '2px' }}>
                  Alta en Catálogo Maestro · Sin Carga en Disco
                </div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Registrar Nuevo Medicamento
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="erp-banner-close"
                aria-label="Cerrar modal"
              >
                <IconClose size={18} />
              </button>
            </header>

            <form onSubmit={handleRegistrarProducto}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div className="erp-field span-2">
                    <label htmlFor="inv-nombre" className="erp-label">
                      Denominación Comercial y Concentración
                    </label>
                    <input
                      id="inv-nombre"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Ej: Naproxeno Sódico 550mg (Blíster x 10)"
                      value={formProd.nombre}
                      onChange={(e) => setFormProd({ ...formProd, nombre: e.target.value })}
                      className="erp-input"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="inv-cat" className="erp-label">
                      Categoría Terapéutica
                    </label>
                    <select
                      id="inv-cat"
                      value={formProd.categoria}
                      onChange={(e) => setFormProd({ ...formProd, categoria: e.target.value })}
                      className="erp-select"
                    >
                      {categorias.length > 0 ? (
                        categorias.map((c) => (
                          <option key={c.id_categoria} value={c.nombre}>
                            {c.nombre}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Analgésicos">Analgésicos</option>
                          <option value="Antibióticos">Antibióticos</option>
                          <option value="Antiinflamatorios">Antiinflamatorios</option>
                          <option value="Gastrointestinal">Gastrointestinal</option>
                          <option value="Vitaminas">Vitaminas</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="erp-field">
                    <label htmlFor="inv-precio" className="erp-label">
                      Precio Unitario de Venta (S/)
                    </label>
                    <input
                      id="inv-precio"
                      type="number"
                      required
                      min="0.10"
                      step="0.10"
                      placeholder="Ej: 4.50"
                      value={formProd.precio}
                      onChange={(e) => setFormProd({ ...formProd, precio: e.target.value })}
                      className="erp-input erp-mono"
                      autoComplete="off"
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="inv-stock" className="erp-label">
                      Stock Inicial de Ingreso (und.)
                    </label>
                    <input
                      id="inv-stock"
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="Ej: 40"
                      value={formProd.stock}
                      onChange={(e) => setFormProd({ ...formProd, stock: e.target.value })}
                      className="erp-input erp-mono"
                      autoComplete="off"
                    />
                  </div>

                  <div className="erp-field">
                    <label htmlFor="inv-min" className="erp-label">
                      Umbral de Stock Mínimo (und.)
                    </label>
                    <input
                      id="inv-min"
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formProd.stock_minimo}
                      onChange={(e) => setFormProd({ ...formProd, stock_minimo: e.target.value })}
                      className="erp-input erp-mono"
                      autoComplete="off"
                    />
                  </div>

                  <div className="erp-field span-2">
                    <label htmlFor="inv-ubicacion" className="erp-label">
                      Ubicación Física en Anaquel / Vitrina
                    </label>
                    <input
                      id="inv-ubicacion"
                      type="text"
                      maxLength={80}
                      value={formProd.ubicacion}
                      onChange={(e) => setFormProd({ ...formProd, ubicacion: e.target.value })}
                      className="erp-input"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Selector Visual WebP Existente (PLAN.md 2.D) */}
                <div className="erp-field">
                  <span className="erp-label">
                    Representación Visual en Catálogo (Seleccione imagen WebP verificada)
                  </span>
                  <div className="webp-selector-grid">
                    {PRODUCT_IMAGE_CATALOG.map((asset) => {
                      const active = formProd.imagenPath === asset.path;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => setFormProd({ ...formProd, imagenPath: asset.path })}
                          className={`webp-option-btn ${active ? 'selected' : ''}`}
                        >
                          <img src={asset.path} alt={asset.label} width="44" height="44" />
                          <span className="webp-option-label">{asset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <footer className="erp-modal-footer">
                <button
                  type="button"
                  disabled={guardandoProd}
                  onClick={() => setModalAbierto(false)}
                  className="erp-btn erp-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProd}
                  className="erp-btn erp-btn-primary"
                >
                  <IconCheck size={16} />
                  <span>{guardandoProd ? 'Registrando...' : 'Guardar en Catálogo y Kardex'}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
