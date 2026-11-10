/**
 * SINTETIZADOR DE SONIDO CLÍNICO FARMACÉUTICO
 * Web Audio API nativo del navegador (0 dependencias, latencia ultra-baja).
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Beep agudo suave de escáner médico (880Hz, 60ms)
 * Se ejecuta al agregar un fármaco o incrementar unidades en ticket.
 */
export function playScanBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // La5 (880Hz)

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // Silencioso si el navegador bloquea audio antes de interacción
  }
}

/**
 * Acorde armónico ascendente de confirmación (C5 -> E5 -> G5)
 * Se reproduce al emitir exitosamente la boleta electrónica fiscal.
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Frecuencias: Do5 (523.25Hz), Mi5 (659.25Hz), Sol5 (783.99Hz)
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;
      const duration = 0.22;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // Silencioso
  }
}

/**
 * Tono grave de alerta clínica (220Hz -> 160Hz con decaimiento rápido)
 * Se reproduce cuando se excede el stock disponible o hay error de validación.
 */
export function playAlertTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Silencioso
  }
}

/**
 * Sonido tranquilo y sutil de 'click/tick' aero (frecuencia suave, 12ms)
 * para navegar con flechas en la Command Palette o el catálogo.
 */
export function playNavTick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.018);

    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.018);
  } catch {
    // Silencioso
  }
}

/**
 * Reproduce el sonido de confirmación oficial de Yape (/yape.mp3)
 * cuando el método de pago seleccionado es Yape / Plin.
 */
export function playYapeSound() {
  try {
    const audio = new Audio('/yape.mp3');
    audio.volume = 0.85;
    audio.play().catch(() => {});
  } catch {
    // Silencioso si el navegador bloquea autoplay
  }
}


