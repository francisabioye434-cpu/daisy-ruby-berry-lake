import { t as clamp } from "./utils-C6P-Cf7I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bet-metrics-B670mQan.js
function implied(odds) {
	return odds > 1 ? 1 / odds : 0;
}
function expectedGf(g) {
	if (g.sog != null || g.shots != null) {
		const sog = g.sog ?? 0;
		const shots = g.shots ?? sog;
		return clamp(sog * .32 + Math.max(0, shots - sog) * .07, .15, 3.2);
	}
	const opp = g.oppStrength ?? 1;
	const venue = g.venue === "H" ? 1.32 : .95;
	return clamp(1.2 * venue / opp, .4, 2.4);
}
function finishingLuck(games) {
	const list = (games || []).filter((g) => g.comp !== "friendly" && (g.oppStrength != null || g.sog != null || g.shots != null));
	if (list.length === 0) return 0;
	let s = 0;
	for (const g of list) s += g.gf - expectedGf(g);
	return s / list.length;
}
function congestion(games, kickoffIso) {
	const t = kickoffIso ? Date.parse(kickoffIso) : Date.now();
	if (!Number.isFinite(t)) return 0;
	return (games || []).filter((g) => {
		const d = Date.parse(g.date);
		return Number.isFinite(d) && t - d >= 0 && t - d <= 648e6;
	}).length;
}
function venueRecord(games, venue) {
	const rec = {
		w: 0,
		d: 0,
		l: 0
	};
	for (const g of games || []) {
		if (g.venue !== venue) continue;
		if (g.result === "W") rec.w += 1;
		else if (g.result === "D") rec.d += 1;
		else rec.l += 1;
	}
	return rec;
}
function last2Score(games) {
	const g = (games || []).slice(0, 2);
	if (g.length < 2) return null;
	return g.reduce((s, x) => s + (x.result === "W" ? 1 : x.result === "D" ? .5 : 0), 0) / g.length;
}
function rate(games, pred) {
	const list = (games || []).filter((g) => g.comp !== "friendly");
	if (list.length === 0) return 0;
	return list.filter(pred).length / list.length;
}
function steamPts(close, open) {
	if (!close || !open || close <= 1 || open <= 1) return 0;
	return implied(close) - implied(open);
}
var ALTITUDE_CITIES = /la paz|quito|bogot|mexico city|ciudad de m[eé]xico|johannesburg|addis|cusco|calama|potos[ií]|oruro|toluca|puebla|denver|la paz/i;
function hangover(games, kickoffIso) {
	const t = kickoffIso ? Date.parse(kickoffIso) : Date.now();
	if (!Number.isFinite(t)) return false;
	return (games || []).some((g) => {
		if (g.comp === "league" || g.comp === "friendly") return false;
		const d = Date.parse(g.date);
		return Number.isFinite(d) && t - d >= 0 && t - d <= 36288e4;
	});
}
function juiceOf(book) {
	if (!book || book.home <= 1 || book.draw <= 1 || book.away <= 1) return 0;
	return implied(book.home) + implied(book.draw) + implied(book.away) - 1;
}
function derbyOf(facts, kickoffIso) {
	const meets = facts?.h2h?.recent || [];
	if (meets.length >= 4) return true;
	const t = kickoffIso ? Date.parse(kickoffIso) : Date.now();
	return meets.some((m) => {
		const d = Date.parse(m.date);
		return Number.isFinite(d) && Number.isFinite(t) && t - d > 0 && t - d <= 6912e6;
	});
}
function styleOf(h, a) {
	const bothBlank = h.failToScore >= .45 && a.failToScore >= .45;
	const bothLeaky = h.cleanSheets < .2 && a.cleanSheets < .2 && h.failToScore < .3 && a.failToScore < .3;
	if (bothBlank) return "caged";
	if (bothLeaky) return "open";
	return "mixed";
}
function suspCount(factsSide) {
	return (factsSide?.unavailable || []).filter((p) => p.kind === "suspension").length;
}
function motivationOf(h, a, week, totalWeeks) {
	if (!h || !a) return {
		score: .5,
		label: "table n/a"
	};
	const frac = totalWeeks && week ? week / totalWeeks : .15;
	if (frac < .12 || h.played < 5 && a.played < 5) return {
		score: .5,
		label: "early table"
	};
	const hRel = h.rank / Math.max(2, h.leagueSize);
	const aRel = a.rank / Math.max(2, a.leagueSize);
	if (frac > .72 && hRel > .3 && hRel < .7 && aRel > .3 && aRel < .7) return {
		score: .18,
		label: "dead rubber"
	};
	if (h.rank <= 6 && a.rank <= 6) return {
		score: .92,
		label: "top-table clash"
	};
	if (hRel >= .75 && aRel >= .75) return {
		score: .88,
		label: "relegation six-pointer"
	};
	if (Math.abs(h.rank - a.rank) >= 10) return {
		score: .42,
		label: "table mismatch"
	};
	return {
		score: .6,
		label: "standard fixture"
	};
}
function sideProfile(factsSide, table, venue, kickoffIso) {
	const games = factsSide?.recent;
	return {
		rank: table?.rank,
		played: table?.played,
		pts: table?.pts,
		leagueSize: table?.leagueSize,
		congestion: congestion(games, kickoffIso),
		luck: finishingLuck(games),
		failToScore: rate(games, (g) => g.gf === 0),
		cleanSheets: rate(games, (g) => g.ga === 0),
		venueRecord: venueRecord(games, venue),
		last2: last2Score(games),
		sos: factsSide?.sos,
		formAdj: factsSide?.formAdj
	};
}
function buildProfile(opts) {
	const facts = opts.facts;
	const mot = motivationOf(opts.homeTable, opts.awayTable, opts.week, opts.totalWeeks);
	const played = Math.min(opts.homeTable?.played ?? 99, opts.awayTable?.played ?? 99);
	const week = opts.week ?? 99;
	const w = facts?.weather;
	const home = sideProfile(facts?.home, opts.homeTable, "H", opts.kickoffIso);
	const away = sideProfile(facts?.away, opts.awayTable, "A", opts.kickoffIso);
	const restH = facts?.home.restDays ?? 6;
	const restA = facts?.away.restDays ?? 6;
	return {
		earlySeason: week <= 6 || played < 6,
		thinSample: Number.isFinite(played) && played > 0 && played < 3,
		motivation: mot.score,
		motivationLabel: mot.label,
		lineup: facts?.lineupKind ?? "none",
		steamHome: steamPts(opts.book?.home, opts.open?.home),
		steamDraw: steamPts(opts.book?.draw, opts.open?.draw),
		steamAway: steamPts(opts.book?.away, opts.open?.away),
		weatherRisk: Boolean(w && (w.precipChance >= 45 || w.windKph >= 28 || /rain|storm|snow/i.test(w.description))),
		refereeCards: facts?.referee?.yellowsPerGame,
		refereePens: facts?.referee?.pens,
		home,
		away,
		restGap: restH - restA,
		hangoverHome: hangover(facts?.home.recent, opts.kickoffIso),
		hangoverAway: hangover(facts?.away.recent, opts.kickoffIso),
		derby: derbyOf(facts, opts.kickoffIso),
		juice: juiceOf(opts.book),
		altitude: Boolean(facts?.venueCity && ALTITUDE_CITIES.test(facts.venueCity)),
		style: styleOf(home, away),
		suspensionsHome: suspCount(facts?.home),
		suspensionsAway: suspCount(facts?.away)
	};
}
function add(checks, id, label, status, detail) {
	checks.push({
		id,
		label,
		status,
		detail
	});
}
function steamFor(profile, side) {
	if (side === "home") return profile.steamHome;
	if (side === "away") return profile.steamAway;
	if (side === "draw") return profile.steamDraw;
	return 0;
}
function profileFor(profile, side) {
	if (side === "home") return profile.home;
	if (side === "away") return profile.away;
	return null;
}
function evaluateGates(opts) {
	const checks = [];
	const p = opts.profile;
	const t = opts.ticket;
	const side = t.side || "";
	const market = t.market || "1x2";
	if (!t.source || t.source !== "market") add(checks, "book", "Live book", "fail", "No live price. Desk will not call a model-made book.");
	else add(checks, "book", "Live book", "pass", t.source);
	if (t.live) {
		if (!Number.isFinite(t.odds) || t.odds < 1.28 || t.odds > 6.5) add(checks, "band", "Live odds", "fail", `${Number(t.odds).toFixed(2)} is outside 1.28–6.50`);
		else add(checks, "band", "Live odds", "pass", t.odds.toFixed(2));
	} else if (!Number.isFinite(t.odds) || t.odds < 1.45 || t.odds > 4.5) add(checks, "band", "Odds band", "fail", `${Number(t.odds).toFixed(2)} is outside 1.45–4.50`);
	else add(checks, "band", "Odds band", "pass", t.odds.toFixed(2));
	const impliedP = t.odds > 1 ? 1 / t.odds : 0;
	const gap = Math.abs(t.modelP - impliedP);
	if (gap > (t.live ? .16 : .11)) add(checks, "gap", "Model vs implied", "fail", `${(gap * 100).toFixed(0)} pt gap — broken rating`);
	else add(checks, "gap", "Model vs implied", "pass", `${(gap * 100).toFixed(0)} pts`);
	if (t.ev < .035 || t.kelly <= 0) add(checks, "ev", "Edge", "fail", `EV ${(t.ev * 100).toFixed(1)}% under the floor`);
	else if (t.ev < .08) add(checks, "ev", "Edge", "warn", `EV ${(t.ev * 100).toFixed(1)}% is LEAN only`);
	else add(checks, "ev", "Edge", "pass", `EV ${(t.ev * 100).toFixed(1)}%`);
	if (market !== "1x2") add(checks, "market", "Market type", "warn", "Totals/BTTS never get a BET");
	else add(checks, "market", "Market type", "pass", "1X2");
	const risk = t.sideRisk ?? 0;
	if (risk >= .55) add(checks, "injury", "Injuries / XI", "fail", `Risk ${(risk * 100).toFixed(0)}% veto`);
	else if (risk >= .32) add(checks, "injury", "Injuries / XI", "warn", `Risk ${(risk * 100).toFixed(0)}% — BET cut to LEAN`);
	else add(checks, "injury", "Injuries / XI", "pass", risk ? `Risk ${(risk * 100).toFixed(0)}%` : "No star-shaped hole");
	if (p) {
		if (p.lineup === "confirmed") add(checks, "xi", "Confirmed XI", "pass", "Confirmed");
		else if (p.lineup === "predicted") add(checks, "xi", "Confirmed XI", "warn", "Predicted XI — cannot BET");
		else add(checks, "xi", "Confirmed XI", "warn", "No XI yet — cannot BET");
		if (p.thinSample) add(checks, "sample", "Sample", "fail", "Fewer than 3 league games — ratings are noise");
		else if (p.earlySeason) add(checks, "sample", "Sample", "warn", "Early season / thin table — LEAN max");
		else add(checks, "sample", "Sample", "pass", "Enough games");
		add(checks, "motive", "Motivation", p.motivation < .25 ? "warn" : "pass", p.motivationLabel);
		const steam = steamFor(p, side);
		if (side === "home" || side === "away" || side === "draw") {
			if (steam <= -.045) add(checks, "steam", "Line move", "fail", "Steam against this side");
			else if (steam <= -.025) add(checks, "steam", "Line move", "warn", "Price drifting against you");
			else if (steam >= .04) add(checks, "steam", "Line move", "pass", "Money has come this side");
			else add(checks, "steam", "Line move", "pass", "Quiet number");
		}
		const sp = profileFor(p, side);
		if (sp) {
			if (sp.congestion >= 2) add(checks, "load", "Congestion", "warn", `${sp.congestion} league games in 7 days`);
			else add(checks, "load", "Congestion", "pass", sp.congestion ? `${sp.congestion} in last 7d` : "Clear week");
			if (sp.luck >= .55) add(checks, "luck", "Finishing luck", "fail", `Overperforming xG by ${sp.luck.toFixed(2)} GF — do not BET`);
			else if (sp.luck >= .32) add(checks, "luck", "Finishing luck", "warn", `Hot finishing (+${sp.luck.toFixed(2)} vs xG)`);
			else if (sp.luck <= -.4) add(checks, "luck", "Finishing luck", "warn", `Cold finishing (${sp.luck.toFixed(2)} vs xG)`);
			else add(checks, "luck", "Finishing luck", "pass", `${sp.luck >= 0 ? "+" : ""}${sp.luck.toFixed(2)} vs xG`);
			if (sp.failToScore >= .5 && (side === "home" || side === "away")) add(checks, "blank", "Fail to score", "warn", `Blanked ${(sp.failToScore * 100).toFixed(0)}% of recent`);
			else add(checks, "blank", "Fail to score", "pass", "Attack is converting");
			const vr = sp.venueRecord;
			const venueN = vr.w + vr.d + vr.l;
			if (venueN >= 2 && vr.w === 0 && (side === "home" || side === "away")) add(checks, "venue", "Venue split", "warn", `${vr.w}-${vr.d}-${vr.l} at this venue`);
			else add(checks, "venue", "Venue split", "pass", venueN ? `${vr.w}-${vr.d}-${vr.l} here` : "No venue sample");
			if (sp.sos != null && sp.sos < .88 && (sp.formAdj ?? 0) > .6) add(checks, "sos", "Strength of schedule", "warn", "Hot form on soft fixtures");
			else if (sp.sos != null && sp.sos > 1.12) add(checks, "sos", "Strength of schedule", "pass", "Hard recent fixtures");
			else add(checks, "sos", "Strength of schedule", "pass", sp.sos != null ? "Mixed fixtures" : "n/a");
		}
		if (market === "totals" || market === "btts") {
			if (p.weatherRisk) add(checks, "wx", "Weather", "warn", "Wind/rain — totals lean under");
			else add(checks, "wx", "Weather", "pass", "No weather veto");
			if (p.refereeCards != null && p.refereeCards >= 5) add(checks, "ref", "Referee", "pass", `${p.refereeCards.toFixed(1)} yellows/game — cards market only`);
			else add(checks, "ref", "Referee", "pass", p.refereeCards != null ? `${p.refereeCards.toFixed(1)} ylw/g` : "n/a");
		} else {
			add(checks, "wx", "Weather", p.weatherRisk ? "warn" : "pass", p.weatherRisk ? "Ugly conditions" : "Playable");
			add(checks, "ref", "Referee", "pass", p.refereePens != null ? `${p.refereePens} pens · not a 1X2 signal` : "Not a 1X2 signal");
		}
		if (p.juice >= .09) add(checks, "juice", "Book juice", "fail", `Hold ${(p.juice * 100).toFixed(1)}% — number is too soft to trade`);
		else if (p.juice >= .07) add(checks, "juice", "Book juice", "warn", `Hold ${(p.juice * 100).toFixed(1)}% — not a sharp close`);
		else if (p.juice > 0) add(checks, "juice", "Book juice", "pass", `Hold ${(p.juice * 100).toFixed(1)}%`);
		if ((side === "home" ? p.restGap < -2.5 : side === "away" ? p.restGap > 2.5 : Math.abs(p.restGap) >= 3) && (side === "home" || side === "away")) add(checks, "rest", "Rest mismatch", "warn", `This side is ${Math.abs(p.restGap).toFixed(1)}d shorter rest`);
		else add(checks, "rest", "Rest mismatch", "pass", `${p.restGap >= 0 ? "Home" : "Away"} +${Math.abs(p.restGap).toFixed(1)}d rest`);
		if (side === "home" && p.hangoverHome || side === "away" && p.hangoverAway || side === "draw" && (p.hangoverHome || p.hangoverAway)) add(checks, "euro", "Midweek hangover", "warn", "Continental/cup in the last 4 days — rotation risk");
		else add(checks, "euro", "Midweek hangover", "pass", "No midweek cup");
		if (p.derby) add(checks, "derby", "Derby / H2H heat", "warn", "Familiarity fixture — more variance, smaller edges");
		else add(checks, "derby", "Derby / H2H heat", "pass", "Not a derby");
		if (p.altitude && (side === "away" || market === "totals")) add(checks, "alt", "Altitude / venue", "warn", "Thin-air venue — away legs and totals move");
		else add(checks, "alt", "Altitude / venue", "pass", p.altitude ? "Home knows the air" : "Sea-level");
		if (p.style === "caged" && (side === "home" || side === "away")) add(checks, "style", "Style matchup", "warn", "Two low-event sides — 1X2 is a coin, draw is the shape");
		else if (p.style === "open" && market === "1x2") add(checks, "style", "Style matchup", "warn", "Open, leaky pair — more goals, fatter 1X2 variance");
		else add(checks, "style", "Style matchup", "pass", p.style === "open" ? "Open game" : p.style === "caged" ? "Caged" : "Mixed styles");
		const susp = side === "home" ? p.suspensionsHome : side === "away" ? p.suspensionsAway : p.suspensionsHome + p.suspensionsAway;
		if (susp >= 2) add(checks, "ban", "Suspensions", "warn", `${susp} banned — XI is not the usual press`);
		else if (susp === 1) add(checks, "ban", "Suspensions", "warn", "One suspension");
		else add(checks, "ban", "Suspensions", "pass", "No bans");
		const tape = steamFor(p, side);
		if ((side === "home" || side === "away" || side === "draw") && tape >= .035 && t.ev >= .035) add(checks, "agree", "Market agrees", "pass", "Steam and model on the same side");
		else if ((side === "home" || side === "away") && Math.abs(tape) < .02) add(checks, "agree", "Market agrees", "pass", "Quiet tape");
	} else add(checks, "xi", "Confirmed XI", "warn", "No fact sheet");
	const heat = opts.heat ?? 0;
	if (heat >= .12) add(checks, "heat", "Bankroll heat", "fail", `${(heat * 100).toFixed(0)}% already out`);
	else if (heat >= .06) add(checks, "heat", "Bankroll heat", "warn", `${(heat * 100).toFixed(0)}% already out`);
	else add(checks, "heat", "Bankroll heat", "pass", "Fresh book");
	if (opts.correlated) add(checks, "corr", "Correlation", "fail", "Open ticket already on this match/team");
	else add(checks, "corr", "Correlation", "pass", "Uncorrelated");
	const hardFail = checks.some((c) => c.status === "fail");
	const demote = checks.some((c) => c.status === "warn");
	const score = Math.max(0, 100 - checks.filter((c) => c.status === "fail").length * 18 - checks.filter((c) => c.status === "warn").length * 7);
	const failed = checks.filter((c) => c.status === "fail");
	const warned = checks.filter((c) => c.status === "warn");
	return {
		checks,
		hardFail,
		demote,
		score,
		summary: failed.length ? failed[0].detail : warned.length ? warned[0].detail : "All gates clear."
	};
}
//#endregion
export { evaluateGates as n, buildProfile as t };
