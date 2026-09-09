import type { ReactNode } from "react";
import { cn, formatPct, formatUnits } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { callTone, type CallAction, type DeskCall } from "@/lib/math/call";

export function CallBadge({
  action,
  className,
}: {
  action: CallAction;
  className?: string;
}) {
  const word = action === "bet" ? "BET" : action === "lean" ? "LEAN" : "NO BET";
  return (
    <Badge tone={callTone(action)} className={cn("whitespace-nowrap", className)}>
      {word}
    </Badge>
  );
}

export function DeskCallCard({
  call,
  bankroll,
  children,
  onLog,
}: {
  call: DeskCall;
  bankroll: number;
  children?: ReactNode;
  onLog?: () => void;
}) {
  const stake = Math.round(bankroll * call.kelly * 100) / 100;
  const canLog = Boolean(onLog) && call.action !== "pass";

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Desk call</p>
      <h2
        className={cn(
          "mt-2 font-display text-4xl tracking-tight sm:text-5xl",
          call.action === "bet" && "text-positive",
          call.action === "lean" && "text-warn",
          call.action === "pass" && "text-muted",
        )}
      >
        {call.word}
      </h2>
      {call.selection ? (
        <p className="mt-1 text-sm text-fg">
          {call.action === "pass" ? "Best side · " : "On "}
          <span className="font-medium">{call.selection}</span>
        </p>
      ) : null}
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{call.reason}</p>
      {call.action !== "pass" ? (
        <p className="mt-3 font-mono text-sm tabular text-fg">
          Stake {formatUnits(stake, 0)} u
          <span className="ml-2 text-muted">· {formatPct(call.kelly, 1)} of bankroll</span>
        </p>
      ) : null}
      {canLog || children ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {canLog ? (
            <Button size="sm" onClick={onLog}>
              Log this ticket
            </Button>
          ) : null}
          {children}
        </div>
      ) : null}
      <p className="mt-3 text-xs text-faint">
        Model signal, not a placed bet. Plus-EV still loses. BET only if every gate clears: live 1X2,
        confirmed XI, sample, luck, steam, injuries and bankroll. LEAN is optional. Default is sit.
      </p>
    </section>
  );
}
