// Thin wrapper around the Web Vibration API. No-ops in environments that
// don't expose it (desktop browsers, iOS Safari, SSR, the `state.sound`
// preference being off). PORT_FROM_VANILLA.md item 7.
export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw on certain patterns; treat as best-effort.
  }
}
