"use client";

import type { ReactNode } from "react";
import { colors } from "@/styles/tokens";
import { Sidebar } from "./Sidebar";
import { Workspace } from "./Workspace";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        display:    "flex",
        width:      "100vw",
        height:     "100vh",
        overflow:   "hidden",
        background: colors.background,
      }}
    >
      <Sidebar />
      <div
        aria-hidden="true"
        style={{
          width:      1,
          flexShrink: 0,
          background: colors.border,
        }}
      />
      <Workspace>{children}</Workspace>
    </div>
  );
}
