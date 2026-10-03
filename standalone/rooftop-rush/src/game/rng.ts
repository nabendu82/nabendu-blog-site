export const rand = (a = 1, b?: number): number => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a: number, b: number): number => Math.floor(rand(a, b + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function weighted<T>(items: readonly (readonly [T, number])[]): T {
  let total = 0;
  for (const [, w] of items) total += Math.max(0, w);
  let r = Math.random() * total;
  for (const [v, w] of items) {
    r -= Math.max(0, w);
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}
export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Frame-rate independent exponential smoothing factor. */
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);
