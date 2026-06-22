/**
 * Compile-time exhaustiveness guard. When every variant of a union is handled,
 * `value` narrows to `never`, so adding a new variant (e.g. a new GameMode)
 * without a matching branch becomes a compile error at every call site.
 *
 * At runtime we return `fallback` rather than throw — the app deliberately
 * never crashes the user's in-progress game on unexpected state. The guard's
 * value is the build-time check, not a runtime assertion.
 */
export function exhaustive<T>(_value: never, fallback: T): T {
  return fallback;
}
