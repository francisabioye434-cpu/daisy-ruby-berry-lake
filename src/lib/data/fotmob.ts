import {
  emptyFacts,
  emptySide,
  h2hHomeEdge,
  mergeRecent,
  posGroup,
  scheduleForm,
  type CompKind,
  type H2HMeeting,
  type MatchFacts,
  type OutPlayer,
  type PosGroup,
  type RecentGame,
  type SideFacts,
  type XIPlayer,
} from "./facts";
import type { Fixture } from "./fixtures";

const FM_MATCHES = "https://www.fotmob.com/api/data/matches";
const FM_DETAIL = "https://www.fotmob.com/api/data/matchDetails";
const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Referer: "https://www.fotmob.com/",
};

const ALIAS: Record<string, string> = {
  "man united": "manchester united",
  "man utd": "manchester united",
  "manchester utd": "manchester united",
  "man city": "manchester city",
  "nottm forest": "nottingham forest",
  "nottingham forest": "nottingham forest",
  "wolves": "wolverhampton",
  "spurs": "tottenham",
  "psg": "paris saint germain",
  "paris sg": "paris saint germain",
  "inter": "internazionale",
  "atletico": "atletico madrid",
  "athletic": "athletic club",
  "west brom": "west bromwich",
  "newcastle": "newcastle united",
  "leeds": "leeds united",
};

function canon(raw: string): string {
  let s = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(fc|cf|sc|afc|cafc|ac|as|ud|cd|rcd|sk|fk|bk|if|ff|calcio|club|de|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ALIAS[s] || s;
}

function tokens(s: string): Set<string> {
  return new Set(canon(s).split(" ").filter((w) => w.length > 2));
}

export function nameScore(a: string, b: string): number {
  const na = canon(a);
  const nb = canon(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / new Set([...ta, ...tb]).size;
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, () => worker()));
  return out;
}

interface FmIndexRow {
  id: number;
  date: string;
  home: string;
  away: string;
  utc: string;
}

function ymd(iso: string): string {
  return iso.slice(0, 10);
}

function parseMatches(payload: unknown): FmIndexRow[] {
  if (!payload || typeof payload !== "object") return [];
  const leagues = (payload as { leagues?: unknown[] }).leagues;
  if (!Array.isArray(leagues)) return [];
  const out: FmIndexRow[] = [];
  for (const lg of leagues) {
    if (!lg || typeof lg !== "object") continue;
    const matches = (lg as { matches?: unknown[] }).matches;
    if (!Array.isArray(matches)) continue;
    for (const m of matches) {
      if (!m || typeof m !== "object") continue;
      const rec = m as {
        id?: number;
        home?: { name?: string; longName?: string };
        away?: { name?: string; longName?: string };
        status?: { utcTime?: string; finished?: boolean; started?: boolean };
      };
      const utc = rec.status?.utcTime || "";
      if (!utc || rec.status?.finished) continue;
      const id = Number(rec.id);
      if (!Number.isFinite(id)) continue;
      out.push({
        id,
        date: ymd(utc),
        home: rec.home?.longName || rec.home?.name || "",
        away: rec.away?.longName || rec.away?.name || "",
        utc,
      });
    }
  }
  return out;
}

function asNum(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parsePlayers(list: unknown, kind: "xi" | "out"): XIPlayer[] | OutPlayer[] {
  if (!Array.isArray(list)) return [];
  const xi: XIPlayer[] = [];
  const outs: OutPlayer[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as {
      name?: string;
      shirtNumber?: string | number;
      usualPlayingPositionId?: number | null;
      positionId?: number | null;
      marketValue?: number;
      unavailability?: { type?: string; expectedReturn?: string };
    };
    const name = p.name || "";
    if (!name) continue;
    const pos: PosGroup = posGroup(p.usualPlayingPositionId, p.positionId);
    if (kind === "xi") {
      xi.push({ name, shirt: p.shirtNumber != null ? String(p.shirtNumber) : undefined, pos });
    } else {
      const t = (p.unavailability?.type || "injury").toLowerCase();
      outs.push({
        name,
        pos,
        kind: t.includes("suspen") ? "suspension" : t.includes("injury") ? "injury" : "other",
        eta: p.unavailability?.expectedReturn,
        marketValue: asNum(p.marketValue),
      });
    }
  }
  return kind === "xi" ? xi : outs;
}

function formFromTeam(events: unknown): {
  form: string;
  restDays?: number;
  goalsLast5?: number;
  recent: RecentGame[];
} {
  if (!Array.isArray(events)) return { form: "", recent: [] };
  const letters: string[] = [];
  let lastIso = "";
  let goals = 0;
  const recent: RecentGame[] = [];
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const e = ev as {
      resultString?: string;
      date?: { utcTime?: string };
      competitionName?: string;
      leagueName?: string;
      score?: string;
      tooltipText?: {
        homeScore?: string;
        awayScore?: string;
        homeTeam?: string;
        awayTeam?: string;
        homeTeamId?: number;
        awayTeamId?: number;
      };
      home?: { id?: string; name?: string; isOurTeam?: boolean };
      away?: { id?: string; name?: string; isOurTeam?: boolean };
    };
    const ch = (e.resultString || "").toUpperCase();
    if (ch !== "W" && ch !== "D" && ch !== "L") continue;
    letters.push(ch);
    const iso = e.date?.utcTime || "";
    if (iso > lastIso) lastIso = iso;
    const hs = Number(e.tooltipText?.homeScore);
    const as = Number(e.tooltipText?.awayScore);
    const oursHome = Boolean(e.home?.isOurTeam);
    const gf = Number.isFinite(hs) && Number.isFinite(as) ? (oursHome ? hs : as) : 0;
    const ga = Number.isFinite(hs) && Number.isFinite(as) ? (oursHome ? as : hs) : 0;
    if (Number.isFinite(hs) && Number.isFinite(as)) goals += gf;
    const oppName = oursHome
      ? e.away?.name || e.tooltipText?.awayTeam || "Opp"
      : e.home?.name || e.tooltipText?.homeTeam || "Opp";
    const compName = `${e.competitionName || ""} ${e.leagueName || ""}`.toLowerCase();
    const friendly = compName.includes("friendly");
    const cup = /cup|champions|europa|conference|fa cup|league cup|coppa|dfb|copa/.test(compName);
    const comp: CompKind = friendly ? "friendly" : cup ? "cup" : "league";
    recent.push({
      date: iso,
      opp: oppName,
      venue: oursHome ? "H" : "A",
      gf,
      ga,
      result: ch,
      weight: friendly ? 0.35 : cup ? 0.8 : 1,
      comp,
    });
  }
  let restDays: number | undefined;
  if (lastIso) {
    restDays = (Date.now() - Date.parse(lastIso)) / 86_400_000;
    if (!Number.isFinite(restDays) || restDays < 0) restDays = undefined;
  }
  return { form: letters.join(""), restDays, goalsLast5: letters.length ? goals : undefined, recent };
}

function parseH2h(raw: unknown, homeName: string): H2HMeeting[] {
  if (!raw || typeof raw !== "object") return [];
  const matches = (raw as { matches?: unknown[] }).matches;
  if (!Array.isArray(matches)) return [];
  const homeCanon = homeName.toLowerCase();
  const out: H2HMeeting[] = [];
  for (const m of matches) {
    if (!m || typeof m !== "object") continue;
    const rec = m as {
      finished?: boolean;
      time?: { utcTime?: string };
      status?: {
        utcTime?: string;
        finished?: boolean;
        scoreStr?: string;
        reason?: { short?: string };
      };
      home?: { name?: string; score?: number | string };
      away?: { name?: string; score?: number | string };
    };
    const iso = rec.status?.utcTime || rec.time?.utcTime || "";
    if (!iso || Date.parse(iso) > Date.now()) continue;
    let hs = Number(rec.home?.score);
    let as = Number(rec.away?.score);
    const str = rec.status?.scoreStr || "";
    if ((!Number.isFinite(hs) || !Number.isFinite(as)) && str.includes("-")) {
      const [a, b] = str.split("-").map((x) => Number(x.trim()));
      if (Number.isFinite(a) && Number.isFinite(b)) {
        hs = a;
        as = b;
      }
    }
    if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
    if (rec.finished === false && rec.status?.finished === false) continue;
    const listedHome = (rec.home?.name || "").toLowerCase();
    const currentWasHome = listedHome.includes(homeCanon.slice(0, 8)) || homeCanon.includes(listedHome.slice(0, 8));
    const gf = currentWasHome ? hs : as;
    const ga = currentWasHome ? as : hs;
    out.push({
      date: iso,
      venue: currentWasHome ? "H" : "A",
      gf,
      ga,
      result: gf > ga ? "W" : gf < ga ? "L" : "D",
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
}

function parseSide(team: unknown, formEvents: unknown, insight?: string): SideFacts {
  const t = (team && typeof team === "object" ? team : {}) as {
    formation?: string;
    coach?: { name?: string };
    starters?: unknown;
    unavailable?: unknown;
    averageStarterAge?: number;
    totalStarterMarketValue?: number;
  };
  const starters = parsePlayers(t.starters, "xi") as XIPlayer[];
  const unavailable = parsePlayers(t.unavailable, "out") as OutPlayer[];
  const { form, restDays, goalsLast5, recent } = formFromTeam(formEvents);
  const sched = scheduleForm(recent);
  return {
    form: sched.form || form,
    restDays,
    formation: t.formation,
    coach: t.coach?.name,
    starters,
    unavailable,
    missingValue: unavailable.reduce((s, p) => s + (p.marketValue || 0), 0),
    starterValue: asNum(t.totalStarterMarketValue),
    goalsLast5,
    insight,
    recent,
    formAdj: sched.formAdj,
    sos: sched.sos,
    sosLabel: sched.label,
  };
}

function parseDetail(payload: unknown): MatchFacts | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as {
    content?: {
      lineup?: {
        lineupType?: string;
        homeTeam?: unknown;
        awayTeam?: unknown;
      };
      weather?: {
        temperature?: number;
        windSpeed?: number;
        precipChance?: number;
        description?: string;
      };
      h2h?: { summary?: number[]; matches?: unknown[] };
      matchFacts?: {
        infoBox?: {
          Stadium?: { city?: string; surface?: string };
          Referee?: { text?: string; stats?: { type?: string; value?: number }[] };
        };
        teamForm?: unknown[];
        insights?: { type?: string; teamId?: number; text?: string; priority?: number }[];
        preReview?: { title?: string; lang?: string }[];
      };
    };
    general?: { homeTeam?: { id?: number }; awayTeam?: { id?: number } };
  };
  const content = root.content;
  if (!content) return null;
  const lu = content.lineup || {};
  const mf = content.matchFacts || {};
  const forms = Array.isArray(mf.teamForm) ? mf.teamForm : [];
  const insights = Array.isArray(mf.insights) ? mf.insights : [];
  const homeId = root.general?.homeTeam?.id;
  const awayId = root.general?.awayTeam?.id;
  const homeInsight = insights.find((i) => i.type === "team" && i.teamId === homeId)?.text;
  const awayInsight = insights.find((i) => i.type === "team" && i.teamId === awayId)?.text;
  const home = parseSide(lu.homeTeam, forms[0], homeInsight);
  const away = parseSide(lu.awayTeam, forms[1], awayInsight);
  const kindRaw = (lu.lineupType || "").toLowerCase();
  const lineupKind = kindRaw.includes("confirm")
    ? "confirmed"
    : home.starters.length >= 11
      ? "predicted"
      : "none";
  const w = content.weather;
  const ref = mf.infoBox?.Referee;
  const yellows = ref?.stats?.find((s) => s.type === "yellowCards")?.value;
  const pens = ref?.stats?.find((s) => s.type === "penalties")?.value;
  const h2hSum = content.h2h?.summary;
  const homeName = (lu.homeTeam as { name?: string } | undefined)?.name || "";
  const meetings = parseH2h(content.h2h, homeName);
  const news = (mf.preReview || [])
    .filter((n) => !n.lang || n.lang === "en")
    .map((n) => n.title || "")
    .filter(Boolean)
    .slice(0, 3);

  const facts: MatchFacts = {
    source: "fotmob",
    lineupKind,
    home,
    away,
    news,
    notes: [],
    venueCity: mf.infoBox?.Stadium?.city,
    surface: mf.infoBox?.Stadium?.surface,
  };
  if ((Array.isArray(h2hSum) && h2hSum.length >= 3) || meetings.length) {
    facts.h2h = {
      homeWins: Array.isArray(h2hSum) ? Number(h2hSum[0]) || 0 : meetings.filter((m) => m.result === "W").length,
      draws: Array.isArray(h2hSum) ? Number(h2hSum[1]) || 0 : meetings.filter((m) => m.result === "D").length,
      awayWins: Array.isArray(h2hSum) ? Number(h2hSum[2]) || 0 : meetings.filter((m) => m.result === "L").length,
      recent: meetings,
      homeEdge: h2hHomeEdge(meetings),
    };
  }
  if (w && Number.isFinite(Number(w.temperature))) {
    facts.weather = {
      tempC: Number(w.temperature),
      windKph: Number(w.windSpeed) || 0,
      precipChance: Number(w.precipChance) || 0,
      description: w.description || "—",
    };
  }
  if (ref?.text) {
    facts.referee = {
      name: ref.text,
      yellowsPerGame: yellows,
      pens,
    };
  }
  return facts;
}

function pairScore(fxHome: string, fxAway: string, row: FmIndexRow): number {
  return nameScore(fxHome, row.home) * nameScore(fxAway, row.away);
}

export async function enrichWithFotmob(
  fixtures: Fixture[],
  names: Map<string, { name: string; short: string }>,
): Promise<Fixture[]> {
  const dated = fixtures.filter((f) => f.kickoffIso);
  if (dated.length === 0) return fixtures;

  const dateCounts = new Map<string, number>();
  for (const f of dated) {
    const d = ymd(f.kickoffIso!);
    dateCounts.set(d, (dateCounts.get(d) || 0) + 1);
  }
  const dates = [...dateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([d]) => d);

  const packs = await pool(dates, 4, async (d) => {
    const json = await getJson(`${FM_MATCHES}?date=${d.replace(/-/g, "")}`);
    return parseMatches(json);
  });
  const index = packs.flat();
  if (index.length === 0) return fixtures;

  const byDate = new Map<string, FmIndexRow[]>();
  for (const row of index) {
    const list = byDate.get(row.date) || [];
    list.push(row);
    byDate.set(row.date, list);
  }

  const now = Date.now();
  const ranked = [...dated]
    .map((f) => {
      const t = f.kickoffIso ? Date.parse(f.kickoffIso) : NaN;
      const delta = Number.isFinite(t) ? t - now : Infinity;
      const soon =
        delta < 0 && delta > -40 * 3_600_000
          ? 1
          : delta >= 0 && delta < 2 * 3_600_000
            ? 0
            : delta >= 0 && delta < 6 * 3_600_000
              ? 1
              : 2;
      const livePri = f.status === "live" ? -1 : soon;
      return {
        f,
        soon: livePri,
        market: f.bookSource === "market" ? 0 : 1,
        kick: f.kickoffIso || "",
      };
    })
    .sort((a, b) => a.soon - b.soon || a.market - b.market || a.kick.localeCompare(b.kick))
    .slice(0, 64);

  const assigned = new Set<number>();
  const jobs: { fixture: Fixture; fmId: number }[] = [];
  for (const { f } of ranked) {
    const home = names.get(f.homeId)?.name || "";
    const away = names.get(f.awayId)?.name || "";
    const day = ymd(f.kickoffIso!);
    const candidates = byDate.get(day) || [];
    let best: FmIndexRow | undefined;
    let bestScore = 0.42;
    for (const row of candidates) {
      if (assigned.has(row.id)) continue;
      const s = pairScore(home, away, row);
      if (s > bestScore) {
        best = row;
        bestScore = s;
      }
    }
    if (!best) continue;
    assigned.add(best.id);
    jobs.push({ fixture: f, fmId: best.id });
  }

  const details = await pool(jobs, 6, async (job) => {
    const json = await getJson(`${FM_DETAIL}?matchId=${job.fmId}`);
    return { id: job.fixture.id, facts: parseDetail(json) };
  });

  const byId = new Map(details.filter((d) => d.facts).map((d) => [d.id, d.facts!]));
  if (byId.size === 0) return fixtures;

  return fixtures.map((f) => {
    const extra = byId.get(f.id);
    if (!extra) return f;
    const base = f.facts;
    if (!base || base.source === "none") return { ...f, facts: extra };
    const homeRecent = mergeRecent(base.home.recent, extra.home.recent);
    const awayRecent = mergeRecent(base.away.recent, extra.away.recent);
    const homeSched = scheduleForm(homeRecent);
    const awaySched = scheduleForm(awayRecent);
    const meetings = extra.h2h?.recent?.length ? extra.h2h.recent : base.h2h?.recent;
    return {
      ...f,
      facts: {
        ...extra,
        source: "mixed",
        home: {
          ...extra.home,
          form: homeSched.form || base.home.form || extra.home.form,
          record: extra.home.record || base.home.record,
          restDays: extra.home.restDays ?? base.home.restDays,
          recent: homeRecent,
          formAdj: homeSched.formAdj,
          sos: homeSched.sos,
          sosLabel: homeSched.label,
          shots: extra.home.shots ?? base.home.shots,
          sog: extra.home.sog ?? base.home.sog,
          possession: extra.home.possession ?? base.home.possession,
          corners: extra.home.corners ?? base.home.corners,
        },
        away: {
          ...extra.away,
          form: awaySched.form || base.away.form || extra.away.form,
          record: extra.away.record || base.away.record,
          restDays: extra.away.restDays ?? base.away.restDays,
          recent: awayRecent,
          formAdj: awaySched.formAdj,
          sos: awaySched.sos,
          sosLabel: awaySched.label,
          shots: extra.away.shots ?? base.away.shots,
          sog: extra.away.sog ?? base.away.sog,
          possession: extra.away.possession ?? base.away.possession,
          corners: extra.away.corners ?? base.away.corners,
        },
        h2h: {
          homeWins: extra.h2h?.homeWins ?? base.h2h?.homeWins ?? 0,
          draws: extra.h2h?.draws ?? base.h2h?.draws ?? 0,
          awayWins: extra.h2h?.awayWins ?? base.h2h?.awayWins ?? 0,
          recent: meetings,
          homeEdge: h2hHomeEdge(meetings),
        },
        venueCity: extra.venueCity || base.venueCity,
        news: extra.news.length ? extra.news : base.news,
      },
    };
  });
}

export interface LiveHarvest {
  fotmobId: number;
  leagueName: string;
  leagueKey: string;
  homeName: string;
  awayName: string;
  utc: string;
  score: { home: number; away: number };
  clock: string;
  elapsedMin: number;
  phase: "ht" | "h1" | "h2";
}

function fmYmd(offset = 0): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function liveClockFromStatus(st: {
  liveTime?: { short?: string; long?: string; longKey?: string };
}): Pick<LiveHarvest, "clock" | "elapsedMin" | "phase"> {
  const short = st.liveTime?.short || "";
  const long = st.liveTime?.long || "";
  if (/HT|Half/i.test(short) || st.liveTime?.longKey === "pause_match") {
    return { clock: "HT", elapsedMin: 45, phase: "ht" };
  }
  const n = Number((long.match(/(\d+)/) || short.match(/(\d+)/) || [])[1]);
  const elapsed = Number.isFinite(n) ? n : 0;
  return {
    clock: (short.replace(/[^\d'HT+]/g, "") || `${elapsed}'`).slice(0, 8),
    elapsedMin: elapsed,
    phase: elapsed > 45 ? "h2" : "h1",
  };
}

function liveScore(m: {
  home?: { score?: unknown };
  away?: { score?: unknown };
  status?: { scoreStr?: string };
}): { home: number; away: number } {
  const h = Number(m.home?.score);
  const a = Number(m.away?.score);
  if (Number.isFinite(h) && Number.isFinite(a)) return { home: h, away: a };
  const g = String(m.status?.scoreStr || "").match(/(\d+)\s*[-–]\s*(\d+)/);
  if (g) return { home: Number(g[1]), away: Number(g[2]) };
  return { home: 0, away: 0 };
}

/** Every in-play match FotMob is showing — not just our league list. */
export async function harvestFotmobLive(): Promise<LiveHarvest[]> {
  const dates = [fmYmd(-1), fmYmd(0), fmYmd(1)];
  const packs = await pool(dates, 3, async (d) => getJson(`${FM_MATCHES}?date=${d}`));
  const out: LiveHarvest[] = [];
  const seen = new Set<number>();
  for (const payload of packs) {
    if (!payload || typeof payload !== "object") continue;
    const leagues = (payload as { leagues?: unknown[] }).leagues;
    if (!Array.isArray(leagues)) continue;
    for (const lg of leagues) {
      if (!lg || typeof lg !== "object") continue;
      const rec = lg as { name?: string; id?: number; matches?: unknown[] };
      for (const raw of rec.matches || []) {
        if (!raw || typeof raw !== "object") continue;
        const m = raw as {
          id?: number;
          home?: { name?: string; longName?: string; score?: unknown };
          away?: { name?: string; longName?: string; score?: unknown };
          status?: {
            utcTime?: string;
            finished?: boolean;
            started?: boolean;
            ongoing?: boolean;
            cancelled?: boolean;
            scoreStr?: string;
            liveTime?: { short?: string; long?: string; longKey?: string };
          };
        };
        const st = m.status;
        if (!st || st.finished || st.cancelled) continue;
        if (!st.ongoing && !st.started) continue;
        const id = Number(m.id);
        if (!Number.isFinite(id) || seen.has(id)) continue;
        seen.add(id);
        const clock = liveClockFromStatus(st);
        out.push({
          fotmobId: id,
          leagueName: rec.name || "Live",
          leagueKey: `live-${rec.id || "world"}`,
          homeName: m.home?.longName || m.home?.name || "Home",
          awayName: m.away?.longName || m.away?.name || "Away",
          utc: st.utcTime || new Date().toISOString(),
          score: liveScore(m),
          ...clock,
        });
      }
    }
  }
  return out;
}

export interface CalHarvest {
  fotmobId: number;
  leagueName: string;
  leagueKey: string;
  homeName: string;
  awayName: string;
  utc: string;
  status: "pre" | "live" | "post";
  score?: { home: number; away: number };
  clock?: string;
  elapsedMin?: number;
  phase?: "ht" | "h1" | "h2";
}

/** Every FotMob match on the given Lagos calendar days — pre, live, and FT. */
export async function harvestFotmobWeek(days: string[]): Promise<CalHarvest[]> {
  const packs = await pool(days, 4, async (d) => {
    const ymd = d.replace(/-/g, "");
    return { d, json: await getJson(`${FM_MATCHES}?date=${ymd}`) };
  });
  const out: CalHarvest[] = [];
  const seen = new Set<number>();
  const perDay = new Map<string, number>();
  for (const pack of packs) {
    if (!pack?.json || typeof pack.json !== "object") continue;
    const leagues = (pack.json as { leagues?: unknown[] }).leagues;
    if (!Array.isArray(leagues)) continue;
    for (const lg of leagues) {
      if (!lg || typeof lg !== "object") continue;
      const rec = lg as { name?: string; id?: number; matches?: unknown[] };
      for (const raw of rec.matches || []) {
        if (!raw || typeof raw !== "object") continue;
        const m = raw as {
          id?: number;
          home?: { name?: string; longName?: string; score?: unknown };
          away?: { name?: string; longName?: string; score?: unknown };
          status?: {
            utcTime?: string;
            finished?: boolean;
            started?: boolean;
            ongoing?: boolean;
            cancelled?: boolean;
            scoreStr?: string;
            liveTime?: { short?: string; long?: string; longKey?: string };
          };
        };
        const st = m.status;
        if (!st || st.cancelled) continue;
        const id = Number(m.id);
        if (!Number.isFinite(id) || seen.has(id)) continue;
        const utc = st.utcTime || "";
        const day = utc.slice(0, 10) || pack.d;
        const n = perDay.get(day) || 0;
        if (n >= 90) continue;
        perDay.set(day, n + 1);
        seen.add(id);
        const live = Boolean(st.ongoing || (st.started && !st.finished));
        const status: CalHarvest["status"] = st.finished ? "post" : live ? "live" : "pre";
        const clock = live ? liveClockFromStatus(st) : undefined;
        const score = st.finished || live ? liveScore(m) : undefined;
        out.push({
          fotmobId: id,
          leagueName: rec.name || "Football",
          leagueKey: `fm-${rec.id || "world"}`,
          homeName: m.home?.longName || m.home?.name || "Home",
          awayName: m.away?.longName || m.away?.name || "Away",
          utc: utc || new Date().toISOString(),
          status,
          score,
          clock: clock?.clock,
          elapsedMin: clock?.elapsedMin,
          phase: clock?.phase,
        });
      }
    }
  }
  return out;
}

export { emptyFacts, emptySide };
