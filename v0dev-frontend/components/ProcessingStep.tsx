"use client";

import { cn } from "@/lib/utils";

interface ProcessingStepProps {
  label: string;
  status: "pending" | "active" | "done";
}

export function ProcessingStep({ label, status }: ProcessingStepProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border",
          status === "done" && "border-[var(--accent-green)] bg-[var(--accent-green)]/15 text-[var(--accent-green)]",
          status === "active" && "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]",
          status === "pending" && "border-white/10 bg-white/5 text-white/35",
        )}
      >
        {status === "done" ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : status === "active" ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div className="h-3 w-3 rounded-full bg-current" />
        )}
      </div>
      <p
        className={cn(
          "text-base transition-colors",
          status === "done" && "text-white",
          status === "active" && "text-white",
          status === "pending" && "text-white/45",
        )}
      >
        {label}
      </p>
    </div>
  );
}
