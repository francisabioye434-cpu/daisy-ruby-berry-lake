import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { enableAlerts } from "@/lib/alerts";
import { useDesk } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/stat";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone);
  return mq || ios;
}

function SettingsPage() {
  const desk = useDesk();
  const [alertMsg, setAlertMsg] = useState("");
  const standalone = typeof window !== "undefined" && isStandalone();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Desk</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Settings</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Fairline runs in this browser. Bankroll, journal, votes and alerts live on your device —
          not in the Grok chat. Install it to the home screen and you can close the chat.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/login" className="text-muted hover:text-fg">
            Sign in
          </Link>
          {" · "}
          <Link to="/admin" className="text-muted hover:text-fg">
            Admin
          </Link>
          {" · "}
          <Link to="/brain" className="text-muted hover:text-fg">
            Desk IQ
          </Link>
        </p>
      </header>

      <Panel className="space-y-4">
        <h2 className="font-display text-xl tracking-tight">Standalone</h2>
        <p className="text-sm text-muted">
          {standalone
            ? "This copy is on your home screen. Opening the icon loads a live slate without Grok."
            : "You are inside a browser tab (or the Grok preview). Install to keep the desk after you leave the chat."}
        </p>
        {!standalone ? (
          <Button
            onClick={() => {
              window.location.href = "/?install=1";
            }}
          >
            Install to home screen
          </Button>
        ) : null}
      </Panel>

      <Panel className="space-y-4">
        <h2 className="font-display text-xl tracking-tight">Alerts</h2>
        <p className="text-sm text-muted">One daily brief when a BET or LEAN appears. Sit stays silent.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={desk.alertsOn ? "default" : "outline"}
            onClick={() => {
              void enableAlerts().then((ok) => {
                desk.setAlertsOn(ok);
                setAlertMsg(ok ? "Alerts on for this device." : "Permission blocked — enable notifications in the browser.");
              });
            }}
          >
            {desk.alertsOn ? "Alerts on" : "Enable alerts"}
          </Button>
          <Button variant={desk.alertLeans ? "default" : "outline"} onClick={() => desk.setAlertLeans(!desk.alertLeans)}>
            {desk.alertLeans ? "LEAN alerts on" : "LEAN alerts off"}
          </Button>
        </div>
        {alertMsg ? <p className="text-xs text-faint">{alertMsg}</p> : null}
      </Panel>

      <Panel className="space-y-4">
        <h2 className="font-display text-xl tracking-tight">Bankroll & stake</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bank">Bankroll</Label>
            <Input
              id="bank"
              type="number"
              min={100}
              value={desk.bankroll}
              onChange={(e) => desk.setBankroll(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kelly">Kelly fraction</Label>
            <Input
              id="kelly"
              type="number"
              step={0.05}
              min={0.05}
              max={1}
              value={desk.kellyFractionUsed}
              onChange={(e) => desk.setKellyFractionUsed(Number(e.target.value) || 0.25)}
            />
            <p className="text-xs text-faint">Quarter Kelly (0.25) is the desk default. Full Kelly ruins bankrolls.</p>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4">
        <h2 className="font-display text-xl tracking-tight">Odds format</h2>
        <div className="flex gap-2">
          <Button
            variant={desk.oddsFormat === "decimal" ? "default" : "outline"}
            onClick={() => desk.setOddsFormat("decimal")}
          >
            Decimal
          </Button>
          <Button
            variant={desk.oddsFormat === "american" ? "default" : "outline"}
            onClick={() => desk.setOddsFormat("american")}
          >
            American
          </Button>
        </div>
      </Panel>

      <p className="text-xs leading-relaxed text-faint">
        Educational model, not a bookmaker. Prices can be wrong. BET is a process call, not a promise.
        Never stake money you cannot lose.
      </p>
    </div>
  );
}
