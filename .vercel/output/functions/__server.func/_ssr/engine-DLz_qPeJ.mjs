import { i as __toESM } from "../_runtime.mjs";
import { a as fairOdds, c as formatPct, n as cn, s as formatOdds, u as formatUnits } from "./utils-C6P-Cf7I.mjs";
import { n as overround } from "./devig-yQ-VDeWP.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as ChevronDown } from "../_libs/lucide-react.mjs";
import { f as Button, i as Route$5 } from "./router-DcSwOfsq.mjs";
import { t as Input } from "./input-BPwjQzsl.mjs";
import { t as Label } from "./label-CHikME_b.mjs";
import { n as Stat, t as Panel } from "./stat-rVv6e6iO.mjs";
import { _ as priceMatch, i as blendThreeWay, l as liveMarketsFromScore, m as pickUpcoming, p as pOver, r as applyFacts, u as marketFromOdds, v as remainingFraction, x as ticketSideRisk } from "./fixtures-Chcd4jUa.mjs";
import { c as bestCall, l as scoreTicket, n as CallBadge, o as MatchFactsCard, r as DeskCallCard, s as TeamMark, t as BetSheet } from "./bet-sheet-kqqn0Om-.mjs";
import { t as useDesk } from "./store-DN5jHrat.mjs";
import { n as useLedger } from "./store-ledger-BjKkCpAJ.mjs";
import { t as useAutoSettle } from "./use-auto-settle-bBwQuR8q.mjs";
import { n as learnFromBets, t as effectiveBlend } from "./journal-learn-B2yLdh4z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-DLz_qPeJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ScoreMatrixGrid({ matrix, maxShow = 5 }) {
	let peak = 0;
	for (let h = 0; h <= maxShow; h++) for (let a = 0; a <= maxShow; a++) peak = Math.max(peak, matrix.joint[h][a]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-x-auto",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[20rem] border-separate border-spacing-1 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				className: "w-8 pb-1 text-[10px] font-medium uppercase tracking-wider text-faint",
				children: "H\\A"
			}), Array.from({ length: maxShow + 1 }, (_, a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				className: "pb-1 text-[10px] font-medium text-muted tabular",
				children: a
			}, a))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: Array.from({ length: maxShow + 1 }, (_, h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				className: "pr-1 text-[10px] font-medium text-muted tabular",
				children: h
			}), Array.from({ length: maxShow + 1 }, (_, a) => {
				const p = matrix.joint[h][a];
				const t = peak > 0 ? p / peak : 0;
				const isMode = p === peak && p > 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("flex h-10 items-center justify-center rounded-xs text-[11px] tabular sm:h-11 sm:text-xs", isMode ? "text-accent-fg" : t > .45 ? "text-fg" : "text-muted"),
					style: { background: isMode ? "var(--color-accent)" : `color-mix(in oklab, var(--color-fg) ${Math.round(t * 28)}%, var(--color-subtle))` },
					title: `${h}–${a} · ${formatPct(p, 2)}`,
					children: formatPct(p, 1).replace("%", "")
				}) }, a);
			})] }, h)) })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-faint",
			children: "Cell = probability of that scoreline (%). Highlight is the mode."
		})]
	});
}
function Engine() {
	const slate = Route$5.useLoaderData();
	const search = Route$5.useSearch();
	const navigate = Route$5.useNavigate();
	const desk = useDesk();
	useAutoSettle(slate.fixtures);
	const ledgerTickets = useLedger((s) => s.tickets);
	const blendW = effectiveBlend(slate.study?.blendW ?? .22, (learnFromBets(desk.bets).blendDelta + learnFromBets(ledgerTickets).blendDelta) / 2);
	const teamMap = (0, import_react.useMemo)(() => new Map(slate.teams.map((t) => [t.id, t])), [slate.teams]);
	const byLeague = search.league ? slate.fixtures.filter((f) => f.leagueId === search.league) : slate.fixtures;
	const fixture = slate.fixtures.find((f) => f.id === search.id) || byLeague.find((f) => f.homeId === search.home && f.awayId === search.away) || pickUpcoming(byLeague) || pickUpcoming(slate.fixtures);
	const home = fixture && teamMap.get(fixture.homeId) || slate.teams[0];
	const away = fixture && teamMap.get(fixture.awayId) || slate.teams.find((t) => t.id !== home?.id) || slate.teams[1];
	const leagueId = fixture?.leagueId || search.league || slate.leagues[0]?.id;
	const leagueFixtures = slate.fixtures.filter((f) => f.leagueId === leagueId).slice().sort((a, b) => {
		const rank = (s) => s === "live" ? 0 : s === "pre" || !s ? 1 : 2;
		const r = rank(a.status) - rank(b.status);
		if (r) return r;
		return (a.kickoffIso || "").localeCompare(b.kickoffIso || "");
	});
	const [oddsH, setOddsH] = (0, import_react.useState)(fixture?.book1x2.home ?? 2.1);
	const [oddsD, setOddsD] = (0, import_react.useState)(fixture?.book1x2.draw ?? 3.4);
	const [oddsA, setOddsA] = (0, import_react.useState)(fixture?.book1x2.away ?? 3.5);
	(0, import_react.useEffect)(() => {
		if (!fixture) return;
		setOddsH(fixture.book1x2.home);
		setOddsD(fixture.book1x2.draw);
		setOddsA(fixture.book1x2.away);
	}, [
		fixture?.id,
		fixture?.book1x2.home,
		fixture?.book1x2.draw,
		fixture?.book1x2.away
	]);
	const adj = (0, import_react.useMemo)(() => {
		if (!home || !away) return null;
		const frozen = fixture?.settled && (fixture.status === "post" || fixture.status === "live");
		const homeIn = frozen ? {
			...home,
			attack: fixture.settled.home.attack,
			defense: fixture.settled.home.defense
		} : home;
		const awayIn = frozen ? {
			...away,
			attack: fixture.settled.away.attack,
			defense: fixture.settled.away.defense
		} : away;
		const out = applyFacts(homeIn, awayIn, fixture?.facts, desk.homeAdv);
		if (frozen) out.notes.unshift(`Frozen ${fixture.settled.asOf} — this score is not in the ratings`);
		return out;
	}, [
		home,
		away,
		fixture,
		desk.homeAdv
	]);
	const priced = (0, import_react.useMemo)(() => {
		if (!home || !away || !adj || !fixture) return null;
		const raw = priceMatch(adj.home, adj.away, {
			homeAdv: adj.homeAdv,
			rho: desk.rho
		});
		if (fixture.status === "live" && fixture.score) {
			const frac = remainingFraction(fixture.elapsedMin, fixture.phase);
			const live = liveMarketsFromScore(raw.lambdaHome, raw.lambdaAway, desk.rho, fixture.score, frac, fixture.overLine ?? 2.5);
			return {
				...raw,
				lambdaHome: live.remHome,
				lambdaAway: live.remAway,
				markets: {
					...raw.markets,
					...live.markets
				}
			};
		}
		const w = fixture.status === "post" ? 0 : blendW;
		if (w > 0 && fixture.bookSource === "market") {
			const mkt = marketFromOdds(fixture.book1x2);
			if (mkt) {
				const mixed = blendThreeWay({
					home: raw.markets.home,
					draw: raw.markets.draw,
					away: raw.markets.away
				}, mkt, w);
				return {
					...raw,
					markets: {
						...raw.markets,
						...mixed
					}
				};
			}
		}
		return raw;
	}, [
		home,
		away,
		adj,
		desk.rho,
		fixture,
		blendW
	]);
	if (!home || !away || !priced || !fixture || !adj) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "No upcoming matches on the slate."
	}) });
	const line = fixture.overLine ?? 2.5;
	const overP = fixture.status === "live" || Math.abs(line - 2.5) < .01 ? priced.markets.over25 : pOver(priced.matrix, line);
	const factsNote = adj.notes[0];
	const openBets = desk.bets.filter((b) => b.result === "open");
	const heat = desk.bankroll > 0 ? openBets.reduce((s, b) => s + b.stake, 0) / desk.bankroll : 0;
	const correlated = openBets.some((b) => b.fixtureId === fixture.id || b.matchLabel.includes(home.short) || b.matchLabel.includes(away.short));
	const gateMeta = {
		profile: fixture.profile,
		heat,
		correlated,
		live: fixture.status === "live",
		remainingFrac: remainingFraction(fixture.elapsedMin, fixture.phase),
		clock: fixture.clock
	};
	const oneXtwo = [
		{
			key: "H",
			label: `${home.short} win`,
			p: priced.markets.home,
			odds: oddsH,
			market: "1x2",
			sel: "home"
		},
		{
			key: "X",
			label: "Draw",
			p: priced.markets.draw,
			odds: oddsD,
			market: "1x2",
			sel: "draw"
		},
		{
			key: "A",
			label: `${away.short} win`,
			p: priced.markets.away,
			odds: oddsA,
			market: "1x2",
			sel: "away"
		}
	].map((t) => {
		const meta = {
			market: t.market,
			source: fixture.bookSource,
			sideRisk: ticketSideRisk(adj, t.sel),
			factsNote,
			side: t.sel,
			...gateMeta
		};
		return {
			...t,
			...scoreTicket(t.label, t.p, t.odds, desk.kellyFractionUsed, meta),
			...meta
		};
	});
	const extras = [
		{
			key: "O",
			label: `Over ${line}`,
			p: overP,
			odds: fixture.bookTotals.over25,
			market: "totals",
			sel: "over"
		},
		{
			key: "U",
			label: `Under ${line}`,
			p: 1 - overP,
			odds: fixture.bookTotals.under25,
			market: "totals",
			sel: "under"
		},
		{
			key: "Y",
			label: "BTTS yes",
			p: priced.markets.bttsYes,
			odds: fixture.bookTotals.bttsYes,
			market: "btts",
			sel: "yes"
		},
		{
			key: "N",
			label: "BTTS no",
			p: priced.markets.bttsNo,
			odds: fixture.bookTotals.bttsNo,
			market: "btts",
			sel: "no"
		}
	].map((t) => {
		const meta = {
			market: t.market,
			source: t.market === "btts" ? "model" : fixture.bookSource,
			sideRisk: ticketSideRisk(adj, t.sel),
			factsNote,
			side: t.sel,
			...gateMeta
		};
		return {
			...t,
			...scoreTicket(t.label, t.p, t.odds, desk.kellyFractionUsed, meta),
			...meta
		};
	});
	const allTickets = [...oneXtwo, ...extras];
	const matchCall = bestCall(allTickets);
	const calledTicket = allTickets.find((t) => t.selection === matchCall.selection && t.odds === matchCall.odds);
	const vig = overround([
		oddsH,
		oddsD,
		oddsA
	]);
	function go(next) {
		navigate({ search: {
			...search,
			...next
		} });
	}
	function addTicket(t) {
		if (!fixture || t.ev <= 0) return;
		desk.addBet({
			fixtureId: fixture.id,
			matchLabel: `${home.short} v ${away.short}`,
			market: t.key === "O" || t.key === "U" ? "totals" : t.key === "Y" || t.key === "N" ? "btts" : "1X2",
			selection: t.label,
			odds: t.odds,
			modelP: t.p,
			stake: Math.round(desk.bankroll * t.kelly * 100) / 100,
			side: t.sel
		});
	}
	const outN = (fixture.facts?.home.unavailable.length || 0) + (fixture.facts?.away.unavailable.length || 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
					children: "Dixon–Coles engine"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight",
					children: "Match lab"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-sm text-sm text-muted",
					children: "Lineups, injuries, rest, form, luck, steam, table and bankroll all have to clear before a BET. Confirmed XIs are pulled again every couple of minutes. The book is studied on settled games; Dixon–Coles is never dropped."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "league",
						children: "League"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "league",
							value: leagueId,
							onChange: (e) => {
								const id = e.target.value;
								const first = pickUpcoming(slate.fixtures.filter((f) => f.leagueId === id));
								go({
									league: id,
									id: first?.id,
									home: first?.homeId,
									away: first?.awayId
								});
							},
							className: "flex h-11 w-full appearance-none rounded-md bg-subtle py-0 pl-3 pr-8 text-sm text-fg shadow-[var(--shadow-border)]",
							children: slate.leagues.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: l.id,
								children: [
									l.name,
									" (",
									l.matchCount,
									")"
								]
							}, l.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "match",
						children: "Match"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "match",
							value: fixture.id,
							onChange: (e) => {
								const fx = slate.fixtures.find((f) => f.id === e.target.value);
								if (!fx) return;
								go({
									id: fx.id,
									home: fx.homeId,
									away: fx.awayId,
									league: fx.leagueId
								});
							},
							className: "flex h-11 w-full appearance-none rounded-md bg-subtle py-0 pl-3 pr-8 text-sm text-fg shadow-[var(--shadow-border)]",
							children: leagueFixtures.map((f) => {
								const h = teamMap.get(f.homeId);
								const a = teamMap.get(f.awayId);
								const ft = f.score ? `${f.status === "live" ? "LIVE" : "FT"} ${f.score.home}–${f.score.away}${f.clock ? ` ${f.clock}` : ""}` : f.kickoff;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: f.id,
									children: [
										h?.short ?? "?",
										" v ",
										a?.short ?? "?",
										" · ",
										ft
									]
								}, f.id);
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
						team: home,
						size: "lg"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate font-display text-xl tracking-tight sm:text-2xl",
							children: [
								home.name,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-faint",
									children: "v"
								}),
								" ",
								away.name
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-faint",
							children: [
								fixture.leagueName,
								fixture.weekLabel ? ` · ${fixture.weekLabel}` : "",
								fixture.seasonLabel ? ` · ${fixture.seasonLabel}` : "",
								" · ",
								fixture.kickoff,
								fixture.score ? ` · ${fixture.status === "live" ? "LIVE" : "FT"} ${fixture.score.home}–${fixture.score.away}` : "",
								" ",
								"· λ ",
								priced.lambdaHome.toFixed(2),
								" – ",
								priced.lambdaAway.toFixed(2),
								" ·",
								" ",
								fixture.bookSource === "market" ? fixture.bookLabel : "model book",
								outN ? ` · ${outN} out` : ""
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamMark, {
						team: away,
						size: "lg"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskCallCard, {
				call: matchCall,
				bankroll: desk.bankroll,
				onLog: calledTicket && matchCall.action !== "pass" ? () => addTicket(calledTicket) : void 0
			}),
			calledTicket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BetSheet, {
				ticket: calledTicket,
				profile: fixture.profile,
				heat,
				correlated
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchFactsCard, { facts: fixture.facts }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Home",
						value: formatPct(priced.markets.home),
						hint: `fair ${formatOdds(fairOdds(priced.markets.home))}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Draw",
						value: formatPct(priced.markets.draw),
						hint: `fair ${formatOdds(fairOdds(priced.markets.draw))}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Away",
						value: formatPct(priced.markets.away),
						hint: `fair ${formatOdds(fairOdds(priced.markets.away))}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[1.15fr_0.85fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl tracking-tight",
						children: "Scoreline grid"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 mt-1 text-sm text-muted",
						children: "Poisson × Dixon–Coles τ, after the fact sheet."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreMatrixGrid, { matrix: priced.matrix })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl tracking-tight",
						children: "Derived markets"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-3 space-y-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: `Over ${line}`,
								v: formatPct(overP)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: `Under ${line}`,
								v: formatPct(1 - overP)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "BTTS yes",
								v: formatPct(priced.markets.bttsYes)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								k: "BTTS no",
								v: formatPct(priced.markets.bttsNo)
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl tracking-tight",
							children: "Model knobs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Home advantage",
								value: desk.homeAdv,
								min: 1,
								max: 1.6,
								step: .01,
								display: desk.homeAdv.toFixed(2),
								onChange: desk.setHomeAdv
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Knob, {
								label: "Dixon–Coles ρ",
								value: desk.rho,
								min: -.2,
								max: .05,
								step: .01,
								display: desk.rho.toFixed(2),
								onChange: desk.setRho
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs text-faint",
							children: "Attack/defence start from the table, then shift for XI, injuries, rest and weather."
						})
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl tracking-tight",
						children: "Book vs model"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"Overround ",
							formatPct(vig),
							" · stake uses ",
							formatPct(desk.kellyFractionUsed, 0),
							" Kelly on",
							" ",
							formatUnits(desk.bankroll),
							" u"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/devig",
						className: "text-sm text-muted underline-offset-4 hover:text-fg hover:underline",
						children: "Open the devig desk"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-3",
					children: [
						{
							label: "Home odds",
							value: oddsH,
							set: setOddsH
						},
						{
							label: "Draw odds",
							value: oddsD,
							set: setOddsD
						},
						{
							label: "Away odds",
							value: oddsA,
							set: setOddsA
						}
					].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: f.label,
							children: f.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: f.label,
							type: "number",
							inputMode: "decimal",
							min: 1.01,
							step: .01,
							value: Number.isFinite(f.value) ? f.value : "",
							onChange: (e) => f.set(Number(e.target.value))
						})]
					}, f.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-border",
					children: allTickets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-3 py-3 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-medium",
								children: [
									t.key,
									" · ",
									t.label
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-faint",
								children: [
									"model ",
									formatPct(t.p),
									" · fair ",
									formatOdds(t.fair),
									" · book ",
									formatOdds(t.odds),
									t.sideRisk ? ` · risk ${formatPct(t.sideRisk)}` : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallBadge, { action: t.call.action }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted tabular",
									children: ["stake ", formatPct(t.kelly, 1)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: t.call.action === "pass" ? "outline" : "default",
									disabled: t.ev <= 0,
									onClick: () => addTicket(t),
									children: "Journal"
								})
							]
						})]
					}, t.key))
				})
			] })
		]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "tabular",
			children: v
		})]
	});
}
function Knob({ label, value, min, max, step, display, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tabular text-fg",
			children: display
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type: "range",
		min,
		max,
		step,
		value,
		onChange: (e) => onChange(Number(e.target.value)),
		className: "mt-2 h-11 w-full accent-accent"
	})] });
}
//#endregion
export { Engine as component };
