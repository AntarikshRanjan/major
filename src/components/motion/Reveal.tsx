"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { transitions } from "@/styles/tokens";

type Direction = "up" | "down" | "left" | "right";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  duration?: number;
  className?: string;
}

const OFFSET = 12;

function getInitial(direction: Direction): { opacity: number; x?: number; y?: number } {
  switch (direction) {
    case "up":    return { opacity: 0, y:  OFFSET };
    case "down":  return { opacity: 0, y: -OFFSET };
    case "left":  return { opacity: 0, x:  OFFSET };
    case "right": return { opacity: 0, x: -OFFSET };
  }
}

export function Reveal({
  children,
  delay = 0,
  direction = "up",
  duration,
  className,
}: RevealProps) {
  return (
    <motion.div
      initial={getInitial(direction)}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        ...transitions.entry,
        ...(duration !== undefined && { duration: duration / 1000 }),
        delay: delay / 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
