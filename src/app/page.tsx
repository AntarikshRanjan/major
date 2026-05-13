"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Layout ────────────────────────────────────────────────────────────────────
import { AppShell } from "@/components/layout/AppShell";

// ── Personality ───────────────────────────────────────────────────────────────
import { PersonalityEngine } from "@/components/mcq/PersonalityEngine";

// ── Upload ────────────────────────────────────────────────────────────────────
import { UploadZone } from "@/components/upload/UploadZone";

// ── MCQ ───────────────────────────────────────────────────────────────────────
import { MCQCard } from "@/components/mcq/MCQCard";
import { personalities } from "@/types/mcq";
import type { PersonalityDNA } from "@/types/mcq";

// ── Preview ───────────────────────────────────────────────────────────────────
import { PreviewReveal } from "@/components/preview/PreviewReveal";

// ── Motion ────────────────────────────────────────────────────────────────────
import { Shimmer } from "@/components/motion/Shimmer";

// ── Tokens ────────────────────────────────────────────────────────────────────
import { colors, typeScale, fontFamilies } from "@/styles/tokens";

// ─── State machine ────────────────────────────────────────────────────────────

type Phase = "idle" | "uploading" | "analyzing" | "observing" | "mcq" | "revealing";

// ─── Observation shape ────────────────────────────────────────────────────────

interface Obs {
  id: string;
  category: "layout" | "motion" | "temporal";
  sectionId: string;
  claim: string;
  confidence: number;
}

// ─── Mock observation stream ──────────────────────────────────────────────────
// In production these come from the Python pipeline (observations.json).

const STREAM: Obs[] = [
  { id: "o1", category: "layout", sectionId: "sec_1", confidence: 1.0, claim: "Sticky nav: NVIDIA logo left, Products/Solutions/Industries center, Shop/Drivers/Support right" },
  { id: "o2", category: "layout", sectionId: "sec_1", confidence: 1.0, claim: "Hero: 'Unleash the Future: Dell Technologies World 2026 Keynote', green CTA button, two portrait images right" },
  { id: "o3", category: "motion", sectionId: "sec_2", confidence: 0.9, claim: "Artificial Intelligence section: horizontal carousel, 8+ cards, left/right arrow navigation" },
  { id: "o4", category: "layout", sectionId: "sec_3", confidence: 1.0, claim: "Design and Simulation section: heading, paragraph, 6+ image+text cards in carousel" },
  { id: "o5", category: "motion", sectionId: "sec_4", confidence: 0.9, claim: "High-Performance Computing: carousel of 4+ cards with arrow navigation" },
  { id: "o6", category: "layout", sectionId: "sec_5", confidence: 1.0, claim: "Gaming and Creating: 6+ cards showcasing game titles and RTX news" },
  { id: "o7", category: "motion", sectionId: "sec_6", confidence: 0.9, claim: "Automotive section: brand logo cards in horizontal carousel" },
  { id: "o8", category: "layout", sectionId: "sec_7", confidence: 1.0, claim: "Robotics and Edge AI: heading, text block, 4+ image cards in carousel" },
  { id: "o9", category: "layout", sectionId: "sec_8", confidence: 1.0, claim: "Data Center and Cloud: heading, paragraph, 4+ cards" },
  { id: "o10", category: "layout", sectionId: "sec_10", confidence: 1.0, claim: "Footer: dark theme, 3 columns — Company Info, News and Events, Popular Links, newsletter signup + social icons" },
];

// ─── Easing ───────────────────────────────────────────────────────────────────

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CINEMATIC: [number, number, number, number] = [0.76, 0, 0.24, 1];

// ─── Category accent colours ──────────────────────────────────────────────────

const CAT_HUE: Record<string, string> = {
  layout: colors.textSecondary,
  motion: colors.accent,
  temporal: "#6B6578",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ObsCard({ obs }: { obs: Obs }) {
  return (
    <div
      style={{
        padding: "10px 16px 10px 12px",
        borderLeft: `1px solid ${colors.border}`,
        marginBottom: 2,
      }}
    >
      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: CAT_HUE[obs.category] ?? colors.textSecondary,
            fontFamily: fontFamilies.heading,
          }}
        >
          {obs.category}
        </span>
        <span style={{ fontSize: 10, color: colors.border, fontFamily: fontFamilies.mono }}>
          {obs.sectionId}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: colors.textSecondary,
            fontFamily: fontFamilies.mono,
          }}
        >
          {Math.round(obs.confidence * 100)}%
        </span>
      </div>

      {/* Claim */}
      <p
        style={{
          margin: 0,
          fontSize: typeScale.sm.size,
          lineHeight: typeScale.sm.lineHeight,
          letterSpacing: typeScale.sm.letterSpacing,
          color: colors.textPrimary,
          fontFamily: fontFamilies.heading,
        }}
      >
        {obs.claim}
      </p>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p
      style={{
        margin: "0 0 8px 0",
        paddingLeft: 12,
        fontSize: typeScale.xs.size,
        lineHeight: typeScale.xs.lineHeight,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: colors.textSecondary,
        fontFamily: fontFamilies.heading,
        userSelect: "none",
      }}
    >
      {text}
    </p>
  );
}

function BuildButton({
  personality,
  onClick,
}: {
  personality: PersonalityDNA;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: hovered ? colors.accent : "transparent",
        border: `1px solid ${hovered ? colors.accent : colors.border}`,
        borderRadius: 3,
        padding: "9px 16px",
        cursor: "pointer",
        fontSize: typeScale.sm.size,
        lineHeight: typeScale.sm.lineHeight,
        letterSpacing: typeScale.sm.letterSpacing,
        fontWeight: 500,
        fontFamily: fontFamilies.heading,
        color: hovered ? colors.background : colors.textPrimary,
        transition: "background 160ms, border-color 160ms, color 160ms",
        userSelect: "none",
      }}
    >
      build with {personality.label.toLowerCase()}
      <span style={{ opacity: 0.5, fontSize: 10 }}>↗</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [obs, setObs] = useState<Obs[]>([]);
  const [personality, setPersonality] = useState<PersonalityDNA>(personalities[0]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function kill() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => kill, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stream simulated observations after analysis begins ────────────────────

  function streamObs() {
    setObs([]);
    STREAM.forEach((item, i) => {
      const t = setTimeout(() => {
        setObs(prev => {
          const next = [...prev, item];
          // First observation surfaces → transition to observing
          if (next.length === 1) setPhase("observing");
          return next;
        });
      }, i * 620 + 480);
      timers.current.push(t);
    });

    // After all observations have surfaced + 1.4 s grace → present MCQ
    const mcqAt = STREAM.length * 620 + 1400;
    timers.current.push(setTimeout(() => setPhase("mcq"), mcqAt));
  }

  // ── File received from UploadZone ──────────────────────────────────────────

  const handleFileAccepted = useCallback((_file: File) => {
    kill();
    setPhase("uploading");
    // 800 ms after drop — absorb animation completes → begin analysis
    const t = setTimeout(() => {
      setPhase("analyzing");
      streamObs();
    }, 800);
    timers.current.push(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── MCQ confirmed → kick off the reveal ────────────────────────────────────

  function handleConfirm() {
    kill();
    setPhase("revealing");
  }

  // ── Reset back to idle (regenerate / change personality) ──────────────────

  function handleReset() {
    kill();
    setPhase("idle");
    setObs([]);
    setPersonality(personalities[0]);
  }

  // ─── Workspace inner content ───────────────────────────────────────────────
  // Rendered as children of UploadZone; appears in the slot below the compact
  // bar once the zone transitions to its own "analyzing" state.

  const innerContent = (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "20px 0",
      }}
    >
      {/* Reading indicator — shown while observations are still streaming */}
      <AnimatePresence>
        {phase === "analyzing" && (
          <motion.div
            key="indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            style={{ marginBottom: 12 }}
          >
            <Shimmer>
              <div
                style={{
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: typeScale.xs.size,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.heading,
                  }}
                >
                  reading frames
                </span>
              </div>
            </Shimmer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Observation list — items animate in one by one as they arrive */}
      {obs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel text={`observations — ${obs.length}`} />
          {obs.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            >
              <ObsCard obs={item} />
            </motion.div>
          ))}
        </div>
      )}

      {/* MCQ + confirm — enters after all observations have surfaced */}
      <AnimatePresence>
        {phase === "mcq" && (
          <motion.div
            key="mcq-block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            <MCQCard
              question="choose interaction personality"
              personalities={personalities}
              onPersonalitySelected={setPersonality}
            />

            {/* Confirm CTA — always rendered once MCQ block is mounted */}
            <div style={{ padding: "8px 24px 40px" }}>
              <BuildButton personality={personality} onClick={handleConfirm} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── Root render ───────────────────────────────────────────────────────────

  return (
    // Outer div pins the viewport — PersonalityEngine's height:100% needs a
    // defined parent height; 100vh here supplies it.
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <PersonalityEngine>
        <AppShell>

          {/*
           * Workspace inner shell.
           * position:relative makes it the containing block for the two
           * absolutely-positioned layers (upload flow + reveal overlay).
           */}
          <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>

            {/* ── Layer 1: Upload flow (idle → uploading → analyzing → observing → mcq) ── */}
            {/*
             * Kept mounted as one continuous element so that UploadZone's
             * internal layoutId animation (zone → compact bar) survives
             * phase transitions without remounting.
             * Exits as a unit when the reveal begins.
             */}
            <AnimatePresence>
              {phase !== "revealing" && (
                <motion.div
                  key="upload-flow"
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.4, ease: CINEMATIC },
                  }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <UploadZone onFileAccepted={handleFileAccepted}>
                    {innerContent}
                  </UploadZone>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Layer 2: Preview reveal (mcq → revealing) ── */}
            {/*
             * Overlays everything at zIndex 20.
             * PreviewReveal owns its entire animation sequence — the parent
             * transition is near-instant (0.01 s) so the orchestrator starts
             * from a clean t=0.
             * The observation list is passed as children so PreviewReveal
             * can dim it during the "theatre goes dark" moment.
             */}
            <AnimatePresence>
              {phase === "revealing" && (
                <motion.div
                  key="reveal-layer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.01 }}
                  style={{ position: "absolute", inset: 0, zIndex: 20 }}
                >
                  <PreviewReveal
                    src="http://localhost:3000/generated.html"
                    personality={personality}
                    onRegenerate={handleReset}
                    onExportCode={() => { /* wire to export service */ }}
                    onChangePersonality={() => setPhase("mcq")}
                  >
                    {/* Workspace content that gets dimmed during the reveal sequence */}
                    <div style={{ padding: "20px 0" }}>
                      {obs.map(item => (
                        <ObsCard key={item.id} obs={item} />
                      ))}
                    </div>
                  </PreviewReveal>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </AppShell>
      </PersonalityEngine>
    </div>
  );
}
