import { a as fairOdds, c as formatPct, i as expectedValue, l as formatSignedPct, n as cn, s as formatOdds, u as formatUnits } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Shirt, m as Cloud, n as UserX, o as ShieldAlert, t as Wind, u as Flag } from "../_libs/lucide-react.mjs";
import { f as Button } from "./router-DcSwOfsq.mjs";
import { t as Panel } from "./stat-rVv6e6iO.mjs";
import { n as evaluateGates } from "./bet-metrics-B670mQan.mjs";
import { t as fractionalKelly } from "./kelly-WQ0YQtcf.mjs";
import { t as Badge } from "./badge-BTMFsW3e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bet-sheet-kqqn0Om-.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Tight band. Fake 30/1 "edges" and model-vs-itself books never get a BET.
* An 11-point gap vs the implied is a broken rating, not a gift.
*/
function isTradable(p, odds, meta) {
	if (!Number.isFinite(p) || !Number.isFinite(odds)) return false;
	if (meta?.source && meta.source !== "market") return false;
	if (meta?.live) {
		if ((meta.remainingFrac ?? 1) < .12) return false;
		if (odds < 1.28 || odds > 6.5) return false;
		if (p < .14 || p > .8) return false;
		const implied = 1 / odds;
		if (Math.abs(p - implied) > .16) return false;
		return true;
	}
	if (odds < 1.45 || odds > 4.5) return false;
	if (p < .22 || p > .68) return false;
	const implied = 1 / odds;
	if (Math.abs(p - implied) > .11) return false;
	return true;
}
function classifyEv(ev, kelly, ticket) {
	if (!Number.isFinite(ev) || !Number.isFinite(kelly)) return "pass";
	if (ticket && !isTradable(ticket.modelP, ticket.odds, ticket)) return "pass";
	if (kelly <= 0 || ev < .035) return "pass";
	const risk = ticket?.sideRisk ?? 0;
	if (risk >= .55) return "pass";
	const gates = ticket ? evaluateGates({
		profile: ticket.profile,
		ticket,
		heat: ticket.heat,
		correlated: ticket.correlated
	}) : null;
	if (gates?.hardFail) return "pass";
	const oneXtwo = !ticket?.market || ticket.market === "1x2";
	if (ticket?.live) {
		const frac = ticket.remainingFrac ?? 1;
		if (frac < .12 || frac > .92) return "pass";
		if (ev >= .1 && oneXtwo && risk < .32 && !gates?.demote) return "bet";
		if (ev >= .035) return "lean";
		return "pass";
	}
	if (ev >= .08 && oneXtwo && risk < .32 && !gates?.demote) return "bet";
	if (ev >= .035) return "lean";
	return "pass";
}
function ticketCall(ticket) {
	const tradable = isTradable(ticket.modelP, ticket.odds, ticket);
	const gates = evaluateGates({
		profile: ticket.profile,
		ticket,
		heat: ticket.heat,
		correlated: ticket.correlated
	});
	const action = classifyEv(ticket.ev, ticket.kelly, ticket);
	const fair = fairOdds(ticket.modelP);
	const word = action === "bet" ? "BET" : action === "lean" ? "LEAN" : "NO BET";
	const risk = ticket.sideRisk ?? 0;
	const factBit = ticket.factsNote ? ` ${ticket.factsNote}` : "";
	let reason;
	if (!tradable) reason = ticket.source !== "market" ? "No live book on this side. The desk does not call against a model-made price." : ticket.live ? "Outside the live band (market 1X2, odds 1.28–6.50, model within 16 pts of the implied). Pass." : "Outside the tight band (live 1X2, odds 1.45–4.50, model within 11 pts of the implied). Pass.";
	else if (gates.hardFail && action === "pass") reason = `${gates.summary} Pass.`;
	else if (risk >= .55) reason = `Lineups/injuries veto this side (risk ${formatPct(risk)}).${factBit} Pass.`;
	else if (action === "bet") reason = ticket.live ? `In-play ${ticket.clock || ""} · book ${formatOdds(ticket.odds)} vs fair ${formatOdds(fair)}. Edge ${formatSignedPct(ticket.ev)}. Live BET is tight on purpose.` : `Book ${formatOdds(ticket.odds)} vs fair ${formatOdds(fair)}. Edge ${formatSignedPct(ticket.ev)}. Gates ${gates.score}/100.${factBit}`;
	else if (action === "lean") {
		if (gates.demote && ticket.ev >= .08) reason = `Edge ${formatSignedPct(ticket.ev)} would be BET, but a gate cut it to LEAN: ${gates.summary}`;
		else if (risk >= .32 && ticket.ev >= .08) reason = `Edge ${formatSignedPct(ticket.ev)} would be BET, but absences/rest cut it to LEAN.${factBit}`;
		else reason = `Edge ${formatSignedPct(ticket.ev)} is real but thin${ticket.market && ticket.market !== "1x2" ? " (totals/BTTS never BET)" : ""}.${factBit} Optional, keep the stake small.`;
	} else if (ticket.kelly <= 0 || ticket.ev <= 0) reason = `Model ${formatPct(ticket.modelP)} does not beat ${formatOdds(ticket.odds)}. Pass.`;
	else reason = `Edge ${formatSignedPct(ticket.ev)} is under the 3.5% floor. Treat as noise.`;
	return {
		action,
		word,
		selection: ticket.selection,
		ev: ticket.ev,
		kelly: ticket.kelly,
		fair,
		modelP: ticket.modelP,
		odds: ticket.odds,
		reason
	};
}
function scoreTicket(selection, modelP, odds, kellyFractionUsed, meta) {
	const ev = expectedValue(modelP, odds);
	const kelly = fractionalKelly(modelP, odds, kellyFractionUsed);
	const call = ticketCall({
		selection,
		modelP,
		odds,
		ev,
		kelly,
		...meta
	});
	return {
		selection,
		modelP,
		odds,
		ev,
		kelly,
		fair: call.fair,
		call
	};
}
function emptyPass(reason = "No price on the board. Pass.") {
	return {
		action: "pass",
		word: "NO BET",
		selection: "",
		ev: 0,
		kelly: 0,
		fair: Infinity,
		modelP: 0,
		odds: 0,
		reason
	};
}
/** Highest-EV ticket, then classify it. Sitting out is the default. */
function bestCall(tickets) {
	if (tickets.length === 0) return emptyPass();
	return ticketCall([...tickets].sort((a, b) => b.ev - a.ev)[0]);
}
function callTone(action) {
	if (action === "bet") return "positive";
	if (action === "lean") return "warn";
	return "negative";
}
function TeamMark({ team, size = "md" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex shrink-0 items-center justify-center rounded-sm font-medium tracking-wide text-fg", size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-11 text-sm" : "size-9 text-xs"),
		style: {
			background: `hsl(${team.hue} 18% 18%)`,
			boxShadow: "inset 0 0 0 1px hsl(0 0% 100% / 0.08)"
		},
		"aria-hidden": true,
		children: (team.short || team.name || "?").slice(0, 3)
	});
}
function CallBadge({ action, className }) {
	const word = action === "bet" ? "BET" : action === "lean" ? "LEAN" : "NO BET";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		tone: callTone(action),
		className: cn("whitespace-nowrap", className),
		children: word
	});
}
function DeskCallCard({ call, bankroll, children, onLog }) {
	const stake = Math.round(bankroll * call.kelly * 100) / 100;
	const canLog = Boolean(onLog) && call.action !== "pass";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
				children: "Desk call"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: cn("mt-2 font-display text-4xl tracking-tight sm:text-5xl", call.action === "bet" && "text-positive", call.action === "lean" && "text-warn", call.action === "pass" && "text-muted"),
				children: call.word
			}),
			call.selection ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-fg",
				children: [call.action === "pass" ? "Best side · " : "On ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: call.selection
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-xl text-sm leading-relaxed text-muted",
				children: call.reason
			}),
			call.action !== "pass" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 font-mono text-sm tabular text-fg",
				children: [
					"Stake ",
					formatUnits(stake, 0),
					" u",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 text-muted",
						children: [
							"· ",
							formatPct(call.kelly, 1),
							" of bankroll"
						]
					})
				]
			}) : null,
			canLog || children ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-3",
				children: [canLog ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					onClick: onLog,
					children: "Log this ticket"
				}) : null, children]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-faint",
				children: "Model signal, not a placed bet. Plus-EV still loses. BET only if every gate clears: live 1X2, confirmed XI, sample, luck, steam, injuries and bankroll. LEAN is optional. Default is sit."
			})
		]
	});
}
function FormPills({ form }) {
	const letters = form.replace(/[^WDL]/gi, "").toUpperCase().slice(-5).split("");
	if (letters.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-xs text-faint",
		children: "No form yet"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex gap-0.5",
		children: letters.map((ch, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("inline-flex size-5 items-center justify-center rounded-sm text-[10px] font-medium", ch === "W" && "bg-positive/15 text-positive", ch === "D" && "bg-subtle text-muted", ch === "L" && "bg-negative/15 text-negative"),
			children: ch
		}, `${ch}-${i}`))
	});
}
function OppTag({ g }) {
	const s = g.oppStrength;
	const grade = g.comp === "friendly" ? "fr" : s == null ? "" : s >= 1.12 ? "top" : s <= .88 ? "soft" : "mid";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-baseline justify-between gap-2 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "truncate text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("mr-1.5 inline-flex size-4 items-center justify-center rounded-sm text-[10px] font-medium", g.result === "W" && "bg-positive/15 text-positive", g.result === "D" && "bg-subtle text-muted", g.result === "L" && "bg-negative/15 text-negative"),
					children: g.result
				}),
				g.gf,
				"-",
				g.ga,
				" vs ",
				g.opp,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ml-1 text-faint",
					children: [
						"(",
						g.venue,
						")"
					]
				})
			]
		}), grade ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("shrink-0 text-[10px] uppercase tracking-wide", grade === "top" && "text-warn", (grade === "soft" || grade === "fr") && "text-faint", grade === "mid" && "text-muted"),
			children: grade
		}) : null]
	});
}
function OutList({ players }) {
	if (players.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-faint",
		children: "No reported absences"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-1",
		children: players.slice(0, 6).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-baseline justify-between gap-2 text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "truncate text-fg",
				children: [p.name, p.pos !== "unk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1.5 uppercase text-faint",
					children: p.pos
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "shrink-0 text-muted",
				children: p.kind === "suspension" ? "susp" : p.eta || "out"
			})]
		}, p.name))
	});
}
function SideCol({ title, side, lineupKind }) {
	const recent = (side.recent || []).slice(0, 5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-wider text-faint",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormPills, { form: side.form }),
					side.record ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs text-muted",
						children: side.record
					}) : null,
					side.restDays != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-muted",
						children: [Math.round(side.restDays), "d rest"]
					}) : null
				]
			}),
			side.sosLabel && side.sosLabel !== "no sample" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1.5 text-xs text-muted",
				children: [side.sosLabel, side.formAdj != null ? ` · adj form ${(side.formAdj * 100).toFixed(0)}` : ""]
			}) : null,
			recent.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 space-y-1",
				children: recent.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OppTag, { g }, `${g.date}-${g.opp}`))
			}) : null,
			side.formation ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-muted",
				children: [
					lineupKind === "confirmed" ? "Confirmed" : lineupKind === "predicted" ? "Predicted" : "XI",
					" ",
					side.formation,
					side.coach ? ` · ${side.coach}` : ""
				]
			}) : null,
			side.starters.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 line-clamp-2 text-[11px] leading-relaxed text-faint",
				children: side.starters.map((p) => p.name.split(" ").slice(-1)[0]).join(" · ")
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-faint",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserX, {
							className: "size-3",
							strokeWidth: 1.75
						}),
						"Out (",
						side.unavailable.length,
						")"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutList, { players: side.unavailable })]
			}),
			side.insight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs leading-relaxed text-muted",
				children: side.insight
			}) : null,
			side.sog != null || side.shots != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-muted",
				children: [
					"Shots ",
					side.shots ?? "—",
					" · SoT ",
					side.sog ?? "—",
					side.possession != null ? ` · poss ${Math.round(side.possession)}%` : "",
					side.corners != null ? ` · cnr ${side.corners}` : ""
				]
			}) : null
		]
	});
}
function h2hLine(m) {
	return `${m.result} ${m.gf}–${m.ga} (${m.venue})`;
}
function MatchFactsCard({ facts }) {
	if (!facts || facts.source === "none") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "font-display text-xl tracking-tight",
		children: "Match facts"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-sm text-muted",
		children: "No lineup or injury sheet on this fixture yet."
	})] });
	const w = facts.weather;
	const h2h = facts.h2h;
	const lastH2h = (h2h?.recent || []).slice(0, 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: "Match facts"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [facts.lineupKind === "confirmed" ? "Confirmed XI" : facts.lineupKind === "predicted" ? "Predicted XI" : "Form sheet", facts.source === "fotmob" || facts.source === "mixed" ? " · live feed" : " · table feed"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-5 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideCol, {
				title: "Home",
				side: facts.home,
				lineupKind: facts.lineupKind
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SideCol, {
				title: "Away",
				side: facts.away,
				lineupKind: facts.lineupKind
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2",
			children: [
				w ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cloud, {
						className: "mt-0.5 size-3.5 shrink-0 text-faint",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-faint",
						children: "Weather"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "text-fg",
						children: [
							w.tempC,
							"°C · ",
							w.description,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-xs text-muted",
								children: [
									"Wind ",
									w.windKph,
									" kph · rain ",
									w.precipChance,
									"%"
								]
							})
						]
					})] })]
				}) : null,
				facts.referee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
						className: "mt-0.5 size-3.5 shrink-0 text-faint",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-faint",
						children: "Referee"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "text-fg",
						children: [facts.referee.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block text-xs text-muted",
							children: [facts.referee.yellowsPerGame != null ? `${facts.referee.yellowsPerGame.toFixed(1)} yellows/game` : "Cards n/a", facts.referee.pens != null ? ` · ${facts.referee.pens} pens` : ""]
						})]
					})] })]
				}) : null,
				h2h ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shirt, {
						className: "mt-0.5 size-3.5 shrink-0 text-faint",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-faint",
						children: "Head to head"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "text-fg",
						children: [lastH2h.length ? lastH2h.map(h2hLine).join(" · ") : `${h2h.homeWins}–${h2h.draws}–${h2h.awayWins}`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs text-muted",
							children: lastH2h.length ? `Last ${lastH2h.length}, venue-weighted · all-time ${h2h.homeWins}–${h2h.draws}–${h2h.awayWins}` : "home–draw–away all-time"
						})]
					})] })]
				}) : null,
				facts.venueCity || facts.surface ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wind, {
						className: "mt-0.5 size-3.5 shrink-0 text-faint",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-[11px] uppercase tracking-wider text-faint",
						children: "Venue"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
						className: "text-fg",
						children: [facts.venueCity || "—", facts.surface ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" · ", facts.surface]
						}) : null]
					})] })]
				}) : null
			]
		}),
		facts.home.unavailable.length + facts.away.unavailable.length >= 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-4 flex items-start gap-2 text-xs text-warn",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, {
				className: "mt-0.5 size-3.5 shrink-0",
				strokeWidth: 1.75
			}), "Heavy absences on this card. The desk will not BET the thinned side."]
		}) : null,
		facts.news.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-1 border-t border-border pt-3",
			children: facts.news.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "text-xs leading-relaxed text-muted",
				children: n
			}, n))
		}) : null
	] });
}
function FactChip({ facts }) {
	if (!facts || facts.source === "none") return null;
	const out = facts.home.unavailable.length + facts.away.unavailable.length;
	const formH = facts.home.form.replace(/[^WDL]/gi, "").slice(-5);
	const formA = facts.away.form.replace(/[^WDL]/gi, "").slice(-5);
	const soft = facts.home.sosLabel === "soft fixtures" || facts.away.sosLabel === "soft fixtures";
	if (!formH && !formA && out === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "text-faint",
		children: [
			formH && formA ? `${formH} / ${formA}` : formH || formA,
			soft ? " · soft" : "",
			out ? ` · ${out} out` : "",
			facts.home.sog != null && facts.away.sog != null ? ` · SoT ${facts.home.sog}-${facts.away.sog}` : ""
		]
	});
}
function tone(status) {
	if (status === "pass") return "bg-positive";
	if (status === "warn") return "bg-warn";
	return "bg-negative";
}
function BetSheet({ ticket, profile, heat, correlated }) {
	if (!ticket) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "font-display text-xl tracking-tight",
		children: "Betability sheet"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-sm text-muted",
		children: "No ticket on this card yet."
	})] });
	const result = evaluateGates({
		profile,
		ticket,
		heat,
		correlated
	});
	const fails = result.checks.filter((c) => c.status === "fail").length;
	const warns = result.checks.filter((c) => c.status === "warn").length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: "Betability sheet"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [
					result.score,
					"/100 · ",
					fails,
					" ",
					fails === 1 ? "veto" : "vetoes",
					" · ",
					warns,
					" ",
					warns === 1 ? "caution" : "cautions"
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: result.summary
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-border",
			children: result.checks.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-start gap-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("mt-1.5 size-1.5 shrink-0 rounded-full", tone(c.status)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg",
							children: c.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: c.detail
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-[11px] uppercase tracking-wide text-faint",
						children: c.status
					})
				]
			}, c.id))
		})
	] });
}
function GateChip({ profile }) {
	if (!profile) return null;
	const bits = [];
	if (profile.earlySeason) bits.push("early");
	if (profile.thinSample) bits.push("thin");
	if (profile.lineup !== "confirmed") bits.push(profile.lineup === "predicted" ? "pred XI" : "no XI");
	if (profile.motivation < .3) bits.push("dead");
	if (Math.abs(profile.steamHome) >= .03 || Math.abs(profile.steamAway) >= .03) bits.push("steam");
	if (profile.home.luck >= .32 || profile.away.luck >= .32) bits.push("luck");
	if (profile.home.congestion >= 2 || profile.away.congestion >= 2) bits.push("3 in 7");
	if (profile.weatherRisk) bits.push("wx");
	if (profile.derby) bits.push("derby");
	if (profile.hangoverHome || profile.hangoverAway) bits.push("hangover");
	if (profile.altitude) bits.push("altitude");
	if (profile.juice >= .07) bits.push("juice");
	if (profile.style === "caged") bits.push("caged");
	if (profile.style === "open") bits.push("open");
	if (bits.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "text-faint",
		children: [" · ", bits.slice(0, 4).join(" · ")]
	});
}
//#endregion
export { GateChip as a, bestCall as c, FactChip as i, scoreTicket as l, CallBadge as n, MatchFactsCard as o, DeskCallCard as r, TeamMark as s, BetSheet as t };
