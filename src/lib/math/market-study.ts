import { devig } from "./devig";

export type Triple = { home: number; draw: number; away: number };

export interface StudyRow {
  date: string;
  leagueId: string;
  actual: "home" | "draw" | "away";
  model: Triple;
  market: Triple;
}

export interface MarketStudy {
  n: number;
  blendW: number;
  brierModel: number;
  brierMarket: number;
  brierBlend: number;
  sharper: "model" | "market" | "even";
  note: string;
}

function brier(p: Triple, actual: StudyRow["actual"]): number {
  const y = {
    home: actual === "home" ? 1 : 0,
    draw: actual === "draw" ? 1 : 0,
    away: actual === "away" ? 1 : 0,
  };
  return (p.home - y.home) ** 2 + (p.draw - y.draw) ** 2 + (p.away - y.away) ** 2;
}

function meanBrier(rows: StudyRow[], pick: (r: StudyRow) => Triple): number {
  if (rows.length === 0) return 1;
  return rows.reduce((s, r) => s + brier(pick(r), r.actual), 0) / rows.length;
}

export function blendTriple(model: Triple, market: Triple, w: number): Triple {
  const t = Math.max(0, Math.min(0.6, w));
  const home = model.home * (1 - t) + market.home * t;
  const draw = model.draw * (1 - t) + market.draw * t;
  const away = model.away * (1 - t) + market.away * t;
  const s = home + draw + away;
  return s > 0 ? { home: home / s, draw: draw / s, away: away / s } : model;
}

export function marketFromOdds(odds: Triple): Triple | null {
  if (odds.home < 1.01 || odds.draw < 1.01 || odds.away < 1.01) return null;
  const fair = devig([odds.home, odds.draw, odds.away]).fair;
  if (fair.length < 3) return null;
  return { home: fair[0]!, draw: fair[1]!, away: fair[2]! };
}

/**
 * Learn how much to trust the closing book vs Dixon–Coles.
 * Dixon–Coles always keeps ≥ 40% of the blend — the market studies the model,
 * it does not replace it.
 */
export function summariseStudy(rows: StudyRow[]): MarketStudy {
  const usable = rows.filter(
    (r) =>
      r.model.home > 0 &&
      r.market.home > 0 &&
      (r.actual === "home" || r.actual === "draw" || r.actual === "away"),
  );
  const seen = new Set<string>();
  const unique = usable.filter((r) => {
    const k = `${r.date}|${r.leagueId}|${r.market.home.toFixed(3)}|${r.actual}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const n = unique.length;
  if (n < 12) {
    return {
      n,
      blendW: 0.22,
      brierModel: n ? meanBrier(unique, (r) => r.model) : 0,
      brierMarket: n ? meanBrier(unique, (r) => r.market) : 0,
      brierBlend: 0,
      sharper: "even",
      note: n ? `Thin sample (${n}). Mild market shrink until 12 settled games.` : "No settled books yet. Model only.",
    };
  }

  const brierModel = meanBrier(unique, (r) => r.model);
  const brierMarket = meanBrier(unique, (r) => r.market);

  let bestW = 0.22;
  let bestB = Infinity;
  for (let w = 0; w <= 0.6 + 1e-9; w += 0.05) {
    const b = meanBrier(unique, (r) => blendTriple(r.model, r.market, w));
    if (b < bestB) {
      bestB = b;
      bestW = w;
    }
  }

  const sharper =
    brierMarket + 0.008 < brierModel ? "market" : brierModel + 0.008 < brierMarket ? "model" : "even";

  const note =
    sharper === "market"
      ? `Book is sharper on ${n} settled games. Blend ${Math.round(bestW * 100)}% toward close.`
      : sharper === "model"
        ? `Model adds on ${n} games. Keep ${Math.round((1 - bestW) * 100)}% Dixon–Coles.`
        : `Model and book agree on ${n} games. Small ${Math.round(bestW * 100)}% shrink.`;

  return {
    n,
    blendW: Math.round(bestW * 100) / 100,
    brierModel,
    brierMarket,
    brierBlend: bestB,
    sharper,
    note,
  };
}

export function blendThreeWay(model: Triple, market: Triple, w: number): Triple {
  return blendTriple(model, market, w);
}

export function blendBinary(modelP: number, marketP: number, w: number): number {
  const t = Math.max(0, Math.min(0.6, w));
  return modelP * (1 - t) + marketP * t;
}

export function emptyStudy(): MarketStudy {
  return {
    n: 0,
    blendW: 0.22,
    brierModel: 0,
    brierMarket: 0,
    brierBlend: 0,
    sharper: "even",
    note: "No settled books yet. Model only.",
  };
}
