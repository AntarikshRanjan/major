"use client";

import { useState, useRef, useMemo } from "react";
import type { ReactNode, DragEvent } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { colors, typeScale, fontFamilies, durations } from "@/styles/tokens";
import { Shimmer } from "@/components/motion/Shimmer";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadState = "idle" | "receiving" | "absorbing" | "analyzing";

interface UploadZoneProps {
  onFileAccepted?: (file: File) => void;
  children?: ReactNode;
}

// ─── Easing tuples (mirrors tokens, inlined to avoid tuple-widening) ──────────

type Curve = [number, number, number, number];

const E: Record<string, Curve> = {
  easeOutExpo:  [0.16, 1,    0.3,  1],
  springSnappy: [0.34, 1.56, 0.64, 1],
  cinematic:    [0.76, 0,    0.24, 1],
  surgical:     [0.4,  0,    0,    1],
};

// ─── Hex opacity constants ────────────────────────────────────────────────────
//   accent 40% = 0x66  |  accent 20% = 0x33  |  accent 4% = 0x0A

const ACCENT_40  = "#C8F04D66"; // border idle-hover
const ACCENT_20  = "#C8F04D33"; // glow idle-hover
const ACCENT_4   = "#C8F04D0A"; // zone fill receiving/absorbing
const SHADOW_OFF = "0 0 0 0px transparent";

// ─── Styles ───────────────────────────────────────────────────────────────────

const TEXT_LABEL: React.CSSProperties = {
  fontSize:      typeScale.sm.size,
  lineHeight:    typeScale.sm.lineHeight,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color:         colors.textSecondary,
  fontFamily:    fontFamilies.heading,
  userSelect:    "none",
};

const TEXT_FILENAME: React.CSSProperties = {
  display:       "block",
  marginTop:     8,
  fontSize:      typeScale.xs.size,
  lineHeight:    typeScale.xs.lineHeight,
  letterSpacing: typeScale.xs.letterSpacing,
  color:         colors.textSecondary,
  fontFamily:    fontFamilies.mono,
  userSelect:    "none",
};

const BAR_LABEL: React.CSSProperties = {
  fontSize:      typeScale.xs.size,
  lineHeight:    typeScale.xs.lineHeight,
  letterSpacing: typeScale.xs.letterSpacing,
  color:         colors.textSecondary,
  fontFamily:    fontFamilies.mono,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadZone({ onFileAccepted, children }: UploadZoneProps) {
  const [state,    setState]    = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [hovered,  setHovered]  = useState(false);
  const dragDepth = useRef(0);

  // ── Computed animate values, vary by state + hover ─────────────────────────

  const zoneAnimate = useMemo(() => {
    if (state === "receiving") return {
      borderColor:     colors.accent,
      boxShadow:       SHADOW_OFF,
      backgroundColor: ACCENT_4,
      scale:           1.02,
    };
    if (state === "absorbing") return {
      borderColor:     colors.accent,
      boxShadow:       SHADOW_OFF,
      backgroundColor: ACCENT_4,
      scale:           1,
    };
    return {
      borderColor:     hovered ? ACCENT_40 : colors.border,
      boxShadow:       hovered ? `0 0 0 1px ${ACCENT_20}` : SHADOW_OFF,
      backgroundColor: "transparent",
      scale:           1,
    };
  }, [state, hovered]);

  // Per-property transitions — each state transition has its own spec
  const zoneTransition = useMemo(() => {
    if (state === "receiving") return {
      borderColor:     { duration: durations.micro / 1000, ease: E.surgical     },
      boxShadow:       { duration: durations.micro / 1000, ease: E.surgical     },
      backgroundColor: { duration: durations.base  / 1000, ease: E.cinematic   },
      scale:           { duration: 0.3,                    ease: E.springSnappy },
    };
    if (state === "absorbing") return {
      scale: { duration: durations.fast / 1000, ease: E.surgical },
    };
    // idle — hover fade in/out
    return {
      borderColor: { duration: 0.2, ease: E.easeOutExpo },
      boxShadow:   { duration: 0.2, ease: E.easeOutExpo },
    };
  }, [state]);

  // ── Drag event handlers ────────────────────────────────────────────────────

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragDepth.current++;
    setState(prev => (prev === "idle" || prev === "receiving") ? "receiving" : prev);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDragLeave() {
    dragDepth.current--;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setState(prev => prev !== "absorbing" ? "idle" : prev);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (state === "absorbing") return;
    dragDepth.current = 0;
    const file = e.dataTransfer.files[0];
    if (!file) { setState("idle"); return; }
    setFileName(file.name);
    onFileAccepted?.(file);
    setState("absorbing");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LayoutGroup>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

        {state !== "analyzing" ? (

          // ── Upload zone (idle / receiving / absorbing) ─────────────────────
          <div
            style={{
              flex:           1,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              layoutId="upload-zone"
              onMouseEnter={() => { if (state === "idle") setHovered(true); }}
              onMouseLeave={() => setHovered(false)}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              animate={zoneAnimate}
              transition={zoneTransition}
              style={{
                width:          480,
                borderRadius:   4,
                borderWidth:    1,
                borderStyle:    state === "idle" ? "dashed" : "solid",
                padding:        "48px 32px",
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                position:       "relative",
                overflow:       "hidden",
                cursor:         "default",
                boxSizing:      "border-box",
              }}
            >
              {/* Primary label */}
              <span style={TEXT_LABEL}>
                {state === "receiving" ? "release to begin" : "drop a video"}
              </span>

              {/* Filename — fades in on absorbing */}
              {state === "absorbing" && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: durations.fast / 1000, ease: E.easeOutExpo }}
                  style={TEXT_FILENAME}
                >
                  {fileName}
                </motion.span>
              )}

              {/* Scan line — drives the absorbing → analyzing transition */}
              {state === "absorbing" && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.6, ease: E.cinematic }}
                  onAnimationComplete={() => setState("analyzing")}
                  style={{
                    position:   "absolute",
                    bottom:     0,
                    left:       0,
                    height:     1,
                    background: colors.accent,
                  }}
                />
              )}
            </motion.div>
          </div>

        ) : (

          // ── Analyzing bar + content below ──────────────────────────────────
          <>
            <motion.div
              layoutId="upload-zone"
              transition={{ layout: { duration: 0.5, ease: E.cinematic } }}
              style={{
                height:          48,
                flexShrink:      0,
                backgroundColor: colors.surface,
                borderBottom:    `1px solid ${colors.border}`,
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "space-between",
                paddingLeft:     16,
                paddingRight:    16,
                boxSizing:       "border-box",
              }}
            >
              {/* Filename — left */}
              <span
                style={{
                  ...BAR_LABEL,
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                  maxWidth:     "60%",
                }}
              >
                {fileName}
              </span>

              {/* "watching" — right, with Shimmer to signal active processing */}
              <Shimmer>
                <span
                  style={{
                    ...BAR_LABEL,
                    display:      "block",
                    paddingLeft:  6,
                    paddingRight: 6,
                    paddingTop:   2,
                    paddingBottom: 2,
                  }}
                >
                  watching
                </span>
              </Shimmer>
            </motion.div>

            {/* Workspace below the bar */}
            <div style={{ flex: 1, overflow: "hidden auto" }}>
              {children}
            </div>
          </>

        )}

      </div>
    </LayoutGroup>
  );
}
