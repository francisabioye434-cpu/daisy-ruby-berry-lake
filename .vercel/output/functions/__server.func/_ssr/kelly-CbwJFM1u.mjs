import { i as __toESM } from "../_runtime.mjs";
import { c as formatPct, i as expectedValue, l as formatSignedPct, u as formatUnits } from "./utils-C6P-Cf7I.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Button } from "./router-DcSwOfsq.mjs";
import { t as Input } from "./input-BPwjQzsl.mjs";
import { t as Label } from "./label-CHikME_b.mjs";
import { n as Stat, t as Panel } from "./stat-rVv6e6iO.mjs";
import { n as kellyFraction } from "./kelly-WQ0YQtcf.mjs";
import { t as Badge } from "./badge-BTMFsW3e.mjs";
import { a as Line, c as Tooltip, i as Area, n as YAxis, o as CartesianGrid, r as XAxis, s as ResponsiveContainer, t as ComposedChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/kelly-CbwJFM1u.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STRATEGY_LABEL = {
	flat: "Flat 1%",
	"kelly-full": "Full Kelly",
	"kelly-half": "Half Kelly",
	"kelly-quarter": "Quarter Kelly",
	martingale: "Martingale"
};
function mulberry32(seed) {
	let a = seed >>> 0;
	return function next() {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function percentile(sorted, q) {
	if (sorted.length === 0) return 0;
	const i = (sorted.length - 1) * q;
	const lo = Math.floor(i);
	const hi = Math.ceil(i);
	if (lo === hi) return sorted[lo];
	return sorted[lo] * (hi - i) + sorted[hi] * (i - lo);
}
function stakeFor(strategy, bankroll, initial, p, odds, flatFraction, martingaleUnit, consecutiveLosses) {
	if (bankroll <= 0) return 0;
	if (strategy === "flat") return Math.min(bankroll, initial * flatFraction);
	if (strategy === "kelly-full") return Math.min(bankroll, Math.max(0, bankroll * kellyFraction(p, odds)));
	if (strategy === "kelly-half") return Math.min(bankroll, Math.max(0, bankroll * kellyFraction(p, odds) * .5));
	if (strategy === "kelly-quarter") return Math.min(bankroll, Math.max(0, bankroll * kellyFraction(p, odds) * .25));
	const raw = martingaleUnit * 2 ** consecutiveLosses;
	return Math.min(bankroll, raw);
}
function simulateStrategy(strategy, cfg) {
	const rng = mulberry32(cfg.seed);
	const n = cfg.bets;
	const paths = cfg.paths;
	const initial = cfg.bankroll;
	const martingaleUnit = initial * cfg.flatFraction;
	const series = Array.from({ length: n + 1 }, () => []);
	const terminals = [];
	const drawdowns = [];
	let ruins = 0;
	let logGrowthSum = 0;
	for (let path = 0; path < paths; path++) {
		let bank = initial;
		let peak = initial;
		let maxDd = 0;
		let losses = 0;
		series[0].push(bank);
		for (let i = 0; i < n; i++) {
			const stake = stakeFor(strategy, bank, initial, cfg.p, cfg.odds, cfg.flatFraction, martingaleUnit, losses);
			const win = rng() < cfg.p;
			if (stake <= 0 || bank <= 0) bank = Math.max(0, bank);
			else if (win) {
				bank += stake * (cfg.odds - 1);
				losses = 0;
			} else {
				bank -= stake;
				losses += 1;
			}
			if (bank <= 1e-9) bank = 0;
			peak = Math.max(peak, bank);
			if (peak > 0) maxDd = Math.max(maxDd, (peak - bank) / peak);
			series[i + 1].push(bank);
		}
		terminals.push(bank);
		drawdowns.push(maxDd);
		if (bank <= 0) ruins += 1;
		logGrowthSum += Math.log(Math.max(bank, 1e-12) / initial) / n;
	}
	const median = [];
	const p10 = [];
	const p90 = [];
	for (let i = 0; i <= n; i++) {
		const col = series[i].slice().sort((a, b) => a - b);
		median.push(percentile(col, .5));
		p10.push(percentile(col, .1));
		p90.push(percentile(col, .9));
	}
	const termSorted = terminals.slice().sort((a, b) => a - b);
	const ddSorted = drawdowns.slice().sort((a, b) => a - b);
	return {
		median,
		p10,
		p90,
		terminal: terminals,
		ruinRate: ruins / paths,
		medianTerminal: percentile(termSorted, .5),
		meanLogGrowth: logGrowthSum / paths,
		medianMaxDrawdown: percentile(ddSorted, .5)
	};
}
var PRESETS = [
	{
		id: "coin",
		label: "Biased coin",
		p: .6,
		odds: 2
	},
	{
		id: "nfl",
		label: "Thin NFL −110",
		p: .54,
		odds: 1.91
	},
	{
		id: "fat",
		label: "Fat soccer dog",
		p: .42,
		odds: 2.7
	}
];
var COMPARE = [
	"kelly-quarter",
	"kelly-half",
	"kelly-full",
	"flat",
	"martingale"
];
function KellyLab() {
	const [p, setP] = (0, import_react.useState)(.6);
	const [odds, setOdds] = (0, import_react.useState)(2);
	const [bankroll, setBankroll] = (0, import_react.useState)(1e4);
	const [bets, setBets] = (0, import_react.useState)(200);
	const [seed, setSeed] = (0, import_react.useState)(7);
	const [focus, setFocus] = (0, import_react.useState)("kelly-half");
	const ev = expectedValue(p, odds);
	const fStar = kellyFraction(p, odds);
	const cfg = {
		p,
		odds,
		bankroll,
		bets,
		paths: 280,
		seed,
		flatFraction: .01
	};
	const results = (0, import_react.useMemo)(() => {
		return Object.fromEntries(COMPARE.map((s) => [s, simulateStrategy(s, cfg)]));
	}, [
		p,
		odds,
		bankroll,
		bets,
		seed
	]);
	const focusStats = results[focus];
	const chartData = focusStats.median.map((m, i) => ({
		i,
		median: m,
		p10: focusStats.p10[i],
		spread: Math.max(0, focusStats.p90[i] - focusStats.p10[i])
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
					children: "Bankroll lab"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight",
					children: "Kelly vs the folklore"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-sm text-muted sm:text-base",
					children: "Same sequence of wins and losses, five staking rules. Full Kelly maximises log-growth when p is known. Martingale maximises the chance of a small win — and the size of the eventual hole."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [PRESETS.map((pre) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: p === pre.p && odds === pre.odds ? "default" : "outline",
					onClick: () => {
						setP(pre.p);
						setOdds(pre.odds);
					},
					children: pre.label
				}, pre.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "ghost",
					onClick: () => setSeed((s) => s + 1),
					children: "Reseed"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "True p",
						value: p,
						min: .4,
						max: .7,
						step: .005,
						onChange: setP,
						display: formatPct(p, 1)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Decimal odds",
						value: odds,
						min: 1.2,
						step: .01,
						onChange: setOdds
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Bankroll (u)",
						value: bankroll,
						min: 100,
						step: 100,
						onChange: setBankroll
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: "Bets",
						value: bets,
						min: 20,
						max: 400,
						step: 10,
						onChange: setBets
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Edge",
						value: formatSignedPct(ev),
						tone: ev > 0 ? "positive" : ev < 0 ? "negative" : "neutral",
						hint: "EV per unit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Full Kelly",
						value: formatPct(Math.max(0, fStar), 1),
						hint: "f* of bankroll"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Half Kelly",
						value: formatPct(Math.max(0, fStar * .5), 1),
						hint: "the usual compromise"
					})
				]
			}),
			ev <= 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-negative",
				children: "Negative EV. No staking rule — Kelly, Martingale, or otherwise — has a positive expectation here. Raise p or the odds."
			}) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "p-3 sm:p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display text-xl tracking-tight",
						children: [STRATEGY_LABEL[focus], " · 10–90 band"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-faint",
						children: ["280 paths · seed ", seed]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-64 w-full sm:h-80",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
							data: chartData,
							margin: {
								top: 8,
								right: 8,
								left: 0,
								bottom: 0
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									stroke: "rgba(242,243,241,0.06)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "i",
									tick: {
										fill: "#6b726e",
										fontSize: 11
									},
									axisLine: false,
									tickLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									tick: {
										fill: "#6b726e",
										fontSize: 11
									},
									axisLine: false,
									tickLine: false,
									width: 48,
									tickFormatter: (v) => v >= 1e3 ? `${Math.round(v / 1e3)}k` : `${Math.round(v)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									contentStyle: {
										background: "#121413",
										border: "1px solid #2a2e2b",
										borderRadius: 8,
										fontSize: 12
									},
									labelFormatter: (l) => `Bet ${l}`,
									formatter: (value, name) => {
										const n = Number(value);
										const label = name === "median" ? "Median" : name === "p10" ? "P10" : "Band";
										return [formatUnits(n, 0), label];
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "p10",
									stackId: "band",
									stroke: "none",
									fill: "transparent",
									isAnimationActive: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "spread",
									stackId: "band",
									stroke: "none",
									fill: "rgba(212,216,213,0.16)",
									isAnimationActive: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									type: "monotone",
									dataKey: "median",
									stroke: "#d4d8d5",
									strokeWidth: 1.75,
									dot: false,
									isAnimationActive: false
								})
							]
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden grid-cols-[1.2fr_repeat(4,1fr)] gap-2 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wider text-faint sm:grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rule" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-right",
							children: "Median end"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-right",
							children: "Ruin"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-right",
							children: "Max DD"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-right",
							children: "Log growth"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: COMPARE.map((s) => {
					const r = results[s];
					const active = s === focus;
					const growth = Math.exp(r.meanLogGrowth) - 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setFocus(s),
						className: `grid w-full grid-cols-2 gap-2 px-4 py-3 text-left sm:grid-cols-[1.2fr_repeat(4,1fr)] ${active ? "bg-subtle" : "hover:bg-subtle/50"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "col-span-2 flex items-center gap-2 text-sm font-medium sm:col-span-1",
								children: [
									STRATEGY_LABEL[s],
									s === "martingale" && r.ruinRate > .05 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "negative",
										children: "fragile"
									}) : null,
									s === "kelly-half" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "default" }) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm tabular sm:text-right",
								children: [formatUnits(r.medianTerminal, 0), " u"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: `text-sm tabular sm:text-right ${r.ruinRate > .1 ? "text-negative" : "text-muted"}`,
								children: ["ruin ", formatPct(r.ruinRate, 1)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm tabular text-muted sm:text-right",
								children: ["DD ", formatPct(r.medianMaxDrawdown, 0)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm tabular sm:text-right",
								children: [formatSignedPct(growth), " /bet"]
							})
						]
					}) }, s);
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-faint",
				children: "Martingale doubles after each loss, capped by remaining bankroll. Ruin is defined as hitting zero. Paths share a seed family so a reseed reshuffles every rule together."
			})
		]
	});
}
function Field({ label, value, min, max, step, onChange, display }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs tabular",
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
		})]
	});
}
function Num({ label, value, min, max, step, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type: "number",
			min,
			max,
			step,
			value,
			onChange: (e) => onChange(Number(e.target.value))
		})]
	});
}
//#endregion
export { KellyLab as component };
