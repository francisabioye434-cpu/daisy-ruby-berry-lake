import { poissonPmf } from "./poisson";

export const MAX_GOALS = 8;

/** Dixon–Coles low-score correction. ρ is typically negative (~ −0.08). */
export function tau(
  homeGoals: number,
  awayGoals: number,
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
): number {
  if (homeGoals === 0 && awayGoals === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (homeGoals === 0 && awayGoals === 1) return 1 + lambdaHome * rho;
  if (homeGoals === 1 && awayGoals === 0) return 1 + lambdaAway * rho;
  if (homeGoals === 1 && awayGoals === 1) return 1 - rho;
  return 1;
}

export interface ScoreMatrix {
  /** joint[h][a] */
  joint: number[][];
  lambdaHome: number;
  lambdaAway: number;
  rho: number;
  total: number;
}

export function scoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
  maxGoals = MAX_GOALS,
): ScoreMatrix {
  const joint: number[][] = [];
  let total = 0;
  for (let h = 0; h <= maxGoals; h++) {
    const row: number[] = [];
    const ph = poissonPmf(h, lambdaHome);
    for (let a = 0; a <= maxGoals; a++) {
      const p = tau(h, a, lambdaHome, lambdaAway, rho) * ph * poissonPmf(a, lambdaAway);
      row.push(p);
      total += p;
    }
    joint.push(row);
  }
  if (total > 0) {
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        joint[h][a] /= total;
      }
    }
  }
  return { joint, lambdaHome, lambdaAway, rho, total };
}

export interface MatchMarkets {
  home: number;
  draw: number;
  away: number;
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
  mostLikely: { h: number; a: number; p: number };
}

export function marketsFromMatrix(matrix: ScoreMatrix): MatchMarkets {
  let home = 0;
  let draw = 0;
  let away = 0;
  let over25 = 0;
  let bttsYes = 0;
  let mostLikely = { h: 0, a: 0, p: -1 };

  const n = matrix.joint.length - 1;
  for (let h = 0; h <= n; h++) {
    for (let a = 0; a <= n; a++) {
      const p = matrix.joint[h][a];
      if (p > mostLikely.p) mostLikely = { h, a, p };
      if (h > a) home += p;
      else if (a > h) away += p;
      else draw += p;
      if (h + a > 2.5) over25 += p;
      if (h > 0 && a > 0) bttsYes += p;
    }
  }
  return {
    home,
    draw,
    away,
    over25,
    under25: 1 - over25,
    bttsYes,
    bttsNo: 1 - bttsYes,
    mostLikely,
  };
}

export interface TeamStrength {
  attack: number;
  defense: number;
}

/**
 * Expected goals: attack × opponent defense × home advantage.
 * Attack is goals vs an average defence (def = 1) at a neutral venue.
 * Defense < 1 is stronger.
 */
export function expectedGoals(
  home: TeamStrength,
  away: TeamStrength,
  homeAdv = 1.32,
): { lambdaHome: number; lambdaAway: number } {
  return {
    lambdaHome: Math.max(0.05, home.attack * away.defense * homeAdv),
    lambdaAway: Math.max(0.05, away.attack * home.defense),
  };
}

export function pOver(matrix: ScoreMatrix, line: number): number {
  let p = 0;
  const n = matrix.joint.length - 1;
  for (let h = 0; h <= n; h++) {
    for (let a = 0; a <= n; a++) {
      if (h + a > line) p += matrix.joint[h][a];
    }
  }
  return p;
}

export function priceMatch(
  home: TeamStrength,
  away: TeamStrength,
  opts?: { homeAdv?: number; rho?: number },
) {
  const homeAdv = opts?.homeAdv ?? 1.32;
  const rho = opts?.rho ?? -0.08;
  const { lambdaHome, lambdaAway } = expectedGoals(home, away, homeAdv);
  const matrix = scoreMatrix(lambdaHome, lambdaAway, rho);
  const markets = marketsFromMatrix(matrix);
  return { lambdaHome, lambdaAway, matrix, markets, homeAdv, rho };
}

export function remainingFraction(elapsedMin?: number, phase?: string): number {
  if (phase === "ht") return 0.52;
  const elapsed = Number.isFinite(elapsedMin) ? (elapsedMin as number) : 30;
  const rem = Math.max(4, Math.min(90, 93 - elapsed));
  return rem / 90;
}

/** Current score + remaining Poisson goals → in-play 1X2 / totals / BTTS. */
export function liveMarketsFromScore(
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
  score: { home: number; away: number },
  frac: number,
  line = 2.5,
): { markets: MatchMarkets; remHome: number; remAway: number } {
  const remHome = Math.max(0.02, lambdaHome * frac);
  const remAway = Math.max(0.02, lambdaAway * frac);
  const matrix = scoreMatrix(remHome, remAway, rho);
  let home = 0;
  let draw = 0;
  let away = 0;
  let over = 0;
  let bttsYes = 0;
  let mostLikely = { h: score.home, a: score.away, p: -1 };
  const n = matrix.joint.length - 1;
  const alreadyBtts = score.home > 0 && score.away > 0;
  for (let rh = 0; rh <= n; rh++) {
    for (let ra = 0; ra <= n; ra++) {
      const p = matrix.joint[rh][ra];
      const fh = score.home + rh;
      const fa = score.away + ra;
      if (fh > fa) home += p;
      else if (fa > fh) away += p;
      else draw += p;
      if (fh + fa > line) over += p;
      if (alreadyBtts || (fh > 0 && fa > 0)) bttsYes += p;
      if (p > mostLikely.p) mostLikely = { h: fh, a: fa, p };
    }
  }
  const tot = home + draw + away || 1;
  return {
    remHome,
    remAway,
    markets: {
      home: home / tot,
      draw: draw / tot,
      away: away / tot,
      over25: over,
      under25: 1 - over,
      bttsYes,
      bttsNo: 1 - bttsYes,
      mostLikely,
    },
  };
}
