import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getProductImage } from '../utils/productImages';
import './CustomerDisplay.css';

// Consejos farmacéuticos para el carrusel de espera (Estado IDLE - 4A)
const HEALTH_TIPS = [
  {
    icon: '💊',
    tag: 'FARMACIA RESPONSABLE',
    title: 'Alternativas Genéricas',
    desc: 'Consulte con nuestro Químico Farmacéutico sobre medicamentos genéricos bioequivalentes con la misma eficacia y menor costo.'
  },
  {
    icon: '🌡️',
    tag: 'CALIDAD Y SEGURIDAD',
    title: 'Control FEFO / DIGEMID',
    desc: 'Todos nuestros medicamentos cuentan con estricta trazabilidad de lote y fecha de vencimiento certificada.'
  },
  {
    icon: '🧾',
    tag: 'TRANSPARENCIA FISCAL',
    title: 'Boleta de Venta Electrónica',
    desc: 'Indique su número de DNI al operador en caja para emitir su comprobante electrónico con validez tributaria SUNAT.'
  }
];

export default function CustomerDisplay() {
  // Estado del visor recibido desde el POS
  const [visorData, setVisorData] = useState(() => {
    try {
      const stored = localStorage.getItem('botica_visor_payload');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Reloj en tiempo real sin segundero (HH:MM AM/PM)
  const [clock, setClock] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  // Índice para el carrusel de consejos farmacéuticos (IDLE)
  const [activeTipIdx, setActiveTipIdx] = useState(0);

  // Referencia para detectar el último producto agregado
  const prevItemsCountRef = useRef(0);
  const [lastAddedId, setLastAddedId] = useState(null);

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotación del carrusel de salud cada 5s en IDLE
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setActiveTipIdx((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 5000);
    return () => clearInterval(tipTimer);
  }, []);

  // =========================================================================
  // 🔌 OMNI-SYNC: TRIPLE SINCRONIZACIÓN AUTOMÁTICA (5A)
  // Canal 1: BroadcastChannel (0ms en la misma PC / simulador)
  // Canal 2: Window Storage Event (respaldo local)
  // Canal 3: Polling ligero cada 400ms a /api/visor-estado (celular por Wi-Fi/Red)
  // =========================================================================
  useEffect(() => {
    // Canal 1: BroadcastChannel
    let bc = null;
    try {
      bc = new BroadcastChannel('botica_visor_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.updatedAt) {
          setVisorData((prev) => {
            if (!prev || event.data.updatedAt >= prev.updatedAt) {
              return event.data;
            }
            return prev;
          });
        }
      };
    } catch {
      // BroadcastChannel no soportado
    }

    // Canal 2: Storage Event
    const handleStorage = (e) => {
      if (e.key === 'botica_visor_payload' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setVisorData((prev) => {
            if (!prev || parsed.updatedAt >= prev.updatedAt) {
              return parsed;
            }
            return prev;
          });
        } catch {
          // Ignorar JSON malformado
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Canal 3: Polling a la API de Node cada 400ms
    const pollInterval = setInterval(() => {
      fetch('/api/visor-estado', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.updatedAt) {
            setVisorData((prev) => {
              if (!prev || data.updatedAt > prev.updatedAt) {
                return data;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 400);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, []);

  // Detectar último producto agregado para resaltar con badge
  useEffect(() => {
    if (visorData?.items && visorData.items.length > 0) {
      const currentCount = visorData.items.length;
      if (currentCount > prevItemsCountRef.current || !lastAddedId) {
        const lastItem = visorData.items[visorData.items.length - 1];
        setLastAddedId(lastItem.id_producto);
      }
      prevItemsCountRef.current = currentCount;
    } else {
      prevItemsCountRef.current = 0;
      setLastAddedId(null);
    }
  }, [visorData?.items]);

  // Vibración háptica en móvil cuando llega un comprobante (3A)
  const comprobanteHandledRef = useRef(null);
  useEffect(() => {
    if (visorData?.modo === 'COMPROBANTE' && visorData.comprobante) {
      const compId = visorData.comprobante.numero || visorData.updatedAt;
      if (comprobanteHandledRef.current !== compId) {
        comprobanteHandledRef.current = compId;
        try {
          if (navigator.vibrate) {
            navigator.vibrate([70, 40, 100]);
          }
        } catch {}
      }
    }
  }, [visorData?.modo, visorData?.comprobante]);

  // Modo actual por defecto: 'IDLE'
  const modo = visorData?.modo || 'IDLE';
  const items = visorData?.items || [];
  const total = Number(visorData?.total || 0);
  const totalUnidades = useMemo(() => items.reduce((acc, i) => acc + (i.cantidad || 1), 0), [items]);
  const subtotalNeto = Number(visorData?.subtotalNeto || (total / 1.18).toFixed(2));
  const igv = Number(visorData?.igv || (total - subtotalNeto).toFixed(2));
  const efectivoRecibido = Number(visorData?.efectivoRecibido || 0);
  const vuelto = Number(visorData?.vuelto || 0);
  const cliente = visorData?.cliente || 'Público General';
  const comprobante = visorData?.comprobante;

  // Acciones en comprobante (Compartir / Imprimir)
  const handleShareWhatsApp = () => {
    if (!comprobante) return;
    const text = `🧾 *BOTICA NOVA S.A.C.*%0AComprobante: *${comprobante.numero}*%0ACliente: ${comprobante.cliente}%0ATotal Pagado: S/ ${Number(comprobante.total).toFixed(2)}%0AFecha: ${comprobante.fecha || new Date().toLocaleString()}%0A%0AGracias por su preferencia.`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="cfd-viewport-wrapper">
      <div className={`cfd-screen-container cfd-mode-${modo.toLowerCase()}`}>

        {/* ================================================================= */}
        {/* 🌿 ESTADO 1: IDLE - BIENVENIDA Y SALUD (4A)                      */}
        {/* ================================================================= */}
        {modo === 'IDLE' && (
          <div className="cfd-state-idle-stage">
            {/* Cabecera Superior */}
            <header className="cfd-top-header">
              <div className="cfd-brand-pill">
                <img src="/favicon.svg" alt="Botica Nova" className="cfd-brand-logo" />
                <span className="cfd-brand-title">Botica Nova</span>
              </div>
              <div className="cfd-status-beacon">
                <span className="cfd-beacon-dot" />
                <span className="cfd-beacon-label">Caja 01 Disponible</span>
              </div>
              <div className="cfd-clock-tag">{clock}</div>
            </header>

            {/* Tarjeta Principal de Bienvenida */}
            <main className="cfd-idle-main">
              <div className="cfd-idle-hero-card">
                <div className="cfd-idle-cross-aura">
                  <div className="cfd-idle-cross-icon">
                    <svg viewBox="0 0 48 48" fill="none" className="cfd-cross-svg">
                      <rect x="20" y="8" width="8" height="32" rx="4" fill="#10b981" />
                      <rect x="8" y="20" width="32" height="8" rx="4" fill="#10b981" />
                      <circle cx="24" cy="24" r="3" fill="#ffffff" />
                    </svg>
                  </div>
                </div>

                <h1 className="cfd-idle-heading">Bienvenido a Botica Nova</h1>
                <p className="cfd-idle-subheading">
                  Sus medicamentos aparecerán en esta pantalla en tiempo real mientras son registrados en caja.
                </p>

                <div className="cfd-idle-scan-hint">
                  <span className="cfd-hint-pulse" />
                  <span>Esperando inicio de turno o despacho...</span>
                </div>
              </div>

              {/* Carrusel Automático de Consejos de Salud (4A) */}
              <div className="cfd-health-carousel">
                <div className="cfd-carousel-badge">
                  <span>CONSEJO FARMACÉUTICO BOTICA NOVA</span>
                </div>
                <div key={activeTipIdx} className="cfd-carousel-card cfd-fade-slide">
                  <div className="cfd-tip-icon">{HEALTH_TIPS[activeTipIdx].icon}</div>
                  <div className="cfd-tip-content">
                    <span className="cfd-tip-tag">{HEALTH_TIPS[activeTipIdx].tag}</span>
                    <h3 className="cfd-tip-title">{HEALTH_TIPS[activeTipIdx].title}</h3>
                    <p className="cfd-tip-desc">{HEALTH_TIPS[activeTipIdx].desc}</p>
                  </div>
                </div>

                {/* Indicadores de diapositiva */}
                <div className="cfd-carousel-dots">
                  {HEALTH_TIPS.map((_, idx) => (
                    <span
                      key={idx}
                      className={`cfd-dot ${idx === activeTipIdx ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </main>

            {/* Pie de pantalla seguro */}
            <footer className="cfd-idle-footer">
              <span>● Conexión segura en tiempo real · Terminal POS v2.4</span>
            </footer>
          </div>
        )}

        {/* ================================================================= */}
        {/* 🛒 ESTADO 2: CARRITO ACTIVO - ESTILO APPLE WALLET (1A)           */}
        {/* ================================================================= */}
        {modo === 'CARRITO' && (
          <div className="cfd-state-cart-stage">
            {/* Barra Superior Fija */}
            <header className="cfd-cart-sticky-header">
              <div className="cfd-cart-header-top">
                <div className="cfd-brand-pill-compact">
                  <img src="/favicon.svg" alt="Botica Nova" className="cfd-brand-logo-small" />
                  <span className="cfd-brand-name-bold">Botica Nova</span>
                </div>
                <div className="cfd-clock-mini">{clock}</div>
              </div>

              <div className="cfd-cart-header-bottom">
                <div className="cfd-patient-tag">
                  <span className="cfd-patient-label">Paciente / Cliente:</span>
                  <span className="cfd-patient-name">{cliente}</span>
                </div>
                <div className="cfd-items-badge">
                  {totalUnidades} {totalUnidades === 1 ? 'producto' : 'productos'}
                </div>
              </div>
            </header>

            {/* Lista Visual de Productos (100% Read-Only) */}
            <main className="cfd-cart-items-feed">
              {items.map((item, index) => {
                const isLast = item.id_producto === lastAddedId;
                const imgSrc = item.imagen || getProductImage(item.nombre);

                return (
                  <article
                    key={item.id_producto}
                    className={`cfd-item-card ${isLast ? 'cfd-item-highlight' : ''}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {isLast && (
                      <div className="cfd-item-spotlight-badge">
                        <span>✨ Registrado en caja</span>
                      </div>
                    )}

                    <div className="cfd-item-body">
                      {/* Miniatura nítida del medicamento */}
                      <div className="cfd-item-thumb-wrapper">
                        <img
                          src={imgSrc}
                          alt={item.nombre}
                          className="cfd-item-thumb"
                          onError={(e) => { e.currentTarget.src = '/favicon.svg'; }}
                        />
                      </div>

                      {/* Información técnica y comercial */}
                      <div className="cfd-item-info">
                        <span className="cfd-item-category">{item.categoria || 'Medicamento Farmacéutico'}</span>
                        <h2 className="cfd-item-name">{item.nombre}</h2>
                        <div className="cfd-item-pricing-row">
                          <span className="cfd-item-qty-pill">x{item.cantidad} und.</span>
                          <span className="cfd-item-unit-price">S/ {Number(item.precio).toFixed(2)} c/u</span>
                        </div>
                      </div>

                      {/* Subtotal de línea */}
                      <div className="cfd-item-subtotal-column">
                        <span className="cfd-subtotal-label">Subtotal</span>
                        <span className="cfd-subtotal-val">S/ {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </main>

            {/* Banner Dinámico de Efectivo y Vuelto (si se ingresó efectivo en caja) */}
            {efectivoRecibido > 0 && (
              <div className="cfd-cash-change-banner cfd-spring-in">
                <div className="cfd-cash-row">
                  <span>Efectivo entregado en caja:</span>
                  <strong className="cfd-cash-amount">S/ {efectivoRecibido.toFixed(2)}</strong>
                </div>
                <div className="cfd-change-highlight">
                  <span className="cfd-change-label">Su vuelto a recibir:</span>
                  <span className="cfd-change-amount">S/ {vuelto.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Dock Inferior Fijo de Totales e Impuestos */}
            <footer className="cfd-bottom-dock">
              <div className="cfd-dock-breakdown">
                <div className="cfd-tax-row">
                  <span>Op. Gravada (Neto):</span>
                  <span>S/ {subtotalNeto.toFixed(2)}</span>
                </div>
                <div className="cfd-tax-row">
                  <span>I.G.V. (18%):</span>
                  <span>S/ {igv.toFixed(2)}</span>
                </div>
              </div>

              <div className="cfd-dock-grand-total">
                <div className="cfd-total-text-group">
                  <span className="cfd-total-caption">Total a pagar</span>
                  <span className="cfd-total-currency">PEN (Soles)</span>
                </div>
                <div className="cfd-total-monumental">
                  S/ {total.toFixed(2)}
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* ================================================================= */}
        {/* 💜 ESTADO 3A: PAGO YAPE / PLIN - INMERSIÓN A PANTALLA COMPLETA    */}
        {/* ================================================================= */}
        {modo === 'PAGO_YAPE' && (
          <div className="cfd-state-yape-stage">
            {/* Header Yape / Plin */}
            <header className="cfd-yape-header">
              <div className="cfd-wallets-badges">
                <span className="cfd-badge-yape">Yape</span>
                <span className="cfd-badge-sep">o</span>
                <span className="cfd-badge-plin">Plin</span>
              </div>
              <p className="cfd-yape-instruction">Escanea el código QR desde tu app para pagar</p>
            </header>

            {/* Tarjeta Central de Pago con QR Vectorial */}
            <main className="cfd-yape-card">
              {/* Esquinas y láser de escaneo animado */}
              <div className="cfd-qr-frame">
                <span className="cfd-corner tl" />
                <span className="cfd-corner tr" />
                <span className="cfd-corner bl" />
                <span className="cfd-corner br" />
                <div className="cfd-qr-laser-beam" />

                {/* Código QR SVG de Alta Definición */}
                <div className="cfd-qr-svg-wrapper">
                  <svg viewBox="0 0 256 256" className="cfd-qr-svg">
                    <rect width="256" height="256" fill="#ffffff" rx="16" />
                    {/* Patrón de Posición Superior Izquierda */}
                    <rect x="24" y="24" width="56" height="56" rx="8" fill="#742384" />
                    <rect x="36" y="36" width="32" height="32" rx="4" fill="#ffffff" />
                    <rect x="44" y="44" width="16" height="16" rx="2" fill="#742384" />

                    {/* Patrón de Posición Superior Derecha */}
                    <rect x="176" y="24" width="56" height="56" rx="8" fill="#742384" />
                    <rect x="188" y="36" width="32" height="32" rx="4" fill="#ffffff" />
                    <rect x="196" y="44" width="16" height="16" rx="2" fill="#742384" />

                    {/* Patrón de Posición Inferior Izquierda */}
                    <rect x="24" y="176" width="56" height="56" rx="8" fill="#742384" />
                    <rect x="36" y="188" width="32" height="32" rx="4" fill="#ffffff" />
                    <rect x="44" y="196" width="16" height="16" rx="2" fill="#742384" />

                    {/* Módulos de Datos Decorativos de Alta Densidad */}
                    <rect x="96" y="28" width="16" height="16" rx="2" fill="#742384" />
                    <rect x="124" y="28" width="16" height="16" rx="2" fill="#00d3b5" />
                    <rect x="96" y="56" width="24" height="24" rx="3" fill="#742384" />
                    <rect x="132" y="56" width="16" height="16" rx="2" fill="#742384" />
                    
                    <rect x="28" y="96" width="16" height="16" rx="2" fill="#742384" />
                    <rect x="56" y="96" width="24" height="16" rx="2" fill="#00d3b5" />
                    <rect x="28" y="124" width="24" height="24" rx="3" fill="#742384" />
                    <rect x="64" y="124" width="16" height="16" rx="2" fill="#742384" />

                    <rect x="100" y="100" width="56" height="56" rx="28" fill="#742384" />
                    <circle cx="128" cy="128" r="18" fill="#ffffff" />
                    <circle cx="128" cy="128" r="9" fill="#00d3b5" />

                    <rect x="176" y="96" width="16" height="16" rx="2" fill="#742384" />
                    <rect x="204" y="96" width="28" height="16" rx="2" fill="#742384" />
                    <rect x="176" y="124" width="24" height="24" rx="3" fill="#00d3b5" />
                    <rect x="212" y="124" width="20" height="20" rx="2" fill="#742384" />

                    <rect x="96" y="176" width="20" height="20" rx="2" fill="#742384" />
                    <rect x="128" y="176" width="16" height="16" rx="2" fill="#00d3b5" />
                    <rect x="156" y="176" width="24" height="24" rx="3" fill="#742384" />
                    <rect x="192" y="176" width="16" height="16" rx="2" fill="#742384" />
                    <rect x="220" y="176" width="12" height="12" rx="2" fill="#00d3b5" />

                    <rect x="96" y="208" width="32" height="24" rx="3" fill="#742384" />
                    <rect x="140" y="208" width="16" height="16" rx="2" fill="#742384" />
                    <rect x="168" y="208" width="24" height="24" rx="3" fill="#00d3b5" />
                    <rect x="204" y="208" width="28" height="24" rx="3" fill="#742384" />
                  </svg>
                </div>
              </div>

              {/* Datos de Comercio y Monto */}
              <div className="cfd-yape-merchant-badge">
                <span className="cfd-verified-check">✓</span>
                <span>BOTICA NOVA S.A.C.</span>
              </div>

              <div className="cfd-yape-amount-box">
                <span className="cfd-yape-amount-label">Monto exacto a pagar:</span>
                <span className="cfd-yape-amount-val">S/ {total.toFixed(2)}</span>
              </div>
            </main>

            {/* Footer con estado de espera en caja */}
            <footer className="cfd-yape-footer">
              <div className="cfd-yape-summary-tag">
                {totalUnidades} medicamentos en su pedido
              </div>
              <div className="cfd-yape-pulse-wait">
                <span className="cfd-yape-dot-pulse" />
                <span>Esperando confirmación de pago en caja...</span>
              </div>
            </footer>
          </div>
        )}

        {/* ================================================================= */}
        {/* 💳 ESTADO 3B: PAGO TARJETA - RADAR CONTACTLESS NFC                */}
        {/* ================================================================= */}
        {modo === 'PAGO_TARJETA' && (
          <div className="cfd-state-card-stage">
            <header className="cfd-card-header">
              <span className="cfd-card-badge">PAGO CON TARJETA</span>
              <h2 className="cfd-card-heading">Acerque su tarjeta o teléfono</h2>
              <p className="cfd-card-subheading">Terminal POS Izipay / Niubiz sin contacto habilitado</p>
            </header>

            <main className="cfd-card-main">
              {/* Radar de Ondas NFC Concéntricas */}
              <div className="cfd-nfc-radar-container">
                <span className="cfd-nfc-wave w1" />
                <span className="cfd-nfc-wave w2" />
                <span className="cfd-nfc-wave w3" />
                <div className="cfd-nfc-icon-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cfd-nfc-svg">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
              </div>

              {/* Monto Gigante */}
              <div className="cfd-card-amount-block">
                <span className="cfd-card-amount-label">Total a debitar</span>
                <span className="cfd-card-amount-val">S/ {total.toFixed(2)}</span>
              </div>

              {/* Logos de Franquicias */}
              <div className="cfd-card-brands">
                <span className="cfd-brand-chip">VISA</span>
                <span className="cfd-brand-chip">Mastercard</span>
                <span className="cfd-brand-chip">Amex</span>
                <span className="cfd-brand-chip">Apple Pay</span>
                <span className="cfd-brand-chip">Google Pay</span>
              </div>
            </main>

            <footer className="cfd-card-footer">
              <div className="cfd-card-pulse-wait">
                <span className="cfd-card-dot-pulse" />
                <span>Esperando lectura del chip o dispositivo...</span>
              </div>
            </footer>
          </div>
        )}

        {/* ================================================================= */}
        {/* 🧾 ESTADO 4: COMPROBANTE FINAL - BOLETA ELECTRÓNICA SUNAT (3A)    */}
        {/* ================================================================= */}
        {modo === 'COMPROBANTE' && (
          <div className="cfd-state-receipt-stage">
            {/* Banner de Éxito Superior */}
            <div className="cfd-receipt-success-banner">
              <div className="cfd-success-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="cfd-check-svg">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="cfd-success-title">¡Pago Confirmado!</h2>
              <p className="cfd-success-subtitle">Su comprobante electrónico ha sido emitido con éxito</p>
            </div>

            {/* Ticket Digital con Textura Térmica y Bordes Dentados */}
            <div className="cfd-receipt-paper-wrapper">
              <div className="cfd-receipt-paper">
                {/* Encabezado Fiscal */}
                <div className="cfd-receipt-header">
                  <h3 className="cfd-receipt-company">BOTICA NOVA S.A.C.</h3>
                  <div className="cfd-receipt-meta">R.U.C. 20608493021</div>
                  <div className="cfd-receipt-doc-title">BOLETA DE VENTA ELECTRÓNICA</div>
                  <div className="cfd-receipt-series">
                    {comprobante?.numero || 'B001-0004921'}
                  </div>
                </div>

                <div className="cfd-receipt-divider-dashed" />

                {/* Datos de Operación */}
                <div className="cfd-receipt-info-grid">
                  <div className="cfd-info-row">
                    <span>Fecha y hora:</span>
                    <strong>{comprobante?.fecha || new Date().toLocaleString()}</strong>
                  </div>
                  <div className="cfd-info-row">
                    <span>Cliente:</span>
                    <strong>{comprobante?.cliente || cliente}</strong>
                  </div>
                  <div className="cfd-info-row">
                    <span>Método de pago:</span>
                    <strong>{comprobante?.metodoPago || visorData?.metodoPago || 'Efectivo'}</strong>
                  </div>
                </div>

                <div className="cfd-receipt-divider-dashed" />

                {/* Tabla de Medicamentos Comprados */}
                <table className="cfd-receipt-table">
                  <thead>
                    <tr>
                      <th className="th-qty">Cant.</th>
                      <th className="th-desc">Descripción</th>
                      <th className="th-subt">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(comprobante?.items || items).map((it, idx) => (
                      <tr key={idx}>
                        <td className="td-qty">{it.cantidad}</td>
                        <td className="td-desc">
                          <span className="td-name">{it.nombre}</span>
                          <span className="td-unit">S/ {Number(it.precio || it.precio_unitario || 0).toFixed(2)} c/u</span>
                        </td>
                        <td className="td-subt">S/ {Number(it.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="cfd-receipt-divider-dashed" />

                {/* Desglose Tributario */}
                <div className="cfd-receipt-taxes">
                  <div className="cfd-tax-line">
                    <span>Op. Gravada:</span>
                    <span>S/ {Number(comprobante?.subtotalNeto || subtotalNeto).toFixed(2)}</span>
                  </div>
                  <div className="cfd-tax-line">
                    <span>I.G.V. 18%:</span>
                    <span>S/ {Number(comprobante?.igv || igv).toFixed(2)}</span>
                  </div>
                  <div className="cfd-receipt-grand-total">
                    <span>TOTAL PAGADO:</span>
                    <strong>S/ {Number(comprobante?.total || total).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="cfd-receipt-divider-dashed" />

                {/* Código QR Oficial SUNAT */}
                <div className="cfd-receipt-qr-section">
                  <div className="cfd-receipt-sunat-qr">
                    <svg viewBox="0 0 100 100" className="cfd-sunat-svg">
                      <rect width="100" height="100" fill="#ffffff" />
                      <rect x="10" y="10" width="24" height="24" fill="#000000" />
                      <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                      <rect x="18" y="18" width="8" height="8" fill="#000000" />

                      <rect x="66" y="10" width="24" height="24" fill="#000000" />
                      <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                      <rect x="74" y="18" width="8" height="8" fill="#000000" />

                      <rect x="10" y="66" width="24" height="24" fill="#000000" />
                      <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                      <rect x="18" y="74" width="8" height="8" fill="#000000" />

                      <rect x="42" y="14" width="12" height="12" fill="#000000" />
                      <rect x="14" y="42" width="12" height="12" fill="#000000" />
                      <rect x="42" y="42" width="16" height="16" fill="#000000" />
                      <rect x="66" y="42" width="8" height="16" fill="#000000" />
                      <rect x="42" y="66" width="14" height="24" fill="#000000" />
                      <rect x="66" y="66" width="24" height="24" fill="#000000" />
                    </svg>
                  </div>
                  <div className="cfd-receipt-sunat-legend">
                    Representación impresa de la Boleta de Venta Electrónica. Consulte su validez en www.sunat.gob.pe
                  </div>
                </div>

                <div className="cfd-receipt-thanks">
                  <span>✓ Gracias por confiar su salud en Botica Nova</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción (Descargar / Compartir) */}
            <div className="cfd-receipt-actions">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="cfd-btn-receipt cfd-btn-pdf"
              >
                📥 Imprimir / Guardar PDF
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="cfd-btn-receipt cfd-btn-wa"
              >
                💬 Compartir por WhatsApp
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

