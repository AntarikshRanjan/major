"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import type { ModeCardConfig } from "@/lib/types";

function Icon({ type }: { type: ModeCardConfig["icon"] }) {
  if (type === "prompt") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20h4l10-10a2.12 2.12 0 0 0-3-3L5 17v3Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m13.5 6.5 4 4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "record") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="12" rx="2.5" />
        <path d="M8 21h8" strokeLinecap="round" />
        <path d="M12 17v4" strokeLinecap="round" />
        <circle cx="12" cy="11" r="2.75" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 16V4" strokeLinecap="round" />
      <path d="m7 9 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="16" width="16" height="4" rx="2" />
    </svg>
  );
}

export function ModeCard({ card, index }: { card: ModeCardConfig; index: number }) {
  const reset = useAppStore((state) => state.reset);
  const setMode = useAppStore((state) => state.setMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        className="group relative flex h-full flex-col justify-between gap-6 p-6 transition-colors duration-300 hover:shadow-[0_0_0_1px_var(--hover-accent)]"
        style={{ ["--hover-accent" as string]: card.accent }}
      >
        {card.recommended ? (
          <Badge className="absolute right-5 top-5 border-transparent bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
            Recommended
          </Badge>
        ) : null}
        <div className="space-y-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10"
            style={{ color: card.accent, backgroundColor: `${card.accent}15` }}
          >
            <Icon type={card.icon} />
          </div>
          <div className="space-y-3">
            <Badge>{card.badge}</Badge>
            <h3 className="text-2xl font-semibold tracking-tight text-white">{card.title}</h3>
            <p className="text-sm leading-7 text-[var(--muted)]">{card.description}</p>
          </div>
        </div>
        <Link
          href={card.href}
          onClick={() => {
            reset();
            setMode(card.mode);
          }}
        >
          <Button className="w-full" size="lg" style={{ backgroundColor: card.accent }}>
            {card.cta}
          </Button>
        </Link>
      </Card>
    </motion.div>
  );
}
