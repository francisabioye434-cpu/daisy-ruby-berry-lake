/** Convert decimal odds to implied probability (with vig still in). */
export function impliedProb(decimalOdds: number): number {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return 0;
  return 1 / decimalOdds;
}

/** Fair decimal odds from a true probability. */
export function fairOdds(p: number): number {
  if (!Number.isFinite(p) || p <= 0) return Infinity;
  if (p >= 1) return 1;
  return 1 / p;
}

/**
 * Expected value per 1 unit staked.
 * EV = p * d - 1
 */
export function expectedValue(p: number, decimalOdds: number): number {
  if (!Number.isFinite(p) || !Number.isFinite(decimalOdds)) return 0;
  return p * decimalOdds - 1;
}

export function americanFromDecimal(d: number): string {
  if (!Number.isFinite(d) || d <= 1) return "—";
  if (d >= 2) return `+${Math.round((d - 1) * 100)}`;
  return `${Math.round(-100 / (d - 1))}`;
}

/** Decimal odds from American, e.g. +235 → 3.35, −160 → 1.625. */
export function decimalFromAmerican(raw: string | number | null | undefined): number {
  if (raw == null) return NaN;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace("+", "").trim());
  if (!Number.isFinite(n) || n === 0) return NaN;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
}

/** Break-even win probability at decimal odds d. */
export function breakevenP(decimalOdds: number): number {
  return impliedProb(decimalOdds);
}
