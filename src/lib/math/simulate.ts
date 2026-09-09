import { kellyFraction } from "./kelly";

export type StakeStrategy =
  | "flat"
  | "kelly-full"
  | "kelly-half"
  | "kelly-quarter"
  | "martingale";

export const STRATEGY_LABEL: Record<StakeStrategy, string> = {
  flat: "Flat 1%",
  "kelly-full": "Full Kelly",
  "kelly-half": "Half Kelly",
  "kelly-quarter": "Quarter Kelly",
  martingale: "Martingale",
};

export interface SimConfig {
  p: number;
  odds: number;
  bankroll: number;
  bets: number;
  paths: number;
  seed: number;
  /** Flat stake as a fraction of *initial* bankroll. */
  flatFraction: number;
}

export interface PathStats {
  median: number[];
  p10: number[];
  p90: number[];
  terminal: number[];
  ruinRate: number;
  medianTerminal: number;
  meanLogGrowth: number;
  medianMaxDrawdown: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - i) + sorted[hi] * (i - lo);
}

function stakeFor(
  strategy: StakeStrategy,
  bankroll: number,
  initial: number,
  p: number,
  odds: number,
  flatFraction: number,
  martingaleUnit: number,
  consecutiveLosses: number,
): number {
  if (bankroll <= 0) return 0;
  if (strategy === "flat") {
    return Math.min(bankroll, initial * flatFraction);
  }
  if (strategy === "kelly-full") {
    return Math.min(bankroll, Math.max(0, bankroll * kellyFraction(p, odds)));
  }
  if (strategy === "kelly-half") {
    return Math.min(bankroll, Math.max(0, bankroll * kellyFraction(p, odds) * 0.5));
  }
  if (strategy === "kelly-quarter") {
    return Math.min(bankroll, Math.max(0, bankroll * kellyFraction(p, odds) * 0.25));
  }
  // Martingale: double after each loss, reset on win. Capped by remaining bankroll.
  const raw = martingaleUnit * 2 ** consecutiveLosses;
  return Math.min(bankroll, raw);
}

export function simulateStrategy(strategy: StakeStrategy, cfg: SimConfig): PathStats {
  const rng = mulberry32(cfg.seed);
  const n = cfg.bets;
  const paths = cfg.paths;
  const initial = cfg.bankroll;
  const martingaleUnit = initial * cfg.flatFraction;

  const series: number[][] = Array.from({ length: n + 1 }, () => []);
  const terminals: number[] = [];
  const drawdowns: number[] = [];
  let ruins = 0;
  let logGrowthSum = 0;

  for (let path = 0; path < paths; path++) {
    let bank = initial;
    let peak = initial;
    let maxDd = 0;
    let losses = 0;
    series[0].push(bank);

    for (let i = 0; i < n; i++) {
      const stake = stakeFor(
        strategy,
        bank,
        initial,
        cfg.p,
        cfg.odds,
        cfg.flatFraction,
        martingaleUnit,
        losses,
      );
      const win = rng() < cfg.p;
      if (stake <= 0 || bank <= 0) {
        bank = Math.max(0, bank);
      } else if (win) {
        bank += stake * (cfg.odds - 1);
        losses = 0;
      } else {
        bank -= stake;
        losses += 1;
      }
      if (bank <= 1e-9) {
        bank = 0;
      }
      peak = Math.max(peak, bank);
      if (peak > 0) maxDd = Math.max(maxDd, (peak - bank) / peak);
      series[i + 1].push(bank);
    }

    terminals.push(bank);
    drawdowns.push(maxDd);
    if (bank <= 0) ruins += 1;
    logGrowthSum += Math.log(Math.max(bank, 1e-12) / initial) / n;
  }

  const median: number[] = [];
  const p10: number[] = [];
  const p90: number[] = [];
  for (let i = 0; i <= n; i++) {
    const col = series[i].slice().sort((a, b) => a - b);
    median.push(percentile(col, 0.5));
    p10.push(percentile(col, 0.1));
    p90.push(percentile(col, 0.9));
  }

  const termSorted = terminals.slice().sort((a, b) => a - b);
  const ddSorted = drawdowns.slice().sort((a, b) => a - b);

  return {
    median,
    p10,
    p90,
    terminal: terminals,
    ruinRate: ruins / paths,
    medianTerminal: percentile(termSorted, 0.5),
    meanLogGrowth: logGrowthSum / paths,
    medianMaxDrawdown: percentile(ddSorted, 0.5),
  };
}

export function simulateAll(cfg: SimConfig, strategies: StakeStrategy[]) {
  return Object.fromEntries(strategies.map((s) => [s, simulateStrategy(s, cfg)])) as Record<
    StakeStrategy,
    PathStats
  >;
}
