import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getProductImage } from '../utils/productImages';
import PaymentQrBox from './PaymentQrBox';
import {
  IconPill,
  IconShield,
  IconReceipt,
  IconCheck,
  IconPrinter,
  IconShare
} from './Icons';
import './CustomerDisplay.css';

const HEALTH_TIPS = [
  {
    iconType: 'pill',
    tag: 'FARMACIA RESPONSABLE',
    title: 'Alternativas Genéricas Bioequivalentes',
    desc: 'Consulte con nuestro Químico Farmacéutico sobre medicamentos genéricos con eficacia terapéutica certificada.'
  },
  {
    iconType: 'shield',
    tag: 'CALIDAD Y SEGURIDAD',
    title: 'Control Estricto FEFO / DIGEMID',
    desc: 'Cada medicamento dispensado cuenta con trazabilidad de lote y verificación activa de vigencia.'
  },
  {
    iconType: 'receipt',
    tag: 'TRANSPARENCIA FISCAL',
    title: 'Boleta de Venta Electrónica',
    desc: 'Indique su número de DNI en caja para emitir su comprobante electrónico con respaldo tributario SUNAT.'
  }
];

function renderTipIcon(type) {
  if (type === 'shield') return <IconShield size={22} />;
  if (type === 'receipt') return <IconReceipt size={22} />;
  return <IconPill size={22} />;
}

export default function CustomerDisplay() {
  const [visorData, setVisorData] = useState(() => {
    try {
      const stored = localStorage.getItem('botica_visor_payload');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [clock, setClock] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  const [activeTipIdx, setActiveTipIdx] = useState(0);
  const [simuladoFirma, setSimuladoFirma] = useState(null);
  const [billeteraVisor, setBilleteraVisor] = useState('Yape');

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setClock(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setActiveTipIdx((prev) => (prev + 1) % HEALTH_TIPS.length);
    }, 5000);
    return () => clearInterval(tipTimer);
  }, []);

  // =========================================================================
  // OMNI-SYNC: TRIPLE SINCRONIZACIÓN AUTOMÁTICA (5A)
  // =========================================================================
  useEffect(() => {
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
      // BroadcastChannel opcional
    }

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
        } catch {
          // Vibración opcional
        }
      }
    }
  }, [visorData?.modo, visorData?.comprobante, visorData?.updatedAt]);

  const modo = visorData?.modo || 'IDLE';
  const items = useMemo(() => visorData?.items || [], [visorData?.items]);
  const lastAddedId = items.length > 0 ? items[items.length - 1].id_producto : null;
  const total = Number(visorData?.total || 0);
  const totalUnidades = useMemo(() => items.reduce((acc, i) => acc + (i.cantidad || 1), 0), [items]);
  const subtotalNeto = Number(visorData?.subtotalNeto || (total / 1.18).toFixed(2));
  const igv = Number(visorData?.igv || (total - subtotalNeto).toFixed(2));
  const efectivoRecibido = Number(visorData?.efectivoRecibido || 0);
  const vuelto = Number(visorData?.vuelto || 0);
  const cliente = visorData?.cliente || 'Público General';
  const comprobante = visorData?.comprobante;

  const firmaOrdenActual = `${modo}:${items.length}:${total.toFixed(2)}`;
  const simulandoPago =
    simuladoFirma === firmaOrdenActual && modo !== 'COMPROBANTE' && modo !== 'IDLE';

  // Confirmación interactiva de pago desde Pantalla de Cliente (PLAN.md 2.C)
  const handleSimularPagoRealizado = () => {
    if (simulandoPago) return;
    setSimuladoFirma(firmaOrdenActual);

    const nowTs = Date.now();
    const confirmPayload = {
      ...(visorData || {}),
      pagoSimuladoAt: nowTs,
      updatedAt: nowTs
    };

    try {
      const bc = new BroadcastChannel('botica_visor_channel');
      bc.postMessage(confirmPayload);
      bc.close();
    } catch {
      // BroadcastChannel opcional
    }

    try {
      localStorage.setItem('botica_visor_payload', JSON.stringify(confirmPayload));
    } catch {
      // Storage opcional
    }

    fetch('/api/visor-estado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoSimuladoAt: nowTs })
    }).catch(() => {});
  };

  const handleShareWhatsApp = () => {
    if (!comprobante) return;
    const text = `*BOTICA NOVA S.A.C.*%0AComprobante Electrónico: *${comprobante.numero}*%0APaciente/Cliente: ${comprobante.cliente}%0AImporte Total: S/ ${Number(comprobante.total).toFixed(2)}%0AFecha: ${comprobante.fecha || new Date().toLocaleString('es-PE')}%0A%0AGracias por su preferencia.`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="cfd-viewport-wrapper">
      <div className={`cfd-screen-container cfd-mode-${modo.toLowerCase()}`}>

        {/* ESTADO 1: IDLE - BIENVENIDA Y SALUD */}
        {modo === 'IDLE' && (
          <div className="cfd-state-idle-stage">
            <header className="cfd-top-header">
              <div className="cfd-brand-pill">
                <img src="/favicon.svg" alt="Botica Nova" width="32" height="32" className="cfd-brand-logo" />
                <span className="cfd-brand-title">Botica Nova</span>
              </div>
              <div className="cfd-status-beacon">
                <span className="cfd-beacon-dot" />
                <span className="cfd-beacon-label">Caja 01 Disponible</span>
              </div>
              <div className="cfd-clock-tag">{clock}</div>
            </header>

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
                  <span>Esperando inicio de despacho en mostrador...</span>
                </div>
              </div>

              <div className="cfd-health-carousel">
                <div className="cfd-carousel-badge">
                  <span>ORIENTACIÓN FARMACÉUTICA BOTICA NOVA</span>
                </div>
                <div key={activeTipIdx} className="cfd-carousel-card cfd-fade-slide">
                  <div className="cfd-tip-icon-svg">
                    {renderTipIcon(HEALTH_TIPS[activeTipIdx].iconType)}
                  </div>
                  <div className="cfd-tip-content">
                    <span className="cfd-tip-tag">{HEALTH_TIPS[activeTipIdx].tag}</span>
                    <h3 className="cfd-tip-title">{HEALTH_TIPS[activeTipIdx].title}</h3>
                    <p className="cfd-tip-desc">{HEALTH_TIPS[activeTipIdx].desc}</p>
                  </div>
                </div>

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

            <footer className="cfd-idle-footer">
              <span>Conexión sincronizada en tiempo real · Terminal POS v2.4</span>
            </footer>
          </div>
        )}

        {/* ESTADO 2: CARRITO ACTIVO */}
        {modo === 'CARRITO' && (
          <div className="cfd-state-cart-stage">
            <header className="cfd-cart-sticky-header">
              <div className="cfd-cart-header-top">
                <div className="cfd-brand-pill-compact">
                  <img src="/favicon.svg" alt="Botica Nova" width="22" height="22" className="cfd-brand-logo-small" />
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
                  {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'}
                </div>
              </div>
            </header>

            <main className="cfd-cart-items-feed">
              {items.map((item, index) => {
                const isLast = item.id_producto === lastAddedId;
                const imgSrc = item.imagen || getProductImage(item.nombre, item.id_producto);

                return (
                  <article
                    key={item.id_producto}
                    className={`cfd-item-card ${isLast ? 'cfd-item-highlight' : ''}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {isLast && (
                      <div className="cfd-item-spotlight-badge">
                        <IconCheck size={11} />
                        <span>Registrado en caja</span>
                      </div>
                    )}

                    <div className="cfd-item-body">
                      <div className="cfd-item-thumb-wrapper">
                        <img
                          src={imgSrc}
                          alt={item.nombre}
                          width="44"
                          height="44"
                          className="cfd-item-thumb"
                          onError={(e) => {
                            e.currentTarget.src = '/favicon.svg';
                          }}
                        />
                      </div>

                      <div className="cfd-item-info">
                        <span className="cfd-item-category">{item.categoria || 'Medicamento Farmacéutico'}</span>
                        <h2 className="cfd-item-name">{item.nombre}</h2>
                        <div className="cfd-item-pricing-row">
                          <span className="cfd-item-qty-pill">x{item.cantidad} und.</span>
                          <span className="cfd-item-unit-price">S/ {Number(item.precio).toFixed(2)} c/u</span>
                        </div>
                      </div>

                      <div className="cfd-item-subtotal-column">
                        <span className="cfd-subtotal-label">Subtotal</span>
                        <span className="cfd-subtotal-val">S/ {Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </main>

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

              {visorData?.esperandoConfirmacionVisor && (
                <button
                  type="button"
                  disabled={simulandoPago}
                  onClick={handleSimularPagoRealizado}
                  className="cfd-simulate-pay-btn"
                  style={{ marginTop: '12px' }}
                >
                  <IconCheck size={17} />
                  <span>{simulandoPago ? 'Confirmando en caja...' : 'Simular Pago Realizado'}</span>
                </button>
              )}
            </footer>
          </div>
        )}

        {/* ESTADO 3A: PAGO YAPE / PLIN CON SELECTOR DE QR REAL (yape.jpeg / plin.jpeg) */}
        {modo === 'PAGO_YAPE' && (
          <div
            className="cfd-state-yape-stage"
            style={
              billeteraVisor === 'Plin'
                ? { background: 'linear-gradient(160deg, #0369a1 0%, #0f172a 75%, #082f49 100%)' }
                : undefined
            }
          >
            <header className="cfd-yape-header">
              <div className="cfd-wallets-badges" role="tablist" aria-label="Elegir código QR">
                <button
                  type="button"
                  role="tab"
                  aria-selected={billeteraVisor === 'Yape'}
                  onClick={() => setBilleteraVisor('Yape')}
                  className={`cfd-wallet-switch-btn ${billeteraVisor === 'Yape' ? 'active-yape' : ''}`}
                >
                  QR Yape
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={billeteraVisor === 'Plin'}
                  onClick={() => setBilleteraVisor('Plin')}
                  className={`cfd-wallet-switch-btn ${billeteraVisor === 'Plin' ? 'active-plin' : ''}`}
                >
                  QR Plin
                </button>
              </div>
              <p className="cfd-yape-instruction">
                Escanee el código QR oficial de {billeteraVisor} desde su aplicación móvil
              </p>
            </header>

            <main className="cfd-yape-card">
              <div className="cfd-qr-frame">
                <span className="cfd-corner tl" />
                <span className="cfd-corner tr" />
                <span className="cfd-corner bl" />
                <span className="cfd-corner br" />
                <div className="cfd-qr-laser-beam" />

                <div
                  className="cfd-qr-svg-wrapper"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <PaymentQrBox
                    metodo={billeteraVisor}
                    selectedWallet={billeteraVisor}
                    size={212}
                  />
                </div>
              </div>

              <div className="cfd-yape-merchant-badge">
                <IconCheck size={13} />
                <span>BOTICA NOVA S.A.C. · QR VERIFICADO</span>
              </div>

              <div className="cfd-yape-amount-box">
                <span className="cfd-yape-amount-label">Monto exacto a abonar:</span>
                <span
                  className="cfd-yape-amount-val"
                  style={billeteraVisor === 'Plin' ? { color: '#0369a1' } : undefined}
                >
                  S/ {total.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={simulandoPago}
                onClick={handleSimularPagoRealizado}
                className="cfd-simulate-pay-btn"
                style={{ marginTop: '16px' }}
              >
                <IconCheck size={17} />
                <span>{simulandoPago ? 'Notificando pago a caja...' : 'Simular Pago Realizado'}</span>
              </button>
            </main>

            <footer className="cfd-yape-footer">
              <div className="cfd-yape-summary-tag">
                {totalUnidades} {totalUnidades === 1 ? 'medicamento' : 'medicamentos'} en su orden
              </div>
              <div className="cfd-yape-pulse-wait">
                <span className="cfd-yape-dot-pulse" />
                <span>Esperando validación de abono en caja...</span>
              </div>
            </footer>
          </div>
        )}

        {/* ESTADO 3B: PAGO TARJETA - RADAR CONTACTLESS NFC */}
        {modo === 'PAGO_TARJETA' && (
          <div className="cfd-state-card-stage">
            <header className="cfd-card-header">
              <span className="cfd-card-badge">TERMINAL CONTACTLESS</span>
              <h2 className="cfd-card-heading">Acerque su tarjeta o dispositivo</h2>
              <p className="cfd-card-subheading">Lectura sin contacto habilitada para su operación</p>
            </header>

            <main className="cfd-card-main">
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

              <div className="cfd-card-amount-block">
                <span className="cfd-card-amount-label">Importe total a debitar</span>
                <span className="cfd-card-amount-val">S/ {total.toFixed(2)}</span>
              </div>

              <div className="cfd-card-brands" style={{ marginBottom: '20px' }}>
                <span className="cfd-brand-chip">VISA</span>
                <span className="cfd-brand-chip">Mastercard</span>
                <span className="cfd-brand-chip">Amex</span>
                <span className="cfd-brand-chip">Apple Pay</span>
                <span className="cfd-brand-chip">Google Pay</span>
              </div>

              <button
                type="button"
                disabled={simulandoPago}
                onClick={handleSimularPagoRealizado}
                className="cfd-simulate-pay-btn"
              >
                <IconCheck size={17} />
                <span>{simulandoPago ? 'Procesando autorización...' : 'Simular Pago Realizado'}</span>
              </button>
            </main>

            <footer className="cfd-card-footer">
              <div className="cfd-card-pulse-wait">
                <span className="cfd-card-dot-pulse" />
                <span>Esperando lectura del chip o billetera NFC...</span>
              </div>
            </footer>
          </div>
        )}

        {/* ESTADO 4: COMPROBANTE FINAL - BOLETA ELECTRÓNICA SUNAT */}
        {modo === 'COMPROBANTE' && (
          <div className="cfd-state-receipt-stage">
            <div className="cfd-receipt-success-banner">
              <div className="cfd-success-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="cfd-check-svg">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="cfd-success-title">Operación Confirmada</h2>
              <p className="cfd-success-subtitle">Su comprobante electrónico ha sido emitido con éxito</p>
            </div>

            <div className="cfd-receipt-paper-wrapper">
              <div className="cfd-receipt-paper">
                <div className="cfd-receipt-header">
                  <h3 className="cfd-receipt-company">BOTICA NOVA S.A.C.</h3>
                  <div className="cfd-receipt-meta">R.U.C. 20608493021</div>
                  <div className="cfd-receipt-doc-title">BOLETA DE VENTA ELECTRÓNICA</div>
                  <div className="cfd-receipt-series">
                    {comprobante?.numero || 'B001-0004921'}
                  </div>
                </div>

                <div className="cfd-receipt-divider-dashed" />

                <div className="cfd-receipt-info-grid">
                  <div className="cfd-info-row">
                    <span>Fecha y hora:</span>
                    <strong>{comprobante?.fecha || clock}</strong>
                  </div>
                  <div className="cfd-info-row">
                    <span>Cliente:</span>
                    <strong>{comprobante?.cliente || cliente}</strong>
                  </div>
                  <div className="cfd-info-row">
                    <span>Modalidad de pago:</span>
                    <strong>{comprobante?.metodoPago || visorData?.metodoPago || 'Efectivo'}</strong>
                  </div>
                </div>

                <div className="cfd-receipt-divider-dashed" />

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
                  <span>Gracias por confiar el cuidado de su salud a Botica Nova</span>
                </div>
              </div>
            </div>

            <div className="cfd-receipt-actions no-print">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="cfd-btn-receipt cfd-btn-pdf"
              >
                <IconPrinter size={17} />
                <span>Imprimir / Guardar PDF</span>
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="cfd-btn-receipt cfd-btn-wa"
              >
                <IconShare size={17} />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
