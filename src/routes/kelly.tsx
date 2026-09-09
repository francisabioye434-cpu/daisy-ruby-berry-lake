import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  simulateStrategy,
  STRATEGY_LABEL,
  type SimConfig,
  type StakeStrategy,
} from "@/lib/math/simulate";
import { expectedValue } from "@/lib/math/odds";
import { kellyFraction } from "@/lib/math/kelly";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, Stat } from "@/components/stat";
import { formatPct, formatSignedPct, formatUnits } from "@/lib/utils";

export const Route = createFileRoute("/kelly")({ component: KellyLab });

const PRESETS = [
  { id: "coin", label: "Biased coin", p: 0.6, odds: 2 },
  { id: "nfl", label: "Thin NFL −110", p: 0.54, odds: 1.91 },
  { id: "fat", label: "Fat soccer dog", p: 0.42, odds: 2.7 },
] as const;

const COMPARE: StakeStrategy[] = ["kelly-quarter", "kelly-half", "kelly-full", "flat", "martingale"];

function KellyLab() {
  const [p, setP] = useState(0.6);
  const [odds, setOdds] = useState(2);
  const [bankroll, setBankroll] = useState(10_000);
  const [bets, setBets] = useState(200);
  const [seed, setSeed] = useState(7);
  const [focus, setFocus] = useState<StakeStrategy>("kelly-half");

  const ev = expectedValue(p, odds);
  const fStar = kellyFraction(p, odds);

  const cfg: SimConfig = {
    p,
    odds,
    bankroll,
    bets,
    paths: 280,
    seed,
    flatFraction: 0.01,
  };

  const results = useMemo(() => {
    return Object.fromEntries(COMPARE.map((s) => [s, simulateStrategy(s, cfg)])) as Record<
      StakeStrategy,
      ReturnType<typeof simulateStrategy>
    >;
    // cfg fields listed explicitly so the memo is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, odds, bankroll, bets, seed]);

  const focusStats = results[focus];
  const chartData = focusStats.median.map((m, i) => ({
    i,
    median: m,
    p10: focusStats.p10[i],
    spread: Math.max(0, focusStats.p90[i] - focusStats.p10[i]),
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Bankroll lab</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Kelly vs the folklore</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
          Same sequence of wins and losses, five staking rules. Full Kelly maximises log-growth when
          p is known. Martingale maximises the chance of a small win — and the size of the eventual
          hole.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((pre) => (
          <Button
            key={pre.id}
            size="sm"
            variant={p === pre.p && odds === pre.odds ? "default" : "outline"}
            onClick={() => {
              setP(pre.p);
              setOdds(pre.odds);
            }}
          >
            {pre.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setSeed((s) => s + 1)}>
          Reseed
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="True p" value={p} min={0.4} max={0.7} step={0.005} onChange={setP} display={formatPct(p, 1)} />
        <Num label="Decimal odds" value={odds} min={1.2} step={0.01} onChange={setOdds} />
        <Num label="Bankroll (u)" value={bankroll} min={100} step={100} onChange={setBankroll} />
        <Num label="Bets" value={bets} min={20} max={400} step={10} onChange={setBets} />
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <Stat
          label="Edge"
          value={formatSignedPct(ev)}
          tone={ev > 0 ? "positive" : ev < 0 ? "negative" : "neutral"}
          hint="EV per unit"
        />
        <Stat label="Full Kelly" value={formatPct(Math.max(0, fStar), 1)} hint="f* of bankroll" />
        <Stat
          label="Half Kelly"
          value={formatPct(Math.max(0, fStar * 0.5), 1)}
          hint="the usual compromise"
        />
      </div>

      {ev <= 0 ? (
        <Panel>
          <p className="text-sm text-negative">
            Negative EV. No staking rule — Kelly, Martingale, or otherwise — has a positive
            expectation here. Raise p or the odds.
          </p>
        </Panel>
      ) : null}

      <Panel className="p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl tracking-tight">
            {STRATEGY_LABEL[focus]} · 10–90 band
          </h2>
          <p className="text-xs text-faint">280 paths · seed {seed}</p>
        </div>
        <div className="h-64 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(242,243,241,0.06)" vertical={false} />
              <XAxis
                dataKey="i"
                tick={{ fill: "#6b726e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b726e", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`)}
              />
              <Tooltip
                contentStyle={{
                  background: "#121413",
                  border: "1px solid #2a2e2b",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(l) => `Bet ${l}`}
                formatter={(value, name) => {
                  const n = Number(value);
                  const label = name === "median" ? "Median" : name === "p10" ? "P10" : "Band";
                  return [formatUnits(n, 0), label];
                }}
              />
              <Area
                type="monotone"
                dataKey="p10"
                stackId="band"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="spread"
                stackId="band"
                stroke="none"
                fill="rgba(212,216,213,0.16)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="median"
                stroke="#d4d8d5"
                strokeWidth={1.75}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <div className="hidden grid-cols-[1.2fr_repeat(4,1fr)] gap-2 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wider text-faint sm:grid">
          <span>Rule</span>
          <span className="text-right">Median end</span>
          <span className="text-right">Ruin</span>
          <span className="text-right">Max DD</span>
          <span className="text-right">Log growth</span>
        </div>
        <ul>
          {COMPARE.map((s) => {
            const r = results[s];
            const active = s === focus;
            const growth = Math.exp(r.meanLogGrowth) - 1;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setFocus(s)}
                  className={`grid w-full grid-cols-2 gap-2 px-4 py-3 text-left sm:grid-cols-[1.2fr_repeat(4,1fr)] ${
                    active ? "bg-subtle" : "hover:bg-subtle/50"
                  }`}
                >
                  <span className="col-span-2 flex items-center gap-2 text-sm font-medium sm:col-span-1">
                    {STRATEGY_LABEL[s]}
                    {s === "martingale" && r.ruinRate > 0.05 ? (
                      <Badge tone="negative">fragile</Badge>
                    ) : null}
                    {s === "kelly-half" ? <Badge>default</Badge> : null}
                  </span>
                  <span className="text-sm tabular sm:text-right">{formatUnits(r.medianTerminal, 0)} u</span>
                  <span className={`text-sm tabular sm:text-right ${r.ruinRate > 0.1 ? "text-negative" : "text-muted"}`}>
                    ruin {formatPct(r.ruinRate, 1)}
                  </span>
                  <span className="text-sm tabular text-muted sm:text-right">
                    DD {formatPct(r.medianMaxDrawdown, 0)}
                  </span>
                  <span className="text-sm tabular sm:text-right">{formatSignedPct(growth)} /bet</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-xs text-faint">
        Martingale doubles after each loss, capped by remaining bankroll. Ruin is defined as hitting
        zero. Paths share a seed family so a reseed reshuffles every rule together.
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  display: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-xs tabular">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full accent-accent"
      />
    </div>
  );
}

function Num({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
