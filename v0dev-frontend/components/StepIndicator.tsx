"use client";

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  total: number;
  currentStep: number;
}

export function StepIndicator({ total, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const active = step <= currentStep;
        return (
          <div
            key={step}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              active ? "w-8 bg-[var(--accent-blue)]" : "w-2 bg-white/15",
            )}
          />
        );
      })}
    </div>
  );
}
