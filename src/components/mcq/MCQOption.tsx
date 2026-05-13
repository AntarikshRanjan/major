"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { colors, typeScale, fontFamilies } from "@/styles/tokens";
import type { PersonalityDNA } from "@/types/mcq";
import { usePersonality } from "./PersonalityEngine";
import { Tilt } from "@/components/motion/Tilt";

// ─── Constants ────────────────────────────────────────────────────────────────

// accent at 50 % opacity for hover border
const ACCENT_50 = "#C8F04D80";
// accent at 6 % opacity for selected background
const ACCENT_6  = "#C8F04D0F";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1,   0.3, 1];
const SURGICAL:      [number, number, number, number] = [0.4,  0,   0,   1];

// ─── Props ────────────────────────────────────────────────────────────────────

interface MCQOptionProps {
  personality: PersonalityDNA;
  selected:    boolean;
  onSelect:    () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MCQOption({ personality, selected, onSelect }: MCQOptionProps) {
  const [hovered, setHovered] = useState(false);
  const { setPreview, clearPreview } = usePersonality();

  // ── Derived state ──────────────────────────────────────────────────────────

  const borderColor  = selected ? colors.accent : hovered ? ACCENT_50 : colors.border;
  const bgColor      = selected ? ACCENT_6      : colors.surface;
  const labelColor   = selected ? colors.accent : hovered ? colors.textPrimary : colors.textSecondary;
  const labelWeight  = selected ? 500 : 400;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleMouseEnter() {
    setHovered(true);
    setPreview(personality);
  }

  function handleMouseLeave() {
    setHovered(false);
    clearPreview();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Tilt maxDeg={3}>
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ borderColor: colors.border, backgroundColor: colors.surface }}
        animate={{ borderColor, backgroundColor: bgColor }}
        transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
        style={{
          position:    "relative",
          borderWidth: 1,
          borderStyle: "solid",
          borderRadius: 2,
          padding:     "10px 12px",
          cursor:      "pointer",
          overflow:    "hidden",
          boxSizing:   "border-box",
          userSelect:  "none",
          outline:     "none",
        }}
      >
        {/* Top accent line — draws left→right on hover, collapses on leave */}
        <motion.div
          aria-hidden="true"
          animate={{ width: hovered ? "100%" : "0%" }}
          transition={{ duration: 0.3, ease: SURGICAL }}
          style={{
            position:      "absolute",
            top:           0,
            left:          0,
            height:        1,
            background:    colors.accent,
            pointerEvents: "none",
          }}
        />

        {/* Left accent stripe — visible when selected */}
        <motion.div
          aria-hidden="true"
          animate={{ opacity: selected ? 1 : 0 }}
          transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
          style={{
            position:      "absolute",
            left:          0,
            top:           0,
            width:         2,
            height:        "100%",
            background:    colors.accent,
            pointerEvents: "none",
          }}
        />

        {/* Label */}
        <motion.span
          animate={{ color: labelColor, fontWeight: labelWeight }}
          transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
          style={{
            display:    "block",
            fontSize:   typeScale.sm.size,
            lineHeight: typeScale.sm.lineHeight,
            fontFamily: fontFamilies.heading,
          }}
        >
          {personality.label}
        </motion.span>

        {/* Description — expands height + fades in on hover */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height:  hovered ? "auto" : 0,
            opacity: hovered ? 1      : 0,
          }}
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          style={{ overflow: "hidden" }}
        >
          <span
            style={{
              display:       "block",
              marginTop:     4,
              fontSize:      typeScale.xs.size,
              lineHeight:    typeScale.xs.lineHeight,
              letterSpacing: typeScale.xs.letterSpacing,
              color:         colors.textSecondary,
              fontFamily:    fontFamilies.heading,
            }}
          >
            {personality.description}
          </span>
        </motion.div>
      </motion.div>
    </Tilt>
  );
}
