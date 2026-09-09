import { i as __toESM } from "../_runtime.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn } from "./utils-C6P-Cf7I.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as createRootRoute, b as require_jsx_runtime, d as useRouterState, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { c as Radar, d as Download, f as Crosshair, g as BookOpen, i as TriangleAlert, l as LayoutGrid, p as Copy, r as Trophy, s as Settings } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/load-slate-BCKKeg2V.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loadSlate = createServerFn({ method: "GET" }).handler(createSsrRpc("b6bcc7a864fa0da22ccffc87331cb9934c2ef88fb683110a3905e47f7f7ff80e"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-DcSwOfsq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,box-shadow] duration-150 ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			ghost: "bg-transparent text-fg hover:bg-subtle",
			outline: "bg-transparent text-fg hairline hairline-hover",
			subtle: "bg-subtle text-fg hover:bg-subtle/80",
			danger: "bg-negative/15 text-negative hover:bg-negative/25"
		},
		size: {
			default: "h-11 rounded-md px-4 text-sm",
			sm: "h-9 rounded-sm px-3 text-sm",
			lg: "h-12 rounded-lg px-5 text-sm",
			icon: "size-11 rounded-md",
			"icon-sm": "size-9 rounded-sm"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		...props
	});
});
Button.displayName = "Button";
var DAY_KEY = "fairline-alert-day";
var IDS_KEY = "fairline-alert-ids";
var BRIEF_KEY = "fairline-alert-brief";
function todayKey() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function loadDay() {
	if (typeof window === "undefined") return {
		day: todayKey(),
		ids: []
	};
	const day = localStorage.getItem(DAY_KEY) || "";
	const ids = JSON.parse(localStorage.getItem(IDS_KEY) || "[]");
	if (day !== todayKey()) return {
		day: todayKey(),
		ids: []
	};
	return {
		day,
		ids
	};
}
function save(ids) {
	localStorage.setItem(DAY_KEY, todayKey());
	localStorage.setItem(IDS_KEY, JSON.stringify(ids.slice(-80)));
}
function alreadyAlerted(id) {
	return loadDay().ids.includes(id);
}
function markAlerted(id) {
	const { ids } = loadDay();
	if (ids.includes(id)) return;
	save([...ids, id]);
}
function briefSentToday() {
	if (typeof window === "undefined") return true;
	return localStorage.getItem(BRIEF_KEY) === todayKey();
}
function markBriefSent() {
	localStorage.setItem(BRIEF_KEY, todayKey());
}
async function enableAlerts() {
	if (typeof window === "undefined" || typeof Notification === "undefined") return false;
	if (await Notification.requestPermission() !== "granted") return false;
	if ("serviceWorker" in navigator) try {
		const reg = await navigator.serviceWorker.register("/fairline-sw.js");
		await navigator.serviceWorker.ready;
		const periodic = reg.periodicSync;
		if (periodic) {
			if ((await navigator.permissions.query({ name: "periodic-background-sync" })).state === "granted") await periodic.register("fairline-daily", { minInterval: 432e5 });
		}
	} catch {}
	return true;
}
function pushNotice(title, body, tag) {
	if (typeof window === "undefined" || typeof Notification === "undefined") return;
	if (Notification.permission !== "granted") return;
	const payload = {
		type: "NOTIFY",
		title,
		body,
		tag,
		url: "/",
		renotify: false
	};
	const sw = navigator.serviceWorker?.controller;
	if (sw) {
		sw.postMessage(payload);
		return;
	}
	try {
		new Notification(title, {
			body,
			tag,
			icon: "/icon-192.png"
		});
	} catch {}
}
async function registerFairlineWorker() {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
	try {
		await navigator.serviceWorker.register("/fairline-sw.js");
	} catch {}
}
/** Fresh slate the moment the link opens, then while the desk stays open. */
function useSlateRefresh(everyMs = 15e3) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		const tick = () => {
			router.invalidate();
		};
		tick();
		const id = window.setInterval(tick, everyMs);
		const onVis = () => {
			if (document.visibilityState === "visible") tick();
		};
		const onShow = (e) => {
			if (e.persisted) tick();
		};
		document.addEventListener("visibilitychange", onVis);
		window.addEventListener("pageshow", onShow);
		window.addEventListener("focus", tick);
		return () => {
			window.clearInterval(id);
			document.removeEventListener("visibilitychange", onVis);
			window.removeEventListener("pageshow", onShow);
			window.removeEventListener("focus", tick);
		};
	}, [router, everyMs]);
}
var NAV = [
	{
		to: "/screen",
		label: "Screen",
		icon: Radar
	},
	{
		to: "/",
		label: "Board",
		icon: LayoutGrid
	},
	{
		to: "/engine",
		label: "Engine",
		icon: Crosshair
	},
	{
		to: "/record",
		label: "Record",
		icon: Trophy
	},
	{
		to: "/journal",
		label: "Journal",
		icon: BookOpen
	}
];
function isStandalone() {
	if (typeof window === "undefined") return false;
	const mq = window.matchMedia("(display-mode: standalone)").matches;
	const ios = "standalone" in window.navigator && Boolean(window.navigator.standalone);
	return mq || ios;
}
function InstallControl() {
	const [deferred, setDeferred] = (0, import_react.useState)(null);
	const [installed, setInstalled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setInstalled(isStandalone());
		const onPrompt = (e) => {
			e.preventDefault();
			setDeferred(e);
		};
		const onInstalled = () => {
			setInstalled(true);
			setDeferred(null);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);
	if (installed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "hidden text-xs text-faint sm:block",
		children: "On your home screen"
	});
	async function install() {
		if (deferred) {
			await deferred.prompt();
			if ((await deferred.userChoice).outcome === "accepted") setInstalled(true);
			setDeferred(null);
			return;
		}
		window.location.href = "/?install=1";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "ghost",
		size: "sm",
		onClick: install,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
			className: "size-3.5",
			strokeWidth: 1.75
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: "Install"
		})]
	});
}
function boardSearch(prev) {
	return {
		league: typeof prev.league === "string" ? prev.league : void 0,
		region: typeof prev.region === "string" ? prev.region : void 0,
		day: typeof prev.day === "string" ? prev.day : void 0
	};
}
function CopyLink() {
	const [ok, setOk] = (0, import_react.useState)(false);
	async function copy() {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			window.prompt("Copy this link", url);
		}
		setOk(true);
		window.setTimeout(() => setOk(false), 1600);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "ghost",
		size: "sm",
		onClick: copy,
		"aria-label": "Copy link to this view",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
			className: "size-3.5",
			strokeWidth: 1.75
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: ok ? "Copied" : "Link"
		})]
	});
}
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		search: boardSearch,
		className: "group flex items-center gap-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "relative flex size-8 items-center justify-center rounded-sm bg-accent text-accent-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 24 24",
				className: "size-4",
				fill: "none",
				"aria-hidden": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M4 16.5L10 7.5L14 13L20 6",
					stroke: "currentColor",
					strokeWidth: "1.8",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "20",
					cy: "6",
					r: "1.4",
					fill: "currentColor"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-lg leading-none tracking-tight",
			children: "Fairline"
		})]
	});
}
function AppShell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	useSlateRefresh(15e3);
	(0, import_react.useEffect)(() => {
		registerFairlineWorker();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-30 border-b border-border/80 bg-bg/85 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "hidden items-center gap-1 md:flex",
							children: NAV.map((item) => {
								const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: item.to,
									search: item.to === "/" ? boardSearch : void 0,
									className: cn("flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150", active ? "bg-subtle text-fg" : "text-muted hover:text-fg"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
										className: "size-3.5",
										strokeWidth: 1.75
									}), item.label]
								}, item.to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyLink, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/settings",
									className: cn("inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm", pathname.startsWith("/settings") ? "bg-subtle text-fg" : "text-muted hover:text-fg"),
									"aria-label": "Settings",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
										className: "size-3.5",
										strokeWidth: 1.75
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Settings"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InstallControl, {})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-16",
				children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-10 pb-4 text-center text-[11px] leading-relaxed text-faint",
					children: "Fairline is an educational desk — not a bookmaker. Model prices can be wrong. Never stake money you cannot lose."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-5",
					children: NAV.map((item) => {
						const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							search: item.to === "/" ? boardSearch : void 0,
							className: cn("flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] tracking-wide", active ? "text-fg" : "text-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
								className: "size-4",
								strokeWidth: 1.75
							}), item.label]
						}, item.to);
					})
				})
			})
		]
	});
}
var styles_default = "/assets/styles-XaZFmyaM.css";
var APP_NAME = "Fairline";
var Route$8 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Fairline auto-detects each league’s game week, fits Dixon–Coles from results so far, and calls BET only on a tight live-1X2 band."
			},
			{
				name: "theme-color",
				content: "#0a0b0a"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter$7 = () => import("./routes-DkPmj5e8.mjs");
var Route$7 = createFileRoute("/")({
	validateSearch: (s) => ({
		league: typeof s.league === "string" ? s.league : "all",
		region: typeof s.region === "string" ? s.region : "all",
		week: typeof s.week === "string" ? s.week : void 0,
		day: typeof s.day === "string" ? s.day : void 0,
		q: typeof s.q === "string" ? s.q : void 0,
		call: typeof s.call === "string" ? s.call : void 0
	}),
	loader: () => loadSlate(),
	staleTime: 0,
	pendingMs: 250,
	pendingComponent: BoardPending,
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
function BoardPending() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
				children: "Worldwide desk"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl tracking-tight",
				children: "Pulling the slate…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Detecting each league’s game week, then the XI and injury sheet."
			})
		]
	});
}
var $$splitComponentImporter$6 = () => import("./devig-hMf5r4_s.mjs");
var Route$6 = createFileRoute("/devig")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./engine-DLz_qPeJ.mjs");
function asId(v) {
	if (typeof v === "number" && Number.isFinite(v)) return String(v);
	if (typeof v === "string") return v.replace(/^"|"$/g, "").trim() || void 0;
}
var Route$5 = createFileRoute("/engine")({
	validateSearch: (s) => ({
		home: asId(s.home),
		away: asId(s.away),
		league: asId(s.league),
		id: asId(s.id)
	}),
	loader: () => loadSlate(),
	staleTime: 0,
	pendingMs: 250,
	pendingComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
			children: "Dixon–Coles engine"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl tracking-tight",
			children: "Loading matches…"
		})]
	}),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./journal-BZFplTZu.mjs");
var Route$4 = createFileRoute("/journal")({
	loader: () => loadSlate(),
	staleTime: 0,
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./kelly-CbwJFM1u.mjs");
var Route$3 = createFileRoute("/kelly")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./record-BP1T2LPg.mjs");
var Route$2 = createFileRoute("/record")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./screen-C9ZIPfyt.mjs");
var Route$1 = createFileRoute("/screen")({
	validateSearch: (s) => ({ view: typeof s.view === "string" ? s.view : "ev" }),
	loader: () => loadSlate(),
	staleTime: 0,
	pendingMs: 250,
	pendingComponent: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs font-medium uppercase tracking-[0.18em] text-muted",
		children: "Screen"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "mt-2 font-display text-4xl tracking-tight",
		children: "Pulling books…"
	})] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./settings-g4tnslXa.mjs");
var Route = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$7.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$8
	}),
	DevigRoute: Route$6.update({
		id: "/devig",
		path: "/devig",
		getParentRoute: () => Route$8
	}),
	EngineRoute: Route$5.update({
		id: "/engine",
		path: "/engine",
		getParentRoute: () => Route$8
	}),
	JournalRoute: Route$4.update({
		id: "/journal",
		path: "/journal",
		getParentRoute: () => Route$8
	}),
	KellyRoute: Route$3.update({
		id: "/kelly",
		path: "/kelly",
		getParentRoute: () => Route$8
	}),
	RecordRoute: Route$2.update({
		id: "/record",
		path: "/record",
		getParentRoute: () => Route$8
	}),
	ScreenRoute: Route$1.update({
		id: "/screen",
		path: "/screen",
		getParentRoute: () => Route$8
	}),
	SettingsRoute: Route.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$8
	})
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { Route$7 as a, enableAlerts as c, pushNotice as d, Button as f, Route$5 as i, markAlerted as l, Route$1 as n, alreadyAlerted as o, Route$4 as r, briefSentToday as s, router_exports as t, markBriefSent as u };
