"use client";

import { useState } from "react";
import { colors, typeScale, fontFamilies } from "@/styles/tokens";
import type { PersonalityDNA } from "@/types/mcq";
import { usePersonality } from "./PersonalityEngine";
import { MCQOption } from "./MCQOption";
import { Reveal } from "@/components/motion/Reveal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MCQCardProps {
  question:               string;
  personalities:          PersonalityDNA[];
  onPersonalitySelected?: (p: PersonalityDNA) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MCQCard({ question, personalities, onPersonalitySelected }: MCQCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { setActive } = usePersonality();

  function handleSelect(personality: PersonalityDNA) {
    setSelectedId(personality.id);
    setActive(personality);
    onPersonalitySelected?.(personality);
  }

  return (
    <Reveal direction="up" delay={100}>
      <div style={{ padding: 24 }}>

        {/* Question */}
        <p
          style={{
            margin:        "0 0 12px 0",
            fontSize:      typeScale.sm.size,
            lineHeight:    typeScale.sm.lineHeight,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:         colors.textSecondary,
            fontFamily:    fontFamilies.heading,
          }}
        >
          {question}
        </p>

        {/* Option grid — 2 columns, 8px gap */}
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "1fr 1fr",
            gap:                 8,
          }}
        >
          {personalities.map(p => (
            <MCQOption
              key={p.id}
              personality={p}
              selected={selectedId === p.id}
              onSelect={() => handleSelect(p)}
            />
          ))}
        </div>

      </div>
    </Reveal>
  );
}
