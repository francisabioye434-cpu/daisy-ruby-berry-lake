import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({ email, password, name: name || email.split("@")[0]! });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) throw new Error(error.message);
      }
      window.location.href = "/";
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Fairline FC</p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">Sign on</h1>
        <p className="mt-2 text-sm text-muted">
          Email and password. The first account on this desk is admin — create it if that’s you.
          Google or X if you prefer.
        </p>
      </header>

      <SignedIn>
        <p className="text-sm text-muted">You are already on the desk.</p>
        <div className="mt-3 flex gap-2">
          <UserButton />
          <Button asChild>
            <Link to="/">Open board</Link>
          </Button>
        </div>
      </SignedIn>

      <SignedOut>
        {!authEnabled ? (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        ) : (
          <div className="space-y-5">
            <form onSubmit={onEmail} className="space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
              {mode === "up" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
              </div>
              {err ? <p className="text-sm text-negative">{err}</p> : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {mode === "up" ? "Create admin desk" : "Sign in"}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-muted hover:text-fg"
                onClick={() => setMode(mode === "up" ? "in" : "up")}
              >
                {mode === "up" ? "Already have a desk? Sign in" : "New desk? Create with email"}
              </button>
            </form>
            <div className="space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </SignedOut>
    </div>
  );
}
