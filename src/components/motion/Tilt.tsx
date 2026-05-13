"use client";

import { useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { ReactNode } from "react";
import { durations, easings } from "@/styles/tokens";

const SPRING_CONFIG = { type: "spring", stiffness: 300, damping: 30 } as const;

// Parsed once — surgical easing for exit
const SURGICAL: [number, number, number, number] = [0.4, 0, 0, 1];

interface TiltProps {
  children: ReactNode;
  maxDeg?: number;
  className?: string;
}

export function Tilt({ children, maxDeg = 5, className }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const ny = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    animate(rotateX, -ny * maxDeg, { ...SPRING_CONFIG });
    animate(rotateY,  nx * maxDeg, { ...SPRING_CONFIG });
  }

  function handleMouseLeave() {
    animate(rotateX, 0, { duration: durations.fast / 1000, ease: SURGICAL });
    animate(rotateY, 0, { duration: durations.fast / 1000, ease: SURGICAL });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
