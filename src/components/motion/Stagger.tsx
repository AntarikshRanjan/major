"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { transitions } from "@/styles/tokens";

interface StaggerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.entry },
  },
};

function buildContainerVariants(staggerDelay: number) {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay / 1000,
      },
    },
  };
}

function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

function StaggerBase({ children, staggerDelay = 60, className }: StaggerProps) {
  return (
    <motion.div
      variants={buildContainerVariants(staggerDelay)}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

StaggerBase.Item = StaggerItem;

export const Stagger = StaggerBase;
