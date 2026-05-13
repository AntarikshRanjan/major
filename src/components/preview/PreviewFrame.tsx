"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { colors, typeScale, fontFamilies } from "@/styles/tokens";
import type { PersonalityDNA } from "@/types/mcq";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewFrameProps {
  src:         string;
  personality: PersonalityDNA;
}

// ─── Easing ───────────────────────────────────────────────────────────────────

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Loading shimmer ──────────────────────────────────────────────────────────
// Self-contained — handles its own width measurement so it doesn't need
// the Shimmer primitive (which requires a relative-positioned parent of
// known height, incompatible with inset absolute positioning).

function FrameLoadingShimmer() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position:      "absolute",
        inset:         0,
        background:    colors.surface,
        overflow:      "hidden",
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          width:      80,
          height:     "100%",
          background: "linear-gradient(90deg, transparent 0%, #C8F04D0F 50%, transparent 100%)",
        }}
        animate={{ x: [-80, width + 80] }}
        transition={{
          duration:   1.8,
          ease:       [0.45, 0, 0.55, 1],
          repeat:     Infinity,
          repeatType: "loop",
        }}
      />
    </div>
  );
}

// ─── Vignette edge ────────────────────────────────────────────────────────────

type EdgeSide = "top" | "bottom" | "left" | "right";

function VignetteEdge({ side }: { side: EdgeSide }) {
  const isVertical = side === "top" || side === "bottom";
  const gradientDir = { top: "to bottom", bottom: "to top", left: "to right", right: "to left" }[side];

  const style: React.CSSProperties = {
    position:      "absolute",
    pointerEvents: "none",
    background:    `linear-gradient(${gradientDir}, ${colors.background}, transparent)`,
    zIndex:        1,
    ...(isVertical
      ? { [side]: 0, left: 0, right: 0, height: 48 }
      : { [side]: 0, top: 0, bottom: 0, width: 48 }),
  };

  return <div aria-hidden="true" style={style} />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewFrame({ src, personality }: PreviewFrameProps) {
  const [loaded, setLoaded] = useState(false);

  // Detect whether src is a static image
  const isImage = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(src);

  return (
    <div
      style={{
        width:       "100%",
        height:      "70vh",
        position:    "relative",
        // CSS variable set by PersonalityEngine; prop value as fallback
        borderRadius: `var(--personality-border-radius, ${personality.borderRadius})`,
        border:      `1px solid ${colors.border}`,
        overflow:    "hidden",
        boxSizing:   "border-box",
        background:  colors.surface,
      }}
    >
      {/* Loading shimmer — shown until content fires onLoad */}
      {!loaded && <FrameLoadingShimmer />}

      {/* Generated result */}
      {isImage ? (
        <motion.img
          src={src}
          alt="Generated result"
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          style={{
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            display:    "block",
          }}
        />
      ) : (
        <motion.iframe
          src={src}
          title="Generated result"
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          style={{
            width:       "100%",
            height:      "100%",
            border:      "none",
            display:     "block",
            background:  "transparent",
          }}
        />
      )}

      {/* Vignette — 48px gradient on each edge so the preview "floats" */}
      <VignetteEdge side="top"    />
      <VignetteEdge side="bottom" />
      <VignetteEdge side="left"   />
      <VignetteEdge side="right"  />
    </div>
  );
}
