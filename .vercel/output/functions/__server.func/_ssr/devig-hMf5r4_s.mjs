import { i as __toESM } from "../_runtime.mjs";
import { a as fairOdds, c as formatPct, s as formatOdds } from "./utils-C6P-Cf7I.mjs";
import { t as devig } from "./devig-yQ-VDeWP.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Button } from "./router-DcSwOfsq.mjs";
import { t as Input } from "./input-BPwjQzsl.mjs";
import { t as Label } from "./label-CHikME_b.mjs";
import { n as Stat, t as Panel } from "./stat-rVv6e6iO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/devig-hMf5r4_s.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PRESETS = {
	two: {
		labels: ["Home", "Away"],
		odds: [1.91, 1.91]
	},
	three: {
		labels: [
			"Home",
			"Draw",
			"Away"
		],
		odds: [
			1.85,
			3.6,
			4.2
		]
	}
};
function DevigDesk() {
	const [mode, setMode] = (0, import_react.useState)("three");
	const [method, setMethod] = (0, import_react.useState)("multiplicative");
	const [odds, setOdds] = (0, import_react.useState)(PRESETS.three.odds);
	const labels = PRESETS[mode].labels;
	const result = (0, import_react.useMemo)(() => devig(odds.slice(0, labels.length), method), [
		odds,
		labels.length,
		method
	]);
	function setModeAndOdds(next) {
		setMode(next);
		setOdds(PRESETS[next].odds);
	}
	function setOdd(i, v) {
		setOdds((prev) => {
			const copy = prev.slice();
			copy[i] = v;
			return copy;
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
					children: "Margin desk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl tracking-tight",
					children: "Take the vig out"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-sm text-muted sm:text-base",
					children: "A book of 1.91 / 1.91 is not a coin flip. Each side implies 52.4%. The extra 4.8% is the overround. Devigging redistributes that margin so you can compare a model to a fair price, not a loaded one."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: mode === "two" ? "default" : "outline",
						onClick: () => setModeAndOdds("two"),
						children: "Two-way"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: mode === "three" ? "default" : "outline",
						onClick: () => setModeAndOdds("three"),
						children: "1X2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: method === "multiplicative" ? "default" : "outline",
						onClick: () => setMethod("multiplicative"),
						children: "Multiplicative"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: method === "additive" ? "default" : "outline",
						onClick: () => setMethod("additive"),
						children: "Additive"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-3 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Overround",
						value: formatPct(result.overround, 2),
						hint: "sum of implied − 1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Outcomes",
						value: `${labels.length}`,
						hint: mode === "two" ? "moneyline" : "home / draw / away"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Method",
						value: method === "multiplicative" ? "Prop." : "Add.",
						hint: method === "multiplicative" ? "scale implied to 100%" : "shave margin equally"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `grid gap-3 ${mode === "three" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`,
				children: labels.map((lab, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
						htmlFor: lab,
						children: [lab, " decimal odds"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: lab,
						type: "number",
						min: 1.01,
						step: .01,
						value: odds[i],
						onChange: (e) => setOdd(i, Number(e.target.value))
					})]
				}, lab))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: "Implied vs fair"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 divide-y divide-border",
				children: labels.map((lab, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid grid-cols-2 gap-3 py-3 sm:grid-cols-4 sm:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "col-span-2 text-sm font-medium sm:col-span-1",
							children: lab
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm tabular text-muted",
							children: ["implied ", formatPct(result.implied[i])]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm tabular",
							children: ["fair ", formatPct(result.fair[i])]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm tabular text-faint",
							children: ["no-vig ", formatOdds(fairOdds(result.fair[i]))]
						})
					]
				}, lab))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-tight",
				children: "Why this matters"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-3 text-sm leading-relaxed text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Multiplicative (proportional) keeps the ratios of the implied probabilities. It is the default on two-way US books and a clean teaching method for 1X2." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Additive subtracts the overround equally. On a three-way market it can push a longshot through zero, so Fairline floors and renormalises. Power methods exist; they rarely change the decision at these margins." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Compare your model p to the ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
							className: "text-fg",
							children: "fair"
						}),
						" column, not to 1/odds. If you skip this step you will think every favourite is underpriced."
					] })
				]
			})] })
		]
	});
}
//#endregion
export { DevigDesk as component };
