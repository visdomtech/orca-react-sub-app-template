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

/** All available presets in display order. */
export const LIQUID_PRESETS: LiquidPreset[] = [
  LIQUID_METAL,
  SAGE_GREEN,
  CORPORATE_BLUE,
];
