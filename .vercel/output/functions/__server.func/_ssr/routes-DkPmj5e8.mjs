import { i as __toESM } from "../_runtime.mjs";
import { c as formatPct, l as formatSignedPct, n as cn, s as formatOdds } from "./utils-C6P-Cf7I.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as ArrowUpRight } from "../_libs/lucide-react.mjs";
import { a as Route$7, c as enableAlerts, d as pushNotice, f as Button, l as markAlerted, o as alreadyAlerted, s as briefSentToday, u as markBriefSent } from "./router-DcSwOfsq.mjs";
import { t as Input } from "./input-BPwjQzsl.mjs";
import { n as Stat, t as Panel } from "./stat-rVv6e6iO.mjs";
import { g as priceFixture, v as remainingFraction } from "./fixtures-Chcd4jUa.mjs";
import { t as fractionalKelly } from "./kelly-WQ0YQtcf.mjs";
import { t as Badge } from "./badge-BTMFsW3e.mjs";
import { a as GateChip, c as bestCall, i as FactChip, l as scoreTicket, n as CallBadge, s as TeamMark } from "./bet-sheet-kqqn0Om-.mjs";
import { t as useDesk } from "./store-DN5jHrat.mjs";
import { n as useLedger, t as ledgerStats } from "./store-ledger-BjKkCpAJ.mjs";
import { t as useAutoSettle } from "./use-auto-settle-bBwQuR8q.mjs";
import { n as learnFromBets, t as effectiveBlend } from "./journal-learn-B2yLdh4z.mjs";
import { n as REGIONS } from "./leagues-BHa9XDnC.mjs";
import { a as dayLabel, c as weekStrip, i as dayKey, n as DayStrip, o as kickoffHm, r as dayHeading, s as todayKey, t as Chip } from "./day-strip-DcHs97Pj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DkPmj5e8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function actual1x2(score) {
	if (score.home > score.away) return "home";
	if (score.home < score.away) return "away";
	return "draw";
}
function gradeCall(call, score, side) {
	if (!score) return "sat";
	if (call.action === "pass") return "sat";
	const actual = actual1x2(score);
	const picked = side === "home" || side === "draw" || side === "away" ? side : null;
	if (!picked) return "sat";
	return picked === actual ? "hit" : "miss";
}
function scoreline(score) {
	return `${score.home}–${score.away}`;
}
function closeFor(row, side) {
	const b = row.fixture.book1x2;
	if (side === "home" && b.home > 1.01) return b.home;
	if (side === "draw" && b.draw > 1.01) return b.draw;
	if (side === "away" && b.away > 1.01) return b.away;
}
function meta(row, sel) {
	return {
		market: sel.market,
		source: row.fixture.bookSource,
		sideRisk: sel.sideRisk,
		factsNote: row.factsNotes[0],
		profile: row.fixture.profile,
		side: sel.selection
	};
}
function alertOnce(id, title, body) {
	if (alreadyAlerted(id)) return;
	markAlerted(id);
	pushNotice(title, body, id);
}
/** Snapshot BET while pre. Alert BET + LEAN once per day. Last look is the close. */
function useDeskLedger(live, finished, kellyF) {
	const syncLive = useLedger((s) => s.syncLive);
	const settle = useLedger((s) => s.settle);
	const addBet = useDesk((s) => s.addBet);
	const bankroll = useDesk((s) => s.bankroll);
	const alertsOn = useDesk((s) => s.alertsOn);
	const alertLeans = useDesk((s) => s.alertLeans);
	const liveKey = live.map((r) => `${r.fixture.id}:${r.fixture.book1x2.home}`).join("|");
	const doneKey = finished.map((r) => `${r.fixture.id}:${r.fixture.score?.home}-${r.fixture.score?.away}`).join("|");
	(0, import_react.useEffect)(() => {
		const calls = [];
		const sits = [];
		const possibles = [];
		for (const row of live) {
			if (row.fixture.status !== "pre") continue;
			const tickets = row.selections.filter((sel) => sel.market === "1x2").map((sel) => ({
				...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, meta(row, sel)),
				side: sel.selection
			}));
			const call = bestCall(tickets);
			const label = `${row.home.short} v ${row.away.short} · ${call.selection}`;
			if (call.action === "pass") {
				sits.push(row.fixture.id);
				continue;
			}
			possibles.push({
				id: `${row.fixture.id}:${call.selection}`,
				word: call.action === "bet" ? "BET" : "LEAN",
				label,
				ev: call.ev
			});
			if (call.action !== "bet") continue;
			const side = tickets.find((t) => t.selection === call.selection)?.side || "";
			calls.push({
				fixtureId: row.fixture.id,
				matchLabel: `${row.home.short} v ${row.away.short}`,
				league: row.fixture.leagueAbbr || row.fixture.leagueName || "",
				kickoffIso: row.fixture.kickoffIso || "",
				selection: call.selection,
				side,
				market: "1x2",
				word: "BET",
				odds: call.odds,
				modelP: call.modelP,
				ev: call.ev
			});
			addBet({
				fixtureId: row.fixture.id,
				matchLabel: `${row.home.short} v ${row.away.short}`,
				market: "1X2",
				selection: call.selection,
				side,
				odds: call.odds,
				modelP: call.modelP,
				stake: Math.round(bankroll * fractionalKelly(call.modelP, call.odds, kellyF) * 100) / 100
			});
		}
		syncLive(calls, sits);
		if (!alertsOn || typeof Notification === "undefined" || Notification.permission !== "granted") return;
		const bets = possibles.filter((p) => p.word === "BET");
		const leans = possibles.filter((p) => p.word === "LEAN");
		if (!briefSentToday() && possibles.length) {
			pushNotice("Fairline today", `${bets.length} BET · ${leans.length} possible · sit the rest`, "fairline-brief");
			markBriefSent();
		}
		for (const p of bets) alertOnce(p.id, "Fairline BET", `${p.label} · EV ${(p.ev * 100).toFixed(1)}%`);
		if (alertLeans) for (const p of leans.slice(0, 6)) alertOnce(p.id, "Fairline possible", `${p.label} · LEAN ${(p.ev * 100).toFixed(1)}%`);
	}, [
		liveKey,
		kellyF,
		syncLive,
		live,
		addBet,
		bankroll,
		alertsOn,
		alertLeans
	]);
	(0, import_react.useEffect)(() => {
		const desk = useDesk.getState();
		for (const row of finished) {
			if (row.fixture.status !== "post" || !row.fixture.score) continue;
			const actual = actual1x2(row.fixture.score);
			const open = useLedger.getState().tickets.filter((t) => t.fixtureId === row.fixture.id && t.result === "open");
			for (const t of open) {
				const close = t.closingOdds || closeFor(row, t.side) || t.odds;
				const won = t.side === actual;
				settle(row.fixture.id, won ? "win" : "loss", scoreline(row.fixture.score), close);
				for (const b of desk.bets) if (b.fixtureId === row.fixture.id && b.result === "open") desk.updateBet(b.id, {
					result: b.side && b.side !== t.side ? b.result : won ? "win" : "loss",
					closingOdds: close,
					autoSettled: true
				});
			}
		}
	}, [
		doneKey,
		finished,
		settle
	]);
}
function Board() {
	const slate = Route$7.useLoaderData();
	const search = Route$7.useSearch();
	const navigate = Route$7.useNavigate();
	const homeAdv = useDesk((s) => s.homeAdv);
	const rho = useDesk((s) => s.rho);
	const kellyF = useDesk((s) => s.kellyFractionUsed);
	const bets = useDesk((s) => s.bets);
	const ledgerTickets = useLedger((s) => s.tickets);
	const sitIds = useLedger((s) => s.sitIds);
	const introDone = useLedger((s) => s.introDone);
	const dismissIntro = useLedger((s) => s.dismissIntro);
	const setAlertsOn = useDesk((s) => s.setAlertsOn);
	useAutoSettle(slate.fixtures);
	const blendW = effectiveBlend(slate.study?.blendW ?? .22, (learnFromBets(bets).blendDelta + learnFromBets(ledgerTickets).blendDelta) / 2);
	const leagueId = search.league || "all";
	const region = search.region || "all";
	const query = (search.q || "").trim().toLowerCase();
	const callView = search.call === "bet" || search.call === "lean" ? search.call : "all";
	const today = todayKey();
	const days = weekStrip(today);
	const day = search.day && days.includes(search.day) ? search.day : today;
	const dayIsPast = day < today;
	const teamMap = (0, import_react.useMemo)(() => new Map(slate.teams.map((t) => [t.id, t])), [slate.teams]);
	const regionLeagues = slate.leagues.filter((l) => region === "all" || l.region === region);
	const pricedAll = (0, import_react.useMemo)(() => slate.fixtures.flatMap((f) => {
		const home = teamMap.get(f.homeId);
		const away = teamMap.get(f.awayId);
		if (!home || !away) return [];
		return [priceFixture(f, homeAdv, rho, home, away, f.status === "pre" ? blendW : 0)];
	}), [
		slate.fixtures,
		teamMap,
		homeAdv,
		rho,
		blendW
	]);
	const resultPricedAll = pricedAll.filter((r) => r.fixture.status === "post" || r.fixture.status === "live");
	const liveAll = pricedAll.filter((r) => r.fixture.status === "pre");
	const ticketMeta = (row, sel) => ({
		market: sel.market,
		source: row.fixture.bookSource,
		sideRisk: sel.sideRisk,
		factsNote: row.factsNotes[0],
		profile: row.fixture.profile,
		side: sel.selection,
		live: row.fixture.status === "live",
		remainingFrac: remainingFraction(row.fixture.elapsedMin, row.fixture.phase),
		clock: row.fixture.clock
	});
	useDeskLedger(liveAll, resultPricedAll, kellyF);
	const inRegion = (league) => !league || region === "all" || regionLeagues.some((l) => l.id === league);
	const dayCounts = Object.fromEntries(days.map((d) => [d, 0]));
	for (const row of pricedAll) {
		if (row.fixture.status === "live") continue;
		if (leagueId !== "all" && row.fixture.leagueId !== leagueId) continue;
		if (!inRegion(row.fixture.leagueId)) continue;
		const k = dayKey(row.fixture.kickoffIso);
		if (k in dayCounts) dayCounts[k] += 1;
	}
	const inPlay = pricedAll.filter((row) => {
		if (row.fixture.status !== "live") return false;
		if (leagueId !== "all" && row.fixture.leagueId !== leagueId) return false;
		if (!inRegion(row.fixture.leagueId)) return false;
		if (query) {
			if (!`${row.home.name} ${row.away.name} ${row.home.short} ${row.away.short} ${row.fixture.leagueName}`.toLowerCase().includes(query)) return false;
		}
		return true;
	}).sort((a, b) => (b.fixture.elapsedMin || 0) - (a.fixture.elapsedMin || 0));
	const priced = pricedAll.filter((row) => {
		if (row.fixture.status === "live") return false;
		if (leagueId !== "all" && row.fixture.leagueId !== leagueId) return false;
		if (!inRegion(row.fixture.leagueId)) return false;
		if (query) {
			if (!`${row.home.name} ${row.away.name} ${row.home.short} ${row.away.short} ${row.fixture.leagueName}`.toLowerCase().includes(query)) return false;
		}
		return dayKey(row.fixture.kickoffIso) === day;
	}).slice().sort((a, b) => (a.fixture.kickoffIso || "").localeCompare(b.fixture.kickoffIso || ""));
	function ticketsOf(rows) {
		const list = rows.flatMap((row) => row.selections.map((sel) => {
			return {
				row,
				sel,
				...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, ticketMeta(row, sel))
			};
		}).filter((x) => {
			if (x.call.action === "pass") return false;
			if (callView === "bet") return x.call.action === "bet";
			if (callView === "lean") return x.call.action === "lean";
			return true;
		}));
		list.sort((a, b) => a.call.action === "bet" && b.call.action !== "bet" ? -1 : b.ev - a.ev);
		return list;
	}
	const inPlayTickets = ticketsOf(inPlay);
	const liveTickets = ticketsOf(priced.filter((r) => r.fixture.status === "pre"));
	const betCalls = liveTickets.filter((e) => e.call.action === "bet");
	const rec = ledgerStats(ledgerTickets, sitIds.length);
	const leagueCards = regionLeagues.map((l) => {
		const rows = priced.filter((p) => p.fixture.leagueId === l.id);
		const liveN = inPlay.filter((p) => p.fixture.leagueId === l.id).length;
		return {
			...l,
			matchCount: rows.length + liveN
		};
	}).filter((l) => l.matchCount > 0);
	const selectedLeague = slate.leagues.find((l) => l.id === leagueId);
	const kickoffGroups = (() => {
		const map = /* @__PURE__ */ new Map();
		for (const row of priced) {
			const key = row.fixture.status === "post" ? "FT" : kickoffHm(row.fixture.kickoffIso) || row.fixture.kickoff || "TBD";
			const list = map.get(key) || [];
			list.push(row);
			map.set(key, list);
		}
		const order = (k) => k === "FT" ? "9" : k;
		return [...map.entries()].sort((a, b) => order(a[0]).localeCompare(order(b[0])));
	})();
	function setFilter(next) {
		navigate({ search: {
			league: next.league ?? leagueId,
			region: next.region ?? region,
			day: next.day ?? day,
			q: "q" in next ? next.q : query || void 0,
			call: "call" in next ? next.call : callView !== "all" ? callView : void 0,
			week: void 0
		} });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
						children: [
							slate.source === "espn" ? "Live desk" : "Demo",
							" · ",
							slate.leagues.length,
							" leagues ·",
							" ",
							new Date(slate.asOf).toLocaleTimeString("en-GB", {
								hour: "2-digit",
								minute: "2-digit"
							}),
							" UTC"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-3xl tracking-tight sm:text-4xl",
						children: dayHeading(day, today)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: [
							inPlay.length ? `${inPlay.length} in-play · ` : "",
							priced.length,
							" on ",
							dayLabel(day, today),
							selectedLeague ? ` · ${selectedLeague.name}` : region !== "all" ? ` · ${region}` : " · all leagues"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:min-w-80 sm:p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Sit rate",
							value: rec.sitRate != null ? formatPct(rec.sitRate, 0) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Tickets",
							value: `${betCalls.length + inPlayTickets.filter((e) => e.call.action === "bet").length}`,
							hint: inPlay.length ? `${inPlay.length} live` : `${liveTickets.length - betCalls.length} lean`,
							tone: betCalls.length || inPlayTickets.some((e) => e.call.action === "bet") ? "positive" : "neutral"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Hit",
							value: rec.hit != null ? formatPct(rec.hit, 0) : "—",
							tone: rec.hit == null ? "neutral" : rec.hit >= .5 ? "positive" : "negative"
						})
					]
				})]
			}),
			!introDone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-subtle p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-fg",
					children: "Pick a day — yesterday through the rest of the week. In-play sits above the slate and keeps updating. Install and turn on alerts — Grok is not required after that."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						onClick: dismissIntro,
						children: "Got it"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => {
							enableAlerts().then((ok) => {
								if (ok) setAlertsOn(true);
								dismissIntro();
							});
						},
						children: "Daily bet alerts"
					})]
				})]
			}) : null,
			inPlay.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl tracking-tight text-warn",
							children: "In-play"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-faint",
							children: [inPlay.length, " live worldwide · remaining xG · full in-play slate"]
						})]
					}),
					inPlayTickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: inPlayTickets.slice(0, 24).map(({ row, sel, ev, kelly, call }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TicketLine, {
							row,
							sel,
							ev,
							kelly,
							call,
							live: true
						}) }, `live-${row.fixture.id}-${sel.selection}`))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Live matches on. No in-play ticket clears the band yet."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
						children: inPlay.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameLine, {
							row,
							kellyF,
							ticketMeta,
							live: true
						}, row.fixture.id))
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "sticky top-14 z-20 -mx-4 space-y-2 bg-bg/90 px-4 py-3 backdrop-blur-md sm:top-16",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.16em] text-faint",
						children: "Day"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayStrip, {
						days,
						value: day,
						today,
						counts: dayCounts,
						onChange: (d) => setFilter({ day: d })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						children: REGIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: region === r.id && leagueId === "all",
							onClick: () => setFilter({
								league: "all",
								region: r.id
							}),
							children: r.label
						}, r.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
							active: leagueId === "all",
							tone: "subtle",
							onClick: () => setFilter({
								league: "all",
								region
							}),
							children: ["All", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1.5 tabular text-faint",
								children: priced.length
							})]
						}), leagueCards.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
							active: leagueId === l.id,
							tone: "subtle",
							onClick: () => setFilter({
								league: l.id,
								region: l.region
							}),
							children: [l.abbr, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1.5 tabular text-faint",
								children: l.matchCount
							})]
						}, l.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: search.q || "",
							placeholder: "Search team or league",
							onChange: (e) => setFilter({ q: e.target.value || void 0 }),
							className: "h-11 sm:max-w-xs"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									active: callView === "all",
									tone: "subtle",
									onClick: () => setFilter({ call: void 0 }),
									children: "All calls"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									active: callView === "bet",
									tone: "subtle",
									onClick: () => setFilter({ call: "bet" }),
									children: "BET"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									active: callView === "lean",
									tone: "subtle",
									onClick: () => setFilter({ call: "lean" }),
									children: "LEAN"
								})
							]
						})]
					})
				]
			}),
			slate.study?.n ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [
					"Market study · blend ",
					Math.round(blendW * 100),
					"% to close · ",
					slate.study.note
				]
			}) : null,
			!dayIsPast ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: "Tickets"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/record",
						className: "text-xs text-muted hover:text-fg",
						children: ["Record", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "ml-1 inline size-3" })]
					})]
				}), liveTickets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: callView === "bet" ? "No BET on this filter. Sitting is the product." : "No ticket clears the desk on this filter."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: liveTickets.slice(0, 12).map(({ row, sel, ev, kelly, call }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TicketLine, {
						row,
						sel,
						ev,
						kelly,
						call
					}) }, `${row.fixture.id}-${sel.market}-${sel.selection}`))
				})]
			}) : null,
			priced.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No matches on this day for that filter. Pick another date."
			}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: dayIsPast ? "Results" : "Slate"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-faint",
						children: [priced.length, " games · grouped by kickoff"]
					})]
				}), kickoffGroups.map(([when, rows]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("text-xs font-medium uppercase tracking-[0.16em]", when === "LIVE" ? "text-warn" : "text-faint"),
						children: when === "FT" ? "Full time" : when
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
						children: rows.map((row) => {
							const matchCall = bestCall(row.selections.map((sel) => ({
								...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, ticketMeta(row, sel)),
								...ticketMeta(row, sel)
							})));
							const called = row.selections.find((s) => s.label === matchCall.selection);
							const grade = row.fixture.status === "post" ? gradeCall(matchCall, row.fixture.score, called?.selection) : null;
							const ft = row.fixture.score ? scoreline(row.fixture.score) : null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "border-t border-border first:border-t-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/engine",
									search: {
										home: row.home.id,
										away: row.away.id,
										league: row.fixture.leagueId,
										id: row.fixture.id
									},
									className: "flex items-center gap-3 px-3 py-3 transition-colors duration-150 hover:bg-subtle/60 sm:px-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
												team: row.home,
												size: "sm"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
												team: row.away,
												size: "sm"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "truncate text-sm font-medium",
												children: [
													row.home.short,
													ft ? ` ${ft} ` : " – ",
													row.away.short,
													row.fixture.status === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "ml-2 text-warn",
														children: ["LIVE ", row.fixture.clock || ""]
													}) : null
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-0.5 truncate text-xs text-faint",
												children: [
													row.fixture.leagueAbbr,
													row.fixture.weekLabel ? ` · ${row.fixture.weekLabel}` : "",
													" · ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FactChip, { facts: row.fixture.facts }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateChip, { profile: row.fixture.profile })
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "hidden items-center gap-4 sm:flex",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsMini, {
													label: "1",
													book: row.fixture.book1x2.home,
													fair: 1 / row.model.home
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsMini, {
													label: "X",
													book: row.fixture.book1x2.draw,
													fair: 1 / row.model.draw
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsMini, {
													label: "2",
													book: row.fixture.book1x2.away,
													fair: 1 / row.model.away
												})
											]
										}),
										grade ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: grade === "hit" ? "positive" : grade === "miss" ? "negative" : "neutral",
											children: grade === "hit" ? "HIT" : grade === "miss" ? "MISS" : "SAT"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallBadge, { action: matchCall.action })
									]
								})
							}, row.fixture.id);
						})
					})]
				}, when))]
			})
		]
	});
}
function TicketLine({ row, sel, ev, kelly, call, live }) {
	const fmt = useDesk((s) => s.oddsFormat);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/engine",
		search: {
			home: row.home.id,
			away: row.away.id,
			league: row.fixture.leagueId,
			id: row.fixture.id
		},
		className: "flex items-center gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] sm:p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
					team: row.home,
					size: "sm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
					team: row.away,
					size: "sm"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "truncate text-sm font-medium",
					children: [
						row.home.short,
						"–",
						row.away.short,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-muted",
							children: sel.label
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-0.5 truncate text-xs text-faint",
					children: [
						live ? `LIVE ${row.fixture.clock || ""} · ` : "",
						row.fixture.leagueAbbr,
						" · ",
						kickoffHm(row.fixture.kickoffIso) || row.fixture.kickoff,
						" · ",
						formatOdds(sel.odds, 2, fmt)
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-end gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallBadge, { action: call.action }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "whitespace-nowrap text-xs text-faint tabular",
					children: [
						formatSignedPct(ev),
						" · ",
						formatPct(kelly, 1)
					]
				})]
			})
		]
	});
}
function GameLine({ row, kellyF, ticketMeta, live }) {
	const matchCall = bestCall(row.selections.map((sel) => ({
		...scoreTicket(sel.label, sel.modelP, sel.odds, kellyF, ticketMeta(row, sel)),
		...ticketMeta(row, sel)
	})));
	const called = row.selections.find((s) => s.label === matchCall.selection);
	const grade = row.fixture.status === "post" ? gradeCall(matchCall, row.fixture.score, called?.selection) : null;
	const ft = row.fixture.score ? scoreline(row.fixture.score) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
		className: "border-t border-border first:border-t-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/engine",
			search: {
				home: row.home.id,
				away: row.away.id,
				league: row.fixture.leagueId,
				id: row.fixture.id
			},
			className: "flex items-center gap-3 px-3 py-3 transition-colors duration-150 hover:bg-subtle/60 sm:px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
						team: row.home,
						size: "sm"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
						team: row.away,
						size: "sm"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-sm font-medium",
						children: [
							row.home.short,
							ft ? ` ${ft} ` : " – ",
							row.away.short,
							live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 text-warn",
								children: ["LIVE ", row.fixture.clock || ""]
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-0.5 truncate text-xs text-faint",
						children: [
							row.fixture.leagueAbbr,
							row.fixture.weekLabel ? ` · ${row.fixture.weekLabel}` : "",
							" · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FactChip, { facts: row.fixture.facts }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GateChip, { profile: row.fixture.profile })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden items-center gap-4 sm:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsMini, {
							label: "1",
							book: row.fixture.book1x2.home,
							fair: 1 / row.model.home
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsMini, {
							label: "X",
							book: row.fixture.book1x2.draw,
							fair: 1 / row.model.draw
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsMini, {
							label: "2",
							book: row.fixture.book1x2.away,
							fair: 1 / row.model.away
						})
					]
				}),
				grade ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: grade === "hit" ? "positive" : grade === "miss" ? "negative" : "neutral",
					children: grade === "hit" ? "HIT" : grade === "miss" ? "MISS" : "SAT"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallBadge, { action: matchCall.action })
			]
		})
	});
}
function OddsMini({ label, book, fair }) {
	const fmt = useDesk((s) => s.oddsFormat);
	const better = book > fair * 1.02;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-14 text-right",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-faint",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("text-sm tabular", better && "text-positive"),
			children: formatOdds(book, 2, fmt)
		})]
	});
}
//#endregion
export { Board as component };
