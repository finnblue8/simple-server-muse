import { useSyncExternalStore } from "react";

export function getPresetTextColors(preset: string) {
  const black = {
    fg: "#0a0a0a",
    shadow: "0 0 6px rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.35)",
  };
  const white = {
    fg: "#ffffff",
    shadow: "0 0 6px rgba(0,0,0,0.55), 0 0 14px rgba(0,0,0,0.35)",
  };
  const map: Record<string, { fg: string; shadow: string }> = {
    "01_day": black, "01_night": white,
    "02_day": black, "02_night": white,
    "03_day": black, "03_night": white,
    "04_day": black, "04_night": white,
    "05_day": white, "05_night": white,
    "06_day": black, "06_night": white,
    "07_day": black, "07_night": white,
    "08_day": white, "08_night": white,
    "09_day": black, "09_night": white,
    "10_day": black, "10_night": white,
    "11_day": white, "11_night": white,
    "12_day": black, "12_night": white,
  };
  return map[preset];
}

export function useXmbPreset() {
  return useSyncExternalStore(
    (callback) => {
      const onChange = () => callback();
      window.addEventListener("xmb-preset-change", onChange);
      return () => window.removeEventListener("xmb-preset-change", onChange);
    },
    () =>
      (window as unknown as { SPLINE_SETTINGS?: { gradientPreset?: string } })
        .SPLINE_SETTINGS?.gradientPreset ?? null,
    () => null,
  );
}
