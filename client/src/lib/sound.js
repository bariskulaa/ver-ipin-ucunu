let audioCtx = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone({ frequency, duration, type = "sine", delay = 0, gain = 0.16 }) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    const start = ctx.currentTime + delay;
    gainNode.gain.setValueAtTime(gain, start);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    // Audio can fail silently (autoplay policy, unsupported browser); non-critical.
  }
}

export function playYourTurnSound() {
  tone({ frequency: 660, duration: 0.12 });
  tone({ frequency: 880, duration: 0.16, delay: 0.12 });
}

export function playWinSound() {
  tone({ frequency: 523.25, duration: 0.14 });
  tone({ frequency: 659.25, duration: 0.14, delay: 0.14 });
  tone({ frequency: 783.99, duration: 0.28, delay: 0.28 });
}

export function playLoseSound() {
  tone({ frequency: 311.13, duration: 0.28, type: "sawtooth", gain: 0.12 });
  tone({ frequency: 207.65, duration: 0.42, type: "sawtooth", delay: 0.24, gain: 0.12 });
}
