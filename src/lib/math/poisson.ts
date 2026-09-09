/** Poisson PMF using a running product to stay stable for k ≤ 12. */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    p *= lambda / i;
  }
  return p;
}

export function poissonCdf(k: number, lambda: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += poissonPmf(i, lambda);
  return s;
}
