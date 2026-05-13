"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { transitions } from "@/styles/tokens";

// 40px band with symmetric fade — total element width is 80px
const BAND_WIDTH = 80;

interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

export function Shimmer({ children, className }: ShimmerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(200);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.offsetWidth);

    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {children}
      <motion.div
        aria-hidden="true"
        style={{
          position:       "absolute",
          top:            0,
          left:           0,
          width:          BAND_WIDTH,
          height:         "100%",
          background:     "linear-gradient(90deg, transparent 0%, #C8F04D0F 50%, transparent 100%)",
          pointerEvents:  "none",
        }}
        animate={{ x: [-BAND_WIDTH, width + BAND_WIDTH] }}
        transition={{
          duration:   1.8,
          ease:       transitions.ambient.ease,
          repeat:     Infinity,
          repeatType: "loop",
        }}
      />
    </div>
  );
}
