"use client";

import { useRef, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { ReactNode } from "react";
import { transitions } from "@/styles/tokens";

const PROXIMITY = 80;

interface MagneticProps {
  children:  ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 0.3, className }: MagneticProps) {
  const ref      = useRef<HTMLDivElement>(null);
  const x        = useMotionValue(0);
  const y        = useMotionValue(0);
  const isActive = useRef(false);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PROXIMITY) {
        isActive.current = true;
        animate(x, dx * strength, { ...transitions.selection });
        animate(y, dy * strength, { ...transitions.selection });
      } else if (isActive.current) {
        isActive.current = false;
        animate(x, 0, { ...transitions.selection });
        animate(y, 0, { ...transitions.selection });
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y, strength]);

  return (
    <motion.div ref={ref} style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}
