// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  background:     "#0E0D10",
  surface:        "#161519",
  surfaceRaised:  "#1C1B20",
  border:         "#2A2830",
  textPrimary:    "#F2EFE8",
  textSecondary:  "#8B8799",
  accent:         "#C8F04D",
  accentDim:      "#C8F04D18",
} as const;

// ─── Easings ──────────────────────────────────────────────────────────────────

export const easings = {
  easeOutExpo:  "cubic-bezier(0.16, 1, 0.3, 1)",       // entries
  springSnappy: "cubic-bezier(0.34, 1.56, 0.64, 1)",   // selections
  cinematic:    "cubic-bezier(0.76, 0, 0.24, 1)",       // reveals
  surgical:     "cubic-bezier(0.4, 0, 0, 1)",           // exits
  breath:       "cubic-bezier(0.45, 0, 0.55, 1)",       // ambient loops
} as const;

// ─── Durations ────────────────────────────────────────────────────────────────

export const durations = {
  micro:     80,
  fast:      160,
  base:      280,
  slow:      500,
  cinematic: 900,
} as const;

// ─── Framer Motion Transitions ────────────────────────────────────────────────

type EasingTuple = [number, number, number, number];

const toTuple = (curve: string): EasingTuple => {
  const m = curve.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) throw new Error(`Invalid cubic-bezier: ${curve}`);
  return m[1].split(",").map(Number) as unknown as EasingTuple;
};

export const transitions = {
  entry: {
    duration: durations.base / 1000,
    ease: toTuple(easings.easeOutExpo),
  },
  selection: {
    duration: durations.fast / 1000,
    ease: toTuple(easings.springSnappy),
  },
  reveal: {
    duration: durations.slow / 1000,
    ease: toTuple(easings.cinematic),
  },
  exit: {
    duration: durations.fast / 1000,
    ease: toTuple(easings.surgical),
  },
  ambient: {
    duration: durations.cinematic / 1000,
    ease: toTuple(easings.breath),
    repeat: Infinity,
    repeatType: "mirror" as const,
  },
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  surface: [
    "0 1px 2px rgba(0, 0, 0, 0.45)",
    "0 4px 12px rgba(0, 0, 0, 0.28)",
    "0 8px 24px rgba(0, 0, 0, 0.16)",
  ].join(", "),

  float: [
    "0 2px 4px rgba(0, 0, 0, 0.52)",
    "0 8px 20px rgba(0, 0, 0, 0.36)",
    "0 20px 48px rgba(0, 0, 0, 0.24)",
  ].join(", "),

  accent: [
    "0 0 0 1px rgba(200, 240, 77, 0.18)",
    "0 0 16px rgba(200, 240, 77, 0.12)",
    "0 0 40px rgba(200, 240, 77, 0.06)",
  ].join(", "),
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontFamilies = {
  heading: '"Inter Display", "Inter", system-ui, sans-serif',
  mono:    '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
} as const;

export const fontVariationSettings = {
  heading: {
    100: '"wght" 100',
    400: '"wght" 400',
    500: '"wght" 500',
    600: '"wght" 600',
    700: '"wght" 700',
    800: '"wght" 800',
  },
} as const;

export const typeScale = {
  xs:   { size: "11px", lineHeight: "16px", letterSpacing: "0.02em"  },
  sm:   { size: "13px", lineHeight: "20px", letterSpacing: "0.01em"  },
  base: { size: "15px", lineHeight: "24px", letterSpacing: "0em"     },
  lg:   { size: "18px", lineHeight: "28px", letterSpacing: "-0.01em" },
  xl:   { size: "24px", lineHeight: "32px", letterSpacing: "-0.02em" },
  "2xl":{ size: "32px", lineHeight: "40px", letterSpacing: "-0.03em" },
  "3xl":{ size: "48px", lineHeight: "56px", letterSpacing: "-0.04em" },
} as const;

// ─── Consolidated Token Export ────────────────────────────────────────────────

export const tokens = {
  colors,
  easings,
  durations,
  transitions,
  shadows,
  fontFamilies,
  fontVariationSettings,
  typeScale,
} as const;

export type Tokens       = typeof tokens;
export type ColorToken   = keyof typeof colors;
export type ShadowToken  = keyof typeof shadows;
export type TypeToken    = keyof typeof typeScale;
export type DurationToken = keyof typeof durations;
