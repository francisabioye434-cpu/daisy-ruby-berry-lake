import { t as clamp$1 } from "./utils-C6P-Cf7I.mjs";
import { t as devig } from "./devig-yQ-VDeWP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fixtures-Chcd4jUa.js
/** Poisson PMF using a running product to stay stable for k ≤ 12. */
function poissonPmf(k, lambda) {
	if (k < 0) return 0;
	if (lambda <= 0) return k === 0 ? 1 : 0;
	let p = Math.exp(-lambda);
	for (let i = 1; i <= k; i++) p *= lambda / i;
	return p;
}
/** Dixon–Coles low-score correction. ρ is typically negative (~ −0.08). */
function tau(homeGoals, awayGoals, lambdaHome, lambdaAway, rho) {
	if (homeGoals === 0 && awayGoals === 0) return 1 - lambdaHome * lambdaAway * rho;
	if (homeGoals === 0 && awayGoals === 1) return 1 + lambdaHome * rho;
	if (homeGoals === 1 && awayGoals === 0) return 1 + lambdaAway * rho;
	if (homeGoals === 1 && awayGoals === 1) return 1 - rho;
	return 1;
}
function scoreMatrix(lambdaHome, lambdaAway, rho, maxGoals = 8) {
	const joint = [];
	let total = 0;
	for (let h = 0; h <= maxGoals; h++) {
		const row = [];
		const ph = poissonPmf(h, lambdaHome);
		for (let a = 0; a <= maxGoals; a++) {
			const p = tau(h, a, lambdaHome, lambdaAway, rho) * ph * poissonPmf(a, lambdaAway);
			row.push(p);
			total += p;
		}
		joint.push(row);
	}
	if (total > 0) for (let h = 0; h <= maxGoals; h++) for (let a = 0; a <= maxGoals; a++) joint[h][a] /= total;
	return {
		joint,
		lambdaHome,
		lambdaAway,
		rho,
		total
	};
}
function marketsFromMatrix(matrix) {
	let home = 0;
	let draw = 0;
	let away = 0;
	let over25 = 0;
	let bttsYes = 0;
	let mostLikely = {
		h: 0,
		a: 0,
		p: -1
	};
	const n = matrix.joint.length - 1;
	for (let h = 0; h <= n; h++) for (let a = 0; a <= n; a++) {
		const p = matrix.joint[h][a];
		if (p > mostLikely.p) mostLikely = {
			h,
			a,
			p
		};
		if (h > a) home += p;
		else if (a > h) away += p;
		else draw += p;
		if (h + a > 2.5) over25 += p;
		if (h > 0 && a > 0) bttsYes += p;
	}
	return {
		home,
		draw,
		away,
		over25,
		under25: 1 - over25,
		bttsYes,
		bttsNo: 1 - bttsYes,
		mostLikely
	};
}
/**
* Expected goals: attack × opponent defense × home advantage.
* Attack is goals vs an average defence (def = 1) at a neutral venue.
* Defense < 1 is stronger.
*/
function expectedGoals(home, away, homeAdv = 1.32) {
	return {
		lambdaHome: Math.max(.05, home.attack * away.defense * homeAdv),
		lambdaAway: Math.max(.05, away.attack * home.defense)
	};
}
function pOver(matrix, line) {
	let p = 0;
	const n = matrix.joint.length - 1;
	for (let h = 0; h <= n; h++) for (let a = 0; a <= n; a++) if (h + a > line) p += matrix.joint[h][a];
	return p;
}
function priceMatch(home, away, opts) {
	const homeAdv = opts?.homeAdv ?? 1.32;
	const rho = opts?.rho ?? -.08;
	const { lambdaHome, lambdaAway } = expectedGoals(home, away, homeAdv);
	const matrix = scoreMatrix(lambdaHome, lambdaAway, rho);
	return {
		lambdaHome,
		lambdaAway,
		matrix,
		markets: marketsFromMatrix(matrix),
		homeAdv,
		rho
	};
}
function remainingFraction(elapsedMin, phase) {
	if (phase === "ht") return .52;
	return Math.max(4, Math.min(90, 93 - (Number.isFinite(elapsedMin) ? elapsedMin : 30))) / 90;
}
/** Current score + remaining Poisson goals → in-play 1X2 / totals / BTTS. */
function liveMarketsFromScore(lambdaHome, lambdaAway, rho, score, frac, line = 2.5) {
	const remHome = Math.max(.02, lambdaHome * frac);
	const remAway = Math.max(.02, lambdaAway * frac);
	const matrix = scoreMatrix(remHome, remAway, rho);
	let home = 0;
	let draw = 0;
	let away = 0;
	let over = 0;
	let bttsYes = 0;
	let mostLikely = {
		h: score.home,
		a: score.away,
		p: -1
	};
	const n = matrix.joint.length - 1;
	const alreadyBtts = score.home > 0 && score.away > 0;
	for (let rh = 0; rh <= n; rh++) for (let ra = 0; ra <= n; ra++) {
		const p = matrix.joint[rh][ra];
		const fh = score.home + rh;
		const fa = score.away + ra;
		if (fh > fa) home += p;
		else if (fa > fh) away += p;
		else draw += p;
		if (fh + fa > line) over += p;
		if (alreadyBtts || fh > 0 && fa > 0) bttsYes += p;
		if (p > mostLikely.p) mostLikely = {
			h: fh,
			a: fa,
			p
		};
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
			mostLikely
		}
	};
}
function brier(p, actual) {
	const y = {
		home: actual === "home" ? 1 : 0,
		draw: actual === "draw" ? 1 : 0,
		away: actual === "away" ? 1 : 0
	};
	return (p.home - y.home) ** 2 + (p.draw - y.draw) ** 2 + (p.away - y.away) ** 2;
}
function meanBrier(rows, pick) {
	if (rows.length === 0) return 1;
	return rows.reduce((s, r) => s + brier(pick(r), r.actual), 0) / rows.length;
}
function blendTriple(model, market, w) {
	const t = Math.max(0, Math.min(.6, w));
	const home = model.home * (1 - t) + market.home * t;
	const draw = model.draw * (1 - t) + market.draw * t;
	const away = model.away * (1 - t) + market.away * t;
	const s = home + draw + away;
	return s > 0 ? {
		home: home / s,
		draw: draw / s,
		away: away / s
	} : model;
}
function marketFromOdds(odds) {
	if (odds.home < 1.01 || odds.draw < 1.01 || odds.away < 1.01) return null;
	const fair = devig([
		odds.home,
		odds.draw,
		odds.away
	]).fair;
	if (fair.length < 3) return null;
	return {
		home: fair[0],
		draw: fair[1],
		away: fair[2]
	};
}
/**
* Learn how much to trust the closing book vs Dixon–Coles.
* Dixon–Coles always keeps ≥ 40% of the blend — the market studies the model,
* it does not replace it.
*/
function summariseStudy(rows) {
	const usable = rows.filter((r) => r.model.home > 0 && r.market.home > 0 && (r.actual === "home" || r.actual === "draw" || r.actual === "away"));
	const seen = /* @__PURE__ */ new Set();
	const unique = usable.filter((r) => {
		const k = `${r.date}|${r.leagueId}|${r.market.home.toFixed(3)}|${r.actual}`;
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
	const n = unique.length;
	if (n < 12) return {
		n,
		blendW: .22,
		brierModel: n ? meanBrier(unique, (r) => r.model) : 0,
		brierMarket: n ? meanBrier(unique, (r) => r.market) : 0,
		brierBlend: 0,
		sharper: "even",
		note: n ? `Thin sample (${n}). Mild market shrink until 12 settled games.` : "No settled books yet. Model only."
	};
	const brierModel = meanBrier(unique, (r) => r.model);
	const brierMarket = meanBrier(unique, (r) => r.market);
	let bestW = .22;
	let bestB = Infinity;
	for (let w = 0; w <= .6 + 1e-9; w += .05) {
		const b = meanBrier(unique, (r) => blendTriple(r.model, r.market, w));
		if (b < bestB) {
			bestB = b;
			bestW = w;
		}
	}
	const sharper = brierMarket + .008 < brierModel ? "market" : brierModel + .008 < brierMarket ? "model" : "even";
	const note = sharper === "market" ? `Book is sharper on ${n} settled games. Blend ${Math.round(bestW * 100)}% toward close.` : sharper === "model" ? `Model adds on ${n} games. Keep ${Math.round((1 - bestW) * 100)}% Dixon–Coles.` : `Model and book agree on ${n} games. Small ${Math.round(bestW * 100)}% shrink.`;
	return {
		n,
		blendW: Math.round(bestW * 100) / 100,
		brierModel,
		brierMarket,
		brierBlend: bestB,
		sharper,
		note
	};
}
function blendThreeWay(model, market, w) {
	return blendTriple(model, market, w);
}
function emptyStudy() {
	return {
		n: 0,
		blendW: .22,
		brierModel: 0,
		brierMarket: 0,
		brierBlend: 0,
		sharper: "even",
		note: "No settled books yet. Model only."
	};
}
function emptySide(form = "") {
	return {
		form,
		starters: [],
		unavailable: []
	};
}
function emptyFacts() {
	return {
		source: "none",
		lineupKind: "none",
		home: emptySide(),
		away: emptySide(),
		news: [],
		notes: []
	};
}
function posGroup(usual, positionId) {
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
function newestForm(form) {
	return form.replace(/[^WDL]/gi, "").toUpperCase().slice(-5);
}
function formScore(form) {
	const letters = form.replace(/[^WDL]/gi, "").toUpperCase();
	if (!letters) return null;
	let pts = 0;
	for (const ch of letters) if (ch === "W") pts += 1;
	else if (ch === "D") pts += .5;
	return pts / letters.length;
}
function clamp(n, min, max) {
	return Math.min(max, Math.max(min, n));
}
/** Quality of one result vs this opponent. 0.5 ≈ expected vs average. */
function gameQuality(result, oppStr) {
	const s = clamp(oppStr, .65, 1.55);
	if (result === "W") return clamp(.52 + .38 * s, .55, 1);
	if (result === "D") return clamp(.5 + .22 * (s - 1), .28, .72);
	return clamp(.18 + .22 * (s - 1), .02, .42);
}
function scheduleForm(games) {
	if (!games || games.length === 0) return {
		formAdj: .5,
		sos: 1,
		label: "no sample",
		form: ""
	};
	let num = 0;
	let den = 0;
	let sosNum = 0;
	const letters = [];
	for (const g of [...games].reverse()) {
		const w = g.weight ?? (g.comp === "friendly" ? .35 : g.comp === "cup" ? .8 : 1);
		const s = g.oppStrength ?? 1;
		num += gameQuality(g.result, s) * w;
		den += w;
		sosNum += s * w;
		letters.push(g.result);
	}
	const formAdj = den > 0 ? num / den : .5;
	const sos = den > 0 ? sosNum / den : 1;
	return {
		formAdj,
		sos,
		label: sos >= 1.12 ? "hard fixtures" : sos <= .88 ? "soft fixtures" : "mixed fixtures",
		form: letters.join("")
	};
}
var H2H_W = [
	1,
	.75,
	.55,
	.4,
	.28,
	.2
];
/** Positive = current home side has been better in recent meetings. */
function h2hHomeEdge(meetings) {
	if (!meetings || meetings.length === 0) return 0;
	const recent = [...meetings].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
	let num = 0;
	let den = 0;
	recent.forEach((m, i) => {
		const w = H2H_W[i] ?? .15;
		let v = 0;
		if (m.result === "W") v = m.venue === "A" ? 1 : .65;
		else if (m.result === "L") v = m.venue === "H" ? -1 : -.65;
		num += v * w;
		den += w;
	});
	return den > 0 ? clamp(num / den, -1, 1) : 0;
}
function mergeRecent(primary, extra) {
	const map = /* @__PURE__ */ new Map();
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
function tweakSide(base, side, label) {
	let attack = base.attack;
	let defense = base.defense;
	let risk = 0;
	const notes = [];
	const form = side.formAdj ?? formScore(side.form);
	if (form != null) {
		let d = Math.max(-.25, Math.min(.25, form - .5));
		const sos = side.sos ?? 1;
		if (sos < .88 && form > .6) {
			d *= .5;
			notes.push(`${label} hot form on soft fixtures`);
		} else if (sos > 1.12 && form < .42) {
			d *= .65;
			notes.push(`${label} cold form against strong sides`);
		} else if (sos > 1.12 && form > .6) notes.push(`${label} winning against hard fixtures`);
		attack *= 1 + d * .12;
		defense *= 1 - d * .06;
	}
	if (side.restDays != null && side.restDays < 3.5) {
		attack *= side.restDays < 2 ? .92 : .96;
		defense *= side.restDays < 2 ? 1.04 : 1.02;
		risk += side.restDays < 2 ? .16 : .08;
		notes.push(`${label} on ${Math.max(0, Math.round(side.restDays))}d rest`);
	}
	const starterVal = Math.max(1, side.starterValue ?? 0);
	let missVal = 0;
	let missAtt = 0;
	let missDef = 0;
	const names = [];
	for (const p of side.unavailable) {
		const mv = p.marketValue && p.marketValue > 0 ? p.marketValue : 0;
		if (mv > 0 && mv < 5e6) continue;
		missVal += mv || 8e6;
		names.push(p.name);
		const star = mv > 25e6;
		if (p.pos === "gk") {
			missDef += star ? .08 : .05;
			risk += .18;
		} else if (p.pos === "def") {
			missDef += star ? .045 : .03;
			risk += star ? .1 : .05;
		} else if (p.pos === "fwd") {
			missAtt += star ? .055 : .035;
			risk += star ? .12 : .07;
		} else {
			missAtt += star ? .035 : .02;
			missDef += .012;
			risk += star ? .08 : .04;
		}
		if (p.kind === "suspension") risk += .04;
	}
	const frac = missVal / (starterVal + missVal || 1);
	if (names.length) {
		attack *= 1 - Math.min(.12, missAtt + frac * .1);
		defense *= 1 + Math.min(.1, missDef + frac * .08);
		if (names.length >= 3) risk += .08;
		if (names.length >= 5) risk += .12;
		const shown = names.slice(0, 3).join(", ");
		const extra = names.length > 3 ? ` +${names.length - 3}` : "";
		notes.push(`${label} without ${shown}${extra}`);
	}
	return {
		attack: clamp$1(attack, .45, 2.8),
		defense: clamp$1(defense, .5, 1.85),
		risk: clamp$1(risk, 0, 1),
		notes
	};
}
/** Shift attack/defence from lineups, injuries, rest, form, weather. */
function applyFacts(home, away, facts, homeAdv = 1.32) {
	if (!facts || facts.source === "none") return {
		home,
		away,
		homeAdv,
		homeRisk: 0,
		awayRisk: 0,
		totalsRisk: 0,
		notes: []
	};
	const h = tweakSide(home, facts.home, "Home");
	const a = tweakSide(away, facts.away, "Away");
	const notes = [
		...facts.notes || [],
		...h.notes,
		...a.notes
	];
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
			hAtt *= .94;
			aAtt *= .94;
			totalsRisk += wet ? .22 : .12;
			notes.push(wet ? `${w.description} — totals lean under` : `Wind ${w.windKph} kph`);
		}
	}
	let adv = homeAdv;
	if (facts.home.restDays != null && facts.away.restDays != null) {
		const gap = facts.home.restDays - facts.away.restDays;
		if (Math.abs(gap) >= 3) adv *= 1 + Math.sign(gap) * .03;
	}
	const edge = facts.h2h?.homeEdge ?? 0;
	if (Math.abs(edge) >= .18) {
		const tilt = edge * .05;
		hAtt *= 1 + tilt;
		aAtt *= 1 - tilt * .6;
		hDef *= 1 - tilt * .4;
		aDef *= 1 + tilt * .3;
		notes.push(edge > 0 ? "Recent H2H leans home, venue-weighted" : "Recent H2H leans away, venue-weighted");
	}
	const cupHang = (side) => (side.recent || []).some((g) => {
		if (g.comp === "league" || g.comp === "friendly") return false;
		const d = Date.parse(g.date);
		return Number.isFinite(d) && Date.now() - d >= 0 && Date.now() - d <= 36288e4;
	});
	if (cupHang(facts.away)) {
		aAtt *= .96;
		aDef *= 1.03;
		notes.push("Away midweek cup hangover");
	}
	if (cupHang(facts.home)) {
		hAtt *= .97;
		notes.push("Home midweek cup hangover");
	}
	if (facts.venueCity && /la paz|quito|bogot|mexico city|johannesburg|cusco|calama|potos|oruro|toluca/i.test(facts.venueCity)) {
		adv *= 1.05;
		notes.push(`Altitude venue (${facts.venueCity})`);
	}
	if ((facts.h2h?.recent?.length ?? 0) >= 4) {
		hAtt *= .98;
		aAtt *= .98;
		notes.push("Derby familiarity — both attacks a touch muted");
	}
	return {
		home: {
			attack: hAtt,
			defense: hDef
		},
		away: {
			attack: aAtt,
			defense: aDef
		},
		homeAdv: clamp$1(adv, 1, 1.55),
		homeRisk: h.risk,
		awayRisk: a.risk,
		totalsRisk,
		notes: notes.slice(0, 8)
	};
}
function ticketSideRisk(adj, selection) {
	if (selection === "home") return adj.homeRisk;
	if (selection === "away") return adj.awayRisk;
	if (selection === "draw") return Math.max(adj.homeRisk, adj.awayRisk) * .45;
	if (selection === "over" || selection === "yes") return adj.totalsRisk + (adj.homeRisk + adj.awayRisk) * .2;
	if (selection === "under" || selection === "no") return Math.max(0, .12 - adj.totalsRisk);
	return 0;
}
var TEAMS = [
	{
		id: "mci",
		name: "Manchester City",
		short: "MCI",
		attack: 2.12,
		defense: .72,
		hue: 196
	},
	{
		id: "ars",
		name: "Arsenal",
		short: "ARS",
		attack: 2.02,
		defense: .74,
		hue: 358
	},
	{
		id: "liv",
		name: "Liverpool",
		short: "LIV",
		attack: 1.98,
		defense: .78,
		hue: 352
	},
	{
		id: "che",
		name: "Chelsea",
		short: "CHE",
		attack: 1.76,
		defense: .86,
		hue: 214
	},
	{
		id: "tot",
		name: "Tottenham",
		short: "TOT",
		attack: 1.68,
		defense: .94,
		hue: 220
	},
	{
		id: "new",
		name: "Newcastle",
		short: "NEW",
		attack: 1.62,
		defense: .88,
		hue: 0
	},
	{
		id: "avl",
		name: "Aston Villa",
		short: "AVL",
		attack: 1.58,
		defense: .9,
		hue: 168
	},
	{
		id: "bha",
		name: "Brighton",
		short: "BHA",
		attack: 1.52,
		defense: .96,
		hue: 210
	},
	{
		id: "mun",
		name: "Manchester United",
		short: "MUN",
		attack: 1.48,
		defense: .98,
		hue: 356
	},
	{
		id: "ful",
		name: "Fulham",
		short: "FUL",
		attack: 1.36,
		defense: 1.02,
		hue: 220
	},
	{
		id: "whu",
		name: "West Ham",
		short: "WHU",
		attack: 1.28,
		defense: 1.08,
		hue: 14
	},
	{
		id: "cry",
		name: "Crystal Palace",
		short: "CRY",
		attack: 1.3,
		defense: .97,
		hue: 250
	},
	{
		id: "eve",
		name: "Everton",
		short: "EVE",
		attack: 1.18,
		defense: .95,
		hue: 214
	},
	{
		id: "bre",
		name: "Brentford",
		short: "BRE",
		attack: 1.34,
		defense: 1.06,
		hue: 12
	},
	{
		id: "bou",
		name: "Bournemouth",
		short: "BOU",
		attack: 1.4,
		defense: 1.1,
		hue: 354
	},
	{
		id: "nfo",
		name: "Nottm Forest",
		short: "NFO",
		attack: 1.22,
		defense: .99,
		hue: 8
	},
	{
		id: "wol",
		name: "Wolves",
		short: "WOL",
		attack: 1.12,
		defense: 1.12,
		hue: 48
	},
	{
		id: "lee",
		name: "Leeds",
		short: "LEE",
		attack: 1.26,
		defense: 1.14,
		hue: 220
	},
	{
		id: "sun",
		name: "Sunderland",
		short: "SUN",
		attack: 1.08,
		defense: 1.16,
		hue: 354
	},
	{
		id: "bur",
		name: "Burnley",
		short: "BUR",
		attack: .98,
		defense: 1.18,
		hue: 6
	}
];
var TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
function getTeam(id) {
	const t = TEAM_BY_ID[id];
	if (t) return t;
	const short = id.replace(/\W/g, "").slice(0, 3).toUpperCase() || "???";
	let hue = 0;
	for (let i = 0; i < id.length; i++) hue = hue * 31 + id.charCodeAt(i) >>> 0;
	return {
		id,
		name: id,
		short,
		attack: 1.25,
		defense: 1,
		hue: hue % 360
	};
}
var FIXTURES = [
	{
		id: "mw5-ars-tot",
		kickoff: "Sat 12:30",
		venue: "Emirates",
		homeId: "ars",
		awayId: "tot",
		book1x2: {
			home: 1.62,
			draw: 4.6,
			away: 5.6
		},
		bookTotals: {
			over25: 1.48,
			under25: 2.65,
			bttsYes: 1.58,
			bttsNo: 2.38
		},
		note: "North London. Slight plus on the home price versus the model."
	},
	{
		id: "mw5-mci-liv",
		kickoff: "Sat 17:30",
		venue: "Etihad",
		homeId: "mci",
		awayId: "liv",
		book1x2: {
			home: 2.05,
			draw: 3.6,
			away: 3.5
		},
		bookTotals: {
			over25: 1.55,
			under25: 2.45,
			bttsYes: 1.52,
			bttsNo: 2.5
		}
	},
	{
		id: "mw5-che-new",
		kickoff: "Sun 14:00",
		venue: "Stamford Bridge",
		homeId: "che",
		awayId: "new",
		book1x2: {
			home: 2.15,
			draw: 3.4,
			away: 3.4
		},
		bookTotals: {
			over25: 1.72,
			under25: 2.1,
			bttsYes: 1.7,
			bttsNo: 2.15
		}
	}
];
function pickUpcoming(list) {
	const live = list.filter((f) => f.status === "live");
	if (live.length) return live.slice().sort((a, b) => (b.elapsedMin || 0) - (a.elapsedMin || 0))[0];
	const pre = list.filter((f) => f.status === "pre" || !f.status);
	if (pre.length) return pre.slice().sort((a, b) => (a.kickoffIso || "").localeCompare(b.kickoffIso || ""))[0];
	return list.slice().sort((a, b) => (b.kickoffIso || "").localeCompare(a.kickoffIso || ""))[0];
}
function priceFixture(fixture, homeAdv = 1.32, rho = -.08, homeTeam, awayTeam, marketWeight = 0) {
	const home = homeTeam ?? getTeam(fixture.homeId);
	const away = awayTeam ?? getTeam(fixture.awayId);
	const frozen = fixture.settled && (fixture.status === "post" || fixture.status === "live");
	const adj = applyFacts(frozen ? {
		...home,
		attack: fixture.settled.home.attack,
		defense: fixture.settled.home.defense
	} : home, frozen ? {
		...away,
		attack: fixture.settled.away.attack,
		defense: fixture.settled.away.defense
	} : away, fixture.facts, homeAdv);
	if (frozen) adj.notes.unshift(`Frozen ${fixture.settled.asOf} — this score is not in the ratings`);
	const priced = priceMatch(adj.home, adj.away, {
		homeAdv: adj.homeAdv,
		rho
	});
	let m = priced.markets;
	const line = fixture.overLine ?? 2.5;
	let overP = Math.abs(line - 2.5) < .01 ? m.over25 : pOver(priced.matrix, line);
	let lambdaHome = priced.lambdaHome;
	let lambdaAway = priced.lambdaAway;
	if (fixture.status === "live" && fixture.score && fixture.score) {
		const frac = remainingFraction(fixture.elapsedMin, fixture.phase);
		const live = liveMarketsFromScore(priced.lambdaHome, priced.lambdaAway, rho, fixture.score, frac, line);
		m = live.markets;
		overP = m.over25;
		lambdaHome = live.remHome;
		lambdaAway = live.remAway;
		adj.notes.unshift(`In-play ${fixture.clock || ""} · remaining xG ${live.remHome.toFixed(2)}–${live.remAway.toFixed(2)}`);
	} else if (!frozen && marketWeight > 0 && fixture.bookSource === "market") {
		const book = marketFromOdds(fixture.book1x2);
		if (book) {
			const mixed = blendThreeWay({
				home: m.home,
				draw: m.draw,
				away: m.away
			}, book, marketWeight);
			m = {
				...m,
				home: mixed.home,
				draw: mixed.draw,
				away: mixed.away
			};
			adj.notes.push(`Market study ${Math.round(marketWeight * 100)}% toward close`);
		}
	}
	const selections = [
		{
			market: "1x2",
			selection: "home",
			label: `${home.short} win`,
			modelP: m.home,
			odds: fixture.book1x2.home,
			sideRisk: ticketSideRisk(adj, "home")
		},
		{
			market: "1x2",
			selection: "draw",
			label: "Draw",
			modelP: m.draw,
			odds: fixture.book1x2.draw,
			sideRisk: ticketSideRisk(adj, "draw")
		},
		{
			market: "1x2",
			selection: "away",
			label: `${away.short} win`,
			modelP: m.away,
			odds: fixture.book1x2.away,
			sideRisk: ticketSideRisk(adj, "away")
		},
		{
			market: "totals",
			selection: "over",
			label: `Over ${line}`,
			modelP: overP,
			odds: fixture.bookTotals.over25,
			sideRisk: ticketSideRisk(adj, "over")
		},
		{
			market: "totals",
			selection: "under",
			label: `Under ${line}`,
			modelP: 1 - overP,
			odds: fixture.bookTotals.under25,
			sideRisk: ticketSideRisk(adj, "under")
		},
		{
			market: "btts",
			selection: "yes",
			label: "BTTS yes",
			modelP: m.bttsYes,
			odds: fixture.bookTotals.bttsYes,
			sideRisk: ticketSideRisk(adj, "yes")
		},
		{
			market: "btts",
			selection: "no",
			label: "BTTS no",
			modelP: m.bttsNo,
			odds: fixture.bookTotals.bttsNo,
			sideRisk: ticketSideRisk(adj, "no")
		}
	];
	return {
		fixture,
		home,
		away,
		lambdaHome,
		lambdaAway,
		model: m,
		selections,
		homeRisk: adj.homeRisk,
		awayRisk: adj.awayRisk,
		factsNotes: adj.notes
	};
}
//#endregion
export { priceMatch as _, emptyFacts as a, summariseStudy as b, h2hHomeEdge as c, mergeRecent as d, newestForm as f, priceFixture as g, posGroup as h, blendThreeWay as i, liveMarketsFromScore as l, pickUpcoming as m, TEAMS as n, emptySide as o, pOver as p, applyFacts as r, emptyStudy as s, FIXTURES as t, marketFromOdds as u, remainingFraction as v, ticketSideRisk as x, scheduleForm as y };
