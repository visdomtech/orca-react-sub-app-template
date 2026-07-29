import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import {
  LIQUID_METAL,
  LIQUID_PRESETS,
  type LiquidPreset,
} from "../../theme/liquid-presets";
import { createLiquidTheme } from "../../theme/theme-liquid";

// -- Context shape -----------------------------------------------------------

interface LiquidThemeContextValue {
  preset: LiquidPreset;
  presets: LiquidPreset[];
  setPresetId: (id: string) => void;
}

const LiquidThemeContext = createContext<LiquidThemeContextValue>({
  preset: LIQUID_METAL,
  presets: LIQUID_PRESETS,
  setPresetId: () => {},
});

export const useLiquidTheme = () => useContext(LiquidThemeContext);

// -- localStorage helpers ----------------------------------------------------

const STORAGE_KEY = "liquid-theme-preset";

function loadPresetId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? LIQUID_METAL.id;
  } catch {
    return LIQUID_METAL.id;
  }
}

function savePresetId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // quota or private-mode - ignore
  }
}

// -- CSS variable sync -------------------------------------------------------

function syncCssVariables(el: HTMLElement, preset: LiquidPreset) {
  const { glass, waves, canvas, ink, accent } = preset;
  el.style.setProperty("--lm-glass-bg", glass.bg);
  el.style.setProperty("--lm-glass-border", glass.border);
  el.style.setProperty("--lm-glass-shadow", glass.shadow);
  el.style.setProperty("--lm-canvas-bg", canvas);
  el.style.setProperty("--lm-wave-1", waves[0]);
  el.style.setProperty("--lm-wave-2", waves[1]);
  el.style.setProperty("--lm-wave-3", waves[2]);
  el.style.setProperty("--lm-wave-4", waves[3]);
  el.style.setProperty("--lm-text-primary", ink);
  el.style.setProperty("--lm-text-secondary", "#475569");
  el.style.setProperty("--lm-nav-bg", "rgba(244,246,250,0.6)");
  el.style.setProperty("--lm-accent-soft", `rgba(${hexToRgbStr(accent)},0.08)`);
}

function hexToRgbStr(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`;
}

// -- Provider ----------------------------------------------------------------

export function LiquidThemeProvider({ children }: { children: ReactNode }) {
  const [presetId, setPresetIdRaw] = useState(loadPresetId);

  const preset = useMemo(
    () => LIQUID_PRESETS.find((p) => p.id === presetId) ?? LIQUID_METAL,
    [presetId]
  );

  const setPresetId = useCallback((id: string) => {
    setPresetIdRaw(id);
    savePresetId(id);
  }, []);

  const muiTheme = useMemo(() => createLiquidTheme(preset), [preset]);

  const [wrapperRef, setWrapperRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (wrapperRef) syncCssVariables(wrapperRef, preset);
  }, [wrapperRef, preset]);

  const ctx = useMemo(
    () => ({ preset, presets: LIQUID_PRESETS, setPresetId }),
    [preset, setPresetId]
  );

  return (
    <LiquidThemeContext.Provider value={ctx}>
      <ThemeProvider theme={muiTheme}>
        <Box
          ref={setWrapperRef}
          data-lm-theme={preset.id}
          sx={{ minHeight: "100%" }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </LiquidThemeContext.Provider>
  );
}
