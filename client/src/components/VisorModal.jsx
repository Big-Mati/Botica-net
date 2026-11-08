import React, { useState, useEffect, useMemo } from 'react';
import { generateQrMatrix } from '../utils/qrLocalMatrix';
import {
  IconMonitor,
  IconDesktop,
  IconCopy,
  IconCheck,
  IconClose,
  IconShield
} from './Icons';
import './VisorModal.css';

export default function VisorModal({ isOpen, onClose }) {
  const [localIp, setLocalIp] = useState('');
  const [copied, setCopied] = useState(false);
  const [customIp, setCustomIp] = useState('');

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

  const currentHost = window.location.hostname;
  const currentPort = window.location.port ? `:${window.location.port}` : '';
  const currentProtocol = window.location.protocol;

  let visorUrl = `${window.location.origin}/?visor=cliente`;
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    const ipToUse = customIp.trim() || localIp || 'localhost';
    visorUrl = `${currentProtocol}//${ipToUse}${currentPort}/?visor=cliente`;
  }

  const qrSvgData = useMemo(() => {
    if (!isOpen) return null;
    const result = generateQrMatrix(visorUrl);
    if (!result) return null;

    const { size, matrix } = result;
    const quiet = 2;
    const paths = [];
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (matrix[r][c]) {
          paths.push(`M${c + quiet},${r + quiet}h1v1h-1z`);
        }
      }
    }
    return {
      totalSize: size + quiet * 2,
      pathD: paths.join('')
    };
  }, [isOpen, visorUrl]);

  if (!isOpen) return null;

  const handleOpenSimulador = () => {
    window.open(
      '/?visor=cliente',
      'VisorClienteBotica',
      'width=420,height=880,left=950,top=50,resizable=yes'
    );
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(visorUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      })
      .catch(() => {});
  };

  const qrFallbackOnlineUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    visorUrl
  )}&color=0f172a&bgcolor=ffffff&qzone=1`;

  return (
    <div className="vm-modal-backdrop" onClick={onClose}>
      <div className="vm-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="vm-modal-header">
          <div className="vm-title-group">
            <span className="vm-badge-header">ARQUITECTURA OMNI-SYNC · ZERO-FAIL</span>
            <h2 className="vm-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconMonitor size={20} />
              <span>Pantalla de Cliente Mobile-First</span>
            </h2>
            <p className="vm-modal-subtitle">
              Sincronización bidireccional en tiempo real entre Terminal POS y dispositivo del paciente
            </p>
          </div>
          <button type="button" onClick={onClose} className="vm-close-btn" title="Cerrar ventana">
            <IconClose size={15} />
          </button>
        </header>

        <div className="vm-modal-body">
          {/* PLAN C: Simulador Local en la Misma PC */}
          <div className="vm-card-plan-c">
            <div
              className="vm-plan-c-icon"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#059669',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconDesktop size={24} />
            </div>
            <div className="vm-plan-c-content">
              <div className="vm-plan-c-tag">CONTINGENCIA LOCAL · LATENCIA 0 MS</div>
              <h3 className="vm-plan-c-title">Simulador Móvil en esta Estación</h3>
              <p className="vm-plan-c-desc">
                Despliega una ventana vertical con dimensiones móviles exactas (420x880px). Sincroniza a{' '}
                <strong>0 ms</strong> por canal de memoria interna sin requerir conexión Wi-Fi.
              </p>
              <button
                type="button"
                onClick={handleOpenSimulador}
                className="vm-btn-open-simulador"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
              >
                <IconMonitor size={15} />
                <span>Abrir Visor Móvil en esta PC</span>
              </button>
            </div>
          </div>

          <div className="vm-divider-text">
            <span>CONEXIÓN INALÁMBRICA CON SMARTPHONE (PLAN A / B · 100% OFFLINE)</span>
          </div>

          {/* PLAN A / B: QR generado localmente en SVG (funciona con o sin Internet) */}
          <div className="vm-card-plan-ab">
            <div className="vm-qr-column">
              <div className="vm-qr-box">
                {qrSvgData ? (
                  <svg
                    viewBox={`0 0 ${qrSvgData.totalSize} ${qrSvgData.totalSize}`}
                    width="128"
                    height="128"
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label="Código QR escaneable del Visor de Cliente"
                    className="vm-qr-img"
                  >
                    <rect width={qrSvgData.totalSize} height={qrSvgData.totalSize} fill="#ffffff" />
                    <path d={qrSvgData.pathD} fill="#0f172a" />
                  </svg>
                ) : (
                  <img
                    src={qrFallbackOnlineUrl}
                    alt="Código QR Visor Cliente"
                    width="128"
                    height="128"
                    className="vm-qr-img"
                  />
                )}
              </div>
              <span className="vm-qr-hint">QR local escaneable (sin requerir Internet)</span>
            </div>

            <div className="vm-info-column">
              <span className="vm-info-tag">DIRECCIÓN DE RED LOCAL</span>
              <p className="vm-info-desc">
                Vincule la estación y el smartphone a la misma red Wi-Fi o Zona con Cobertura Inalámbrica Móvil.
              </p>

              <div className="vm-url-box">
                <input
                  type="text"
                  value={visorUrl}
                  readOnly
                  className="vm-url-input"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`vm-btn-copy ${copied ? 'copied' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
                </button>
              </div>

              {(currentHost === 'localhost' || currentHost === '127.0.0.1') && (
                <div className="vm-ip-helper">
                  <label htmlFor="vm-ip-input" className="vm-ip-label">
                    Dirección IPv4 detectada del adaptador de red:
                  </label>
                  <div className="vm-ip-row">
                    <input
                      id="vm-ip-input"
                      type="text"
                      placeholder="Ej: 192.168.1.35"
                      value={customIp}
                      onChange={(e) => setCustomIp(e.target.value)}
                      className="vm-ip-input"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                    <span className="vm-ip-badge">Puerto :5173</span>
                  </div>
                  <small className="vm-ip-note" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconShield size={12} />
                    <span>En modo sin internet, ingrese la IPv4 del Hotspot local de Windows.</span>
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="vm-modal-footer">
          <div className="vm-sync-status">
            <span className="vm-pulse-dot" />
            <span>Canales activos: BroadcastChannel · Storage · API RAM (400ms)</span>
          </div>
          <button type="button" onClick={onClose} className="vm-btn-done">
            Cerrar Panel
          </button>
        </footer>
      </div>
    </div>
  );
}
