import { evaluateGates, type GateCheck, type GateResult, type MatchProfile } from "@/lib/math/bet-metrics";
import type { TicketInput } from "@/lib/math/call";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/stat";

function tone(status: GateCheck["status"]) {
  if (status === "pass") return "bg-positive";
  if (status === "warn") return "bg-warn";
  return "bg-negative";
}

export function BetSheet({
  ticket,
  profile,
  heat,
  correlated,
}: {
  ticket?: TicketInput;
  profile?: MatchProfile;
  heat?: number;
  correlated?: boolean;
}) {
  if (!ticket) {
    return (
      <Panel>
        <h2 className="font-display text-xl tracking-tight">Betability sheet</h2>
        <p className="mt-2 text-sm text-muted">No ticket on this card yet.</p>
      </Panel>
    );
  }
  const result: GateResult = evaluateGates({ profile, ticket, heat, correlated });
  const fails = result.checks.filter((c) => c.status === "fail").length;
  const warns = result.checks.filter((c) => c.status === "warn").length;

  return (
    <Panel>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-xl tracking-tight">Betability sheet</h2>
        <p className="text-xs text-faint">
          {result.score}/100 · {fails} {fails === 1 ? "veto" : "vetoes"} · {warns}{" "}
          {warns === 1 ? "caution" : "cautions"}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted">{result.summary}</p>
      <ul className="mt-4 divide-y divide-border">
        {result.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-3 py-2">
            <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tone(c.status))} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{c.label}</p>
              <p className="text-xs text-muted">{c.detail}</p>
            </div>
            <span className="shrink-0 text-[11px] uppercase tracking-wide text-faint">{c.status}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function GateChip({ profile }: { profile?: MatchProfile }) {
  if (!profile) return null;
  const bits: string[] = [];
  if (profile.earlySeason) bits.push("early");
  if (profile.thinSample) bits.push("thin");
  if (profile.lineup !== "confirmed") bits.push(profile.lineup === "predicted" ? "pred XI" : "no XI");
  if (profile.motivation < 0.3) bits.push("dead");
  if (Math.abs(profile.steamHome) >= 0.03 || Math.abs(profile.steamAway) >= 0.03) bits.push("steam");
  if (profile.home.luck >= 0.32 || profile.away.luck >= 0.32) bits.push("luck");
  if (profile.home.congestion >= 2 || profile.away.congestion >= 2) bits.push("3 in 7");
  if (profile.weatherRisk) bits.push("wx");
  if (profile.derby) bits.push("derby");
  if (profile.hangoverHome || profile.hangoverAway) bits.push("hangover");
  if (profile.altitude) bits.push("altitude");
  if (profile.juice >= 0.07) bits.push("juice");
  if (profile.style === "caged") bits.push("caged");
  if (profile.style === "open") bits.push("open");
  if (bits.length === 0) return null;
  return <span className="text-faint"> · {bits.slice(0, 4).join(" · ")}</span>;
}
