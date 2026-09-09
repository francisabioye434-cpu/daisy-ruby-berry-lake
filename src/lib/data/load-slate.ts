// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { buildProfile, type TableSide } from "@/lib/math/bet-metrics";
import { priceMatch, pOver } from "@/lib/math/dixon-coles";
import { emptyStudy, marketFromOdds, summariseStudy, type MarketStudy, type StudyRow } from "@/lib/math/market-study";
import { decimalFromAmerican } from "@/lib/math/odds";
import { fitRatings, type MatchResult, type Strength } from "@/lib/math/ratings-fit";
import { formatKickoff, hueFromId } from "@/lib/utils";
import { dayKey, shiftDay, todayKey, weekStrip } from "@/lib/day";
import {
  emptyFacts,
  emptySide,
  h2hHomeEdge,
  newestForm,
  scheduleForm,
  type H2HMeeting,
  type RecentGame,
  type SideFacts,
} from "./facts";
import { FIXTURES, type Book1x2, type BookQuote, type BookTotals, type Fixture } from "./fixtures";
import { enrichWithFotmob, harvestFotmobLive, harvestFotmobWeek, nameScore, type CalHarvest, type LiveHarvest } from "./fotmob";
import { LEAGUES, type LeagueDef, type LeagueRegion } from "./leagues";
import { clusterMatchweeks, currentMatchweek, weekForDate, weekLabel, type Matchweek } from "./matchweek";
import { TEAMS, type Team } from "./teams";

export interface SlateLeague {
  id: string;
  name: string;
  abbr: string;
  region: LeagueRegion;
  matchCount: number;
  currentWeek?: number;
  totalWeeks?: number;
  seasonLabel?: string;
  weekStart?: string;
  weekEnd?: string;
}

export interface Slate {
  asOf: number;
  source: "espn" | "fallback";
  window: string;
  leagues: SlateLeague[];
  fixtures: Fixture[];
  teams: Team[];
  study: MarketStudy;
}

const ESPN_SCORE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues";
const ESPN_TABLE = "https://site.api.espn.com/apis/v2/sports/soccer";
const TTL_QUIET_MS = 180_000;
const TTL_LIVE_MS = 45_000;
const CACHE_VER = 29;
const PRIOR_GAMES = 16;
const AVG_ATTACK = 1.25;
let cache: { at: number; ver: number; slate: Slate } | null = null;
function yyyymmdd(d) {
	return d.toISOString().slice(0, 10).replace(/-/g, "");
}
function rangeParam(fromMs, toMs) {
	return `${yyyymmdd(new Date(fromMs))}-${yyyymmdd(new Date(toMs))}`;
}
function deskWindow() {
	const today = todayKey();
	const fromDay = shiftDay(today, -1);
	const toDay = shiftDay(today, 7);
	const from = Date.parse(`${fromDay}T00:00:00+01:00`);
	const to = Date.parse(`${toDay}T23:59:59+01:00`);
	return {
		param: `${fromDay.replace(/-/g, "")}-${toDay.replace(/-/g, "")}`,
		from: Number.isFinite(from) ? from : Date.now() - 36 * 3_600_000,
		to: Number.isFinite(to) ? to : Date.now() + 8 * 86_400_000,
	};
}
function historyWindow() {
	const now = Date.now();
	return rangeParam(now - 40 * 86_400_000, now - 12 * 3_600_000);
}
async function pool(items, limit, fn) {
	const out = new Array(items.length);
	let next = 0;
	async function worker() {
		while (true) {
			const i = next++;
			if (i >= items.length) return;
			out[i] = await fn(items[i]);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, () => worker()));
	return out;
}
async function getJson(url) {
	for (let attempt = 0; attempt < 2; attempt++) try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "Mozilla/5.0 (compatible; FairlineDesk/1.0)"
			},
			signal: AbortSignal.timeout(9_000)
		});
		if (!res.ok) {
			if (attempt === 0) continue;
			return null;
		}
		return await res.json();
	} catch {
		if (attempt === 0) continue;
		return null;
	}
	return null;
}
function statValue(entry, name) {
	const s = entry.stats?.find((x) => x.name === name);
	const n = Number(s?.value);
	return Number.isFinite(n) ? n : 0;
}
function vigPrices(probs, margin = .05, flatten = .12) {
	const u = 1 / (probs.length || 1);
	const mixed = probs.map((p) => Math.max(.001, p * (1 - flatten) + u * flatten));
	const s = mixed.reduce((a, b) => a + b, 0);
	return mixed.map((p) => 1 / (p / s * (1 + margin)));
}
function parseAmericanSide(side) {
	if (!side || typeof side !== "object") return NaN;
	const rec = side;
	return decimalFromAmerican(rec.close?.odds ?? rec.open?.odds);
}
function parseAmericanOpen(side) {
	if (!side || typeof side !== "object") return NaN;
	return decimalFromAmerican(side.open?.odds);
}
function asDec(v) {
	if (typeof v === "number") {
		if (v > 1.01 && v < 80) return v;
		return decimalFromAmerican(v);
	}
	if (typeof v === "string") {
		const n = Number(v);
		if (n > 1.01 && n < 80) return n;
		return decimalFromAmerican(v);
	}
	if (v && typeof v === "object") {
		const o = v;
		if (typeof o.value === "number" && o.value > 1.01) return o.value;
		if (typeof o.decimal === "number" && o.decimal > 1.01) return o.decimal;
		const nested = o.american ?? o.odds ?? o.moneyLine ?? o.close ?? o.current;
		if (nested && nested !== v) return asDec(nested);
	}
	return NaN;
}
function quoteFromOddsObj(o) {
	const provider = o.provider;
	const book = provider?.displayName || provider?.name || "";
	if (!book) return null;
	const ml = o.moneyline;
	const homeOdds = o.homeTeamOdds;
	const awayOdds = o.awayTeamOdds;
	const drawOdds = o.drawOdds;
	const tot = o.total;
	const home = asDec(ml?.home) || asDec(homeOdds?.odds) || asDec((homeOdds?.current)?.moneyLine) || asDec(homeOdds?.moneyLine);
	const away = asDec(ml?.away) || asDec(awayOdds?.odds) || asDec((awayOdds?.current)?.moneyLine) || asDec(awayOdds?.moneyLine);
	const draw = asDec(ml?.draw) || asDec(drawOdds?.odds) || asDec(drawOdds?.value) || asDec((drawOdds?.current)?.moneyLine) || asDec(drawOdds);
	if (!(home > 1.01 && draw > 1.01 && away > 1.01)) return null;
	const over = asDec(tot?.over) || asDec(o.overOdds);
	const under = asDec(tot?.under) || asDec(o.underOdds);
	const line = Number(o.overUnder);
	return {
		book,
		home,
		draw,
		away,
		over: over > 1.01 ? over : undefined,
		under: under > 1.01 ? under : undefined,
		line: Number.isFinite(line) && line > 0 ? line : undefined
	};
}
function extractBooks(comp) {
	const raw = Array.isArray(comp.odds) ? comp.odds.filter(Boolean) : [];
	const out = [];
	const seen = new Set();
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const q = quoteFromOddsObj(item);
		if (!q || seen.has(q.book)) continue;
		seen.add(q.book);
		out.push(q);
	}
	return out;
}
function extractMarket(comp) {
	const books = extractBooks(comp);
	const raw = (Array.isArray(comp.odds) ? comp.odds.filter(Boolean) : [])[0];
	if (!raw || typeof raw !== "object") return books[0] ? {
		...books[0],
		label: books[0].book,
		open: {
			home: NaN,
			draw: NaN,
			away: NaN
		}
	} : null;
	const o = raw;
	const ml = o.moneyline;
	const tot = o.total;
	const home = books[0]?.home ?? parseAmericanSide(ml?.home);
	const away = books[0]?.away ?? parseAmericanSide(ml?.away);
	const draw = books[0]?.draw ?? parseAmericanSide(ml?.draw);
	const over = books[0]?.over ?? parseAmericanSide(tot?.over);
	const under = books[0]?.under ?? parseAmericanSide(tot?.under);
	const line = books[0]?.line ?? Number(o.overUnder);
	const provider = o.provider;
	return {
		home,
		draw,
		away,
		over,
		under,
		line: Number.isFinite(line) && line > 0 ? line : 2.5,
		label: books[0]?.book || provider?.displayName || provider?.name || "Market",
		open: {
			home: parseAmericanOpen(ml?.home),
			draw: parseAmericanOpen(ml?.draw),
			away: parseAmericanOpen(ml?.away)
		},
		books
	};
}
function teamFromEspn(raw, ratings) {
	const id = String(raw.id ?? raw.abbreviation ?? raw.displayName ?? "unk");
	const r = ratings.get(id);
	const short = String(raw.abbreviation || raw.shortDisplayName || raw.name || "??").slice(0, 4).toUpperCase();
	return {
		id,
		name: String(raw.displayName || raw.name || short),
		short,
		attack: r?.attack ?? AVG_ATTACK,
		defense: r?.defense ?? 1,
		hue: hueFromId(id)
	};
}
function sideKind(name) {
	const s = name.toLowerCase();
	if (/\bu1[5-9]\b|\bu2[0-3]\b|youth|junior/.test(s)) return "youth";
	if (/\bwomen|\bwfc\b|\bwsl\b|ladies/.test(s)) return "women";
	return "men";
}
function livePairScore(aHome, aAway, bHome, bAway) {
	if (sideKind(aHome) !== sideKind(bHome) || sideKind(aAway) !== sideKind(bAway)) return 0;
	return nameScore(aHome, bHome) * nameScore(aAway, bAway);
}
function findTeamByName(name, bag) {
	let best;
	let score = .85;
	const kind = sideKind(name);
	for (const t of bag.values()) {
		if (sideKind(t.name) !== kind) continue;
		const s = nameScore(name, t.name);
		if (s > score) {
			best = t;
			score = s;
		}
	}
	return best;
}
function teamFromLive(name, bag, ratings) {
	const existing = findTeamByName(name, bag);
	if (existing) return existing;
	const id = `fm-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "side"}`;
	const hit = bag.get(id);
	if (hit) return hit;
	const r = ratings.get(id);
	const t = {
		id,
		name,
		short: name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "???",
		attack: r?.attack ?? AVG_ATTACK,
		defense: r?.defense ?? 1,
		hue: hueFromId(id)
	};
	bag.set(id, t);
	return t;
}
function mergeLiveHarvest(fixtures, harvest, ratings, teamBag, leagueMeta) {
	for (const row of harvest) {
		let matched;
		let best = .85;
		for (const f of fixtures) {
			const home = teamBag.get(f.homeId)?.name || "";
			const away = teamBag.get(f.awayId)?.name || "";
			const s = livePairScore(row.homeName, row.awayName, home, away);
			if (s > best) {
				matched = f;
				best = s;
			}
		}
		if (matched) {
			matched.status = "live";
			matched.score = row.score;
			matched.clock = row.clock;
			matched.elapsedMin = row.elapsedMin;
			matched.phase = row.phase;
			continue;
		}
		const home = teamFromLive(row.homeName, teamBag, ratings);
		const away = teamFromLive(row.awayName, teamBag, ratings);
		const model = priceMatch(home, away);
		const synth1 = vigPrices([
			model.markets.home,
			model.markets.draw,
			model.markets.away
		], .05, .14);
		const synthTot = vigPrices([model.markets.over25, 1 - model.markets.over25], .04, .08);
		const synthBtts = vigPrices([model.markets.bttsYes, model.markets.bttsNo], .04, .08);
		fixtures.push({
			id: `live-${row.fotmobId}`,
			kickoff: formatKickoff(row.utc, "LIVE"),
			kickoffIso: row.utc,
			venue: row.leagueName,
			leagueId: row.leagueKey,
			leagueName: row.leagueName,
			leagueAbbr: "LIVE",
			homeId: home.id,
			awayId: away.id,
			book1x2: {
				home: synth1[0],
				draw: synth1[1],
				away: synth1[2]
			},
			bookTotals: {
				over25: synthTot[0],
				under25: synthTot[1],
				bttsYes: synthBtts[0],
				bttsNo: synthBtts[1]
			},
			overLine: 2.5,
			bookSource: "model",
			bookLabel: "Live model",
			status: "live",
			score: row.score,
			clock: row.clock,
			elapsedMin: row.elapsedMin,
			phase: row.phase,
			note: "Worldwide live feed"
		});
		if (!leagueMeta.some((l) => l.id === row.leagueKey)) leagueMeta.push({
			id: row.leagueKey,
			name: row.leagueName,
			abbr: "LIVE",
			region: "cups",
			matchCount: 1
		});
		else {
			const lg = leagueMeta.find((l) => l.id === row.leagueKey);
			if (lg) lg.matchCount += 1;
		}
	}
}
function mergeCalendarHarvest(fixtures, harvest, ratings, teamBag, leagueMeta) {
	for (const row of harvest) {
		let matched;
		let best = 0.88;
		for (const f of fixtures) {
			const home = teamBag.get(f.homeId)?.name || "";
			const away = teamBag.get(f.awayId)?.name || "";
			const s = livePairScore(row.homeName, row.awayName, home, away);
			if (s > best) {
				matched = f;
				best = s;
			}
		}
		if (matched) {
			if (row.status === "live" || row.status === "post") {
				matched.status = row.status;
				if (row.score) matched.score = row.score;
				if (row.clock) matched.clock = row.clock;
				if (row.elapsedMin) matched.elapsedMin = row.elapsedMin;
				if (row.phase) matched.phase = row.phase;
			}
			continue;
		}
		const home = teamFromLive(row.homeName, teamBag, ratings);
		const away = teamFromLive(row.awayName, teamBag, ratings);
		const model = priceMatch(home, away);
		const synth1 = vigPrices([model.markets.home, model.markets.draw, model.markets.away], 0.05, 0.14);
		const synthTot = vigPrices([model.markets.over25, 1 - model.markets.over25], 0.04, 0.08);
		const synthBtts = vigPrices([model.markets.bttsYes, model.markets.bttsNo], 0.04, 0.08);
		fixtures.push({
			id: `fm-${row.fotmobId}`,
			kickoff: formatKickoff(row.utc, row.status === "live" ? "LIVE" : "TBD"),
			kickoffIso: row.utc,
			venue: row.leagueName,
			leagueId: row.leagueKey,
			leagueName: row.leagueName,
			leagueAbbr: (row.leagueName || "FB").slice(0, 4).toUpperCase(),
			homeId: home.id,
			awayId: away.id,
			book1x2: { home: synth1[0], draw: synth1[1], away: synth1[2] },
			bookTotals: { over25: synthTot[0], under25: synthTot[1], bttsYes: synthBtts[0], bttsNo: synthBtts[1] },
			overLine: 2.5,
			bookSource: "model",
			bookLabel: "Model book",
			status: row.status,
			score: row.score,
			clock: row.clock,
			elapsedMin: row.elapsedMin,
			phase: row.phase,
			note: "Worldwide calendar",
		});
		if (!leagueMeta.some((l) => l.id === row.leagueKey)) {
			leagueMeta.push({
				id: row.leagueKey,
				name: row.leagueName,
				abbr: (row.leagueName || "FB").slice(0, 4).toUpperCase(),
				region: "cups",
				matchCount: 1,
			});
		} else {
			const lg = leagueMeta.find((l) => l.id === row.leagueKey);
			if (lg) lg.matchCount += 1;
		}
	}
}
function parseStandings(payload) {
	const table = new Map();
	const ratings = new Map();
	if (!payload || typeof payload !== "object") return {
		table,
		ratings
	};
	const entries = [];
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const n = node;
		const list = n.standings?.entries || n.entries;
		if (Array.isArray(list)) for (const e of list) entries.push(e);
		if (Array.isArray(n.children)) n.children.forEach(walk);
	};
	walk(payload);
	if (entries.length === 0) return {
		table,
		ratings
	};
	let gpSum = 0;
	let gfSum = 0;
	const rows = entries.map((e, i) => {
		const team = e.team;
		const gp = Math.max(0, statValue(e, "gamesPlayed"));
		const gf = Math.max(0, statValue(e, "pointsFor"));
		const ga = Math.max(0, statValue(e, "pointsAgainst"));
		gpSum += gp;
		gfSum += gf;
		return {
			id: String(team?.id ?? ""),
			gp,
			gf,
			ga,
			pts: statValue(e, "points"),
			wins: statValue(e, "wins"),
			draws: statValue(e, "ties"),
			losses: statValue(e, "losses"),
			rank: statValue(e, "rank") || i + 1
		};
	});
	const avg = gpSum > 0 ? gfSum / gpSum : AVG_ATTACK;
	const size = rows.length;
	for (const row of rows) {
		if (!row.id) continue;
		const attack = (row.gf + avg * PRIOR_GAMES) / (row.gp + PRIOR_GAMES);
		const conc = (row.ga + avg * PRIOR_GAMES) / (row.gp + PRIOR_GAMES);
		const defense = avg > 0 ? conc / avg : 1;
		ratings.set(row.id, {
			attack: Math.min(2.8, Math.max(.55, attack)),
			defense: Math.min(1.7, Math.max(.55, defense))
		});
		table.set(row.id, {
			rank: row.rank,
			played: row.gp,
			pts: row.pts,
			gf: row.gf,
			ga: row.ga,
			wins: row.wins,
			draws: row.draws,
			losses: row.losses,
			leagueSize: size
		});
	}
	return {
		table,
		ratings
	};
}
function competitorPair(comp) {
	const competitors = comp.competitors || [];
	return {
		homeRaw: competitors.find((c) => c.homeAway === "home"),
		awayRaw: competitors.find((c) => c.homeAway === "away")
	};
}
function parseStat(stats, name) {
	const s = stats?.find((x) => x.name === name);
	const n = Number(s?.value);
	return Number.isFinite(n) ? n : 0;
}
function clockPhase(status) {
	if (!status) return {};
	const type = status.type;
	const clock = String(status.displayClock || type?.shortDetail || "").trim() || undefined;
	const period = Number(status.period);
	const detail = String(type?.detail || type?.shortDetail || "");
	let phase;
	if (/half/i.test(detail) && !/second/i.test(detail)) phase = "ht";
	else if (period >= 2) phase = "h2";
	else if (period === 1) phase = "h1";
	let elapsedMin;
	const m = clock?.match(/(\d+)/);
	if (m) {
		const mins = Number(m[1]);
		elapsedMin = period >= 2 ? 45 + Math.min(50, mins) : Math.min(50, mins);
	}
	return {
		clock,
		period: Number.isFinite(period) ? period : undefined,
		elapsedMin,
		phase
	};
}
function parseLeagueBoard(league, dated, undated) {
	const pickRoot = (payload) => payload && typeof payload === "object" ? payload : undefined;
	const a = pickRoot(dated);
	const b = pickRoot(undated);
	const leaguesA = a?.leagues;
	const lg = (b?.leagues)?.[0] || leaguesA?.[0];
	const calendar = lg?.calendar || [];
	const byId = new Map();
	for (const pack of [a, b]) {
		const events = pack?.events || [];
		for (const ev of events) {
			if (!ev || typeof ev !== "object") continue;
			byId.set(String(ev.id ?? `${ev.date}-${byId.size}`), ev);
		}
	}
	const events = [...byId.values()];
	const fallbackCal = events.map((e) => String(e.date || "")).filter(Boolean);
	const weeks = clusterMatchweeks(calendar.length ? calendar : fallbackCal);
	const current = currentMatchweek(weeks, new Date(), (w) => events.some((event) => {
		const state = event.status?.type?.state;
		if (state && state !== "pre") return false;
		return weekForDate(weeks, String(event.date || ""))?.week === w.week;
	}));
	const season = lg?.season;
	const seasonLabel = String(season?.displayName || "").match(/\d{4}-\d{2}/)?.[0] || String(season?.year || "");
	const results = [];
	for (const event of events) {
		if (event.status?.type?.state !== "post") continue;
		const comp = event.competitions?.[0];
		if (!comp) continue;
		const { homeRaw, awayRaw } = competitorPair(comp);
		if (!homeRaw?.team || !awayRaw?.team) continue;
		const hg = Number(homeRaw.score);
		const ag = Number(awayRaw.score);
		if (!Number.isFinite(hg) || !Number.isFinite(ag)) continue;
		const homeTeam = homeRaw.team;
		const awayTeam = awayRaw.team;
		const homeId = String(homeTeam.id ?? "");
		const awayId = String(awayTeam.id ?? "");
		if (!homeId || !awayId) continue;
		const hs = parseStat(homeRaw.statistics, "shots");
		const as = parseStat(awayRaw.statistics, "shots");
		const hsog = parseStat(homeRaw.statistics, "shotsOnTarget");
		const asog = parseStat(awayRaw.statistics, "shotsOnTarget");
		results.push({
			homeId,
			awayId,
			hg,
			ag,
			date: String(event.date || "").slice(0, 10),
			leagueId: league.id,
			hs,
			as,
			hsog,
			asog
		});
	}
	return {
		weeks,
		current,
		seasonLabel,
		results,
		events
	};
}
function fixturesFromEvents(league, events, weeks, current, seasonLabel, ratings, teamBag, lastPlayed, desk) {
	const out = [];
	const now = Date.now();
	for (const event of events) {
		const state = event.status?.type?.state;
		const iso = String(event.date || "");
		const kick = Date.parse(iso);
		const isPost = state === "post";
		const isLive = state === "in";
		if (!Number.isFinite(kick)) continue;
		if (isPost) {
			if (kick < desk.from || kick > now + 7_200_000) continue;
		} else if (isLive) {
			if (Math.abs(now - kick) > 12 * 3_600_000) continue;
		} else if (state && state !== "pre") continue;
		else if (kick < desk.from || kick > desk.to) continue;
		const comp = event.competitions?.[0];
		if (!comp) continue;
		const { homeRaw, awayRaw } = competitorPair(comp);
		if (!homeRaw?.team || !awayRaw?.team) continue;
		const mw = weekForDate(weeks, iso);
		const home = teamFromEspn(homeRaw.team, ratings);
		const away = teamFromEspn(awayRaw.team, ratings);
		teamBag.set(home.id, home);
		teamBag.set(away.id, away);
		const market = extractMarket(comp);
		const model = priceMatch(home, away);
		const line = market?.line ?? 2.5;
		const overP = pOver(model.matrix, line);
		const has1x2 = !!market && market.home > 1.01 && market.draw > 1.01 && market.away > 1.01;
		const hasTotals = !!market && (market.over ?? 0) > 1.01 && (market.under ?? 0) > 1.01;
		const synth1 = vigPrices([
			model.markets.home,
			model.markets.draw,
			model.markets.away
		], .05, .14);
		const synthTot = vigPrices([overP, 1 - overP], .04, .08);
		const synthBtts = vigPrices([model.markets.bttsYes, model.markets.bttsNo], .04, .08);
		const book1x2 = has1x2 ? {
			home: market.home,
			draw: market.draw,
			away: market.away
		} : {
			home: synth1[0],
			draw: synth1[1],
			away: synth1[2]
		};
		const bookTotals = {
			over25: hasTotals ? market.over : synthTot[0],
			under25: hasTotals ? market.under : synthTot[1],
			bttsYes: synthBtts[0],
			bttsNo: synthBtts[1]
		};
		const openOk = !!market && "open" in market && market.open && market.open.home > 1.01 && market.open.draw > 1.01 && market.open.away > 1.01;
		const status = isLive ? "live" : isPost ? "post" : "pre";
		const hg = Number(homeRaw.score);
		const ag = Number(awayRaw.score);
		const score = (isLive || isPost) && Number.isFinite(hg) && Number.isFinite(ag) ? {
			home: hg,
			away: ag
		} : undefined;
		const liveBits = isLive ? clockPhase(event.status) : {};
		out.push({
			id: String(event.id ?? `${league.id}-${home.id}-${away.id}`),
			kickoff: formatKickoff(iso, "TBD"),
			kickoffIso: iso,
			venue: String(event.venue?.fullName || event.venue?.displayName || league.name),
			leagueId: league.id,
			leagueName: league.name,
			leagueAbbr: league.abbr,
			homeId: home.id,
			awayId: away.id,
			book1x2,
			bookTotals,
			overLine: line,
			bookSource: has1x2 ? "market" : "model",
			bookLabel: has1x2 ? market.label : "Model book",
			books: market && "books" in market ? market.books : undefined,
			status,
			score,
			clock: liveBits.clock,
			period: liveBits.period,
			elapsedMin: liveBits.elapsedMin,
			phase: liveBits.phase,
			week: mw?.week,
			weekLabel: weekLabel(mw?.week),
			seasonLabel,
			bookOpen: openOk ? {
				home: market.open.home,
				draw: market.open.draw,
				away: market.open.away
			} : undefined
		});
	}
	return out;
}
function mergeBooks(into, extra) {
	const out = [...into || []];
	const seen = new Set(out.map((b) => b.book.toLowerCase()));
	for (const q of extra) {
		const key = q.book.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(q);
	}
	return out;
}
function applyBestBook(f) {
	const books = f.books?.filter((b) => b.home > 1.01 && b.draw > 1.01 && b.away > 1.01) || [];
	if (books.length === 0) return;
	f.books = books;
	f.book1x2 = {
		home: Math.max(...books.map((b) => b.home)),
		draw: Math.max(...books.map((b) => b.draw)),
		away: Math.max(...books.map((b) => b.away))
	};
	f.bookSource = "market";
	f.bookLabel = books.length > 1 ? `Best of ${books.length}` : books[0].book;
	const withLine = books.find((b) => b.over && b.under);
	if (withLine?.over && withLine.under) {
		f.bookTotals = {
			...f.bookTotals,
			over25: withLine.over,
			under25: withLine.under
		};
		if (withLine.line) f.overLine = withLine.line;
	}
}
async function attachBooks(fixtures) {
	const now = Date.now();
	await pool(fixtures.filter((f) => {
		if (f.status === "post") return false;
		if (!f.leagueId || !/^\d+$/.test(f.id)) return false;
		const t = f.kickoffIso ? Date.parse(f.kickoffIso) : NaN;
		return Number.isFinite(t) && t < now + 2592e5 && t > now - 144e5;
	}).sort((a, b) => (a.kickoffIso || "").localeCompare(b.kickoffIso || "")).slice(0, 20), 8, async (f) => {
		const json = await getJson(`${ESPN_CORE}/${f.leagueId}/events/${f.id}/competitions/${f.id}/odds?limit=50&lang=en&region=gb`);
		if (!json || typeof json !== "object") return;
		const items = json.items;
		if (!Array.isArray(items)) return;
		const extra = [];
		for (const item of items) {
			if (!item || typeof item !== "object") continue;
			const q = quoteFromOddsObj(item);
			if (q) extra.push(q);
		}
		if (extra.length === 0) return;
		f.books = mergeBooks(f.books, extra);
		applyBestBook(f);
	});
	for (const f of fixtures) if (f.books?.length) applyBestBook(f);
}
function restMap(results) {
	const last = new Map();
	for (const r of results) {
		const d = r.date || "";
		if (!d) continue;
		const prevH = last.get(r.homeId);
		const prevA = last.get(r.awayId);
		if (!prevH || d > prevH) last.set(r.homeId, d);
		if (!prevA || d > prevA) last.set(r.awayId, d);
	}
	return last;
}
function resultLetter(gf, ga) {
	if (gf > ga) return "W";
	if (gf < ga) return "L";
	return "D";
}
function stampFacts(f, results, ratings, names) {
	const meanAtt = AVG_ATTACK;
	const gamesFor = (id) => {
		const list = [];
		for (const r of results) {
			if (r.homeId !== id && r.awayId !== id) continue;
			const home = r.homeId === id;
			const oppId = home ? r.awayId : r.homeId;
			const gf = home ? r.hg : r.ag;
			const ga = home ? r.ag : r.hg;
			const opp = ratings.get(oppId);
			const oppStr = opp ? (opp.attack / meanAtt + 1 / Math.max(.5, opp.defense)) / 2 : 1;
			list.push({
				date: r.date || "",
				opp: names.get(oppId)?.short || oppId,
				oppId,
				venue: home ? "H" : "A",
				gf,
				ga,
				result: resultLetter(gf, ga),
				shots: home ? r.hs : r.as,
				sog: home ? r.hsog : r.asog,
				oppStrength: oppStr,
				weight: r.leagueId && r.leagueId !== f.leagueId ? .8 : 1,
				comp: r.leagueId && r.leagueId !== f.leagueId ? "cup" : "league"
			});
		}
		return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
	};
	const restDays = (id) => {
		const last = results.filter((r) => r.homeId === id || r.awayId === id).map((r) => r.date || "").filter(Boolean).sort().at(-1);
		if (!last || !f.kickoffIso) return undefined;
		const gap = (Date.parse(f.kickoffIso) - Date.parse(`${last}T12:00:00Z`)) / 86_400_000;
		return Number.isFinite(gap) ? Math.max(0, Math.round(gap)) : undefined;
	};
	const side = (id) => {
		const recent = gamesFor(id);
		const form = scheduleForm(recent);
		const letters = newestForm(recent.map((g) => g.result).join(""));
		return {
			...emptySide(letters || form.form),
			recent,
			restDays: restDays(id),
			formAdj: form.formAdj,
			sos: form.sos,
			sosLabel: form.label,
			goalsLast5: recent.slice(0, 5).reduce((s, g) => s + g.gf, 0)
		};
	};
	const home = side(f.homeId);
	const away = side(f.awayId);
	const meetings = results.filter((r) => r.homeId === f.homeId && r.awayId === f.awayId || r.homeId === f.awayId && r.awayId === f.homeId).map((r) => {
		const homeNow = r.homeId === f.homeId;
		const gf = homeNow ? r.hg : r.ag;
		const ga = homeNow ? r.ag : r.hg;
		return {
			date: r.date || "",
			venue: r.homeId === f.homeId ? "H" : "A",
			gf,
			ga,
			result: resultLetter(gf, ga)
		};
	}).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
	f.facts = {
		...emptyFacts(),
		source: "espn",
		home,
		away,
		h2h: meetings.length > 0 ? {
			homeWins: meetings.filter((m) => m.result === "W").length,
			draws: meetings.filter((m) => m.result === "D").length,
			awayWins: meetings.filter((m) => m.result === "L").length,
			recent: meetings,
			homeEdge: h2hHomeEdge(meetings)
		} : undefined,
		notes: [],
		news: []
	};
}
function snapshotsFor(days, results, prior) {
	const map = new Map();
	for (const day of days) {
		const before = results.filter((r) => (r.date || "") < day);
		map.set(day, fitRatings(before, prior));
	}
	return map;
}
function freezeSettled(fixtures, snaps, teamBag) {
	for (const f of fixtures) {
		if (f.status !== "post" && f.status !== "live") continue;
		const day = (f.kickoffIso || "").slice(0, 10);
		const snap = snaps.get(day);
		if (!snap) continue;
		f.settled = {
			home: snap.get(f.homeId) || {
				attack: teamBag.get(f.homeId)?.attack ?? AVG_ATTACK,
				defense: teamBag.get(f.homeId)?.defense ?? 1
			},
			away: snap.get(f.awayId) || {
				attack: teamBag.get(f.awayId)?.attack ?? AVG_ATTACK,
				defense: teamBag.get(f.awayId)?.defense ?? 1
			},
			asOf: day
		};
	}
}
function slimSide(s, dropXi) {
	return {
		...s,
		starters: dropXi ? [] : (s.starters || []).slice(0, 11),
		unavailable: (s.unavailable || []).slice(0, 8),
		recent: (s.recent || []).slice(0, 5),
		insight: s.insight ? s.insight.slice(0, 160) : s.insight
	};
}
function slimFixture(f) {
	const facts = f.facts;
	if (!facts) return f;
	const post = f.status === "post";
	return {
		...f,
		facts: {
			...facts,
			home: slimSide(facts.home, post),
			away: slimSide(facts.away, post),
			news: (facts.news || []).slice(0, 2),
			notes: (facts.notes || []).slice(0, 4),
			h2h: facts.h2h ? {
				...facts.h2h,
				recent: (facts.h2h.recent || []).slice(0, 4)
			} : facts.h2h
		}
	};
}
function fallbackSlate() {
	const fixtures = FIXTURES.map((f) => ({
		...f,
		leagueId: "eng.1",
		leagueName: "Premier League",
		leagueAbbr: "EPL",
		bookSource: "model",
		overLine: 2.5,
		status: "pre",
		week: 5,
		weekLabel: "MW 5",
		seasonLabel: "2026-27"
	}));
	return {
		asOf: Date.now(),
		source: "fallback",
		window: "demo slate",
		leagues: [{
			id: "eng.1",
			name: "Premier League",
			abbr: "EPL",
			region: "europe",
			matchCount: fixtures.length,
			currentWeek: 5,
			totalWeeks: 38,
			seasonLabel: "2026-27"
		}],
		fixtures,
		teams: TEAMS,
		study: emptyStudy()
	};
}
async function buildSlate() {
	const desk = deskWindow();
	const histParam = historyWindow();
	const tableByLeague = new Map();
	const tableRatings = new Map();
	await pool(LEAGUES.filter((l) => l.hasTable), 10, async (league) => {
		const part = parseStandings(await getJson(`${ESPN_TABLE}/${league.id}/standings`));
		tableByLeague.set(league.id, part.table);
		for (const [k, v] of part.ratings) if (!tableRatings.has(k)) tableRatings.set(k, v);
	});
	const boards = await pool(LEAGUES, 6, async (league) => {
		return {
			league,
			board: parseLeagueBoard(league, await getJson(`${ESPN_SCORE}/${league.id}/scoreboard?dates=${desk.param}&limit=200`), league.hasTable ? await getJson(`${ESPN_SCORE}/${league.id}/scoreboard?dates=${histParam}&limit=300`) : null)
		};
	});
	const ratings = new Map(tableRatings);
	const allResults = [];
	for (const { board } of boards) {
		allResults.push(...board.results);
		if (board.results.length === 0) continue;
		const fitted = fitRatings(board.results, ratings);
		for (const [k, v] of fitted) ratings.set(k, v);
	}
	const teamBag = new Map();
	const fixtures = [];
	const leagueMeta = [];
	for (const { league, board } of boards) {
		const last = restMap(board.results);
		const list = fixturesFromEvents(league, board.events, board.weeks, board.current, board.seasonLabel, ratings, teamBag, last, desk);
		fixtures.push(...list);
		if (list.length === 0) continue;
		leagueMeta.push({
			id: league.id,
			name: league.name,
			abbr: league.abbr,
			region: league.region,
			matchCount: list.length,
			currentWeek: board.current?.week,
			totalWeeks: board.weeks.length,
			seasonLabel: board.seasonLabel,
			weekStart: board.current?.start,
			weekEnd: board.current?.end
		});
	}
	try {
		mergeLiveHarvest(fixtures, await harvestFotmobLive(), ratings, teamBag, leagueMeta);
	} catch {}
	try {
		await fillWeekDays(fixtures, ratings, teamBag, leagueMeta);
	} catch {}
	try {
		await attachBooks(fixtures);
	} catch {}
	fixtures.sort((a, b) => {
		const live = Number(b.status === "live") - Number(a.status === "live");
		if (live) return live;
		return (a.kickoffIso || "").localeCompare(b.kickoffIso || "");
	});
	if (fixtures.length === 0) return fallbackSlate();
	for (const f of fixtures) stampFacts(f, allResults, ratings, teamBag);
	let withFacts = fixtures;
	try {
		withFacts = await enrichWithFotmob(fixtures, teamBag);
	} catch {
		withFacts = fixtures;
	}
	const days = [...new Set(withFacts.map((f) => (f.kickoffIso || "").slice(0, 10)).filter(Boolean))];
	freezeSettled(withFacts, snapshotsFor(days, allResults, tableRatings), teamBag);
	const studyRows = [];
	for (const f of withFacts) {
		if (f.status !== "post" || !f.score || !f.settled) continue;
		const mkt = marketFromOdds(f.book1x2);
		if (!mkt) continue;
		const model = priceMatch(f.settled.home, f.settled.away).markets;
		studyRows.push({
			date: f.kickoffIso || "",
			leagueId: f.leagueId || "",
			actual: f.score.home > f.score.away ? "home" : f.score.home < f.score.away ? "away" : "draw",
			model: {
				home: model.home,
				draw: model.draw,
				away: model.away
			},
			market: mkt
		});
	}
	const study = summariseStudy(studyRows);
	for (const f of withFacts) {
		const lg = leagueMeta.find((l) => l.id === f.leagueId);
		const table = tableByLeague.get(f.leagueId || "");
		f.profile = buildProfile({
			facts: f.facts,
			week: f.week ?? lg?.currentWeek,
			totalWeeks: lg?.totalWeeks,
			homeTable: table?.get(f.homeId),
			awayTable: table?.get(f.awayId),
			book: f.book1x2,
			open: f.bookOpen,
			kickoffIso: f.kickoffIso
		});
	}
	return {
		asOf: Date.now(),
		source: "espn",
		window: desk.param,
		leagues: leagueMeta,
		fixtures: withFacts.map(slimFixture),
		teams: [...teamBag.values()].sort((a, b) => a.name.localeCompare(b.name)),
		study
	};
}
function cacheTtl(slate) {
	if (slate.fixtures.some((f) => f.status === "live")) return TTL_LIVE_MS;
	const now = Date.now();
	return slate.fixtures.some((f) => {
		const t = f.kickoffIso ? Date.parse(f.kickoffIso) : NaN;
		return Number.isFinite(t) && t > now && t - now < 4 * 3_600_000;
	}) ? 90_000 : TTL_QUIET_MS;
}

async function fillWeekDays(fixtures, ratings, teamBag, leagueMeta) {
	try {
		mergeCalendarHarvest(fixtures, await harvestFotmobWeek(weekStrip()), ratings, teamBag, leagueMeta);
	} catch {
		/* ESPN week still stands */
	}
}

export const loadSlate = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  const today = todayKey();
  const cacheDay = cache ? dayKey(undefined, new Date(cache.at)) : "";
  if (cache && cache.ver === CACHE_VER && cacheDay === today && now - cache.at < cacheTtl(cache.slate)) return cache.slate;
  try {
    const slate = await buildSlate();
    cache = { at: Date.now(), ver: CACHE_VER, slate };
    return slate;
  } catch {
    return fallbackSlate();
  }
});
