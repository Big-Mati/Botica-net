import React, { useState } from 'react';

const CANDIDATE_PATHS = {
  Yape: [
    '/qr/yape.jpeg',
    '/qr/yape.png',
    '/qr/yape.webp',
    '/qr/yape.jpg',
    '/qr/qr.png',
    '/qr/qr.webp',
    '/qr/qr.jpg',
    '/qr/plin.jpeg',
    '/qr/plin.png'
  ],
  Plin: [
    '/qr/plin.jpeg',
    '/qr/plin.png',
    '/qr/plin.webp',
    '/qr/plin.jpg',
    '/qr/qr.png',
    '/qr/yape.jpeg',
    '/qr/yape.png'
  ]
};

function QrImageInner({ walletKey, size, showDemoHint }) {
  const candidates = CANDIDATE_PATHS[walletKey] || CANDIDATE_PATHS.Yape;
  const [attemptIdx, setAttemptIdx] = useState(0);

  const agotado = attemptIdx >= candidates.length;
  const accentPrimary = walletKey === 'Plin' ? '#0284c7' : '#742384';
  const accentSecondary = walletKey === 'Plin' ? '#06b6d4' : '#00d3b5';

  if (!agotado) {
    const isYape = walletKey === 'Yape';
    return (
      <div
        style={{
          width: `${size}px`,
          borderRadius: '16px',
          overflow: 'hidden',
          background: isYape ? '#730985' : '#ffffff',
          boxShadow: '0 8px 22px rgba(0, 0, 0, 0.22)',
          lineHeight: 0
        }}
      >
        <img
          src={candidates[attemptIdx]}
          alt={`Código QR oficial ${walletKey}`}
          width={size}
          height={isYape ? Math.round(size * 1.28) : size}
          onError={() => setAttemptIdx((prev) => prev + 1)}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: `${Math.round(size * 1.34)}px`,
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <svg
        viewBox="0 0 256 256"
        width={size}
        height={size}
        style={{ display: 'block', borderRadius: '12px', background: '#ffffff' }}
        aria-label={`QR demostrativo ${walletKey}`}
      >
        <rect width="256" height="256" fill="#ffffff" rx="16" />
        <rect x="24" y="24" width="56" height="56" rx="8" fill={accentPrimary} />
        <rect x="36" y="36" width="32" height="32" rx="4" fill="#ffffff" />
        <rect x="44" y="44" width="16" height="16" rx="2" fill={accentPrimary} />

        <rect x="176" y="24" width="56" height="56" rx="8" fill={accentPrimary} />
        <rect x="188" y="36" width="32" height="32" rx="4" fill="#ffffff" />
        <rect x="196" y="44" width="16" height="16" rx="2" fill={accentPrimary} />

        <rect x="24" y="176" width="56" height="56" rx="8" fill={accentPrimary} />
        <rect x="36" y="188" width="32" height="32" rx="4" fill="#ffffff" />
        <rect x="44" y="196" width="16" height="16" rx="2" fill={accentPrimary} />

        <rect x="96" y="28" width="16" height="16" rx="2" fill={accentPrimary} />
        <rect x="124" y="28" width="16" height="16" rx="2" fill={accentSecondary} />
        <rect x="96" y="56" width="24" height="24" rx="3" fill={accentPrimary} />
        <rect x="132" y="56" width="16" height="16" rx="2" fill={accentPrimary} />

        <rect x="28" y="96" width="16" height="16" rx="2" fill={accentPrimary} />
        <rect x="56" y="96" width="24" height="16" rx="2" fill={accentSecondary} />
        <rect x="28" y="124" width="24" height="24" rx="3" fill={accentPrimary} />
        <rect x="64" y="124" width="16" height="16" rx="2" fill={accentPrimary} />

        <rect x="100" y="100" width="56" height="56" rx="28" fill={accentPrimary} />
        <circle cx="128" cy="128" r="18" fill="#ffffff" />
        <circle cx="128" cy="128" r="9" fill={accentSecondary} />

        <rect x="176" y="96" width="16" height="16" rx="2" fill={accentPrimary} />
        <rect x="204" y="96" width="28" height="16" rx="2" fill={accentPrimary} />
        <rect x="176" y="124" width="24" height="24" rx="3" fill={accentSecondary} />
        <rect x="212" y="124" width="20" height="20" rx="2" fill={accentPrimary} />

        <rect x="96" y="176" width="20" height="20" rx="2" fill={accentPrimary} />
        <rect x="128" y="176" width="16" height="16" rx="2" fill={accentSecondary} />
        <rect x="156" y="176" width="24" height="24" rx="3" fill={accentPrimary} />
        <rect x="192" y="176" width="16" height="16" rx="2" fill={accentPrimary} />

        <rect x="96" y="208" width="32" height="24" rx="3" fill={accentPrimary} />
        <rect x="140" y="208" width="16" height="16" rx="2" fill={accentPrimary} />
        <rect x="168" y="208" width="24" height="24" rx="3" fill={accentSecondary} />
        <rect x="204" y="208" width="28" height="24" rx="3" fill={accentPrimary} />
      </svg>

      {showDemoHint && (
        <span
          style={{
            fontSize: '0.66rem',
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 1.25
          }}
        >
          QR referencial · Guarde su QR real en <code>client/public/qr/{walletKey.toLowerCase()}.jpeg</code>
        </span>
      )}
    </div>
  );
}

export default function PaymentQrBox({
  metodo = 'Yape',
  size = 200,
  showDemoHint = false,
  allowSwitch = false,
  selectedWallet: controlledWallet,
  onSelectWallet
}) {
  const defaultKey =
    String(metodo).toLowerCase().includes('plin') && !String(metodo).toLowerCase().includes('yape')
      ? 'Plin'
      : 'Yape';

  const [internalWallet, setInternalWallet] = useState(defaultKey);
  const activeWallet = controlledWallet || (allowSwitch ? internalWallet : defaultKey);

  const handleChangeWallet = (next) => {
    setInternalWallet(next);
    if (onSelectWallet) onSelectWallet(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {allowSwitch && (
        <div
          role="tablist"
          aria-label="Seleccionar código QR"
          style={{
            display: 'inline-grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            padding: '3px',
            borderRadius: '999px',
            background: 'rgba(15, 23, 42, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.25)'
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeWallet === 'Yape'}
            onClick={() => handleChangeWallet('Yape')}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '0.73rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeWallet === 'Yape' ? '#8b249f' : 'transparent',
              color: activeWallet === 'Yape' ? '#ffffff' : '#cbd5e1',
              transition: 'background 0.16s ease, color 0.16s ease'
            }}
          >
            QR Yape
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeWallet === 'Plin'}
            onClick={() => handleChangeWallet('Plin')}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '4px 14px',
              fontSize: '0.73rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: activeWallet === 'Plin' ? '#0284c7' : 'transparent',
              color: activeWallet === 'Plin' ? '#ffffff' : '#cbd5e1',
              transition: 'background 0.16s ease, color 0.16s ease'
            }}
          >
            QR Plin
          </button>
        </div>
      )}

      <QrImageInner key={activeWallet} walletKey={activeWallet} size={size} showDemoHint={showDemoHint} />
    </div>
  );
}
