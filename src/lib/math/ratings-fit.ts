export interface MatchResult {
  homeId: string;
  awayId: string;
  hg: number;
  ag: number;
  date?: string;
  leagueId?: string;
  hs?: number;
  as?: number;
  hsog?: number;
  asog?: number;
}

export interface Strength {
  attack: number;
  defense: number;
}

const AVG_ATTACK = 1.25;

/**
 * Iterative Dixon–Coles / Maher attack–defence fit from completed scores.
 * `prior` is the league table (shrunk GF/GA). A small prior weight keeps
 * early-season 3-game samples from exploding.
 */
export function fitRatings(
  results: MatchResult[],
  prior: Map<string, Strength>,
  homeAdv = 1.32,
): Map<string, Strength> {
  const ids = new Set<string>();
  for (const r of results) {
    ids.add(r.homeId);
    ids.add(r.awayId);
  }
  for (const id of prior.keys()) ids.add(id);

  const attack = new Map<string, number>();
  const defense = new Map<string, number>();
  for (const id of ids) {
    const p = prior.get(id);
    attack.set(id, p?.attack ?? AVG_ATTACK);
    defense.set(id, p?.defense ?? 1);
  }
  if (results.length < 4) return new Map([...ids].map((id) => [id, { attack: attack.get(id)!, defense: defense.get(id)! }]));

  const priorW = 6;
  for (let iter = 0; iter < 10; iter++) {
    const attN = new Map<string, number>();
    const attD = new Map<string, number>();
    const defN = new Map<string, number>();
    const defD = new Map<string, number>();
    for (const id of ids) {
      const pa = prior.get(id)?.attack ?? AVG_ATTACK;
      const pd = prior.get(id)?.defense ?? 1;
      attN.set(id, pa * priorW);
      attD.set(id, priorW);
      defN.set(id, pd * priorW);
      defD.set(id, priorW);
    }
    for (const m of results) {
      const defA = defense.get(m.awayId) ?? 1;
      const defH = defense.get(m.homeId) ?? 1;
      const attH = attack.get(m.homeId) ?? AVG_ATTACK;
      const attA = attack.get(m.awayId) ?? AVG_ATTACK;
      attN.set(m.homeId, (attN.get(m.homeId) ?? 0) + m.hg);
      attD.set(m.homeId, (attD.get(m.homeId) ?? 0) + defA * homeAdv);
      attN.set(m.awayId, (attN.get(m.awayId) ?? 0) + m.ag);
      attD.set(m.awayId, (attD.get(m.awayId) ?? 0) + defH);
      defN.set(m.awayId, (defN.get(m.awayId) ?? 0) + m.hg);
      defD.set(m.awayId, (defD.get(m.awayId) ?? 0) + attH * homeAdv);
      defN.set(m.homeId, (defN.get(m.homeId) ?? 0) + m.ag);
      defD.set(m.homeId, (defD.get(m.homeId) ?? 0) + attA);
    }
    let attSum = 0;
    let defSum = 0;
    for (const id of ids) {
      const a = (attN.get(id) ?? AVG_ATTACK) / Math.max(0.2, attD.get(id) ?? 1);
      const d = (defN.get(id) ?? 1) / Math.max(0.2, defD.get(id) ?? 1);
      attack.set(id, a);
      defense.set(id, d);
      attSum += a;
      defSum += d;
    }
    const n = ids.size || 1;
    const attMean = attSum / n;
    const defMean = defSum / n;
    for (const id of ids) {
      attack.set(id, ((attack.get(id) ?? AVG_ATTACK) / attMean) * AVG_ATTACK);
      defense.set(id, (defense.get(id) ?? 1) / defMean);
    }
  }

  const out = new Map<string, Strength>();
  for (const id of ids) {
    out.set(id, {
      attack: Math.min(2.6, Math.max(0.6, attack.get(id) ?? AVG_ATTACK)),
      defense: Math.min(1.65, Math.max(0.58, defense.get(id) ?? 1)),
    });
  }
  return out;
}
