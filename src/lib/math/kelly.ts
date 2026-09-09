/**
 * Kelly fraction of bankroll for a binary bet at decimal odds.
 * f* = (b p − q) / b,  b = d − 1,  q = 1 − p
 * Negative means no bet.
 */
export function kellyFraction(p: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  if (!Number.isFinite(p) || !Number.isFinite(b) || b <= 0) return 0;
  const q = 1 - p;
  return (b * p - q) / b;
}

export function fractionalKelly(
  p: number,
  decimalOdds: number,
  fraction = 0.5,
): number {
  return Math.max(0, kellyFraction(p, decimalOdds) * fraction);
}

export function stakeFromKelly(
  bankroll: number,
  p: number,
  decimalOdds: number,
  fraction = 0.5,
): number {
  return Math.max(0, bankroll * fractionalKelly(p, decimalOdds, fraction));
}
