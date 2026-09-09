import { d as hueFromId, o as formatKickoff, r as decimalFromAmerican } from "./utils-C6P-Cf7I.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { _ as priceMatch, a as emptyFacts, b as summariseStudy, c as h2hHomeEdge, d as mergeRecent, f as newestForm, h as posGroup, n as TEAMS, o as emptySide, p as pOver, s as emptyStudy, t as FIXTURES, u as marketFromOdds, y as scheduleForm } from "./fixtures-Chcd4jUa.mjs";
import { t as buildProfile } from "./bet-metrics-B670mQan.mjs";
import { t as LEAGUES } from "./leagues-BHa9XDnC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/load-slate-DY-flD6n.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var AVG_ATTACK$1 = 1.25;
/**
* Iterative Dixon–Coles / Maher attack–defence fit from completed scores.
* `prior` is the league table (shrunk GF/GA). A small prior weight keeps
* early-season 3-game samples from exploding.
*/
function fitRatings(results, prior, homeAdv = 1.32) {
	const ids = /* @__PURE__ */ new Set();
	for (const r of results) {
		ids.add(r.homeId);
		ids.add(r.awayId);
	}
	for (const id of prior.keys()) ids.add(id);
	const attack = /* @__PURE__ */ new Map();
	const defense = /* @__PURE__ */ new Map();
	for (const id of ids) {
		const p = prior.get(id);
		attack.set(id, p?.attack ?? AVG_ATTACK$1);
		defense.set(id, p?.defense ?? 1);
	}
	if (results.length < 4) return new Map([...ids].map((id) => [id, {
		attack: attack.get(id),
		defense: defense.get(id)
	}]));
	const priorW = 6;
	for (let iter = 0; iter < 10; iter++) {
		const attN = /* @__PURE__ */ new Map();
		const attD = /* @__PURE__ */ new Map();
		const defN = /* @__PURE__ */ new Map();
		const defD = /* @__PURE__ */ new Map();
		for (const id of ids) {
			const pa = prior.get(id)?.attack ?? AVG_ATTACK$1;
			const pd = prior.get(id)?.defense ?? 1;
			attN.set(id, pa * priorW);
			attD.set(id, priorW);
			defN.set(id, pd * priorW);
			defD.set(id, priorW);
		}
		for (const m of results) {
			const defA = defense.get(m.awayId) ?? 1;
			const defH = defense.get(m.homeId) ?? 1;
			const attH = attack.get(m.homeId) ?? AVG_ATTACK$1;
			const attA = attack.get(m.awayId) ?? AVG_ATTACK$1;
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
			const a = (attN.get(id) ?? AVG_ATTACK$1) / Math.max(.2, attD.get(id) ?? 1);
			const d = (defN.get(id) ?? 1) / Math.max(.2, defD.get(id) ?? 1);
			attack.set(id, a);
			defense.set(id, d);
			attSum += a;
			defSum += d;
		}
		const n = ids.size || 1;
		const attMean = attSum / n;
		const defMean = defSum / n;
		for (const id of ids) {
			attack.set(id, (attack.get(id) ?? AVG_ATTACK$1) / attMean * AVG_ATTACK$1);
			defense.set(id, (defense.get(id) ?? 1) / defMean);
		}
	}
	const out = /* @__PURE__ */ new Map();
	for (const id of ids) out.set(id, {
		attack: Math.min(2.6, Math.max(.6, attack.get(id) ?? AVG_ATTACK$1)),
		defense: Math.min(1.65, Math.max(.58, defense.get(id) ?? 1))
	});
	return out;
}
var FM_MATCHES = "https://www.fotmob.com/api/data/matches";
var FM_DETAIL = "https://www.fotmob.com/api/data/matchDetails";
var HEADERS = {
	Accept: "application/json",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
	Referer: "https://www.fotmob.com/"
};
var ALIAS = {
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
	"leeds": "leeds united"
};
function canon(raw) {
	let s = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\b(fc|cf|sc|afc|cafc|ac|as|ud|cd|rcd|sk|fk|bk|if|ff|calcio|club|de|the)\b/g, " ").replace(/\s+/g, " ").trim();
	return ALIAS[s] || s;
}
function tokens(s) {
	return new Set(canon(s).split(" ").filter((w) => w.length > 2));
}
function nameScore(a, b) {
	const na = canon(a);
	const nb = canon(b);
	if (!na || !nb) return 0;
	if (na === nb) return 1;
	if (na.includes(nb) || nb.includes(na)) return .9;
	const ta = tokens(a);
	const tb = tokens(b);
	if (ta.size === 0 || tb.size === 0) return 0;
	let inter = 0;
	for (const t of ta) if (tb.has(t)) inter++;
	return inter / (/* @__PURE__ */ new Set([...ta, ...tb])).size;
}
async function getJson$1(url) {
	try {
		const res = await fetch(url, {
			headers: HEADERS,
			signal: AbortSignal.timeout(8e3)
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}
async function pool$1(items, limit, fn) {
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
function ymd(iso) {
	return iso.slice(0, 10);
}
function parseMatches(payload) {
	if (!payload || typeof payload !== "object") return [];
	const leagues = payload.leagues;
	if (!Array.isArray(leagues)) return [];
	const out = [];
	for (const lg of leagues) {
		if (!lg || typeof lg !== "object") continue;
		const matches = lg.matches;
		if (!Array.isArray(matches)) continue;
		for (const m of matches) {
			if (!m || typeof m !== "object") continue;
			const rec = m;
			const utc = rec.status?.utcTime || "";
			if (!utc || rec.status?.finished) continue;
			const id = Number(rec.id);
			if (!Number.isFinite(id)) continue;
			out.push({
				id,
				date: ymd(utc),
				home: rec.home?.longName || rec.home?.name || "",
				away: rec.away?.longName || rec.away?.name || "",
				utc
			});
		}
	}
	return out;
}
function asNum(v) {
	const n = Number(v);
	return Number.isFinite(n) ? n : void 0;
}
function parsePlayers(list, kind) {
	if (!Array.isArray(list)) return [];
	const xi = [];
	const outs = [];
	for (const raw of list) {
		if (!raw || typeof raw !== "object") continue;
		const p = raw;
		const name = p.name || "";
		if (!name) continue;
		const pos = posGroup(p.usualPlayingPositionId, p.positionId);
		if (kind === "xi") xi.push({
			name,
			shirt: p.shirtNumber != null ? String(p.shirtNumber) : void 0,
			pos
		});
		else {
			const t = (p.unavailability?.type || "injury").toLowerCase();
			outs.push({
				name,
				pos,
				kind: t.includes("suspen") ? "suspension" : t.includes("injury") ? "injury" : "other",
				eta: p.unavailability?.expectedReturn,
				marketValue: asNum(p.marketValue)
			});
		}
	}
	return kind === "xi" ? xi : outs;
}
function formFromTeam(events) {
	if (!Array.isArray(events)) return {
		form: "",
		recent: []
	};
	const letters = [];
	let lastIso = "";
	let goals = 0;
	const recent = [];
	for (const ev of events) {
		if (!ev || typeof ev !== "object") continue;
		const e = ev;
		const ch = (e.resultString || "").toUpperCase();
		if (ch !== "W" && ch !== "D" && ch !== "L") continue;
		letters.push(ch);
		const iso = e.date?.utcTime || "";
		if (iso > lastIso) lastIso = iso;
		const hs = Number(e.tooltipText?.homeScore);
		const as = Number(e.tooltipText?.awayScore);
		const oursHome = Boolean(e.home?.isOurTeam);
		const gf = Number.isFinite(hs) && Number.isFinite(as) ? oursHome ? hs : as : 0;
		const ga = Number.isFinite(hs) && Number.isFinite(as) ? oursHome ? as : hs : 0;
		if (Number.isFinite(hs) && Number.isFinite(as)) goals += gf;
		const oppName = oursHome ? e.away?.name || e.tooltipText?.awayTeam || "Opp" : e.home?.name || e.tooltipText?.homeTeam || "Opp";
		const compName = `${e.competitionName || ""} ${e.leagueName || ""}`.toLowerCase();
		const friendly = compName.includes("friendly");
		const cup = /cup|champions|europa|conference|fa cup|league cup|coppa|dfb|copa/.test(compName);
		const comp = friendly ? "friendly" : cup ? "cup" : "league";
		recent.push({
			date: iso,
			opp: oppName,
			venue: oursHome ? "H" : "A",
			gf,
			ga,
			result: ch,
			weight: friendly ? .35 : cup ? .8 : 1,
			comp
		});
	}
	let restDays;
	if (lastIso) {
		restDays = (Date.now() - Date.parse(lastIso)) / 864e5;
		if (!Number.isFinite(restDays) || restDays < 0) restDays = void 0;
	}
	return {
		form: letters.join(""),
		restDays,
		goalsLast5: letters.length ? goals : void 0,
		recent
	};
}
function parseH2h(raw, homeName) {
	if (!raw || typeof raw !== "object") return [];
	const matches = raw.matches;
	if (!Array.isArray(matches)) return [];
	const homeCanon = homeName.toLowerCase();
	const out = [];
	for (const m of matches) {
		if (!m || typeof m !== "object") continue;
		const rec = m;
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
			result: gf > ga ? "W" : gf < ga ? "L" : "D"
		});
	}
	return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
}
function parseSide(team, formEvents, insight) {
	const t = team && typeof team === "object" ? team : {};
	const starters = parsePlayers(t.starters, "xi");
	const unavailable = parsePlayers(t.unavailable, "out");
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
		sosLabel: sched.label
	};
}
function parseDetail(payload) {
	if (!payload || typeof payload !== "object") return null;
	const root = payload;
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
	const lineupKind = (lu.lineupType || "").toLowerCase().includes("confirm") ? "confirmed" : home.starters.length >= 11 ? "predicted" : "none";
	const w = content.weather;
	const ref = mf.infoBox?.Referee;
	const yellows = ref?.stats?.find((s) => s.type === "yellowCards")?.value;
	const pens = ref?.stats?.find((s) => s.type === "penalties")?.value;
	const h2hSum = content.h2h?.summary;
	const homeName = lu.homeTeam?.name || "";
	const meetings = parseH2h(content.h2h, homeName);
	const facts = {
		source: "fotmob",
		lineupKind,
		home,
		away,
		news: (mf.preReview || []).filter((n) => !n.lang || n.lang === "en").map((n) => n.title || "").filter(Boolean).slice(0, 3),
		notes: [],
		venueCity: mf.infoBox?.Stadium?.city,
		surface: mf.infoBox?.Stadium?.surface
	};
	if (Array.isArray(h2hSum) && h2hSum.length >= 3 || meetings.length) facts.h2h = {
		homeWins: Array.isArray(h2hSum) ? Number(h2hSum[0]) || 0 : meetings.filter((m) => m.result === "W").length,
		draws: Array.isArray(h2hSum) ? Number(h2hSum[1]) || 0 : meetings.filter((m) => m.result === "D").length,
		awayWins: Array.isArray(h2hSum) ? Number(h2hSum[2]) || 0 : meetings.filter((m) => m.result === "L").length,
		recent: meetings,
		homeEdge: h2hHomeEdge(meetings)
	};
	if (w && Number.isFinite(Number(w.temperature))) facts.weather = {
		tempC: Number(w.temperature),
		windKph: Number(w.windSpeed) || 0,
		precipChance: Number(w.precipChance) || 0,
		description: w.description || "—"
	};
	if (ref?.text) facts.referee = {
		name: ref.text,
		yellowsPerGame: yellows,
		pens
	};
	return facts;
}
function pairScore(fxHome, fxAway, row) {
	return nameScore(fxHome, row.home) * nameScore(fxAway, row.away);
}
async function enrichWithFotmob(fixtures, names) {
	const dated = fixtures.filter((f) => f.kickoffIso);
	if (dated.length === 0) return fixtures;
	const dateCounts = /* @__PURE__ */ new Map();
	for (const f of dated) {
		const d = ymd(f.kickoffIso);
		dateCounts.set(d, (dateCounts.get(d) || 0) + 1);
	}
	const index = (await pool$1([...dateCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([d]) => d), 4, async (d) => {
		return parseMatches(await getJson$1(`${FM_MATCHES}?date=${d.replace(/-/g, "")}`));
	})).flat();
	if (index.length === 0) return fixtures;
	const byDate = /* @__PURE__ */ new Map();
	for (const row of index) {
		const list = byDate.get(row.date) || [];
		list.push(row);
		byDate.set(row.date, list);
	}
	const now = Date.now();
	const ranked = [...dated].map((f) => {
		const t = f.kickoffIso ? Date.parse(f.kickoffIso) : NaN;
		const delta = Number.isFinite(t) ? t - now : Infinity;
		const soon = delta < 0 && delta > -144e6 ? 1 : delta >= 0 && delta < 72e5 ? 0 : delta >= 0 && delta < 216e5 ? 1 : 2;
		return {
			f,
			soon: f.status === "live" ? -1 : soon,
			market: f.bookSource === "market" ? 0 : 1,
			kick: f.kickoffIso || ""
		};
	}).sort((a, b) => a.soon - b.soon || a.market - b.market || a.kick.localeCompare(b.kick)).slice(0, 64);
	const assigned = /* @__PURE__ */ new Set();
	const jobs = [];
	for (const { f } of ranked) {
		const home = names.get(f.homeId)?.name || "";
		const away = names.get(f.awayId)?.name || "";
		const day = ymd(f.kickoffIso);
		const candidates = byDate.get(day) || [];
		let best;
		let bestScore = .42;
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
		jobs.push({
			fixture: f,
			fmId: best.id
		});
	}
	const details = await pool$1(jobs, 6, async (job) => {
		const json = await getJson$1(`${FM_DETAIL}?matchId=${job.fmId}`);
		return {
			id: job.fixture.id,
			facts: parseDetail(json)
		};
	});
	const byId = new Map(details.filter((d) => d.facts).map((d) => [d.id, d.facts]));
	if (byId.size === 0) return fixtures;
	return fixtures.map((f) => {
		const extra = byId.get(f.id);
		if (!extra) return f;
		const base = f.facts;
		if (!base || base.source === "none") return {
			...f,
			facts: extra
		};
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
					corners: extra.home.corners ?? base.home.corners
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
					corners: extra.away.corners ?? base.away.corners
				},
				h2h: {
					homeWins: extra.h2h?.homeWins ?? base.h2h?.homeWins ?? 0,
					draws: extra.h2h?.draws ?? base.h2h?.draws ?? 0,
					awayWins: extra.h2h?.awayWins ?? base.h2h?.awayWins ?? 0,
					recent: meetings,
					homeEdge: h2hHomeEdge(meetings)
				},
				venueCity: extra.venueCity || base.venueCity,
				news: extra.news.length ? extra.news : base.news
			}
		};
	});
}
function fmYmd(offset = 0) {
	return new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10).replace(/-/g, "");
}
function liveClockFromStatus(st) {
	const short = st.liveTime?.short || "";
	const long = st.liveTime?.long || "";
	if (/HT|Half/i.test(short) || st.liveTime?.longKey === "pause_match") return {
		clock: "HT",
		elapsedMin: 45,
		phase: "ht"
	};
	const n = Number((long.match(/(\d+)/) || short.match(/(\d+)/) || [])[1]);
	const elapsed = Number.isFinite(n) ? n : 0;
	return {
		clock: (short.replace(/[^\d'HT+]/g, "") || `${elapsed}'`).slice(0, 8),
		elapsedMin: elapsed,
		phase: elapsed > 45 ? "h2" : "h1"
	};
}
function liveScore(m) {
	const h = Number(m.home?.score);
	const a = Number(m.away?.score);
	if (Number.isFinite(h) && Number.isFinite(a)) return {
		home: h,
		away: a
	};
	const g = String(m.status?.scoreStr || "").match(/(\d+)\s*[-–]\s*(\d+)/);
	if (g) return {
		home: Number(g[1]),
		away: Number(g[2])
	};
	return {
		home: 0,
		away: 0
	};
}
/** Every in-play match FotMob is showing — not just our league list. */
async function harvestFotmobLive() {
	const packs = await pool$1([
		fmYmd(-1),
		fmYmd(0),
		fmYmd(1)
	], 3, async (d) => getJson$1(`${FM_MATCHES}?date=${d}`));
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const payload of packs) {
		if (!payload || typeof payload !== "object") continue;
		const leagues = payload.leagues;
		if (!Array.isArray(leagues)) continue;
		for (const lg of leagues) {
			if (!lg || typeof lg !== "object") continue;
			const rec = lg;
			for (const raw of rec.matches || []) {
				if (!raw || typeof raw !== "object") continue;
				const m = raw;
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
					utc: st.utcTime || (/* @__PURE__ */ new Date()).toISOString(),
					score: liveScore(m),
					...clock
				});
			}
		}
	}
	return out;
}
function dayKey(iso) {
	return iso.slice(0, 10);
}
/**
* ESPN soccer calendars are match dates, not numbered rounds.
* Cluster dates separated by more than 3 days into matchweeks.
*/
function clusterMatchweeks(calendar) {
	const days = [...new Set(calendar.map(dayKey).filter((d) => d.length === 10))].sort();
	if (days.length === 0) return [];
	const groups = [];
	let cur = [];
	for (const d of days) {
		if (cur.length === 0) {
			cur = [d];
			continue;
		}
		const prev = Date.parse(`${cur[cur.length - 1]}T12:00:00Z`);
		if ((Date.parse(`${d}T12:00:00Z`) - prev) / 864e5 <= 3.25) cur.push(d);
		else {
			groups.push(cur);
			cur = [d];
		}
	}
	if (cur.length) groups.push(cur);
	return groups.map((dates, i) => ({
		week: i + 1,
		start: dates[0],
		end: dates[dates.length - 1]
	}));
}
function weekForDate(weeks, iso) {
	const day = dayKey(iso);
	if (!day) return void 0;
	return weeks.find((w) => day >= w.start && day <= w.end);
}
/** First week that still has a day today-or-later. If `hasUpcoming` is passed, skip spent rounds. */
function currentMatchweek(weeks, now = /* @__PURE__ */ new Date(), hasUpcoming) {
	if (weeks.length === 0) return void 0;
	const today = now.toISOString().slice(0, 10);
	const start = weeks.findIndex((w) => w.end >= today);
	const from = start < 0 ? weeks.length - 1 : start;
	for (let i = from; i < weeks.length; i++) {
		const w = weeks[i];
		if (!hasUpcoming || hasUpcoming(w)) return w;
	}
	return weeks[from];
}
function weekLabel(week) {
	if (!week || week < 1) return "—";
	return `MW ${week}`;
}
var ESPN_SCORE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
var ESPN_CORE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues";
var ESPN_TABLE = "https://site.api.espn.com/apis/v2/sports/soccer";
var TTL_QUIET_MS = 18e4;
var TTL_LIVE_MS = 45e3;
var CACHE_VER = 27;
var PRIOR_GAMES = 16;
var AVG_ATTACK = 1.25;
var cache = null;
function yyyymmdd(d) {
	return d.toISOString().slice(0, 10).replace(/-/g, "");
}
function rangeParam(fromMs, toMs) {
	return `${yyyymmdd(new Date(fromMs))}-${yyyymmdd(new Date(toMs))}`;
}
function deskWindow() {
	const now = Date.now();
	const from = now - 1296e5;
	const to = now + 6912e5;
	return {
		param: rangeParam(from, to),
		from,
		to
	};
}
function historyWindow() {
	const now = Date.now();
	return rangeParam(now - 3456e6, now - 432e5);
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
			signal: AbortSignal.timeout(9e3)
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
		over: over > 1.01 ? over : void 0,
		under: under > 1.01 ? under : void 0,
		line: Number.isFinite(line) && line > 0 ? line : void 0
	};
}
function extractBooks(comp) {
	const raw = Array.isArray(comp.odds) ? comp.odds.filter(Boolean) : [];
	const out = [];
	const seen = /* @__PURE__ */ new Set();
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
function parseStandings(payload) {
	const table = /* @__PURE__ */ new Map();
	const ratings = /* @__PURE__ */ new Map();
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
	const clock = String(status.displayClock || type?.shortDetail || "").trim() || void 0;
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
		period: Number.isFinite(period) ? period : void 0,
		elapsedMin,
		phase
	};
}
function parseLeagueBoard(league, dated, undated) {
	const pickRoot = (payload) => payload && typeof payload === "object" ? payload : void 0;
	const a = pickRoot(dated);
	const b = pickRoot(undated);
	const leaguesA = a?.leagues;
	const lg = (b?.leagues)?.[0] || leaguesA?.[0];
	const calendar = lg?.calendar || [];
	const byId = /* @__PURE__ */ new Map();
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
	const current = currentMatchweek(weeks, /* @__PURE__ */ new Date(), (w) => events.some((event) => {
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
			if (kick < desk.from || kick > now + 72e5) continue;
		} else if (isLive) {
			if (Math.abs(now - kick) > 432e5) continue;
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
		} : void 0;
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
			books: market && "books" in market ? market.books : void 0,
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
			} : void 0
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
	const last = /* @__PURE__ */ new Map();
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
		if (!last || !f.kickoffIso) return void 0;
		const gap = (Date.parse(f.kickoffIso) - Date.parse(`${last}T12:00:00Z`)) / 864e5;
		return Number.isFinite(gap) ? Math.max(0, Math.round(gap)) : void 0;
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
		} : void 0,
		notes: [],
		news: []
	};
}
function snapshotsFor(days, results, prior) {
	const map = /* @__PURE__ */ new Map();
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
	const tableByLeague = /* @__PURE__ */ new Map();
	const tableRatings = /* @__PURE__ */ new Map();
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
	const teamBag = /* @__PURE__ */ new Map();
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
		return Number.isFinite(t) && t > now && t - now < 144e5;
	}) ? 9e4 : TTL_QUIET_MS;
}
var loadSlate_createServerFn_handler = createServerRpc({
	id: "b6bcc7a864fa0da22ccffc87331cb9934c2ef88fb683110a3905e47f7f7ff80e",
	name: "loadSlate",
	filename: "src/lib/data/load-slate.ts"
}, (opts) => loadSlate.__executeServer(opts));
var loadSlate = createServerFn({ method: "GET" }).handler(loadSlate_createServerFn_handler, async () => {
	const now = Date.now();
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const cacheDay = cache ? new Date(cache.at).toISOString().slice(0, 10) : "";
	if (cache && cache.ver === CACHE_VER && cacheDay === today && now - cache.at < cacheTtl(cache.slate)) return cache.slate;
	try {
		const slate = await buildSlate();
		cache = {
			at: Date.now(),
			ver: CACHE_VER,
			slate
		};
		return slate;
	} catch {
		return fallbackSlate();
	}
});
//#endregion
export { loadSlate_createServerFn_handler };
