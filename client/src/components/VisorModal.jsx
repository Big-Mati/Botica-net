import React, { useState, useEffect } from 'react';
import './VisorModal.css';

export default function VisorModal({ isOpen, onClose }) {
  const [localIp, setLocalIp] = useState('');
  const [copied, setCopied] = useState(false);
  const [customIp, setCustomIp] = useState('');

  // Detectar IP local desde el backend Node
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/visor-estado')
      .then((r) => r.json())
      .then((data) => {
        if (data.localIp && data.localIp !== 'localhost') {
          setLocalIp(data.localIp);
          setCustomIp(data.localIp);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // Calcular la URL óptima para el celular
  const currentHost = window.location.hostname;
  const currentPort = window.location.port ? `:${window.location.port}` : '';
  const currentProtocol = window.location.protocol;

  let visorUrl = `${window.location.origin}/?visor=cliente`;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const ipToUse = customIp.trim() || localIp || 'localhost';
    visorUrl = `${currentProtocol}//${ipToUse}${currentPort}/?visor=cliente`;
  }

  // Abrir simulador en la misma PC (Plan C - Zero-Fail)
  const handleOpenSimulador = () => {
    window.open(
      '/?visor=cliente',
      'VisorClienteBotica',
      'width=420,height=880,left=950,top=50,resizable=yes'
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(visorUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {});
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(visorUrl)}&color=0f172a&bgcolor=ffffff&qzone=1`;

  return (
    <div className="vm-modal-backdrop" onClick={onClose}>
      <div className="vm-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <header className="vm-modal-header">
          <div className="vm-title-group">
            <span className="vm-badge-header">SISTEMA POS · NIVEL AWWWARDS</span>
            <h2 className="vm-modal-title">📱 Pantalla de Cliente Mobile-First</h2>
            <p className="vm-modal-subtitle">
              Sincronización en tiempo real PC ↔ Smartphone para el jurado o cliente
            </p>
          </div>
          <button type="button" onClick={onClose} className="vm-close-btn" title="Cerrar modal">
            ✕
          </button>
        </header>

        {/* Cuerpo del Modal con los 3 Planes de Contingencia */}
        <div className="vm-modal-body">

          {/* PLAN C: Salva-Vidas / Demostración en la Misma PC */}
          <div className="vm-card-plan-c">
            <div className="vm-plan-c-icon">🖥️</div>
            <div className="vm-plan-c-content">
              <div className="vm-plan-c-tag">PLAN C (RECOMENDADO · CERO FALLOS)</div>
              <h3 className="vm-plan-c-title">Simulador Móvil en esta PC</h3>
              <p className="vm-plan-c-desc">
                Abre una ventana flotante vertical con el tamaño exacto de un smartphone (420x880px) al lado derecho. Sincroniza a <strong>0 ms</strong> vía memoria interna sin depender de Wi-Fi.
              </p>
              <button
                type="button"
                onClick={handleOpenSimulador}
                className="vm-btn-open-simulador"
              >
                🚀 Abrir Simulador Móvil en esta PC
              </button>
            </div>
          </div>

          <div className="vm-divider-text">
            <span>O ESCANEAR CON CELULAR (PLAN A / B)</span>
          </div>

          {/* PLAN A / B: QR para el Celular del Profesor */}
          <div className="vm-card-plan-ab">
            <div className="vm-qr-column">
              <div className="vm-qr-box">
                <img
                  src={qrImageUrl}
                  alt="Código QR Visor Cliente"
                  className="vm-qr-img"
                  onError={(e) => {
                    // Fallback a SVG si no hay internet en el laboratorio
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div className="vm-qr-fallback" style={{ display: 'none' }}>
                  <svg viewBox="0 0 100 100" className="vm-qr-svg-mock">
                    <rect width="100" height="100" fill="#f8fafc" />
                    <rect x="10" y="10" width="28" height="28" fill="#0f172a" />
                    <rect x="62" y="10" width="28" height="28" fill="#0f172a" />
                    <rect x="10" y="62" width="28" height="28" fill="#0f172a" />
                  </svg>
                  <span className="vm-qr-fallback-label">QR Offline</span>
                </div>
              </div>
              <span className="vm-qr-hint">Apunta con la cámara de tu smartphone</span>
            </div>

            <div className="vm-info-column">
              <span className="vm-info-tag">ENLACE PARA EL SMARTPHONE</span>
              <p className="vm-info-desc">
                Conecta tu laptop y el celular a la misma red Wi-Fi o Hotspot de Windows.
              </p>

              {/* Input de IP / Enlace editable */}
              <div className="vm-url-box">
                <input
                  type="text"
                  value={visorUrl}
                  readOnly
                  className="vm-url-input"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`vm-btn-copy ${copied ? 'copied' : ''}`}
                >
                  {copied ? '✓ ¡Copiado!' : '📋 Copiar'}
                </button>
              </div>

              {currentHost === 'localhost' && (
                <div className="vm-ip-helper">
                  <label htmlFor="vm-ip-input" className="vm-ip-label">
                    IP local detectada de tu laptop:
                  </label>
                  <div className="vm-ip-row">
                    <input
                      id="vm-ip-input"
                      type="text"
                      placeholder="Ej: 192.168.1.35"
                      value={customIp}
                      onChange={(e) => setCustomIp(e.target.value)}
                      className="vm-ip-input"
                    />
                    <span className="vm-ip-badge">Puerto :5173</span>
                  </div>
                  <small className="vm-ip-note">
                    💡 Si estás en el laboratorio, activa la "Zona de cobertura móvil" (Hotspot) en Windows y pon la IP del adaptador aquí.
                  </small>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="vm-modal-footer">
          <div className="vm-sync-status">
            <span className="vm-pulse-dot" />
            <span>Sincronización activa vía BroadcastChannel, Storage & RAM Polling (400ms)</span>
          </div>
          <button type="button" onClick={onClose} className="vm-btn-done">
            Entendido
          </button>
        </footer>
      </div>
    </div>
  );
}

