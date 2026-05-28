import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import treeData from "@/data/britton-tree.json";

export const Route = createFileRoute("/britton-tree")({
  head: () => ({
    meta: [
      { title: "Britton Family Tree" },
      { name: "description", content: "Interactive Britton family tree — navigate with arrow keys." },
    ],
  }),
  component: BrittonTree,
});

type Person = {
  id: number;
  gen: number;
  cx: number;
  y: number;
  name: string;
  details: string[];
  parents: number[];
  children: number[];
};

const PEOPLE = treeData.people as Person[];
const HEADER = treeData.header as string[];
const BANDS_Y = treeData.bandsY as number[];

// Coordinate transform: SVG units (10590 x ~1745) -> display units
// Use the SVG's original cx spacing so cards never overlap.
const SCALE_X = 1;
const SCALE_Y = 0.85;
const CARD_W = 170;
const CARD_H = 72;
const PAD_X = 80;
const PAD_Y = 40;

const SVG_MAX_X = Math.max(...PEOPLE.map((p) => p.cx)) + 100;
const CANVAS_W = SVG_MAX_X * SCALE_X + PAD_X * 2;
const CANVAS_H = (BANDS_Y[BANDS_Y.length - 1] + 80) * SCALE_Y + PAD_Y * 2;

function px(p: Person) {
  return {
    x: p.cx * SCALE_X + PAD_X,
    y: (BANDS_Y[p.gen] ?? p.y) * SCALE_Y + PAD_Y,
  };
}

const ROOT_ID = PEOPLE.find((p) => p.gen === 0)?.id ?? 0;
const clamp = (s: number) => Math.max(0.3, Math.min(4, s));

function BrittonTree() {
  const [focusId, setFocusId] = useState<number>(ROOT_ID);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const focus = PEOPLE[focusId];
  const parentIds = focus.parents;
  const childIds = focus.children;

  const siblingIds = useMemo(() => {
    if (parentIds.length > 0) return PEOPLE[parentIds[0]].children;
    return PEOPLE.filter((p) => p.gen === focus.gen && p.parents.length === 0)
      .sort((a, b) => a.cx - b.cx)
      .map((p) => p.id);
  }, [focus.gen, parentIds]);
  const siblingIndex = Math.max(0, siblingIds.indexOf(focusId));

  // Center focused person in viewport
  const centerOn = useCallback((id: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const p = px(PEOPLE[id]);
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    setTx(vw / 2 - p.x * scale);
    setTy(vh / 2 - p.y * scale);
  }, [scale]);

  useEffect(() => { centerOn(focusId); }, [focusId, centerOn]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (parentIds.length > 0) setFocusId(parentIds[0]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (childIds.length > 0) setFocusId(childIds[0]);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (siblingIndex > 0) setFocusId(siblingIds[siblingIndex - 1]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (siblingIndex < siblingIds.length - 1) setFocusId(siblingIds[siblingIndex + 1]);
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusId(ROOT_ID);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parentIds, childIds, siblingIds, siblingIndex]);

  // Wheel zoom (non-passive)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((s) => {
        const ns = clamp(s * factor);
        const r = ns / s;
        setTx((t) => ox - (ox - t) * r);
        setTy((t) => oy - (oy - t) * r);
        return ns;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = { x: e.clientX - tx, y: e.clientY - ty, moved: false };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const nx = e.clientX - dragging.current.x;
    const ny = e.clientY - dragging.current.y;
    if (Math.abs(nx - tx) + Math.abs(ny - ty) > 3) dragging.current.moved = true;
    setTx(nx); setTy(ny);
  };
  const onMouseUp = () => { dragging.current = null; };

  // Connector paths (orthogonal: parent bottom -> mid Y -> child top)
  const connectors = useMemo(() => {
    const paths: { d: string; highlight: boolean }[] = [];
    for (const p of PEOPLE) {
      if (p.children.length === 0) continue;
      const pp = px(p);
      const pBot = pp.y + CARD_H / 2;
      // Determine mid Y between parent gen and child gen
      const childGen = PEOPLE[p.children[0]].gen;
      const midY = (BANDS_Y[p.gen] * SCALE_Y + PAD_Y + CARD_H / 2 + BANDS_Y[childGen] * SCALE_Y + PAD_Y - CARD_H / 2) / 2;
      const highlight = p.id === focusId || p.children.includes(focusId);
      // Parent stub
      paths.push({ d: `M ${pp.x} ${pBot} L ${pp.x} ${midY}`, highlight });
      // Horizontal across children + drops
      const xs = p.children.map((cid) => px(PEOPLE[cid]).x);
      if (xs.length > 1) {
        paths.push({ d: `M ${Math.min(...xs, pp.x)} ${midY} L ${Math.max(...xs, pp.x)} ${midY}`, highlight });
      } else if (xs[0] !== pp.x) {
        paths.push({ d: `M ${pp.x} ${midY} L ${xs[0]} ${midY}`, highlight });
      }
      for (const cid of p.children) {
        const cp = px(PEOPLE[cid]);
        paths.push({ d: `M ${cp.x} ${midY} L ${cp.x} ${cp.y - CARD_H / 2}`, highlight: highlight || cid === focusId });
      }
    }
    return paths;
  }, [focusId]);

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-2">
        <Link to="/" className="text-xs opacity-70 hover:opacity-100">← Back</Link>
        <div className="text-center">
          <h1 className="text-sm font-semibold">{HEADER[0] ?? "Britton Family Tree"}</h1>
          <p className="text-[10px] opacity-60">{HEADER[1]}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] opacity-60">
          <span>↑ parent · ↓ child · ←→ siblings · Home: root · scroll to zoom · drag to pan</span>
          <button onClick={() => { setScale(1); centerOn(focusId); }} className="rounded border border-foreground/20 px-2 py-0.5 hover:bg-foreground/10">Reset</button>
        </div>
      </header>

      <div
        ref={viewportRef}
        className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ background: "#fffdf7" }}
      >
        <div
          style={{
            position: "absolute", left: 0, top: 0,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: CANVAS_W, height: CANVAS_H,
          }}
        >
          {/* Connector lines */}
          <svg
            width={CANVAS_W} height={CANVAS_H}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            {connectors.map((c, i) => (
              <path
                key={i}
                d={c.d}
                fill="none"
                stroke={c.highlight ? "#2b2b2b" : "#9a8c70"}
                strokeWidth={c.highlight ? 2 : 1.25}
                strokeLinecap="square"
              />
            ))}
          </svg>

          {/* People cards */}
          {PEOPLE.map((p) => {
            const pos = px(p);
            const isFocus = p.id === focusId;
            const isRelated = parentIds.includes(p.id) || childIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={(e) => { e.stopPropagation(); if (!dragging.current?.moved) setFocusId(p.id); }}
                style={{
                  position: "absolute",
                  left: pos.x - CARD_W / 2,
                  top: pos.y - CARD_H / 2,
                  width: CARD_W,
                  height: CARD_H,
                }}
                className={[
                  "rounded-sm border px-2 py-1 text-left transition-colors",
                  isFocus
                    ? "border-[#2b2b2b] bg-[#2b2b2b] text-[#fffdf7] shadow-md z-10"
                    : isRelated
                      ? "border-[#5a5142] bg-[#f3ecdc] text-[#2b2b2b] hover:bg-[#ece2cb]"
                      : "border-[#cbbfa4] bg-[#fffdf7] text-[#2b2b2b] hover:bg-[#f3ecdc]",
                ].join(" ")}
              >
                <div className="truncate text-[11px] font-semibold leading-tight">{p.name}</div>
                {p.details.slice(0, 3).map((d, i) => (
                  <div key={i} className="truncate text-[9px] leading-tight opacity-80">{d}</div>
                ))}
              </button>
            );
          })}
        </div>

        {/* Zoom controls */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-md border border-foreground/20 bg-background/90 px-2 py-1 backdrop-blur">
          <button onClick={() => setScale((s) => clamp(s * 0.8))} className="px-2 text-sm hover:opacity-70">−</button>
          <span className="min-w-[3rem] text-center text-[10px] tabular-nums">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => clamp(s * 1.25))} className="px-2 text-sm hover:opacity-70">+</button>
        </div>

        {/* Focused person details panel */}
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-md rounded-md border border-foreground/20 bg-background/95 p-3 text-xs shadow-md backdrop-blur">
          <div className="text-[9px] uppercase tracking-widest opacity-50">Generation {focus.gen}</div>
          <div className="text-sm font-semibold">{focus.name}</div>
          {focus.details.map((d, i) => (
            <div key={i} className="opacity-80">{d}</div>
          ))}
        </div>
      </div>

      <footer className="border-t border-foreground/10 px-4 py-2 text-[10px] opacity-60">
        {HEADER.slice(2).join("  ·  ")}
      </footer>
    </main>
  );
}
