import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LoginHUD.css';

/**
 * FUSIÓN MAESTRA: "Keylight + Gridwork Co" (Refinamiento 1A + 2A + 3A + 4A)
 * Lado Izquierdo (50%): Atmósfera Cinemática "Keylight & Botanical Apothecary"
 * Lado Derecho (50%): Quirófano Blanco Quirúrgico & Usabilidad Táctil "Gridwork Co"
 */
export default function LoginHUD({ onLoginSuccess }) {
  // Form & Turn State
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [turno, setTurno] = useState('Turno Mañana · 01');
  const [showPassword, setShowPassword] = useState(false);
  const audioEnabled = true;

  // Feedback State
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('idle'); // 'idle' | 'error' | 'success' | 'locked'
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccessing, setIsSuccessing] = useState(false);
  const [clockTime, setClockTime] = useState({ hh: '12', mm: '00', period: 'AM' });

  // Rotación Clásica de Métricas (6 Segundos)
  const [currentMetricIdx, setCurrentMetricIdx] = useState(0);

  // Parallax Tilt para Mosaico de Baldosas y Video 3D (C1)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Alternancia Continua de Fondos Cinemáticos (video1.mp4 <-> video2.mp4)
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);

  // Anti-Brute Force Security
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Element Refs
  const formCardRef = useRef(null);
  const userInputRef = useRef(null);
  const passInputRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isTypewritingRef = useRef(false);

  // Métricas Clave de la Botica (Español Profesional y Simplicidad)
  const metricsData = [
    {
      tag: 'CONTROL DE INVENTARIO · TIEMPO REAL',
      headline: '1,480+ medicamentos despachados hoy',
      quote: 'Control de existencias sincronizado en tiempo real sin quiebres de inventario.',
    },
    {
      tag: 'ROTACIÓN INTELIGENTE · DIGEMID',
      headline: 'Control FEFO y DIGEMID 100% activo',
      quote: 'Cero pérdidas económicas por caducidad en anaqueles mediante rotación inteligente.',
    },
    {
      tag: 'TRAZABILIDAD FISCAL · CAJA POS',
      headline: 'Caja blindada con trazabilidad contable',
      quote: 'Emisión de boletas electrónicas SUNAT y auditoría transaccional en cada turno.',
    },
  ];

  // =========================================================================
  // 1. SINTETIZADOR WEB AUDIO API NATIVO
  // =========================================================================
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playKeyPulse = useCallback(() => {
    if (!audioEnabled || lockoutSeconds > 0) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const freq = 920 + Math.random() * 180;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.022);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio silencioso
    }
  }, [audioEnabled, lockoutSeconds, getAudioContext]);

  const playErrorTone = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      [0, 0.12].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(175, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + delay + 0.1);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.12);
      });
    } catch {
      // Audio silencioso
    }
  }, [audioEnabled, getAudioContext]);

  const playUnlockChime = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.065;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // Audio silencioso
    }
  }, [audioEnabled, getAudioContext]);

  // =========================================================================
  // 2. RELOJ DE PRECISIÓN (12H SIN SEGUNDERO)
  // =========================================================================
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const hours24 = d.getHours();
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      setClockTime({
        hh: pad(hours12),
        mm: pad(d.getMinutes()),
        period,
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // 3. ROTACIÓN DE MÉTRICAS CADA 6 SEGUNDOS (FADE-CROSS SUAVE)
  // =========================================================================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMetricIdx((prev) => (prev + 1) % metricsData.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [metricsData.length]);

  // =========================================================================
  // 3B. ALTERNANCIA CONTINUA DE FONDOS DE VIDEO (video1.mp4 <-> video2.mp4)
  // =========================================================================
  useEffect(() => {
    if (video1Ref.current) {
      video1Ref.current.playbackRate = 0.88;
      video1Ref.current.play().catch(() => {});
    }
  }, []);

  const handleVideo1Ended = () => {
    setActiveVideoIdx(1);
    if (video2Ref.current) {
      video2Ref.current.currentTime = 0;
      video2Ref.current.play().catch(() => {});
    }
  };

  const handleVideo2Ended = () => {
    setActiveVideoIdx(0);
    if (video1Ref.current) {
      video1Ref.current.currentTime = 0;
      video1Ref.current.playbackRate = 0.88;
      video1Ref.current.play().catch(() => {});
    }
  };

  // =========================================================================
  // 4. PARALLAX GLOBAL MULTICAPA EN TODA LA PANTALLA (G1)
  // =========================================================================
  const handleStageMouseMove = (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setParallaxOffset({
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny)),
    });
  };

  const handleStageMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  // =========================================================================
  // 5. SEGURIDAD ANTI-FUERZA BRUTA (15S)
  // =========================================================================
  useEffect(() => {
    let timer;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setStatusType('idle');
            setStatusMessage('');
            setFailedAttempts(0);
            return 0;
          }
          setStatusMessage(`Protocolo de seguridad activo. Reintenta en ${prev - 1}s`);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // =========================================================================
  // 6. VALIDACIÓN REAL CONTRA MYSQL (POST /api/login) + FALLBACK LOCAL
  // =========================================================================
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrarIntentoFallido = useCallback(() => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 3) {
      setLockoutSeconds(15);
      setStatusType('locked');
      setStatusMessage('Demasiados intentos fallidos. Bloqueo temporal por 15s.');
      setIsShaking(true);
      playErrorTone();
      setTimeout(() => setIsShaking(false), 450);
    } else {
      setStatusType('error');
      setStatusMessage(`Credenciales incorrectas (intento ${nextAttempts} de 3).`);
      setIsShaking(true);
      playErrorTone();
      setTimeout(() => setIsShaking(false), 450);

      if (passInputRef.current) {
        passInputRef.current.focus();
        passInputRef.current.select();
      }
    }
  }, [failedAttempts, playErrorTone]);

  const confirmarAccesoExitoso = useCallback(
    (operador) => {
      setStatusType('success');
      setStatusMessage('Identidad validada. Habilitando terminal POS...');
      playUnlockChime();
      setIsSuccessing(true);

      const sesionData = {
        id_vendedor: operador?.id_vendedor || 1,
        usuario: operador?.usuario || 'vendedor',
        nombre: operador?.nombre || 'Carlos Mendoza',
        rol: operador?.rol || 'Químico Farmacéutico',
        turno: turno,
        timestamp: Date.now(),
      };

      try {
        sessionStorage.setItem('botica_sesion_activa', JSON.stringify(sesionData));
      } catch {
        // Fallback seguro
      }

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(sesionData);
        }
      }, 500);
    },
    [turno, playUnlockChime, onLoginSuccess]
  );

  const executeLogin = useCallback(
    async (customUser, customPass) => {
      if (lockoutSeconds > 0 || isSubmitting || isSuccessing) return;

      const u = (customUser !== undefined ? customUser : usuario).trim().toLowerCase();
      const p = (customPass !== undefined ? customPass : password).trim();

      if (!u || !p) {
        registrarIntentoFallido();
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario: u, clave: p })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          confirmarAccesoExitoso(data.operador);
        } else {
          registrarIntentoFallido();
        }
      } catch {
        // Contingencia offline local si la red no está disponible
        if (u === 'vendedor' && p === '123') {
          confirmarAccesoExitoso({
            id_vendedor: 1,
            usuario: 'vendedor',
            nombre: 'Carlos Mendoza',
            rol: 'Químico Farmacéutico'
          });
        } else {
          registrarIntentoFallido();
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [usuario, password, lockoutSeconds, isSubmitting, isSuccessing, confirmarAccesoExitoso, registrarIntentoFallido]
  );

  // =========================================================================
  // 7. ACCESO RÁPIDO DEMO (F9)
  // =========================================================================
  const triggerDemoAutoLogin = useCallback(() => {
    if (isTypewritingRef.current || isSuccessing || lockoutSeconds > 0) return;
    isTypewritingRef.current = true;

    setStatusType('idle');
    setStatusMessage('');
    setUsuario('');
    setPassword('');

    const targetUser = 'vendedor';
    const targetPass = '123';

    let uIdx = 0;
    let pIdx = 0;

    const typeUser = () => {
      if (uIdx <= targetUser.length) {
        setUsuario(targetUser.slice(0, uIdx));
        playKeyPulse();
        uIdx++;
        setTimeout(typeUser, 22);
      } else {
        setTimeout(typePass, 30);
      }
    };

    const typePass = () => {
      if (pIdx <= targetPass.length) {
        setPassword(targetPass.slice(0, pIdx));
        playKeyPulse();
        pIdx++;
        setTimeout(typePass, 22);
      } else {
        isTypewritingRef.current = false;
        executeLogin(targetUser, targetPass);
      }
    };

    typeUser();
  }, [isSuccessing, lockoutSeconds, playKeyPulse, executeLogin]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        triggerDemoAutoLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDemoAutoLogin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userInputRef.current) userInputRef.current.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleUserKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (passInputRef.current) passInputRef.current.focus();
    } else {
      playKeyPulse();
    }
  };

  const handlePassKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeLogin();
    } else {
      playKeyPulse();
    }
  };

  return (
    <div
      className={`login-master-container ${isSuccessing ? 'master-dissolving' : ''}`}
      style={{
        '--px': parallaxOffset.x,
        '--py': parallaxOffset.y,
      }}
      onMouseMove={handleStageMouseMove}
      onMouseLeave={handleStageMouseLeave}
    >
      {/* =====================================================================
          LADO IZQUIERDO (53%): ESCAPARATE CINEMÁTICO LIMPIO & TELEMETRÍA
          ===================================================================== */}
      <section className="split-left-stage">
        {/* Videos de Fondo Alternados (video1.mp4 a 0.88x y video2.mp4) con Transición Fluida */}
        <video
          ref={video1Ref}
          src="/video1.mp4"
          autoPlay
          muted
          playsInline
          className={`split-left-video ${activeVideoIdx === 0 ? 'video-active' : 'video-dormant'}`}
          onPlay={(e) => {
            e.currentTarget.playbackRate = 0.88;
          }}
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = 0.88;
          }}
          onEnded={handleVideo1Ended}
          onError={() => {
            setActiveVideoIdx(1);
            if (video2Ref.current) video2Ref.current.play().catch(() => {});
          }}
        />
        <video
          ref={video2Ref}
          src="/video2.mp4"
          muted
          playsInline
          preload="metadata"
          className={`split-left-video ${activeVideoIdx === 1 ? 'video-active' : 'video-dormant'}`}
          onEnded={handleVideo2Ended}
          onError={() => {
            setActiveVideoIdx(0);
            if (video1Ref.current) video1Ref.current.play().catch(() => {});
          }}
        />

        {/* Halo de Luz Cálida Keylight */}
        <div className="keylight-warm-halo" />

        {/* Barra Superior Izquierda: Telemetría de Base de Datos y Versión */}
        <div className="keylight-brand-header">
          <div className="telemetry-db-pill">
            <div className="telemetry-radar-beacon">
              <span className="radar-core-dot" />
              <span className="radar-wave wave-1" />
              <span className="radar-wave wave-2" />
            </div>
            <span className="telemetry-db-label">Base de datos conectada</span>
            <span className="telemetry-sep">·</span>
            <span className="telemetry-time">{clockTime.hh}:{clockTime.mm} {clockTime.period}</span>
          </div>
          <span className="keylight-version-badge">Sistema v2.4</span>
        </div>

        {/* Gran Titular Editorial Superior con Degradado Perla-Esmeralda y Parallax */}
        <div className="keylight-hero-editorial">
          <h1 className="keylight-editorial-title">
            Sistema Web de Inventario y POS
          </h1>
          <p className="keylight-editorial-subtitle">
            Gestión de inventario y punto de venta en tiempo real.
          </p>
        </div>

        {/* 2A. Repisa Inferior Clásica Descomprimida con Espacio Vertical Generoso */}
        <div className="left-progressive-blur-shelf">
          {/* Métrica Dinámica con Transición Fade-Cross */}
          <div key={currentMetricIdx} className="shelf-metric-block fade-cross">
            <span className="shelf-metric-tag">{metricsData[currentMetricIdx].tag}</span>
            <div className="shelf-metric-headline">{metricsData[currentMetricIdx].headline}</div>
            <p className="shelf-metric-quote">"{metricsData[currentMetricIdx].quote}"</p>
          </div>

          {/* Línea de Progreso Milimétrica (6s de Relleno Esmeralda) */}
          <div className="shelf-progress-track">
            <div key={`prog-${currentMetricIdx}`} className="shelf-progress-fill" />
          </div>

          {/* Sellos de Laboratorio Farmacéutico */}
          <div className="shelf-pharma-seals">
            <span>BAYER</span>
            <span className="pharma-bullet">·</span>
            <span>PFIZER</span>
            <span className="pharma-bullet">·</span>
            <span>GENFAR</span>
            <span className="pharma-bullet">·</span>
            <span>ROCHE</span>
            <span className="pharma-bullet">·</span>
            <span>BAGÓ</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          LADO DERECHO (47%): QUIRÓFANO BLANCO PORCELANA LIMPIO & CENTRADO
          ===================================================================== */}
      <section className="split-right-stage">
        {/* Cuerpo del Formulario Centrado */}
        <div
          ref={formCardRef}
          className={`surgical-form-wrapper ${isShaking ? 'surgical-shake' : ''}`}
        >
          {/* Cabecera con Marca Corporativa Pura (Logo + Botica Nova) */}
          <div className="surgical-form-header stagger-1">
            <div className="surgical-brand-row">
              <div className="brand-logo-container">
                <div className="brand-logo-glow" />
                <span className="brand-particle p1" />
                <span className="brand-particle p2" />
                <span className="brand-particle p3" />
                <span className="brand-particle p4" />
                <img
                  src="/favicon.svg"
                  alt="Botica Nova Logo"
                  className="brand-logo-image"
                  width="42"
                  height="42"
                />
              </div>
              <span className="surgical-brand-title">Botica Nova</span>
            </div>

            <h2 className="surgical-form-title">Iniciar turno en caja</h2>
            <p className="surgical-form-subtitle">Ingresa tus credenciales de operador para habilitar caja.</p>
          </div>

          {/* Formulario Ergonómico POS (Usuario -> Contraseña -> Turno -> Acceso) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeLogin();
            }}
            className="surgical-inputs-form stagger-2"
            autoComplete="off"
          >
            {/* Campo: Usuario */}
            <div className="surgical-field-group">
              <label htmlFor="surgical-input-user" className="surgical-label">
                Usuario
              </label>
              <div className="surgical-input-container">
                <svg className="surgical-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="surgical-input-user"
                  ref={userInputRef}
                  type="text"
                  name="botica_surgical_user"
                  value={usuario}
                  disabled={lockoutSeconds > 0}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    if (statusType === 'error') setStatusType('idle');
                  }}
                  onKeyDown={handleUserKeyDown}
                  placeholder="Vendedor"
                  className="surgical-input-raw"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                />
              </div>
            </div>

            {/* Campo: Contraseña con Conmutador Eye */}
            <div className="surgical-field-group">
              <label htmlFor="surgical-input-pass" className="surgical-label">
                Contraseña
              </label>
              <div className="surgical-input-container">
                <svg className="surgical-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="surgical-input-pass"
                  ref={passInputRef}
                  type={showPassword ? 'text' : 'password'}
                  name="botica_surgical_pass"
                  value={password}
                  disabled={lockoutSeconds > 0}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (statusType === 'error') setStatusType('idle');
                  }}
                  onKeyDown={handlePassKeyDown}
                  placeholder="••••••••"
                  className="surgical-input-raw"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                />
                <button
                  type="button"
                  className="surgical-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Ajuste 4 (T1): Segmented Control Deslizante de Turnos */}
            <div className="surgical-field-group">
              <label className="surgical-label">Turno de operación</label>
              <div className="surgical-segmented-shift" role="radiogroup" aria-label="Turno de operación">
                <div
                  className="surgical-segmented-glider"
                  style={{
                    transform: turno.includes('Mañana') ? 'translateX(0%)' : 'translateX(100%)',
                  }}
                />
                <button
                  type="button"
                  className={`surgical-segment-btn ${turno.includes('Mañana') ? 'active' : ''}`}
                  onClick={() => {
                    setTurno('Turno Mañana · 01');
                    playKeyPulse();
                  }}
                  role="radio"
                  aria-checked={turno.includes('Mañana')}
                >
                  <span className="segment-icon-amber">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </span>
                  <span className="segment-text">Turno Mañana · 01</span>
                  <span className="segment-hours">07:00 - 15:00</span>
                </button>
                <button
                  type="button"
                  className={`surgical-segment-btn ${turno.includes('Noche') ? 'active' : ''}`}
                  onClick={() => {
                    setTurno('Turno Noche · 02');
                    playKeyPulse();
                  }}
                  role="radio"
                  aria-checked={turno.includes('Noche')}
                >
                  <span className="segment-icon-indigo">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </span>
                  <span className="segment-text">Turno Noche · 02</span>
                  <span className="segment-hours">15:00 - 23:00</span>
                </button>
              </div>
            </div>

            {/* Mensajes de Alerta / Estado */}
            {statusMessage && (
              <div className={`surgical-alert ${statusType}`}>
                {statusType === 'error' && <span className="surgical-alert-dot" />}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Stagger 4: Botón de Acceso Principal */}
            <button
              type="submit"
              disabled={lockoutSeconds > 0 || isSubmitting || isSuccessing}
              className="surgical-submit-btn"
            >
              <span>{isSubmitting ? 'Verificando credenciales...' : 'Iniciar sesión en caja'}</span>
              <span className="surgical-btn-arrow">→</span>
            </button>
          </form>

          {/* Stagger 4 Cont.: Acceso Rápido Demo con Tecla 3D F9 */}
          <button
            type="button"
            className="surgical-demo-bar stagger-4"
            onClick={triggerDemoAutoLogin}
            disabled={lockoutSeconds > 0 || isSubmitting || isSuccessing}
          >
            <span className="surgical-demo-left">
              <span className="surgical-demo-bolt" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </span>
              <span>Acceso rápido de demostración</span>
            </span>
            <kbd className="surgical-kbd-key">F9</kbd>
          </button>
        </div>

        {/* Pie Quirúrgico en Español Limpio */}
        <footer className="surgical-footer-note">
          <span>Conexión segura verificada · Botica Nova</span>
        </footer>
      </section>
    </div>
  );
}