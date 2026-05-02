"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  step: number;
  total: number;
  label?: string;
}

export function ProgressBar({ step, total, label }: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, (step / total) * 100));

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
        <span>{label ?? `Step ${step} of ${total}`}</span>
        <span>
          {step}/{total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-[var(--accent-blue)]"
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
