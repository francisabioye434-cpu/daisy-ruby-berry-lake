import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { devig, type DevigMethod } from "@/lib/math/devig";
import { fairOdds } from "@/lib/math/odds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, Stat } from "@/components/stat";
import { formatOdds, formatPct } from "@/lib/utils";

export const Route = createFileRoute("/devig")({ component: DevigDesk });

const PRESETS = {
  two: { labels: ["Home", "Away"], odds: [1.91, 1.91] },
  three: { labels: ["Home", "Draw", "Away"], odds: [1.85, 3.6, 4.2] },
};

function DevigDesk() {
  const [mode, setMode] = useState<"two" | "three">("three");
  const [method, setMethod] = useState<DevigMethod>("multiplicative");
  const [odds, setOdds] = useState<number[]>(PRESETS.three.odds);

  const labels = PRESETS[mode].labels;

  const result = useMemo(() => devig(odds.slice(0, labels.length), method), [odds, labels.length, method]);

  function setModeAndOdds(next: "two" | "three") {
    setMode(next);
    setOdds(PRESETS[next].odds);
  }

  function setOdd(i: number, v: number) {
    setOdds((prev) => {
      const copy = prev.slice();
      copy[i] = v;
      return copy;
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Margin desk</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Take the vig out</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
          A book of 1.91 / 1.91 is not a coin flip. Each side implies 52.4%. The extra 4.8% is the
          overround. Devigging redistributes that margin so you can compare a model to a fair
          price, not a loaded one.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={mode === "two" ? "default" : "outline"} onClick={() => setModeAndOdds("two")}>
          Two-way
        </Button>
        <Button size="sm" variant={mode === "three" ? "default" : "outline"} onClick={() => setModeAndOdds("three")}>
          1X2
        </Button>
        <Button
          size="sm"
          variant={method === "multiplicative" ? "default" : "outline"}
          onClick={() => setMethod("multiplicative")}
        >
          Multiplicative
        </Button>
        <Button
          size="sm"
          variant={method === "additive" ? "default" : "outline"}
          onClick={() => setMethod("additive")}
        >
          Additive
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-3 sm:p-5">
        <Stat label="Overround" value={formatPct(result.overround, 2)} hint="sum of implied − 1" />
        <Stat label="Outcomes" value={`${labels.length}`} hint={mode === "two" ? "moneyline" : "home / draw / away"} />
        <Stat
          label="Method"
          value={method === "multiplicative" ? "Prop." : "Add."}
          hint={method === "multiplicative" ? "scale implied to 100%" : "shave margin equally"}
        />
      </div>

      <div className={`grid gap-3 ${mode === "three" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {labels.map((lab, i) => (
          <div key={lab} className="space-y-1.5">
            <Label htmlFor={lab}>{lab} decimal odds</Label>
            <Input
              id={lab}
              type="number"
              min={1.01}
              step={0.01}
              value={odds[i]}
              onChange={(e) => setOdd(i, Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <Panel>
        <h2 className="font-display text-xl tracking-tight">Implied vs fair</h2>
        <ul className="mt-4 divide-y divide-border">
          {labels.map((lab, i) => (
            <li key={lab} className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-4 sm:items-center">
              <p className="col-span-2 text-sm font-medium sm:col-span-1">{lab}</p>
              <p className="text-sm tabular text-muted">
                implied {formatPct(result.implied[i])}
              </p>
              <p className="text-sm tabular">fair {formatPct(result.fair[i])}</p>
              <p className="text-sm tabular text-faint">no-vig {formatOdds(fairOdds(result.fair[i]))}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="font-display text-xl tracking-tight">Why this matters</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            Multiplicative (proportional) keeps the ratios of the implied probabilities. It is the
            default on two-way US books and a clean teaching method for 1X2.
          </p>
          <p>
            Additive subtracts the overround equally. On a three-way market it can push a longshot
            through zero, so Fairline floors and renormalises. Power methods exist; they rarely
            change the decision at these margins.
          </p>
          <p>
            Compare your model p to the <em className="text-fg">fair</em> column, not to 1/odds.
            If you skip this step you will think every favourite is underpriced.
          </p>
        </div>
      </Panel>
    </div>
  );
}
