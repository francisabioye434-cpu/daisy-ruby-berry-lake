import { c as formatPct, f as impliedProb, i as expectedValue, l as formatSignedPct, n as cn, s as formatOdds } from "./utils-C6P-Cf7I.mjs";
import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route$1 } from "./router-DcSwOfsq.mjs";
import { g as priceFixture } from "./fixtures-Chcd4jUa.mjs";
import { t as Badge } from "./badge-BTMFsW3e.mjs";
import { t as useDesk } from "./store-DN5jHrat.mjs";
import { n as learnFromBets, t as effectiveBlend } from "./journal-learn-B2yLdh4z.mjs";
import { t as Chip } from "./day-strip-DcHs97Pj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/screen-C9ZIPfyt.js
var import_jsx_runtime = require_jsx_runtime();
function overround(q) {
	const s = impliedProb(q.home) + impliedProb(q.draw) + impliedProb(q.away);
	return s > 0 ? s - 1 : 0;
}
function bestQuote(books) {
	if (!books.length) return null;
	return {
		book: "Best",
		home: Math.max(...books.map((b) => b.home)),
		draw: Math.max(...books.map((b) => b.draw)),
		away: Math.max(...books.map((b) => b.away))
	};
}
function arbPct(books) {
	const best = bestQuote(books);
	if (!best) return null;
	const sum = impliedProb(best.home) + impliedProb(best.draw) + impliedProb(best.away);
	if (sum <= 0 || sum >= 1) return null;
	return 1 - sum;
}
function evRows(priced, kellyF) {
	const rows = [];
	for (const p of priced) {
		if (p.fixture.status === "post") continue;
		const books = p.fixture.books?.filter((b) => b.home > 1.01 && b.draw > 1.01 && b.away > 1.01) || [];
		const quotes = books.length ? books : [{
			book: p.fixture.bookLabel || "Book",
			...p.fixture.book1x2
		}];
		const fair = {
			home: 1 / p.model.home,
			draw: 1 / p.model.draw,
			away: 1 / p.model.away
		};
		const sides = [
			{
				market: "1",
				selection: p.home.short,
				fair: fair.home,
				key: "home"
			},
			{
				market: "X",
				selection: "Draw",
				fair: fair.draw,
				key: "draw"
			},
			{
				market: "2",
				selection: p.away.short,
				fair: fair.away,
				key: "away"
			}
		];
		for (const side of sides) {
			let top = null;
			for (const q of quotes) {
				const odds = q[side.key];
				if (!(odds > 1.01)) continue;
				if (!top || odds > top.odds) top = {
					book: q.book,
					odds
				};
			}
			if (!top || top.odds < 1.25 || top.odds > 6.5) continue;
			const pTrue = side.key === "home" ? p.model.home : side.key === "draw" ? p.model.draw : p.model.away;
			const ev = expectedValue(pTrue, top.odds);
			if (ev < .03 || ev > .28) continue;
			const b = top.odds - 1;
			const q = 1 - pTrue;
			const full = (b * pTrue - q) / b;
			rows.push({
				fixture: p.fixture,
				home: p.home.short,
				away: p.away.short,
				market: side.market,
				selection: side.selection,
				fair: side.fair,
				book: top.book,
				odds: top.odds,
				ev,
				juice: overround(quotes[0]),
				kelly: Math.max(0, full * kellyF)
			});
		}
	}
	rows.sort((a, b) => b.ev - a.ev);
	return rows;
}
function arbRows(priced) {
	const out = [];
	for (const p of priced) {
		const books = p.fixture.books || [];
		if (books.length < 2) continue;
		const profit = arbPct(books);
		if (profit == null || profit < .002) continue;
		const h = books.reduce((a, b) => b.home > a.home ? b : a);
		const d = books.reduce((a, b) => b.draw > a.draw ? b : a);
		const a = books.reduce((a, b) => b.away > a.away ? b : a);
		out.push({
			fixture: p.fixture,
			home: p.home.short,
			away: p.away.short,
			homeBook: h.book,
			drawBook: d.book,
			awayBook: a.book,
			homeOdds: h.home,
			drawOdds: d.draw,
			awayOdds: a.away,
			profit
		});
	}
	out.sort((a, b) => b.profit - a.profit);
	return out;
}
function middleRows(priced) {
	const out = [];
	for (const p of priced) {
		const books = (p.fixture.books || []).filter((b) => b.line && b.over && b.under);
		if (books.length < 2) continue;
		for (let i = 0; i < books.length; i++) for (let j = 0; j < books.length; j++) {
			if (i === j) continue;
			const over = books[i];
			const under = books[j];
			const gap = (under.line || 0) - (over.line || 0);
			if (gap < .5) continue;
			out.push({
				fixture: p.fixture,
				home: p.home.short,
				away: p.away.short,
				overBook: over.book,
				underBook: under.book,
				overLine: over.line,
				underLine: under.line,
				gap,
				overOdds: over.over,
				underOdds: under.under
			});
		}
	}
	out.sort((a, b) => b.gap - a.gap);
	return out;
}
function holdRows(priced) {
	return priced.filter((p) => p.fixture.status !== "post").flatMap((p) => (p.fixture.books || [{
		book: p.fixture.bookLabel || "Book",
		...p.fixture.book1x2
	}]).map((b) => ({
		fixture: p.fixture,
		home: p.home.short,
		away: p.away.short,
		book: b.book,
		hold: overround(b),
		homeOdds: b.home,
		drawOdds: b.draw,
		awayOdds: b.away
	}))).sort((a, b) => a.hold - b.hold);
}
var VIEWS = [
	{
		id: "ev",
		label: "+EV"
	},
	{
		id: "odds",
		label: "Odds"
	},
	{
		id: "arb",
		label: "Arb"
	},
	{
		id: "middles",
		label: "Middles"
	},
	{
		id: "hold",
		label: "Hold"
	}
];
function ScreenPage() {
	const slate = Route$1.useLoaderData();
	const view = Route$1.useSearch().view || "ev";
	const navigate = Route$1.useNavigate();
	const homeAdv = useDesk((s) => s.homeAdv);
	const rho = useDesk((s) => s.rho);
	const kellyF = useDesk((s) => s.kellyFractionUsed);
	const fmt = useDesk((s) => s.oddsFormat);
	const bets = useDesk((s) => s.bets);
	const blendW = effectiveBlend(slate.study?.blendW ?? .22, learnFromBets(bets).blendDelta);
	const teamMap = new Map(slate.teams.map((t) => [t.id, t]));
	const priced = slate.fixtures.flatMap((f) => {
		if (f.status === "post") return [];
		const home = teamMap.get(f.homeId);
		const away = teamMap.get(f.awayId);
		if (!home || !away) return [];
		return [priceFixture(f, homeAdv, rho, home, away, f.status === "pre" ? blendW : 0)];
	});
	const ev = evRows(priced, kellyF);
	const arbs = arbRows(priced);
	const mids = middleRows(priced);
	const holds = holdRows(priced).slice(0, 40);
	const bookNames = [...new Set(priced.flatMap((p) => (p.fixture.books || []).map((b) => b.book)))].slice(0, 6);
	const nBooks = bookNames.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
						children: [
							"Screen · ",
							nBooks,
							" books · ",
							priced.length,
							" live markets"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl tracking-tight",
						children: "Shop the number"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: "Fairline fair vs DraftKings, Bet365 and every other book ESPN is sending. +EV is model vs best price. Arb is only when two books actually disagree."
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				children: VIEWS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
					active: view === v.id,
					onClick: () => navigate({ search: { view: v.id } }),
					children: [v.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-1.5 tabular text-faint",
						children: v.id === "ev" ? ev.length : v.id === "arb" ? arbs.length : v.id === "middles" ? mids.length : ""
					})]
				}, v.id))
			}),
			view === "ev" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EvTable, {
				rows: ev,
				fmt
			}) : view === "odds" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsTable, {
				priced,
				books: bookNames,
				fmt
			}) : view === "arb" ? arbs.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArbTable, {
				rows: arbs,
				fmt
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No 1X2 arb right now. That is normal — two books have to split."
			}) : view === "middles" ? mids.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MidTable, {
				rows: mids,
				fmt
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No total-line middle. Need two books with different O/U numbers."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldTable, {
				rows: holds,
				fmt
			})
		]
	});
}
function EvTable({ rows, fmt }) {
	if (!rows.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "No +EV vs the model on the shopped number."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[720px] text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-[11px] uppercase tracking-wider text-faint",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "EV"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Match"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Pick"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Fair"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Best"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Book"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Kelly"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.slice(0, 60).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: cn("px-3 py-2 font-mono tabular", r.ev >= .05 ? "text-positive" : "text-fg"),
						children: formatSignedPct(r.ev)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/engine",
							search: {
								home: r.fixture.homeId,
								away: r.fixture.awayId,
								league: r.fixture.leagueId,
								id: r.fixture.id
							},
							className: "hover:text-fg",
							children: [
								r.home,
								"–",
								r.away,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-xs text-faint",
									children: r.fixture.leagueAbbr
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-2",
						children: [
							r.market,
							" ",
							r.selection
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 font-mono tabular text-faint",
						children: formatOdds(r.fair, 2, fmt)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 font-mono tabular",
						children: formatOdds(r.odds, 2, fmt)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-xs text-muted",
						children: r.book
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 font-mono tabular text-faint",
						children: formatPct(r.kelly, 1)
					})
				]
			}, `${r.fixture.id}-${r.market}-${r.book}`)) })]
		})
	});
}
function OddsTable({ priced, books, fmt }) {
	const cols = books.length ? books : ["Book"];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[800px] text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-[11px] uppercase tracking-wider text-faint",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Match"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Fair 1X2"
						}),
						cols.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: b
						}, b))
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: priced.slice(0, 80).map((p) => {
				const fair = `${formatOdds(1 / p.model.home, 2, fmt)} ${formatOdds(1 / p.model.draw, 2, fmt)} ${formatOdds(1 / p.model.away, 2, fmt)}`;
				const quotes = p.fixture.books?.length ? p.fixture.books : [{
					book: "Book",
					...p.fixture.book1x2
				}];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/engine",
								search: {
									home: p.home.id,
									away: p.away.id,
									league: p.fixture.leagueId,
									id: p.fixture.id
								},
								children: [
									p.home.short,
									"–",
									p.away.short,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 text-xs text-faint",
										children: p.fixture.leagueAbbr
									}),
									p.fixture.status === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-2 text-warn",
										children: "LIVE"
									}) : null
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 font-mono text-xs tabular text-faint",
							children: fair
						}),
						cols.map((name) => {
							const q = quotes.find((b) => b.book === name) || (cols.length === 1 ? quotes[0] : null);
							if (!q) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-faint",
								children: "—"
							}, name);
							const bestH = Math.max(...quotes.map((b) => b.home));
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2 font-mono text-xs tabular",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: q.home === bestH ? "text-positive" : "",
										children: formatOdds(q.home, 2, fmt)
									}),
									" ",
									formatOdds(q.draw, 2, fmt),
									" ",
									formatOdds(q.away, 2, fmt)
								]
							}, name);
						})
					]
				}, p.fixture.id);
			}) })]
		})
	});
}
function ArbTable({ rows, fmt }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium",
					children: [
						r.home,
						"–",
						r.away,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-xs text-faint",
							children: r.fixture.leagueAbbr
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					tone: "positive",
					children: [formatPct(r.profit), " arb"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-muted",
				children: [
					"1 ",
					r.homeBook,
					" ",
					formatOdds(r.homeOdds, 2, fmt),
					" · X ",
					r.drawBook,
					" ",
					formatOdds(r.drawOdds, 2, fmt),
					" · 2",
					" ",
					r.awayBook,
					" ",
					formatOdds(r.awayOdds, 2, fmt)
				]
			})]
		}, r.fixture.id))
	});
}
function MidTable({ rows, fmt }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "space-y-2",
		children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm font-medium",
				children: [
					r.home,
					"–",
					r.away,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 text-xs text-faint",
						children: [
							r.fixture.leagueAbbr,
							" · gap ",
							r.gap
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-muted",
				children: [
					"Over ",
					r.overLine,
					" ",
					r.overBook,
					" ",
					formatOdds(r.overOdds, 2, fmt),
					" · Under ",
					r.underLine,
					" ",
					r.underBook,
					" ",
					formatOdds(r.underOdds, 2, fmt)
				]
			})]
		}, `${r.fixture.id}-${i}`))
	});
}
function HoldTable({ rows, fmt }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[640px] text-left text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
				className: "text-[11px] uppercase tracking-wider text-faint",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Hold"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Match"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "Book"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 font-medium",
							children: "1X2"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: cn("px-3 py-2 font-mono tabular", r.hold < .05 ? "text-positive" : ""),
						children: formatPct(r.hold)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-2",
						children: [
							r.home,
							"–",
							r.away
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "px-3 py-2 text-xs text-muted",
						children: r.book
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "px-3 py-2 font-mono text-xs tabular",
						children: [
							formatOdds(r.homeOdds, 2, fmt),
							" ",
							formatOdds(r.drawOdds, 2, fmt),
							" ",
							formatOdds(r.awayOdds, 2, fmt)
						]
					})
				]
			}, `${r.fixture.id}-${r.book}-${i}`)) })]
		})
	});
}
//#endregion
export { ScreenPage as component };
