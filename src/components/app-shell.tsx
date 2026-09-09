import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Copy, Crosshair, Download, LayoutGrid, Radar, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { registerFairlineWorker } from "@/lib/alerts";
import { useSlateRefresh } from "@/lib/use-slate-refresh";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapDesk } from "@/lib/data/desk-user";

const NAV = [
  { to: "/screen", label: "Screen", icon: Radar },
  { to: "/", label: "Board", icon: LayoutGrid },
  { to: "/engine", label: "Engine", icon: Crosshair },
  { to: "/record", label: "Record", icon: Trophy },
  { to: "/journal", label: "Journal", icon: BookOpen },
] as const;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone);
  return mq || ios;
}

function InstallControl() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
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

  if (installed) {
    return <p className="hidden text-xs text-faint sm:block">On your home screen</p>;
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    window.location.href = "/?install=1";
  }

  return (
    <Button variant="ghost" size="sm" onClick={install}>
      <Download className="size-3.5" strokeWidth={1.75} />
      <span className="hidden sm:inline">Install</span>
    </Button>
  );
}

function boardSearch(prev: Record<string, unknown>) {
  return {
    league: typeof prev.league === "string" ? prev.league : undefined,
    region: typeof prev.region === "string" ? prev.region : undefined,
    day: typeof prev.day === "string" ? prev.day : undefined,
  };
}

function CopyLink() {
  const [ok, setOk] = useState(false);

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

  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy link to this view">
      <Copy className="size-3.5" strokeWidth={1.75} />
      <span className="hidden sm:inline">{ok ? "Copied" : "Link"}</span>
    </Button>
  );
}

function Logo() {
  return (
    <Link to="/" search={boardSearch} className="group flex items-center gap-2.5">
      <span className="relative flex size-8 items-center justify-center rounded-sm bg-accent text-accent-fg">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path d="M4 16.5L10 7.5L14 13L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="6" r="1.4" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-lg leading-none tracking-tight">Fairline</span>
    </Link>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  useEffect(() => {
    if (!user) return;
    void bootstrapDesk().catch(() => {});
  }, [user]);
  if (isPending) return <div className="size-8 shrink-0 animate-pulse rounded-full bg-subtle" />;
  if (user) return <UserButton />;
  return (
    <Link to="/login" className="hidden h-9 items-center rounded-md px-2 text-sm text-muted hover:text-fg sm:inline-flex">
      Sign in
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useSlateRefresh(15_000);
  useEffect(() => {
    void registerFairlineWorker();
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.to === "/" ? boardSearch : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-subtle text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <item.icon className="size-3.5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <CopyLink />
            <Link
              to="/brain"
              className={cn(
                "hidden h-9 items-center rounded-md px-2 text-sm sm:inline-flex",
                pathname.startsWith("/brain") ? "bg-subtle text-fg" : "text-muted hover:text-fg",
              )}
            >
              IQ
            </Link>
            <Link
              to="/settings"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm",
                pathname.startsWith("/settings") ? "bg-subtle text-fg" : "text-muted hover:text-fg",
              )}
              aria-label="Settings"
            >
              <Settings className="size-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <AuthSlot />
            <InstallControl />
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-16">
        {children}
        <p className="mt-10 pb-4 text-center text-[11px] leading-relaxed text-faint">
          Fairline is an educational desk — not a bookmaker. Model prices can be wrong. Never stake money you cannot lose.
        </p>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                search={item.to === "/" ? boardSearch : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] tracking-wide",
                  active ? "text-fg" : "text-muted",
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
