import { useEffect, useRef } from "react";

export default function XMBWave() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) {
      console.warn("XMBWave: WebGL2 not available");
      return;
    }

    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("EXT_color_buffer_float");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    let cancelled = false;
    let splineLayer: { render: (t: number) => void } | null = null;
    let particlesLayer: { render: (t: number) => void } | null = null;

    let lastT = performance.now();
    let splineTimeSec = 0;
    let particlesTimeSec = 0;
    let sampleAccum = 0;
    const SAMPLE_POINTS = 9;
    const samplePixels = new Uint8Array(4 * SAMPLE_POINTS);
    let smoothR = -1, smoothG = -1, smoothB = -1;

    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;
      splineTimeSec += dt;
      particlesTimeSec += dt;
      try {
        gl.viewport(0, 0, canvas.width, canvas.height);
        splineLayer && splineLayer.render(splineTimeSec);
        particlesLayer && particlesLayer.render(particlesTimeSec);

        sampleAccum += dt;
        if (sampleAccum > 0.5) {
          sampleAccum = 0;
          // Sample a 3x3 grid around the center to reduce noise from the animated wave.
          const cx = Math.floor(canvas.width / 2);
          const cy = Math.floor(canvas.height / 2);
          const step = Math.max(20, Math.floor(Math.min(canvas.width, canvas.height) / 12));
          let sr = 0, sg = 0, sb = 0, n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const px = Math.min(canvas.width - 1, Math.max(0, cx + dx * step));
              const py = Math.min(canvas.height - 1, Math.max(0, cy + dy * step));
              gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, samplePixels);
              sr += samplePixels[0];
              sg += samplePixels[1];
              sb += samplePixels[2];
              n++;
            }
          }
          const ar = sr / n, ag = sg / n, ab = sb / n;
          // Exponential smoothing to prevent flicker.
          if (smoothR < 0) { smoothR = ar; smoothG = ag; smoothB = ab; }
          else {
            const a = 0.15;
            smoothR = smoothR * (1 - a) + ar * a;
            smoothG = smoothG * (1 - a) + ag * a;
            smoothB = smoothB * (1 - a) + ab * a;
          }
          window.dispatchEvent(
            new CustomEvent("xmb-bg-sample", {
              detail: { r: Math.round(smoothR), g: Math.round(smoothG), b: Math.round(smoothB) },
            }),
          );
        }
      } catch (e) {
        console.error("XMBWave render error:", e);
      }
      rafId = requestAnimationFrame(loop);
    };


    const tryInit = () => {
      if (cancelled) return;
      const w = window as unknown as {
        createSplineLayer?: (gl: WebGL2RenderingContext, c: HTMLCanvasElement) => { render: (t: number) => void };
        createParticlesLayer?: (gl: WebGL2RenderingContext, c: HTMLCanvasElement) => { render: (t: number) => void };
      };
      if (typeof w.createSplineLayer === "function" && typeof w.createParticlesLayer === "function") {
        try {
          splineLayer = w.createSplineLayer(gl, canvas);
          particlesLayer = w.createParticlesLayer(gl, canvas);
          lastT = performance.now();
          rafId = requestAnimationFrame(loop);
        } catch (e) {
          console.error("XMBWave init error:", e);
        }
      } else {
        setTimeout(tryInit, 50);
      }
    };
    tryInit();

    const updatePreset = () => {
      const s = (window as unknown as { SPLINE_SETTINGS?: { gradientPreset?: string } }).SPLINE_SETTINGS;
      if (!s) return;
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const hour = now.getHours();
      const isDay = hour >= 8 && hour < 19;
      s.gradientPreset = `${month}_${isDay ? "day" : "night"}`;
    };
    updatePreset();
    const presetTimer = window.setInterval(updatePreset, 60_000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.clearInterval(presetTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
