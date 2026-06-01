import { useEffect, useRef } from "react";

export default function XMBWave() {
  const canvasRef = useRef(null);

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
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    let cancelled = false;
    let splineLayer = null;
    let particlesLayer = null;

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
        splineLayer && splineLayer.render(splineTimeSec);
        particlesLayer && particlesLayer.render(particlesTimeSec);
      } catch (e) {
        console.error("XMBWave render error:", e);
      }
      rafId = requestAnimationFrame(loop);
    };

    const tryInit = () => {
      if (cancelled) return;
      if (
        typeof window.createSplineLayer === "function" &&
        typeof window.createParticlesLayer === "function"
      ) {
        try {
          splineLayer = window.createSplineLayer(gl, canvas);
          particlesLayer = window.createParticlesLayer(gl, canvas);
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
        zIndex: -1,
        display: "block",
      }}
    />
  );
}
