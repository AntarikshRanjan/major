import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
        className,
      )}
      {...props}
    />
  );
}
