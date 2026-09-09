export type PosGroup = "gk" | "def" | "mid" | "fwd" | "unk";
export type LineupKind = "confirmed" | "predicted" | "none";
export type FactsSource = "fotmob" | "espn" | "mixed" | "none";
export type CompKind = "league" | "cup" | "friendly";

export interface OutPlayer {
  name: string;
  pos: PosGroup;
  kind: "injury" | "suspension" | "other";
  eta?: string;
  marketValue?: number;
}

export interface XIPlayer {
  name: string;
  shirt?: string;
  pos: PosGroup;
}

export interface RecentGame {
  date: string;
  opp: string;
  oppId?: string;
  venue: "H" | "A";
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
  shots?: number;
  sog?: number;
  /** Opponent strength vs league mean. 1 = average, >1 tougher. */
  oppStrength?: number;
  /** League 1, cup ~0.8, friendly ~0.35. */
  weight?: number;
  comp?: CompKind;
}

export interface H2HMeeting {
  date: string;
  venue: "H" | "A";
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
}

export interface SideFacts {
  form: string;
  record?: string;
  restDays?: number;
  formation?: string;
  coach?: string;
  starters: XIPlayer[];
  unavailable: OutPlayer[];
  missingValue?: number;
  starterValue?: number;
  goalsLast5?: number;
  insight?: string;
  recent?: RecentGame[];
  /** Opponent-adjusted form, 0–1. 0.5 is average. */
  formAdj?: number;
  /** Mean opponent strength of those games. 1 = average. */
  sos?: number;
  sosLabel?: string;
  shots?: number;
  sog?: number;
  possession?: number;
  corners?: number;
}

export interface MatchFacts {
  source: FactsSource;
  lineupKind: LineupKind;
  home: SideFacts;
  away: SideFacts;
  h2h?: {
    homeWins: number;
    draws: number;
    awayWins: number;
    recent?: H2HMeeting[];
    /** Recency + venue weighted edge for the current home side, −1..1. */
    homeEdge?: number;
  };
  weather?: {
    tempC: number;
    windKph: number;
    precipChance: number;
    description: string;
  };
  referee?: { name: string; yellowsPerGame?: number; pens?: number };
  venueCity?: string;
  surface?: string;
  news: string[];
  notes: string[];
}

export function emptySide(form = ""): SideFacts {
  return { form, starters: [], unavailable: [] };
}

export function emptyFacts(): MatchFacts {
  return {
    source: "none",
    lineupKind: "none",
    home: emptySide(),
    away: emptySide(),
    news: [],
    notes: [],
  };
}

export function posGroup(usual?: number | null, positionId?: number | null): PosGroup {
  if (usual === 0 || positionId === 11) return "gk";
  if (usual === 1) return "def";
  if (usual === 2) return "mid";
  if (usual === 3) return "fwd";
  const pid = positionId ?? -1;
  if (pid >= 30 && pid < 50) return "def";
  if (pid >= 50 && pid < 100) return "mid";
  if (pid >= 100 && pid < 200) return "fwd";
  return "unk";
}

export function newestForm(form: string): string {
  return form.replace(/[^WDL]/gi, "").toUpperCase().slice(-5);
}

export function formScore(form: string): number | null {
  const letters = form.replace(/[^WDL]/gi, "").toUpperCase();
  if (!letters) return null;
  let pts = 0;
  for (const ch of letters) {
    if (ch === "W") pts += 1;
    else if (ch === "D") pts += 0.5;
  }
  return pts / letters.length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Quality of one result vs this opponent. 0.5 ≈ expected vs average. */
export function gameQuality(result: RecentGame["result"], oppStr: number): number {
  const s = clamp(oppStr, 0.65, 1.55);
  if (result === "W") return clamp(0.52 + 0.38 * s, 0.55, 1);
  if (result === "D") return clamp(0.5 + 0.22 * (s - 1), 0.28, 0.72);
  return clamp(0.18 + 0.22 * (s - 1), 0.02, 0.42);
}

export function scheduleForm(games: RecentGame[] | undefined): {
  formAdj: number;
  sos: number;
  label: string;
  form: string;
} {
  if (!games || games.length === 0) {
    return { formAdj: 0.5, sos: 1, label: "no sample", form: "" };
  }
  let num = 0;
  let den = 0;
  let sosNum = 0;
  const letters: string[] = [];
  for (const g of [...games].reverse()) {
    const w = g.weight ?? (g.comp === "friendly" ? 0.35 : g.comp === "cup" ? 0.8 : 1);
    const s = g.oppStrength ?? 1;
    num += gameQuality(g.result, s) * w;
    den += w;
    sosNum += s * w;
    letters.push(g.result);
  }
  const formAdj = den > 0 ? num / den : 0.5;
  const sos = den > 0 ? sosNum / den : 1;
  const label = sos >= 1.12 ? "hard fixtures" : sos <= 0.88 ? "soft fixtures" : "mixed fixtures";
  return { formAdj, sos, label, form: letters.join("") };
}

const H2H_W = [1, 0.75, 0.55, 0.4, 0.28, 0.2];

/** Positive = current home side has been better in recent meetings. */
export function h2hHomeEdge(meetings: H2HMeeting[] | undefined): number {
  if (!meetings || meetings.length === 0) return 0;
  const recent = [...meetings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  let num = 0;
  let den = 0;
  recent.forEach((m, i) => {
    const w = H2H_W[i] ?? 0.15;
    let v = 0;
    if (m.result === "W") v = m.venue === "A" ? 1 : 0.65;
    else if (m.result === "L") v = m.venue === "H" ? -1 : -0.65;
    num += v * w;
    den += w;
  });
  return den > 0 ? clamp(num / den, -1, 1) : 0;
}

export function mergeRecent(primary: RecentGame[] | undefined, extra: RecentGame[] | undefined): RecentGame[] {
  const map = new Map<string, RecentGame>();
  for (const g of extra || []) {
    const k = (g.date || "").slice(0, 10);
    if (k) map.set(k, g);
  }
  for (const g of primary || []) {
    const k = (g.date || "").slice(0, 10);
    if (k) map.set(k, g);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
}
