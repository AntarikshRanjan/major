"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import type { ReactNode } from "react";
import { colors, typeScale, fontFamilies } from "@/styles/tokens";
import type { PersonalityDNA } from "@/types/mcq";
import { RevealOrchestrator } from "./RevealOrchestrator";
import { PreviewFrame } from "./PreviewFrame";
import { Magnetic } from "@/components/motion/Magnetic";

// ─── Easing tuples ────────────────────────────────────────────────────────────

type Curve = [number, number, number, number];

const CINEMATIC:    Curve = [0.76, 0, 0.24, 1];
const EASE_OUT_EXPO: Curve = [0.16, 1, 0.3,  1];
const SURGICAL:     Curve = [0.4,  0, 0,    1];

// ─── Control button ───────────────────────────────────────────────────────────

interface ControlButtonProps {
  label:    string;
  accent?:  boolean;
  onClick?: () => void;
}

function ControlButton({ label, accent, onClick }: ControlButtonProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Magnetic strength={0.2}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:    "none",
          border:        "none",
          cursor:        "pointer",
          padding:       "2px 0",
          fontSize:      12,
          lineHeight:    "16px",
          letterSpacing: "0em",
          fontFamily:    fontFamilies.heading,
          color:         accent
            ? colors.accent
            : hovered ? colors.textPrimary : colors.textSecondary,
          transition:    `color 160ms`,
          userSelect:    "none",
        }}
      >
        {label}
      </button>
    </Magnetic>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      aria-hidden="true"
      style={{ width: 1, height: 12, background: colors.border, flexShrink: 0 }}
    />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PreviewRevealProps {
  src:                  string;
  personality:          PersonalityDNA;
  children:             ReactNode;
  onRegenerate?:        () => void;
  onExportCode?:        () => void;
  onChangePersonality?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewReveal({
  src,
  personality,
  children,
  onRegenerate,
  onExportCode,
  onChangePersonality,
}: PreviewRevealProps) {

  // ── Motion values (imperative animations avoid per-render transition conflicts) ──

  const contentOpacity = useMotionValue(1);   // workspace content dim
  const overlayOpacity = useMotionValue(0);   // #0E0D10 full-screen overlay
  const hrWidthPct     = useMotionValue(0);   // 0-50, maps to 0vw-50vw
  const hrOpacity      = useMotionValue(1);   // HR fades out at 1100ms

  // Transform numeric hrWidthPct → CSS string for the motion.div width
  const hrWidthCSS = useTransform(hrWidthPct, v => `${v}vw`);

  // ── React state (controls DOM presence and Framer Motion animate targets) ──

  const [showFrame,    setShowFrame]    = useState(false);
  const [frameEnter,   setFrameEnter]   = useState(false);
  const [listening,    setListening]    = useState(false);
  const [showControls, setShowControls] = useState(false);

  // ── Orchestrate the full reveal sequence ───────────────────────────────────

  useEffect(() => {
    const orchestrator = new RevealOrchestrator({

      // ── 0ms: Theatre goes dark ──────────────────────────────────────────────
      0: () => {
        animate(contentOpacity, 0.08, { duration: 0.6, ease: CINEMATIC });
      },

      // ── 600ms: Dark overlay + horizontal rule slide in ──────────────────────
      600: () => {
        animate(overlayOpacity, 0.85, { duration: 0.4, ease: CINEMATIC });
        animate(hrWidthPct,     50,   { duration: 0.5, ease: EASE_OUT_EXPO });
      },

      // ── 1100ms: Rule fades, frame mounts off-screen ─────────────────────────
      1100: () => {
        animate(hrOpacity, 0, { duration: 0.2, ease: SURGICAL });
        setShowFrame(true);
      },

      // ── 1400ms: Frame enters, overlay retreats ──────────────────────────────
      1400: () => {
        setFrameEnter(true);
        animate(overlayOpacity, 0, { duration: 0.6, ease: CINEMATIC });
      },

      // ── 3200ms: Begin watching for cursor movement ──────────────────────────
      3200: () => {
        setListening(true);
      },
    });

    orchestrator.start();
    return () => orchestrator.cancel();

    // Motion values are stable refs — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cursor detection (activates at 3200ms) ─────────────────────────────────

  useEffect(() => {
    if (!listening) return;

    function handleMouseMove() {
      window.removeEventListener("mousemove", handleMouseMove);
      setShowControls(true);
      // Workspace content returns to full opacity as controls surface
      animate(contentOpacity, 1, { duration: 0.6, ease: EASE_OUT_EXPO });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);

    // contentOpacity is a stable MotionValue ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>

      {/* ── 1. Workspace content (dimmed during reveal) ── */}
      <motion.div style={{ opacity: contentOpacity, height: "100%", width: "100%" }}>
        {children}
      </motion.div>

      {/* ── 2. Dark overlay (#0E0D10) ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         0,
          background:    colors.background,
          opacity:       overlayOpacity,
          zIndex:        10,
          pointerEvents: "none",
        }}
      />

      {/* ── 3. Horizontal rule — slides from left, stops at 50vw ── */}
      <motion.div
        aria-hidden="true"
        style={{
          position:      "absolute",
          left:          0,
          top:           "50%",
          height:        1,
          width:         hrWidthCSS,
          opacity:       hrOpacity,
          background:    "#C8F04D66", // accent at 40% opacity
          zIndex:        11,
          pointerEvents: "none",
          translateY:    "-50%",
        }}
      />

      {/* ── 4. Preview frame — mounts at 1100ms, enters at 1400ms ── */}
      {showFrame && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.96 }}
          animate={frameEnter ? { y: 0, opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: CINEMATIC }}
          style={{
            position:       "absolute",
            inset:          0,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        24,
            boxSizing:      "border-box",
            zIndex:         12,
            pointerEvents:  "none",
          }}
        >
          <PreviewFrame src={src} personality={personality} />
        </motion.div>
      )}

      {/* ── 5. Control bar — fades in on first cursor movement after 3200ms ── */}
      {showFrame && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          style={{
            position:      "fixed",
            bottom:        32,
            left:          "50%",
            x:             "-50%",
            background:    colors.surface,
            border:        `1px solid ${colors.border}`,
            borderRadius:  3,
            padding:       "10px 16px",
            display:       "flex",
            gap:           24,
            alignItems:    "center",
            zIndex:        100,
            pointerEvents: showControls ? "auto" : "none",
          }}
        >
          <ControlButton label="regenerate"        onClick={onRegenerate}        />
          <Divider />
          <ControlButton label="export code" accent onClick={onExportCode}        />
          <Divider />
          <ControlButton label="change personality" onClick={onChangePersonality} />
        </motion.div>
      )}

    </div>
  );
}
