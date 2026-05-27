// Tiny Web Audio helper — single shared AudioContext lazy-created on the
// first user gesture (browsers / iOS require a gesture before audio can
// play). All `state.sound === false` callsites no-op via the `enabled`
// gate. PORT_FROM_VANILLA.md item 7.

type AudioCtxCtor = typeof AudioContext;

let _ctx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (_ctx) return _ctx;
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioCtxCtor };
  const Ctor: AudioCtxCtor | undefined = window.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    _ctx = new Ctor();
  } catch {
    _ctx = null;
  }
  return _ctx;
}

export type BlipOptions = {
  /** Oscillator type. Default 'sine' — clean, low-fatigue UI tone. */
  type?: OscillatorType;
  /** Peak gain (0–1). Default 0.08 — quiet enough to be sweetening, not toy-like. */
  gain?: number;
};

// Play a short tone. `freq` in Hz, `durationSec` in seconds. Includes a
// 10ms attack + release envelope so the start/end don't click. No-op when
// `enabled` is false (caller passes `state.sound`).
export function blip(
  freq: number,
  durationSec: number,
  enabled: boolean,
  options: BlipOptions = {},
): void {
  if (!enabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  // First gesture may have created the context in 'suspended' state on iOS.
  if (ctx.state === 'suspended') {
    try {
      ctx.resume();
    } catch {
      /* noop */
    }
  }
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = options.type ?? 'sine';
  osc.frequency.value = freq;

  const now = ctx.currentTime;
  const peak = options.gain ?? 0.08;
  // Quick AR envelope.
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(peak, now + 0.01);
  env.gain.linearRampToValueAtTime(0, now + durationSec);

  osc.connect(env).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}
