/** Liquid Glass theme presets.
 *  Each preset defines the minimum unique tokens; derived values
 *  (slate variants, hairline, hover states, effect constants) are
 *  computed in createLiquidTheme(). */

export interface LiquidGlass {
  bg: string;
  border: string;
  shadow: string;
}

export interface LiquidPreset {
  id: string;
  label: string;
  description: string;
  isDark: boolean;
  canvas: string;
  ink: string;
  accent: string;
  glass: LiquidGlass;
  waves: [string, string, string, string];
  previewGradient: string;
}

// -- Light themes -----------------------------------------------------------

export const LIQUID_METAL: LiquidPreset = {
  id: "liquid-metal",
  label: "Liquid Metal",
  description: "Chrome blue-violet on cool platinum - the original liquid signature.",
  isDark: false,
  canvas: "#f4f6fa",
  ink: "#0f172a",
  accent: "#5b6cff",
  glass: {
    bg: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.6)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px rgba(91,108,255,0.06)",
  },
  waves: [
    "rgba(199,210,224,0.18)",
    "rgba(91,108,255,0.14)",
    "rgba(199,210,224,0.12)",
    "rgba(244,114,182,0.06)",
  ],
  previewGradient: "linear-gradient(135deg, #5b6cff 0%, #c7d2e0 50%, #f472b6 100%)",
};

export const SAGE_GREEN: LiquidPreset = {
  id: "sage-green",
  label: "Sage Green",
  description: "Reliability and calm - organic green on warm cream canvas.",
  isDark: false,
  canvas: "#f0f4f0",
  ink: "#0f172a",
  accent: "#5b8c5a",
  glass: {
    bg: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.6)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px rgba(91,140,90,0.06)",
  },
  waves: [
    "rgba(139,180,130,0.22)",
    "rgba(91,140,90,0.14)",
    "rgba(212,197,160,0.12)",
    "rgba(168,197,168,0.16)",
  ],
  previewGradient: "linear-gradient(135deg, #5b8c5a 0%, #a8c5a8 50%, #d4c5a0 100%)",
};

export const CORPORATE_BLUE: LiquidPreset = {
  id: "corporate-blue",
  label: "Corporate Blue",
  description: "Trust and security - steel blue on cool white canvas.",
  isDark: false,
  canvas: "#f0f4fa",
  ink: "#0f172a",
  accent: "#3b82f6",
  glass: {
    bg: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.6)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px -4px rgba(15,23,42,0.08), 0 2px 8px -2px rgba(59,130,246,0.06)",
  },
  waves: [
    "rgba(147,197,253,0.22)",
    "rgba(59,130,246,0.14)",
    "rgba(6,182,212,0.10)",
    "rgba(199,210,224,0.16)",
  ],
  previewGradient: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 50%, #06b6d4 100%)",
};

// -- Dark themes ------------------------------------------------------------

export const NEUTRAL_CHARCOAL: LiquidPreset = {
  id: "neutral-charcoal",
  label: "Neutral Charcoal",
  description: "Seriousness and precision - teal accent on deep charcoal.",
  isDark: true,
  canvas: "#1a1a2e",
  ink: "#e5e7eb",
  accent: "#14b8a6",
  glass: {
    bg: "rgba(15,23,42,0.55)",
    border: "rgba(255,255,255,0.08)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
  },
  waves: [
    "rgba(20,184,166,0.15)",
    "rgba(30,41,59,0.25)",
    "rgba(16,185,129,0.10)",
    "rgba(71,85,105,0.20)",
  ],
  previewGradient: "linear-gradient(135deg, #14b8a6 0%, #1a1a2e 50%, #10b981 100%)",
};

export const DEEP_TEAL: LiquidPreset = {
  id: "deep-teal",
  label: "Deep Teal",
  description: "Innovation and sophistication - teal on midnight slate.",
  isDark: true,
  canvas: "#0f172a",
  ink: "#e2e8f0",
  accent: "#0d9488",
  glass: {
    bg: "rgba(15,23,42,0.50)",
    border: "rgba(255,255,255,0.06)",
    shadow:
      "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.25)",
  },
  waves: [
    "rgba(13,148,136,0.18)",
    "rgba(71,85,105,0.22)",
    "rgba(6,182,212,0.08)",
    "rgba(99,102,241,0.12)",
  ],
  previewGradient: "linear-gradient(135deg, #0d9488 0%, #0f172a 50%, #6366f1 100%)",
};

/** All available presets in display order. */
export const LIQUID_PRESETS: LiquidPreset[] = [
  LIQUID_METAL,
  SAGE_GREEN,
  CORPORATE_BLUE,
  NEUTRAL_CHARCOAL,
  DEEP_TEAL,
];
