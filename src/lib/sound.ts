/**
 * 효과음 (Web Audio API)
 */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // 무시
  }
}

export function playCardPlace() {
  playTone(300, 0.08, 'triangle', 0.12);
}

export function playCardCapture() {
  playTone(500, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(700, 0.1, 'sine', 0.12), 60);
}

export function playEvent() {
  playTone(800, 0.15, 'square', 0.1);
  setTimeout(() => playTone(1000, 0.15, 'square', 0.08), 100);
  setTimeout(() => playTone(1200, 0.2, 'square', 0.06), 200);
}

export function playGo() {
  playTone(600, 0.12, 'sawtooth', 0.1);
  setTimeout(() => playTone(900, 0.2, 'sawtooth', 0.12), 100);
}

export function playStop() {
  playTone(440, 0.15, 'sine', 0.15);
  setTimeout(() => playTone(550, 0.15, 'sine', 0.12), 100);
  setTimeout(() => playTone(660, 0.3, 'sine', 0.15), 200);
}

export function playGameOver() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.12), i * 150);
  });
}
