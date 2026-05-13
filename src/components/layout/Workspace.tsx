"use client";

import type { ReactNode } from "react";
import { colors } from "@/styles/tokens";

interface WorkspaceProps {
  children: ReactNode;
}

export function Workspace({ children }: WorkspaceProps) {
  return (
    <div
      style={{
        flex:       1,
        height:     "100%",
        overflow:   "hidden",
        position:   "relative",
        background: colors.background,
      }}
    >
      {/* Ambient light — radial source from above-right */}
      <div
        aria-hidden="true"
        style={{
          position:       "absolute",
          inset:          0,
          background:     "radial-gradient(ellipse 800px 600px at 60% 20%, #C8F04D08 0%, transparent 70%)",
          pointerEvents:  "none",
          zIndex:         0,
        }}
      />

      {/* Content layer — above the gradient */}
      <div style={{ position: "relative", height: "100%", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
