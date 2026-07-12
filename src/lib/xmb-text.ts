/*
 * XMB text-color helpers
 *
 * Part of the XMB-style main menu adapted from PlayStation-3-XMB by linkev
 * (https://github.com/linkev/PlayStation-3-XMB), used under the MIT License.
 *
 * MIT License
 *
 * Copyright (c) 2025 Mart
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
