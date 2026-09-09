import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { bootstrapDesk, getDeskRole } from "@/lib/data/desk-user";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void bootstrapDesk()
      .then(() => getDeskRole())
      .then((r) => setRole(r.role))
      .catch(() => setRole("analyst"));
  }, [user]);

  if (isPending) return <div className="h-24 animate-pulse rounded-xl bg-subtle" />;
  if (!user) return <RedirectToSignIn to="/login" />;

  const admin = role === "admin";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Control</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{admin ? "Admin" : "Analyst"}</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          {admin
            ? "You own this desk. First account is admin. IQ, bankroll and alerts live on this device and in your profile."
            : "You are on the desk as an analyst. The owner signed up first."}
        </p>
      </header>
      <p className="text-sm text-faint">Signed in as {user.primaryEmail || user.displayName || user.id}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/brain">Desk IQ</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/settings">Settings</Link>
        </Button>
      </div>
    </div>
  );
}
