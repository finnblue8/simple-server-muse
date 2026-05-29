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

const ALL = treeData.people as Person[];
const HEADER = treeData.header as string[];
const BANDS_Y = treeData.bandsY as number[];

// Notes = entries with no genealogical relations and no detail lines.
// They're descriptive text from the original SVG, not family-tree cards.
const isNote = (p: Person) =>
  p.details.length === 0 && p.parents.length === 0 && p.children.length === 0;
const PEOPLE = ALL.filter((p) => !isNote(p));
const NOTES = ALL.filter(isNote);

// Group note fragments that are spatially adjacent (same column, stacked rows)
// into single paragraph blocks anchored at the top-left of the group.
type NoteBlock = { x: number; y: number; lines: string[] };
const NOTE_BLOCKS: NoteBlock[] = (() => {
  const sorted = [...NOTES].sort((a, b) => a.cx - b.cx || a.y - b.y);
  const blocks: (NoteBlock & { maxY: number; cx: number })[] = [];
  for (const n of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && Math.abs(last.cx - n.cx) < 120 && n.y - last.maxY < 60) {
      last.lines.push(n.name);
      last.maxY = n.y;
    } else {
      blocks.push({ x: n.cx, y: n.y, cx: n.cx, maxY: n.y, lines: [n.name] });
    }
  }
  return blocks.map(({ x, y, lines }) => ({ x, y, lines }));
})();

// People ids whose lineage is on the Y-DNA tested branch (rendered in blue).
const YDNA_IDS = new Set<number>([8, 10, 14, 17, 18, 22, 23, 29, 33, 58, 75, 77, 84, 130, 134]);

// Dashed/dotted overlay lines from the original SVG.
// `kind: "ydna"` = teal dashed connector for Y-DNA lineage links (e.g. William
// Ira branch ↔ John Edward branch). `kind: "kit"` = finer brown dotted line
// indicating a Y-DNA tester pointing at a kit number.
// Coords are in original SVG units; `svgToLocalX` reconciles them to our layout.
type Dash = { x1: number; y1: number; x2: number; y2: number; kind: "ydna" | "kit" | "mrca" };
const DASHED: Dash[] = [
  { x1: 3350.03, y1: 601.69, x2: 3382.26, y2: 601.69, kind: "mrca" },
  { x1: 1694.63, y1: 1008.95, x2: 1777.78, y2: 1008.95, kind: "ydna" },
  { x1: 1777.78, y1: 1008.95, x2: 1777.78, y2: 1039.55, kind: "ydna" },
  { x1: 8398.80, y1: 1093.65, x2: 8398.80, y2: 1132.81, kind: "ydna" },
  { x1: 674.28, y1: 667.62, x2: 674.28, y2: 645.36, kind: "ydna" },
  { x1: 1088.09, y1: 814.70, x2: 1088.09, y2: 853.87, kind: "ydna" },
  { x1: 5640.04, y1: 814.70, x2: 5640.04, y2: 853.87, kind: "ydna" },
  { x1: 950.16, y1: 721.72, x2: 950.16, y2: 760.89, kind: "ydna" },
  { x1: 9364.36, y1: 628.74, x2: 9364.36, y2: 667.90, kind: "ydna" },
  { x1: 9226.42, y1: 628.74, x2: 9226.42, y2: 667.90, kind: "ydna" },
  { x1: 398.41, y1: 628.74, x2: 398.41, y2: 667.90, kind: "ydna" },
  { x1: 9640.24, y1: 535.76, x2: 9640.24, y2: 574.92, kind: "ydna" },
  { x1: 9916.11, y1: 535.76, x2: 9916.11, y2: 574.92, kind: "ydna" },
  { x1: 1363.97, y1: 1186.63, x2: 1363.97, y2: 1225.80, kind: "ydna" },
  { x1: 2329.53, y1: 1186.63, x2: 2329.53, y2: 1225.80, kind: "ydna" },
  { x1: 312.03, y1: 1761.43, x2: 312.03, y2: 1794.96, kind: "ydna" },
  { x1: 863.78, y1: 1761.43, x2: 863.78, y2: 1794.96, kind: "ydna" },
  // Kit-number dotted lines (subtle): William Ira branch -> John Edward branch
  { x1: 1777.78, y1: 1093.65, x2: 1777.78, y2: 1113.09, kind: "kit" },
  { x1: 1777.78, y1: 1113.09, x2: 1295.00, y2: 1113.09, kind: "kit" },
  { x1: 1295.00, y1: 1113.09, x2: 1295.00, y2: 1225.68, kind: "kit" },
  { x1: 1295.00, y1: 1225.68, x2: 518.94, y2: 1225.68, kind: "kit" },
  { x1: 518.94, y1: 1225.68, x2: 518.94, y2: 1521.37, kind: "kit" },
];

type KitLabel = { x: number; y: number; w: number; h: number; lines: string[] };
const KIT_LABELS: KitLabel[] = [
  { x: 1588.490575, y: 998.914722, w: 104.796, h: 20.071, lines: ["Suspected patriarch of the", "William Ira Britton line, USA"] },
  { x: 8359.587157, y: 1135.496638, w: 78.420, h: 18.889, lines: ["Kit 561092 line", "(West Down branch)"] },
  { x: 1328.767498, y: 1228.478685, w: 70.405, h: 10.715, lines: ["Line of Kit 118335"] },
  { x: 2290.524616, y: 1228.478685, w: 78.020, h: 10.715, lines: ["Line of Kit IN134085"] },
  { x: 282.346776, y: 1797.64152, w: 59.373, h: 10.715, lines: ["Kit B83216 line"] },
  { x: 831.77562, y: 1797.64152, w: 64.018, h: 10.715, lines: ["Kit B577150 line"] },
];

// SVG box centers sit ~35 units to the right of our `cx` values; subtract so the
// dashed overlays align with our rendered card centers.
const SVG_X_OFFSET = 35;

const svgToLocalX = (x: number) => (x - SVG_X_OFFSET) * SCALE_X + PAD_X;
const svgToLocalY = (y: number) => y * SCALE_Y + PAD_Y;


// Coordinate transform: SVG units -> display units
const SCALE_X = 1.25;
const SCALE_Y = 1.3;
const CARD_W = 150;
const CARD_H = 96;
const PAD_X = 80;
const PAD_Y = 40;
const SVG_MAX_X = Math.max(...ALL.map((p) => p.cx)) + 100;
const CANVAS_W = SVG_MAX_X * SCALE_X + PAD_X * 2;
const CANVAS_H = (BANDS_Y[BANDS_Y.length - 1] + 80) * SCALE_Y + PAD_Y * 2;

// Build id -> Person map (PEOPLE was filtered, so array index ≠ id)
const BY_ID = new Map<number, Person>(ALL.map((p) => [p.id, p]));

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
  const scaleRef = useRef(scale);
  const dragging = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const focus = BY_ID.get(focusId)!;
  const parentIds = focus.parents;
  const childIds = focus.children;

  const siblingIds = useMemo(() => {
    if (parentIds.length > 0) return BY_ID.get(parentIds[0])!.children;
    return PEOPLE.filter((p) => p.gen === focus.gen && p.parents.length === 0)
      .sort((a, b) => a.cx - b.cx)
      .map((p) => p.id);
  }, [focus.gen, parentIds]);

  const siblingIndex = Math.max(0, siblingIds.indexOf(focusId));

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Center focused person in viewport
  const centerOn = useCallback((id: number, nextScale = scaleRef.current) => {
    const el = viewportRef.current;
    const target = BY_ID.get(id);
    if (!el || !target) return;
    const p = px(target);
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    setTx(vw / 2 - p.x * nextScale);
    setTy(vh / 2 - p.y * nextScale);
  }, []);



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

  const zoomFromViewportPoint = (ox: number, oy: number, factor: number) => {
    setScale((s) => {
      const ns = clamp(s * factor);
      const r = ns / s;
      setTx((t) => ox - (ox - t) * r);
      setTy((t) => oy - (oy - t) * r);
      return ns;
    });
  };

  const zoomFromCenter = (factor: number) => {
    const el = viewportRef.current;
    if (!el) return;
    zoomFromViewportPoint(el.clientWidth / 2, el.clientHeight / 2, factor);
  };

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
      const childGen = BY_ID.get(p.children[0])!.gen;
      const midY = (BANDS_Y[p.gen] * SCALE_Y + PAD_Y + CARD_H / 2 + BANDS_Y[childGen] * SCALE_Y + PAD_Y - CARD_H / 2) / 2;
      const highlight = p.id === focusId || p.children.includes(focusId);
      // Parent stub
      paths.push({ d: `M ${pp.x} ${pBot} L ${pp.x} ${midY}`, highlight });
      // Horizontal across children + drops
      const xs = p.children.map((cid) => px(BY_ID.get(cid)!).x);
      if (xs.length > 1) {
        paths.push({ d: `M ${Math.min(...xs, pp.x)} ${midY} L ${Math.max(...xs, pp.x)} ${midY}`, highlight });
      } else if (xs[0] !== pp.x) {
        paths.push({ d: `M ${pp.x} ${midY} L ${xs[0]} ${midY}`, highlight });
      }
      for (const cid of p.children) {
        const cp = px(BY_ID.get(cid)!);
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
            {DASHED.map((d, i) => {
              const x1 = svgToLocalX(d.x1);
              const x2 = svgToLocalX(d.x2);
              const y1 = svgToLocalY(d.y1);
              const y2 = svgToLocalY(d.y2);
              const stroke =
                d.kind === "ydna" ? "#2f5d62" : d.kind === "mrca" ? "#8a5a2a" : "#8a7a5a";
              const dashArray = d.kind === "kit" ? "3,3" : "5,3";
              return (
                <line
                  key={`dash-${i}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={stroke}
                  strokeWidth={d.kind === "kit" ? 1.2 : 1.4}
                  strokeDasharray={dashArray}
                />
              );
            })}

          </svg>
          {/* People cards */}
          {PEOPLE.map((p) => {
            const pos = px(p);
            const isFocus = p.id === focusId;
            const isRelated = parentIds.includes(p.id) || childIds.includes(p.id);
            const isYdna = YDNA_IDS.has(p.id);
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
                  "overflow-hidden rounded-sm border-2 px-2 py-1 text-left transition-colors",
                  isFocus
                    ? "border-[#2b2b2b] bg-[#2b2b2b] text-[#fffdf7] shadow-md z-10"
                    : isYdna
                      ? "border-[#2f5d62] bg-[#e8eef0] text-[#2b2b2b] hover:bg-[#d8e4e8]"
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

          {/* Blue Y-DNA kit labels from the original SVG */}
          {KIT_LABELS.map((label, i) => (
            <div
              key={`kit-label-${i}`}
              style={{
                position: "absolute",
                left: svgToLocalX(label.x),
                top: svgToLocalY(label.y),
                width: label.w * SCALE_X,
                minHeight: label.h * SCALE_Y,
              }}
              className="pointer-events-none rounded-sm border border-[#2f5d62] bg-[#fffdf7] px-1 py-0.5 text-center text-[9px] italic leading-tight text-[#2f5d62]"
            >
              {label.lines.map((line) => <div key={line}>{line}</div>)}
            </div>
          ))}


          {/* Marginal notes — plain text from the original SVG */}
          {NOTE_BLOCKS.map((b, i) => (
            <div
              key={`note-${i}`}
              style={{
                position: "absolute",
                left: b.x * SCALE_X + PAD_X - CARD_W / 2,
                top: b.y * SCALE_Y + PAD_Y - 8,
                width: 280,
              }}
              className="pointer-events-none text-[10px] leading-snug text-[#5a5142] italic"
            >
              {b.lines.map((l, j) => (
                <div key={j} dangerouslySetInnerHTML={{ __html: l }} />
              ))}
            </div>
          ))}
        </div>


        {/* Zoom controls */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-md border border-foreground/20 bg-background/90 px-2 py-1 backdrop-blur">
          <button onClick={() => zoomFromCenter(0.8)} className="px-2 text-sm hover:opacity-70">−</button>
          <span className="min-w-[3rem] text-center text-[10px] tabular-nums">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoomFromCenter(1.25)} className="px-2 text-sm hover:opacity-70">+</button>
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
