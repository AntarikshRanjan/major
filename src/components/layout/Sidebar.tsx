"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { colors, durations, typeScale, fontFamilies } from "@/styles/tokens";
import { Magnetic } from "@/components/motion/Magnetic";

// ─── Placeholder — filled later ──────────────────────────────────────────────

function ProjectList() {
  return <div style={{ flex: 1 }} />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M12.2 7.5c0-.28.02-.55.06-.82l1.3-.75a.5.5 0 0 0 .18-.68l-1.4-2.43a.5.5 0 0 0-.65-.2l-1.28.52a5.4 5.4 0 0 0-1.43-.83L8.7.88A.5.5 0 0 0 8.2.5H5.8a.5.5 0 0 0-.5.38l-.29 1.41c-.52.2-1 .48-1.43.83L2.3 2.6a.5.5 0 0 0-.65.2L.25 5.25a.5.5 0 0 0 .18.68l1.3.75c-.04.27-.06.54-.06.82s.02.55.06.82l-1.3.75a.5.5 0 0 0-.18.68l1.4 2.43c.13.23.42.31.65.2l1.28-.52c.44.35.92.63 1.43.83l.29 1.41c.07.32.36.54.68.54h2.4c.32 0 .61-.22.68-.54l.29-1.41c.52-.2 1-.48 1.43-.83l1.28.52c.23.11.52.03.65-.2l1.4-2.43a.5.5 0 0 0-.18-.68l-1.3-.75c.04-.27.06-.54.06-.82Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Sidebar item ─────────────────────────────────────────────────────────────

interface SidebarItemProps {
  icon: ReactNode;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active = false, onClick }: SidebarItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           8,
        width:         "100%",
        // 12px pad − 2px border = 10px left pad so content stays at 12px from edge
        paddingLeft:   10,
        paddingRight:  12,
        paddingTop:    9,
        paddingBottom: 9,
        background:    "none",
        border:        "none",
        borderLeft:    `2px solid ${active ? colors.accent : "transparent"}`,
        color:         active || hovered ? colors.textPrimary : colors.textSecondary,
        cursor:        "pointer",
        transition:    `color ${durations.fast}ms ease`,
        fontSize:      typeScale.sm.size,
        lineHeight:    typeScale.sm.lineHeight,
        letterSpacing: typeScale.sm.letterSpacing,
        fontFamily:    fontFamilies.heading,
        textAlign:     "left",
        whiteSpace:    "nowrap",
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <div
      style={{
        width:          168,
        minWidth:       168,
        maxWidth:       168,
        height:         "100%",
        background:     colors.background,
        display:        "flex",
        flexDirection:  "column",
        overflow:       "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 12px 16px" }}>
        <Magnetic>
          <span
            style={{
              fontSize:      typeScale.lg.size,
              fontWeight:    600,
              color:         colors.accent,
              fontFamily:    fontFamilies.heading,
              letterSpacing: typeScale.lg.letterSpacing,
              cursor:        "default",
              userSelect:    "none",
              display:       "inline-block",
            }}
          >
            v0
          </span>
        </Magnetic>
      </div>

      {/* Project list — filled later */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <ProjectList />
      </div>

      {/* Bottom icons */}
      <div style={{ paddingBottom: 16 }}>
        <SidebarItem icon={<IconSettings />} label="Settings" />
        <SidebarItem icon={<IconUser />}     label="Profile"  />
      </div>
    </div>
  );
}
