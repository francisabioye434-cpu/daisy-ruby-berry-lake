import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "positive" | "negative" | "warn";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular",
        tone === "neutral" && "bg-subtle text-muted",
        tone === "positive" && "bg-positive/15 text-positive",
        tone === "negative" && "bg-negative/15 text-negative",
        tone === "warn" && "bg-warn/15 text-warn",
        className,
      )}
    >
      {children}
    </span>
  );
}
