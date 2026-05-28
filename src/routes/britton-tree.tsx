import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import brittonSvg from "@/assets/britton.svg?raw";


export const Route = createFileRoute("/britton-tree")({
  head: () => ({
    meta: [
      { title: "Britton Family Tree" },
      { name: "description", content: "Interactive Britton family tree." },
    ],
  }),
  component: BrittonTree,
});

const clamp = (s: number) => Math.max(0.1, Math.min(10, s));

function BrittonTree() {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Non-passive wheel listener so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((s) => {
        const ns = clamp(s * factor);
        const ratio = ns / s;
        setTx((t) => ox - (ox - t) * ratio);
        setTy((t) => oy - (oy - t) * ratio);
        return ns;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = { x: e.clientX - tx, y: e.clientY - ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setTx(e.clientX - dragging.current.x);
    setTy(e.clientY - dragging.current.y);
  };
  const onMouseUp = () => { dragging.current = null; };

  const reset = () => { setScale(1); setTx(0); setTy(0); };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: "fit-content",
          }}
        >
          <div
            className="britton-svg"
            style={{ display: "block", userSelect: "none" }}
            dangerouslySetInnerHTML={{ __html: brittonSvg }}
          />

        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md bg-foreground/10 px-3 py-2 backdrop-blur">
        <button onClick={() => setScale((s) => clamp(s * 0.8))} className="px-2 py-1 text-sm hover:opacity-70">−</button>
        <span className="min-w-[3rem] text-center text-xs tabular-nums">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => clamp(s * 1.25))} className="px-2 py-1 text-sm hover:opacity-70">+</button>
        <button onClick={reset} className="ml-2 px-2 py-1 text-xs hover:opacity-70">Reset</button>
      </div>

      <Link
        to="/"
        className="absolute left-4 top-4 z-10 rounded-md bg-foreground/10 px-3 py-2 text-xs backdrop-blur hover:opacity-70"
      >
        ← Back
      </Link>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[10px] opacity-60">
        Scroll to zoom · drag to pan
      </div>
    </main>
  );
}
