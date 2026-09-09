export type DevigMethod = "multiplicative" | "additive";

export interface DevigResult {
  fair: number[];
  implied: number[];
  overround: number;
  method: DevigMethod;
}

/**
 * Remove the bookmaker margin from a mutually exclusive market.
 * Multiplicative (proportional) is the standard teaching method:
 * fair_i = implied_i / sum(implied).
 * Additive subtracts the overround equally — can go negative on longshots,
 * so we floor at 0 and renormalize.
 */
export function devig(odds: number[], method: DevigMethod = "multiplicative"): DevigResult {
  const implied = odds.map((o) => (o > 1 ? 1 / o : 0));
  const sum = implied.reduce((a, b) => a + b, 0);
  const overround = sum - 1;

  let fair: number[];
  if (method === "additive") {
    const n = implied.length || 1;
    fair = implied.map((p) => p - overround / n);
    const floor = fair.map((p) => Math.max(0, p));
    const s = floor.reduce((a, b) => a + b, 0);
    fair = s > 0 ? floor.map((p) => p / s) : floor;
  } else {
    fair = sum > 0 ? implied.map((p) => p / sum) : implied;
  }

  return { fair, implied, overround, method };
}

export function overround(odds: number[]): number {
  return odds.reduce((s, o) => s + (o > 1 ? 1 / o : 0), 0) - 1;
}
