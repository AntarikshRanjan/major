"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { PersonalityDNA } from "@/types/mcq";

// ─── Default DNA ───────────────────────────────────────────────────────────────
// Matches token defaults so the wrapper applies no visible change at rest.

const DEFAULT_DNA: PersonalityDNA = {
  id:              "default",
  label:           "Default",
  easing:          "cubic-bezier(0.16, 1, 0.3, 1)",
  duration:        280,
  fontWeight:      400,
  letterSpacing:   "0em",
  borderRadius:    "4px",
  shadowIntensity: 1,
  motionDistance:  12,
  accentOpacity:   1,
  description:     "default v0dev motion",
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface PersonalityContextValue {
  activePersonality:  PersonalityDNA | null;
  previewPersonality: PersonalityDNA | null;
  currentDNA:         PersonalityDNA;
  setActive:          (p: PersonalityDNA) => void;
  setPreview:         (p: PersonalityDNA) => void;
  clearPreview:       () => void;
}

const PersonalityContext = createContext<PersonalityContextValue | null>(null);

export function usePersonality(): PersonalityContextValue {
  const ctx = useContext(PersonalityContext);
  if (!ctx) throw new Error("usePersonality must be used within <PersonalityEngine>");
  return ctx;
}

// ─── Easing tuples ────────────────────────────────────────────────────────────

type Curve = [number, number, number, number];

const CINEMATIC: Curve = [0.76, 0, 0.24, 1]; // applying a personality preview
const SURGICAL:  Curve = [0.4,  0, 0,    1]; // reverting back to baseline

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PersonalityEngine({ children }: { children: ReactNode }) {
  const [activePersonality,  setActivePersonality]  = useState<PersonalityDNA | null>(null);
  const [previewPersonality, setPreviewPersonality] = useState<PersonalityDNA | null>(null);

  // Timers
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect revert: compare previous preview to current preview.
  // useEffect runs after commit so prevPreview lags by one render — exactly what we need.
  const prevPreview = useRef<PersonalityDNA | null>(null);
  useEffect(() => { prevPreview.current = previewPersonality; });
  const isReverting = prevPreview.current !== null && previewPersonality === null;

  const currentDNA = previewPersonality ?? activePersonality ?? DEFAULT_DNA;

  // Apply personality with cinematic easing; revert with surgical easing.
  const wrapperTransition = {
    duration: isReverting ? 0.2 : 0.4,
    ease:     isReverting ? SURGICAL : CINEMATIC,
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  function setActive(p: PersonalityDNA) {
    setActivePersonality(p);
  }

  function setPreview(p: PersonalityDNA) {
    // Cancel any pending clear so a fast re-hover doesn't kill the new preview
    if (clearTimer.current)   { clearTimeout(clearTimer.current);   clearTimer.current   = null; }
    if (previewTimer.current) { clearTimeout(previewTimer.current); }

    setPreviewPersonality(p);

    // Auto-clear after 1.4 s regardless of hover state
    previewTimer.current = setTimeout(() => {
      setPreviewPersonality(null);
      previewTimer.current = null;
    }, 1400);
  }

  function clearPreview() {
    // Called on mouseLeave — delay 200 ms so fast traversals don't flicker
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      if (previewTimer.current) { clearTimeout(previewTimer.current); previewTimer.current = null; }
      setPreviewPersonality(null);
      clearTimer.current = null;
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      if (clearTimer.current)   clearTimeout(clearTimer.current);
    };
  }, []);

  // ── CSS variable injection ───────────────────────────────────────────────────
  //
  // Numeric vars (shadowIntensity, accentOpacity, fontWeight, motionDistance)
  // are placed in `animate` so Framer Motion interpolates them between
  // personality switches.
  //
  // String vars (easing, duration, borderRadius, letterSpacing) are placed
  // in `style` and switch instantly — easing strings cannot be interpolated,
  // and the snapping of borderRadius/letterSpacing is acceptable at this scale.

  const numericVars = {
    "--personality-shadow-intensity": currentDNA.shadowIntensity,
    "--personality-accent-opacity":   currentDNA.accentOpacity,
    "--personality-font-weight":      currentDNA.fontWeight,
    "--personality-motion-distance":  currentDNA.motionDistance,
  };

  const stringVars: React.CSSProperties = {
    "--personality-easing":         currentDNA.easing,
    "--personality-duration":       `${currentDNA.duration}ms`,
    "--personality-border-radius":  currentDNA.borderRadius,
    "--personality-letter-spacing": currentDNA.letterSpacing,
  } as React.CSSProperties;

  const ctxValue: PersonalityContextValue = {
    activePersonality,
    previewPersonality,
    currentDNA,
    setActive,
    setPreview,
    clearPreview,
  };

  return (
    <PersonalityContext.Provider value={ctxValue}>
      <motion.div
        animate={numericVars as any}
        style={{ ...stringVars, height: "100%", position: "relative" }}
        transition={wrapperTransition}
      >
        {children}
      </motion.div>
    </PersonalityContext.Provider>
  );
}
