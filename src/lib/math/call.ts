import { expectedValue, fairOdds } from "./odds";
import { fractionalKelly } from "./kelly";
import { formatOdds, formatPct, formatSignedPct } from "../utils";
import { evaluateGates, type MatchProfile } from "./bet-metrics";

/** Edge below this is treated as noise. */
export const LEAN_EV = 0.035;
/** Edge at or above this is a BET — tight on purpose. */
export const BET_EV = 0.08;
/** Injuries/rest above this cut BET to LEAN. */
export const RISK_LEAN = 0.32;
/** Injuries/rest above this force NO BET. */
export const RISK_PASS = 0.55;

export type CallAction = "bet" | "lean" | "pass";
export type TicketMarket = "1x2" | "totals" | "btts";
export type BookSource = "market" | "model";

export interface TicketMeta {
  market?: TicketMarket;
  source?: BookSource;
  sideRisk?: number;
  factsNote?: string;
  profile?: MatchProfile;
  side?: string;
  heat?: number;
  correlated?: boolean;
  live?: boolean;
  remainingFrac?: number;
  clock?: string;
}

export interface TicketInput {
  selection: string;
  modelP: number;
  odds: number;
  ev: number;
  kelly: number;
  market?: TicketMarket;
  source?: BookSource;
  sideRisk?: number;
  factsNote?: string;
  profile?: MatchProfile;
  side?: string;
  heat?: number;
  correlated?: boolean;
  live?: boolean;
  remainingFrac?: number;
  clock?: string;
}

export interface DeskCall {
  action: CallAction;
  word: "BET" | "LEAN" | "NO BET";
  selection: string;
  ev: number;
  kelly: number;
  fair: number;
  modelP: number;
  odds: number;
  reason: string;
}

/**
 * Tight band. Fake 30/1 "edges" and model-vs-itself books never get a BET.
 * An 11-point gap vs the implied is a broken rating, not a gift.
 */
export function isTradable(p: number, odds: number, meta?: TicketMeta): boolean {
  if (!Number.isFinite(p) || !Number.isFinite(odds)) return false;
  if (meta?.source && meta.source !== "market") return false;
  if (meta?.live) {
    if ((meta.remainingFrac ?? 1) < 0.12) return false;
    if (odds < 1.28 || odds > 6.5) return false;
    if (p < 0.14 || p > 0.8) return false;
    const implied = 1 / odds;
    if (Math.abs(p - implied) > 0.16) return false;
    return true;
  }
  if (odds < 1.45 || odds > 4.5) return false;
  if (p < 0.22 || p > 0.68) return false;
  const implied = 1 / odds;
  if (Math.abs(p - implied) > 0.11) return false;
  return true;
}

export function classifyEv(ev: number, kelly: number, ticket?: TicketInput): CallAction {
  if (!Number.isFinite(ev) || !Number.isFinite(kelly)) return "pass";
  if (ticket && !isTradable(ticket.modelP, ticket.odds, ticket)) return "pass";
  if (kelly <= 0 || ev < LEAN_EV) return "pass";
  const risk = ticket?.sideRisk ?? 0;
  if (risk >= RISK_PASS) return "pass";
  const gates = ticket
    ? evaluateGates({ profile: ticket.profile, ticket, heat: ticket.heat, correlated: ticket.correlated })
    : null;
  if (gates?.hardFail) return "pass";
  const oneXtwo = !ticket?.market || ticket.market === "1x2";
  if (ticket?.live) {
    const frac = ticket.remainingFrac ?? 1;
    if (frac < 0.12 || frac > 0.92) return "pass";
    if (ev >= 0.1 && oneXtwo && risk < RISK_LEAN && !gates?.demote) return "bet";
    if (ev >= LEAN_EV) return "lean";
    return "pass";
  }
  if (ev >= BET_EV && oneXtwo && risk < RISK_LEAN && !gates?.demote) return "bet";
  if (ev >= LEAN_EV) return "lean";
  return "pass";
}

export function ticketCall(ticket: TicketInput): DeskCall {
  const tradable = isTradable(ticket.modelP, ticket.odds, ticket);
  const gates = evaluateGates({
    profile: ticket.profile,
    ticket,
    heat: ticket.heat,
    correlated: ticket.correlated,
  });
  const action = classifyEv(ticket.ev, ticket.kelly, ticket);
  const fair = fairOdds(ticket.modelP);
  const word: DeskCall["word"] =
    action === "bet" ? "BET" : action === "lean" ? "LEAN" : "NO BET";
  const risk = ticket.sideRisk ?? 0;
  const factBit = ticket.factsNote ? ` ${ticket.factsNote}` : "";

  let reason: string;
  if (!tradable) {
    reason =
      ticket.source !== "market"
        ? "No live book on this side. The desk does not call against a model-made price."
        : ticket.live
          ? "Outside the live band (market 1X2, odds 1.28–6.50, model within 16 pts of the implied). Pass."
          : "Outside the tight band (live 1X2, odds 1.45–4.50, model within 11 pts of the implied). Pass.";
  } else if (gates.hardFail && action === "pass") {
    reason = `${gates.summary} Pass.`;
  } else if (risk >= RISK_PASS) {
    reason = `Lineups/injuries veto this side (risk ${formatPct(risk)}).${factBit} Pass.`;
  } else if (action === "bet") {
    reason = ticket.live
      ? `In-play ${ticket.clock || ""} · book ${formatOdds(ticket.odds)} vs fair ${formatOdds(fair)}. Edge ${formatSignedPct(ticket.ev)}. Live BET is tight on purpose.`
      : `Book ${formatOdds(ticket.odds)} vs fair ${formatOdds(fair)}. Edge ${formatSignedPct(ticket.ev)}. Gates ${gates.score}/100.${factBit}`;
  } else if (action === "lean") {
    if (gates.demote && ticket.ev >= BET_EV) {
      reason = `Edge ${formatSignedPct(ticket.ev)} would be BET, but a gate cut it to LEAN: ${gates.summary}`;
    } else if (risk >= RISK_LEAN && ticket.ev >= BET_EV) {
      reason = `Edge ${formatSignedPct(ticket.ev)} would be BET, but absences/rest cut it to LEAN.${factBit}`;
    } else {
      reason = `Edge ${formatSignedPct(ticket.ev)} is real but thin${ticket.market && ticket.market !== "1x2" ? " (totals/BTTS never BET)" : ""}.${factBit} Optional, keep the stake small.`;
    }
  } else if (ticket.kelly <= 0 || ticket.ev <= 0) {
    reason = `Model ${formatPct(ticket.modelP)} does not beat ${formatOdds(ticket.odds)}. Pass.`;
  } else {
    reason = `Edge ${formatSignedPct(ticket.ev)} is under the 3.5% floor. Treat as noise.`;
  }

  return {
    action,
    word,
    selection: ticket.selection,
    ev: ticket.ev,
    kelly: ticket.kelly,
    fair,
    modelP: ticket.modelP,
    odds: ticket.odds,
    reason,
  };
}

export function scoreTicket(
  selection: string,
  modelP: number,
  odds: number,
  kellyFractionUsed: number,
  meta?: TicketMeta,
) {
  const ev = expectedValue(modelP, odds);
  const kelly = fractionalKelly(modelP, odds, kellyFractionUsed);
  const call = ticketCall({ selection, modelP, odds, ev, kelly, ...meta });
  return { selection, modelP, odds, ev, kelly, fair: call.fair, call };
}

export function emptyPass(reason = "No price on the board. Pass."): DeskCall {
  return {
    action: "pass",
    word: "NO BET",
    selection: "",
    ev: 0,
    kelly: 0,
    fair: Infinity,
    modelP: 0,
    odds: 0,
    reason,
  };
}

/** Highest-EV ticket, then classify it. Sitting out is the default. */
export function bestCall(tickets: TicketInput[]): DeskCall {
  if (tickets.length === 0) return emptyPass();
  const ranked = [...tickets].sort((a, b) => b.ev - a.ev);
  return ticketCall(ranked[0]!);
}

export function callTone(action: CallAction): "positive" | "warn" | "negative" {
  if (action === "bet") return "positive";
  if (action === "lean") return "warn";
  return "negative";
}
