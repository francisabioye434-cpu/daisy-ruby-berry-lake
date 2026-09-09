import { c as formatPct, i as expectedValue, l as formatSignedPct, s as formatOdds, u as formatUnits } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as enableAlerts, f as Button, r as Route$4 } from "./router-DcSwOfsq.mjs";
import { t as Input } from "./input-BPwjQzsl.mjs";
import { t as Label } from "./label-CHikME_b.mjs";
import { n as Stat, t as Panel } from "./stat-rVv6e6iO.mjs";
import { t as Badge } from "./badge-BTMFsW3e.mjs";
import { t as useDesk } from "./store-DN5jHrat.mjs";
import { t as useAutoSettle } from "./use-auto-settle-bBwQuR8q.mjs";
import { n as learnFromBets } from "./journal-learn-B2yLdh4z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journal-BZFplTZu.js
var import_jsx_runtime = require_jsx_runtime();
function clv(bet) {
	if (!bet.closingOdds || bet.closingOdds <= 1) return null;
	return bet.odds / bet.closingOdds - 1;
}
function pnl(bet) {
	if (bet.result === "win") return bet.stake * (bet.odds - 1);
	if (bet.result === "loss") return -bet.stake;
	return 0;
}
function Journal() {
	const slate = Route$4.useLoaderData();
	const bets = useDesk((s) => s.bets);
	useAutoSettle(slate.fixtures);
	const learn = learnFromBets(bets);
	const bankroll = useDesk((s) => s.bankroll);
	const kellyF = useDesk((s) => s.kellyFractionUsed);
	const setBankroll = useDesk((s) => s.setBankroll);
	const setKellyFractionUsed = useDesk((s) => s.setKellyFractionUsed);
	const updateBet = useDesk((s) => s.updateBet);
	const removeBet = useDesk((s) => s.removeBet);
	const clearBets = useDesk((s) => s.clearBets);
	const alertsOn = useDesk((s) => s.alertsOn);
	const alertLeans = useDesk((s) => s.alertLeans);
	const setAlertsOn = useDesk((s) => s.setAlertsOn);
	const setAlertLeans = useDesk((s) => s.setAlertLeans);
	const voteBet = useDesk((s) => s.voteBet);
	const settled = bets.filter((b) => b.result === "win" || b.result === "loss");
	const profit = settled.reduce((s, b) => s + pnl(b), 0);
	const staked = settled.reduce((s, b) => s + b.stake, 0);
	const clvs = bets.map(clv).filter((x) => x !== null);
	const meanClv = clvs.length ? clvs.reduce((a, b) => a + b, 0) / clvs.length : 0;
	const beatClose = clvs.filter((x) => x > 0).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
					children: "Closing line journal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight",
					children: "Process, not last week"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/engine",
						children: "Price a match"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-4 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Open tickets",
						value: `${bets.filter((b) => b.result === "open").length}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Settled P/L",
						value: `${profit >= 0 ? "+" : ""}${formatUnits(profit, 0)}`,
						tone: profit > 0 ? "positive" : profit < 0 ? "negative" : "neutral",
						hint: staked ? `${formatSignedPct(profit / staked)} on staked` : "no settles yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Mean CLV",
						value: clvs.length ? formatSignedPct(meanClv) : "—",
						hint: clvs.length ? `${beatClose}/${clvs.length} beat close` : "auto-fills at FT"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Bankroll",
						value: formatUnits(bankroll, 0),
						hint: "units"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-tight",
					children: "What is working"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: learn.note
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-faint",
					children: [
						"Blend nudge ",
						learn.blendDelta >= 0 ? "+" : "",
						Math.round(learn.blendDelta * 100),
						" pts toward the book. Wins with a bad close are luck — they do not teach the model to chase that side."
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-tight",
					children: "Desk settings"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "br",
							children: "Bankroll (units)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "br",
							type: "number",
							min: 100,
							step: 100,
							value: bankroll,
							onChange: (e) => setBankroll(Number(e.target.value))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Kelly fraction used" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs tabular",
								children: formatPct(kellyF, 0)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: .1,
							max: 1,
							step: .05,
							value: kellyF,
							onChange: (e) => setKellyFractionUsed(Number(e.target.value)),
							className: "mt-2 h-11 w-full accent-accent"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-faint",
							children: "Quarter is 0.25. Full is 1.00."
						})
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: alertsOn ? "default" : "outline",
						onClick: () => {
							enableAlerts().then((ok) => setAlertsOn(ok || alertsOn));
						},
						children: alertsOn ? "Daily alerts on" : "Turn on daily alerts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: alertLeans ? "default" : "outline",
						onClick: () => setAlertLeans(!alertLeans),
						children: alertLeans ? "LEAN pings on" : "LEAN pings off"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-faint",
					children: "One ping per possible ticket per day. Install the app — the desk, journal and record live on this device. Grok is not required after install."
				})
			] }),
			bets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Empty blotter. BET calls on the board are written here automatically. After full time the desk marks win/loss and stamps the last pre-match price as the close. Learning uses that close, not last weekend’s winners."
			}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl tracking-tight",
						children: "Blotter"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: clearBets,
						children: "Clear"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: bets.map((bet) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BetRow, {
						bet,
						onChange: updateBet,
						onRemove: removeBet,
						onVote: voteBet
					}, bet.id))
				})]
			})
		]
	});
}
function BetRow({ bet, onChange, onRemove, onVote }) {
	const ev = expectedValue(bet.modelP, bet.odds);
	const c = clv(bet);
	const profit = pnl(bet);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium",
					children: [bet.matchLabel, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-muted",
						children: bet.selection
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-0.5 text-xs text-faint",
					children: [
						bet.market,
						" · ",
						formatOdds(bet.odds),
						" · model ",
						formatPct(bet.modelP),
						" · stake",
						" ",
						formatUnits(bet.stake, 1),
						" u · EV ",
						formatSignedPct(ev)
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: bet.result === "win" ? "positive" : bet.result === "loss" ? "negative" : "neutral",
					children: [
						bet.result,
						bet.result !== "open" ? ` ${profit >= 0 ? "+" : ""}${formatUnits(profit, 1)}` : "",
						bet.autoSettled ? " · auto" : ""
					]
				}), c !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: c > 0 ? "positive" : "negative",
					children: [formatSignedPct(c), " CLV"]
				}) : null]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid gap-2 sm:grid-cols-[8rem_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `cl-${bet.id}`,
					children: "Close"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: `cl-${bet.id}`,
					type: "number",
					min: 1.01,
					step: .01,
					placeholder: "odds",
					value: bet.closingOdds ?? "",
					onChange: (e) => onChange(bet.id, { closingOdds: e.target.value === "" ? void 0 : Number(e.target.value) })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end gap-2",
				children: [
					[
						"open",
						"win",
						"loss",
						"void"
					].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: bet.result === r ? "default" : "outline",
						onClick: () => onChange(bet.id, { result: r }),
						children: r
					}, r)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => onRemove(bet.id),
						children: "Remove"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: bet.vote === "take" ? "default" : "outline",
						onClick: () => onVote(bet.id, "take"),
						children: "I take"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: bet.vote === "sit" ? "default" : "outline",
						onClick: () => onVote(bet.id, "sit"),
						children: "I sit"
					})
				]
			})]
		})]
	});
}
//#endregion
export { Journal as component };
