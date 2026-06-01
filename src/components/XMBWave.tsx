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

    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;
      splineTimeSec += dt;
      particlesTimeSec += dt;
      try {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        splineLayer && splineLayer.render(splineTimeSec);
        particlesLayer && particlesLayer.render(particlesTimeSec);
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

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
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
