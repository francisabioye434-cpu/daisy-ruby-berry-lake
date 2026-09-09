import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md bg-subtle px-3 text-sm text-fg tabular shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 placeholder:text-faint hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)] disabled:opacity-40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
