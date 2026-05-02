import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-3xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 text-base text-white placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/20",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
