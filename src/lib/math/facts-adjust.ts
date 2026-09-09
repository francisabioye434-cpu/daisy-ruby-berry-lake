import { clamp } from "@/lib/utils";
import { formScore, type MatchFacts, type SideFacts } from "@/lib/data/facts";
import type { TeamStrength } from "./dixon-coles";

export interface FactsAdjustment {
  home: TeamStrength;
  away: TeamStrength;
  homeAdv: number;
  homeRisk: number;
  awayRisk: number;
  totalsRisk: number;
  notes: string[];
}

function tweakSide(base: TeamStrength, side: SideFacts, label: string): {
  attack: number;
  defense: number;
  risk: number;
  notes: string[];
} {
  let attack = base.attack;
  let defense = base.defense;
  let risk = 0;
  const notes: string[] = [];

  const form = side.formAdj ?? formScore(side.form);
  if (form != null) {
    let d = Math.max(-0.25, Math.min(0.25, form - 0.5));
    const sos = side.sos ?? 1;
    if (sos < 0.88 && form > 0.6) {
      d *= 0.5;
      notes.push(`${label} hot form on soft fixtures`);
    } else if (sos > 1.12 && form < 0.42) {
      d *= 0.65;
      notes.push(`${label} cold form against strong sides`);
    } else if (sos > 1.12 && form > 0.6) {
      notes.push(`${label} winning against hard fixtures`);
    }
    attack *= 1 + d * 0.12;
    defense *= 1 - d * 0.06;
  }

  if (side.restDays != null && side.restDays < 3.5) {
    attack *= side.restDays < 2 ? 0.92 : 0.96;
    defense *= side.restDays < 2 ? 1.04 : 1.02;
    risk += side.restDays < 2 ? 0.16 : 0.08;
    notes.push(`${label} on ${Math.max(0, Math.round(side.restDays))}d rest`);
  }

  const starterVal = Math.max(1, side.starterValue ?? 0);
  let missVal = 0;
  let missAtt = 0;
  let missDef = 0;
  const names: string[] = [];
  for (const p of side.unavailable) {
    const mv = p.marketValue && p.marketValue > 0 ? p.marketValue : 0;
    if (mv > 0 && mv < 5_000_000) continue;
    missVal += mv || 8_000_000;
    names.push(p.name);
    const star = mv > 25_000_000;
    if (p.pos === "gk") {
      missDef += star ? 0.08 : 0.05;
      risk += 0.18;
    } else if (p.pos === "def") {
      missDef += star ? 0.045 : 0.03;
      risk += star ? 0.1 : 0.05;
    } else if (p.pos === "fwd") {
      missAtt += star ? 0.055 : 0.035;
      risk += star ? 0.12 : 0.07;
    } else {
      missAtt += star ? 0.035 : 0.02;
      missDef += 0.012;
      risk += star ? 0.08 : 0.04;
    }
    if (p.kind === "suspension") risk += 0.04;
  }
  const frac = missVal / (starterVal + missVal || 1);
  if (names.length) {
    attack *= 1 - Math.min(0.12, missAtt + frac * 0.1);
    defense *= 1 + Math.min(0.1, missDef + frac * 0.08);
    if (names.length >= 3) risk += 0.08;
    if (names.length >= 5) risk += 0.12;
    const shown = names.slice(0, 3).join(", ");
    const extra = names.length > 3 ? ` +${names.length - 3}` : "";
    notes.push(`${label} without ${shown}${extra}`);
  }

  return {
    attack: clamp(attack, 0.45, 2.8),
    defense: clamp(defense, 0.5, 1.85),
    risk: clamp(risk, 0, 1),
    notes,
  };
}

/** Shift attack/defence from lineups, injuries, rest, form, weather. */
export function applyFacts(
  home: TeamStrength,
  away: TeamStrength,
  facts: MatchFacts | undefined,
  homeAdv = 1.32,
): FactsAdjustment {
  if (!facts || facts.source === "none") {
    return { home, away, homeAdv, homeRisk: 0, awayRisk: 0, totalsRisk: 0, notes: [] };
  }

  const h = tweakSide(home, facts.home, "Home");
  const a = tweakSide(away, facts.away, "Away");
  const notes = [...(facts.notes || []), ...h.notes, ...a.notes];
  let totalsRisk = 0;
  let hAtt = h.attack;
  let aAtt = a.attack;
  let hDef = h.defense;
  let aDef = a.defense;

  const w = facts.weather;
  if (w) {
    const wet = w.precipChance >= 45 || /rain|storm|snow/i.test(w.description);
    const windy = w.windKph >= 28;
    if (wet || windy) {
      hAtt *= 0.94;
      aAtt *= 0.94;
      totalsRisk += wet ? 0.22 : 0.12;
      notes.push(wet ? `${w.description} — totals lean under` : `Wind ${w.windKph} kph`);
    }
  }

  let adv = homeAdv;
  if (facts.home.restDays != null && facts.away.restDays != null) {
    const gap = facts.home.restDays - facts.away.restDays;
    if (Math.abs(gap) >= 3) adv *= 1 + Math.sign(gap) * 0.03;
  }

  const edge = facts.h2h?.homeEdge ?? 0;
  if (Math.abs(edge) >= 0.18) {
    const tilt = edge * 0.05;
    hAtt *= 1 + tilt;
    aAtt *= 1 - tilt * 0.6;
    hDef *= 1 - tilt * 0.4;
    aDef *= 1 + tilt * 0.3;
    notes.push(edge > 0 ? "Recent H2H leans home, venue-weighted" : "Recent H2H leans away, venue-weighted");
  }

  const cupHang = (side: { recent?: { date: string; comp?: string }[] }) =>
    (side.recent || []).some((g) => {
      if (g.comp === "league" || g.comp === "friendly") return false;
      const d = Date.parse(g.date);
      return Number.isFinite(d) && Date.now() - d >= 0 && Date.now() - d <= 4.2 * 86_400_000;
    });
  if (cupHang(facts.away)) {
    aAtt *= 0.96;
    aDef *= 1.03;
    notes.push("Away midweek cup hangover");
  }
  if (cupHang(facts.home)) {
    hAtt *= 0.97;
    notes.push("Home midweek cup hangover");
  }
  if (facts.venueCity && /la paz|quito|bogot|mexico city|johannesburg|cusco|calama|potos|oruro|toluca/i.test(facts.venueCity)) {
    adv *= 1.05;
    notes.push(`Altitude venue (${facts.venueCity})`);
  }
  const meets = facts.h2h?.recent?.length ?? 0;
  if (meets >= 4) {
    hAtt *= 0.98;
    aAtt *= 0.98;
    notes.push("Derby familiarity — both attacks a touch muted");
  }

  return {
    home: { attack: hAtt, defense: hDef },
    away: { attack: aAtt, defense: aDef },
    homeAdv: clamp(adv, 1, 1.55),
    homeRisk: h.risk,
    awayRisk: a.risk,
    totalsRisk,
    notes: notes.slice(0, 8),
  };
}

export function ticketSideRisk(
  adj: FactsAdjustment,
  selection: "home" | "draw" | "away" | "over" | "under" | "yes" | "no" | string,
): number {
  if (selection === "home") return adj.homeRisk;
  if (selection === "away") return adj.awayRisk;
  if (selection === "draw") return Math.max(adj.homeRisk, adj.awayRisk) * 0.45;
  if (selection === "over" || selection === "yes") return adj.totalsRisk + (adj.homeRisk + adj.awayRisk) * 0.2;
  if (selection === "under" || selection === "no") return Math.max(0, 0.12 - adj.totalsRisk);
  return 0;
}
