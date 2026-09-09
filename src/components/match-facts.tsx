import { Cloud, Flag, ShieldAlert, Shirt, UserX, Wind } from "lucide-react";
import type { H2HMeeting, MatchFacts, OutPlayer, RecentGame, SideFacts } from "@/lib/data/facts";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/stat";

function FormPills({ form }: { form: string }) {
  const letters = form.replace(/[^WDL]/gi, "").toUpperCase().slice(-5).split("");
  if (letters.length === 0) return <span className="text-xs text-faint">No form yet</span>;
  return (
    <span className="inline-flex gap-0.5">
      {letters.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-sm text-[10px] font-medium",
            ch === "W" && "bg-positive/15 text-positive",
            ch === "D" && "bg-subtle text-muted",
            ch === "L" && "bg-negative/15 text-negative",
          )}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

function OppTag({ g }: { g: RecentGame }) {
  const s = g.oppStrength;
  const grade =
    g.comp === "friendly" ? "fr" : s == null ? "" : s >= 1.12 ? "top" : s <= 0.88 ? "soft" : "mid";
  return (
    <li className="flex items-baseline justify-between gap-2 text-xs">
      <span className="truncate text-fg">
        <span
          className={cn(
            "mr-1.5 inline-flex size-4 items-center justify-center rounded-sm text-[10px] font-medium",
            g.result === "W" && "bg-positive/15 text-positive",
            g.result === "D" && "bg-subtle text-muted",
            g.result === "L" && "bg-negative/15 text-negative",
          )}
        >
          {g.result}
        </span>
        {g.gf}-{g.ga} vs {g.opp}
        <span className="ml-1 text-faint">({g.venue})</span>
      </span>
      {grade ? (
        <span
          className={cn(
            "shrink-0 text-[10px] uppercase tracking-wide",
            grade === "top" && "text-warn",
            (grade === "soft" || grade === "fr") && "text-faint",
            grade === "mid" && "text-muted",
          )}
        >
          {grade}
        </span>
      ) : null}
    </li>
  );
}

function OutList({ players }: { players: OutPlayer[] }) {
  if (players.length === 0) {
    return <p className="text-xs text-faint">No reported absences</p>;
  }
  return (
    <ul className="space-y-1">
      {players.slice(0, 6).map((p) => (
        <li key={p.name} className="flex items-baseline justify-between gap-2 text-xs">
          <span className="truncate text-fg">
            {p.name}
            {p.pos !== "unk" ? <span className="ml-1.5 uppercase text-faint">{p.pos}</span> : null}
          </span>
          <span className="shrink-0 text-muted">
            {p.kind === "suspension" ? "susp" : p.eta || "out"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SideCol({ title, side, lineupKind }: { title: string; side: SideFacts; lineupKind: MatchFacts["lineupKind"] }) {
  const recent = (side.recent || []).slice(0, 5);
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-faint">{title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <FormPills form={side.form} />
        {side.record ? <span className="font-mono text-xs text-muted">{side.record}</span> : null}
        {side.restDays != null ? (
          <span className="text-xs text-muted">{Math.round(side.restDays)}d rest</span>
        ) : null}
      </div>
      {side.sosLabel && side.sosLabel !== "no sample" ? (
        <p className="mt-1.5 text-xs text-muted">
          {side.sosLabel}
          {side.formAdj != null ? ` · adj form ${(side.formAdj * 100).toFixed(0)}` : ""}
        </p>
      ) : null}
      {recent.length ? (
        <ul className="mt-2 space-y-1">
          {recent.map((g) => (
            <OppTag key={`${g.date}-${g.opp}`} g={g} />
          ))}
        </ul>
      ) : null}
      {side.formation ? (
        <p className="mt-2 text-xs text-muted">
          {lineupKind === "confirmed" ? "Confirmed" : lineupKind === "predicted" ? "Predicted" : "XI"}{" "}
          {side.formation}
          {side.coach ? ` · ${side.coach}` : ""}
        </p>
      ) : null}
      {side.starters.length ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-faint">
          {side.starters.map((p) => p.name.split(" ").slice(-1)[0]).join(" · ")}
        </p>
      ) : null}
      <div className="mt-3">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-faint">
          <UserX className="size-3" strokeWidth={1.75} />
          Out ({side.unavailable.length})
        </p>
        <OutList players={side.unavailable} />
      </div>
      {side.insight ? <p className="mt-3 text-xs leading-relaxed text-muted">{side.insight}</p> : null}
      {side.sog != null || side.shots != null ? (
        <p className="mt-2 text-xs text-muted">
          Shots {side.shots ?? "—"} · SoT {side.sog ?? "—"}
          {side.possession != null ? ` · poss ${Math.round(side.possession)}%` : ""}
          {side.corners != null ? ` · cnr ${side.corners}` : ""}
        </p>
      ) : null}
    </div>
  );
}

function h2hLine(m: H2HMeeting): string {
  return `${m.result} ${m.gf}–${m.ga} (${m.venue})`;
}

export function MatchFactsCard({ facts }: { facts?: MatchFacts }) {
  if (!facts || facts.source === "none") {
    return (
      <Panel>
        <h2 className="font-display text-xl tracking-tight">Match facts</h2>
        <p className="mt-2 text-sm text-muted">No lineup or injury sheet on this fixture yet.</p>
      </Panel>
    );
  }

  const w = facts.weather;
  const h2h = facts.h2h;
  const lastH2h = (h2h?.recent || []).slice(0, 4);

  return (
    <Panel>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-xl tracking-tight">Match facts</h2>
        <p className="text-xs text-faint">
          {facts.lineupKind === "confirmed"
            ? "Confirmed XI"
            : facts.lineupKind === "predicted"
              ? "Predicted XI"
              : "Form sheet"}
          {facts.source === "fotmob" || facts.source === "mixed" ? " · live feed" : " · table feed"}
        </p>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <SideCol title="Home" side={facts.home} lineupKind={facts.lineupKind} />
        <SideCol title="Away" side={facts.away} lineupKind={facts.lineupKind} />
      </div>

      <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        {w ? (
          <div className="flex items-start gap-2">
            <Cloud className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} />
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-faint">Weather</dt>
              <dd className="text-fg">
                {w.tempC}°C · {w.description}
                <span className="block text-xs text-muted">
                  Wind {w.windKph} kph · rain {w.precipChance}%
                </span>
              </dd>
            </div>
          </div>
        ) : null}
        {facts.referee ? (
          <div className="flex items-start gap-2">
            <Flag className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} />
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-faint">Referee</dt>
              <dd className="text-fg">
                {facts.referee.name}
                <span className="block text-xs text-muted">
                  {facts.referee.yellowsPerGame != null
                    ? `${facts.referee.yellowsPerGame.toFixed(1)} yellows/game`
                    : "Cards n/a"}
                  {facts.referee.pens != null ? ` · ${facts.referee.pens} pens` : ""}
                </span>
              </dd>
            </div>
          </div>
        ) : null}
        {h2h ? (
          <div className="flex items-start gap-2">
            <Shirt className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} />
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-faint">Head to head</dt>
              <dd className="text-fg">
                {lastH2h.length ? lastH2h.map(h2hLine).join(" · ") : `${h2h.homeWins}–${h2h.draws}–${h2h.awayWins}`}
                <span className="block text-xs text-muted">
                  {lastH2h.length
                    ? `Last ${lastH2h.length}, venue-weighted · all-time ${h2h.homeWins}–${h2h.draws}–${h2h.awayWins}`
                    : "home–draw–away all-time"}
                </span>
              </dd>
            </div>
          </div>
        ) : null}
        {facts.venueCity || facts.surface ? (
          <div className="flex items-start gap-2">
            <Wind className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} />
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-faint">Venue</dt>
              <dd className="text-fg">
                {facts.venueCity || "—"}
                {facts.surface ? <span className="text-muted"> · {facts.surface}</span> : null}
              </dd>
            </div>
          </div>
        ) : null}
      </dl>

      {facts.home.unavailable.length + facts.away.unavailable.length >= 4 ? (
        <p className="mt-4 flex items-start gap-2 text-xs text-warn">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          Heavy absences on this card. The desk will not BET the thinned side.
        </p>
      ) : null}

      {facts.news.length ? (
        <ul className="mt-4 space-y-1 border-t border-border pt-3">
          {facts.news.map((n) => (
            <li key={n} className="text-xs leading-relaxed text-muted">
              {n}
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}

export function FactChip({ facts }: { facts?: MatchFacts }) {
  if (!facts || facts.source === "none") return null;
  const out = facts.home.unavailable.length + facts.away.unavailable.length;
  const formH = facts.home.form.replace(/[^WDL]/gi, "").slice(-5);
  const formA = facts.away.form.replace(/[^WDL]/gi, "").slice(-5);
  const soft = facts.home.sosLabel === "soft fixtures" || facts.away.sosLabel === "soft fixtures";
  if (!formH && !formA && out === 0) return null;
  return (
    <span className="text-faint">
      {formH && formA ? `${formH} / ${formA}` : formH || formA}
      {soft ? " · soft" : ""}
      {out ? ` · ${out} out` : ""}
      {facts.home.sog != null && facts.away.sog != null
        ? ` · SoT ${facts.home.sog}-${facts.away.sog}`
        : ""}
    </span>
  );
}
