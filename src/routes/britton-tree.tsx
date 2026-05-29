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

const isNote = (p: Person) =>
  p.details.length === 0 && p.parents.length === 0 && p.children.length === 0;
const PEOPLE = ALL.filter((p) => !isNote(p));
const NOTES = ALL.filter(isNote);

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

const YDNA_IDS = new Set<number>([0, 8, 10, 14, 15, 17, 18, 22, 23, 29, 33, 58, 75, 77, 84, 130, 134]);

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
  { x1: 1777.78, y1: 1093.65, x2: 1777.78, y2: 1113.09, kind: "kit" },
  { x1: 1777.78, y1: 1113.09, x2: 1295.00, y2: 1113.09, kind: "kit" },
  { x1: 1295.00, y1: 1113.09, x2: 1295.00, y2: 1225.68, kind: "kit" },
  { x1: 1295.00, y1: 1225.68, x2: 518.94, y2: 1225.68, kind: "kit" },
  { x1: 518.94, y1: 1225.68, x2: 518.94, y2: 1521.37, kind: "kit" },
];

type KitLabel = { x: number; y: number; w: number; h: number; lines: string[] };
const KIT_LABELS: KitLabel[] = [
  { x: 1588.490575, y: 998.914722, w: 104.796, h: 20.071, lines: ["Suspected patriarch of the", "William Ira Britton line, USA"] },
  { x: 633.674842, y: 623.789424, w: 81.212, h: 18.889, lines: ["Likely origin point for", "A.H. Britton branch"] },
  { x: 1047.488209, y: 856.550496, w: 81.212, h: 18.889, lines: ["Likely origin point for", "A.H. Britton branch"] },
  { x: 5599.435250, y: 856.550496, w: 81.212, h: 18.889, lines: ["Likely origin point for", "A.H. Britton branch"] },
  { x: 909.550420, y: 763.568449, w: 81.212, h: 18.889, lines: ["Likely origin point for", "A.H. Britton branch"] },
  { x: 9325.158524, y: 670.586402, w: 78.407, h: 18.889, lines: ["Possible origin point", "for Raynham branch"] },
  { x: 9187.220735, y: 670.586402, w: 78.407, h: 18.889, lines: ["Possible origin point", "for Raynham branch"] },
  { x: 359.202232, y: 670.586402, w: 78.407, h: 18.889, lines: ["Possible origin point", "for Raynham branch"] },
  { x: 9601.034102, y: 577.604354, w: 78.407, h: 18.889, lines: ["Possible origin point", "for Raynham branch"] },
  { x: 9876.909681, y: 577.604354, w: 78.407, h: 18.889, lines: ["Possible origin point", "for Raynham branch"] },
  { x: 8359.587157, y: 1135.496638, w: 78.420, h: 18.889, lines: ["Kit 561092 line", "(West Down branch)"] },
  { x: 1328.767498, y: 1228.478685, w: 70.405, h: 10.715, lines: ["Line of Kit 118335"] },
  { x: 2290.524616, y: 1228.478685, w: 78.020, h: 10.715, lines: ["Line of Kit IN134085"] },
  { x: 282.346776, y: 1797.64152, w: 59.373, h: 10.715, lines: ["Kit B83216 line"] },
  { x: 831.77562, y: 1797.64152, w: 64.018, h: 10.715, lines: ["Kit B577150 line"] },
];

const SVG_X_OFFSET = 35;
const SCALE_X = 1.25;
const SCALE_Y = 1.3;
const CARD_W = 150;
const CARD_H = 104;
const PAD_X = 80;
const PAD_Y = 40;
const SVG_MAX_X = Math.max(...ALL.map((p) => p.cx)) + 100;
const CANVAS_W = SVG_MAX_X * SCALE_X + PAD_X * 2;
const CANVAS_H = (BANDS_Y[BANDS_Y.length - 1] + 80) * SCALE_Y + PAD_Y * 2;

const svgToLocalX = (x: number) => (x - SVG_X_OFFSET) * SCALE_X + PAD_X;
const svgToLocalY = (y: number) => y * SCALE_Y + PAD_Y;

const BY_ID = new Map<number, Person>(ALL.map((p) => [p.id, p]));

// Vertical view (flipped): root on LEFT, generations advance to the RIGHT, siblings stack top↓bottom by cx
const V_GEN_SCALE = 0.7;
const V_SIB_SCALE = 0.9;
function pxV(p: Person) {
  return {
    x: (BANDS_Y[p.gen] ?? p.y) * V_GEN_SCALE + PAD_X + CARD_W / 2,
    y: p.cx * V_SIB_SCALE + PAD_Y,
  };
}
const CANVAS_W_V = BANDS_Y[BANDS_Y.length - 1] * V_GEN_SCALE + PAD_X * 2 + CARD_W;
const CANVAS_H_V = SVG_MAX_X * V_SIB_SCALE + PAD_Y * 2 + CARD_H;

// Horizontal view: root on RIGHT, generations advance to the LEFT, siblings stack top↓bottom by cx
const H_GEN_SCALE = 0.7;
const H_SIB_SCALE = 0.9;
const H_MAX_BAND = BANDS_Y[BANDS_Y.length - 1];
function pxH(p: Person) {
  return {
    x: (H_MAX_BAND - (BANDS_Y[p.gen] ?? p.y)) * H_GEN_SCALE + PAD_X + CARD_W / 2,
    y: p.cx * H_SIB_SCALE + PAD_Y,
  };
}
const CANVAS_W_H = H_MAX_BAND * H_GEN_SCALE + PAD_X * 2 + CARD_W;
const CANVAS_H_H = SVG_MAX_X * H_SIB_SCALE + PAD_Y * 2 + CARD_H;


const ROOT_ID = PEOPLE.find((p) => p.gen === 0)?.id ?? 0;
const clamp = (s: number) => Math.max(0.3, Math.min(4, s));

type Theme = {
  pageBg: string;
  canvasBg: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  cardFocusBg: string;
  cardFocusText: string;
  cardFocusBorder: string;
  cardRelBg: string;
  cardRelBorder: string;
  cardRelHover: string;
  ydnaBg: string;
  ydnaBorder: string;
  ydnaHover: string;
  connector: string;
  connectorHighlight: string;
  noteText: string;
  panelBg: string;
  panelBorder: string;
};

const LIGHT: Theme = {
  pageBg: "#fffdf7",
  canvasBg: "#fffdf7",
  text: "#2b2b2b",
  textMuted: "#3a3a3a",
  textSubtle: "#5a5142",
  cardBg: "#fffdf7",
  cardBorder: "#cbbfa4",
  cardHover: "#f3ecdc",
  cardFocusBg: "#2b2b2b",
  cardFocusText: "#fffdf7",
  cardFocusBorder: "#2b2b2b",
  cardRelBg: "#f3ecdc",
  cardRelBorder: "#5a5142",
  cardRelHover: "#ece2cb",
  ydnaBg: "#e8eef0",
  ydnaBorder: "#2f5d62",
  ydnaHover: "#d8e4e8",
  connector: "#9a8c70",
  connectorHighlight: "#2b2b2b",
  noteText: "#5a5142",
  panelBg: "rgba(255,253,247,0.95)",
  panelBorder: "rgba(0,0,0,0.15)",
};

const DARK: Theme = {
  pageBg: "#16181c",
  canvasBg: "#1c1f24",
  text: "#e8e4d8",
  textMuted: "#cfc9b8",
  textSubtle: "#a09784",
  cardBg: "#262a31",
  cardBorder: "#4a4538",
  cardHover: "#33383f",
  cardFocusBg: "#f3ecdc",
  cardFocusText: "#16181c",
  cardFocusBorder: "#f3ecdc",
  cardRelBg: "#3a3528",
  cardRelBorder: "#8a7d5e",
  cardRelHover: "#463f30",
  ydnaBg: "#1f3a3d",
  ydnaBorder: "#6db2b8",
  ydnaHover: "#274749",
  connector: "#6a6453",
  connectorHighlight: "#f3ecdc",
  noteText: "#a09784",
  panelBg: "rgba(28,31,36,0.95)",
  panelBorder: "rgba(255,255,255,0.15)",
};

function BrittonTree() {
  const [focusId, setFocusId] = useState<number>(ROOT_ID);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [themeName, setThemeName] = useState<"light" | "dark">("light");
  const T = themeName === "dark" ? DARK : LIGHT;
  const isH = orientation === "horizontal";
  const px = isH ? pxH : pxV;
  const canvasW = isH ? CANVAS_W_H : CANVAS_W;
  const canvasH = isH ? CANVAS_H_H : CANVAS_H;

  const viewportRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const txRef = useRef(tx);
  const tyRef = useRef(ty);
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

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { txRef.current = tx; }, [tx]);
  useEffect(() => { tyRef.current = ty; }, [ty]);

  const centerOn = useCallback((id: number, nextScale = scaleRef.current) => {
    const el = viewportRef.current;
    const target = BY_ID.get(id);
    if (!el || !target) return;
    const p = px(target);
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    setTx(vw / 2 - p.x * nextScale);
    setTy(vh / 2 - p.y * nextScale);
  }, [px]);

  useEffect(() => { centerOn(focusId); }, [focusId, centerOn]);
  useEffect(() => { centerOn(focusId); }, [orientation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (isH) {
          if (siblingIndex > 0) setFocusId(siblingIds[siblingIndex - 1]);
        } else {
          if (parentIds.length > 0) setFocusId(parentIds[0]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (isH) {
          if (siblingIndex < siblingIds.length - 1) setFocusId(siblingIds[siblingIndex + 1]);
        } else {
          if (childIds.length > 0) setFocusId(childIds[0]);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isH) {
          if (childIds.length > 0) setFocusId(childIds[0]);
        } else {
          if (siblingIndex > 0) setFocusId(siblingIds[siblingIndex - 1]);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isH) {
          if (parentIds.length > 0) setFocusId(parentIds[0]);
        } else {
          if (siblingIndex < siblingIds.length - 1) setFocusId(siblingIds[siblingIndex + 1]);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusId(ROOT_ID);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parentIds, childIds, siblingIds, siblingIndex, isH]);

  const zoomFromViewportPoint = (ox: number, oy: number, factor: number) => {
    const currentScale = scaleRef.current;
    const nextScale = clamp(currentScale * factor);
    const ratio = nextScale / currentScale;
    const nextTx = ox - (ox - txRef.current) * ratio;
    const nextTy = oy - (oy - tyRef.current) * ratio;
    scaleRef.current = nextScale;
    txRef.current = nextTx;
    tyRef.current = nextTy;
    setScale(nextScale);
    setTx(nextTx);
    setTy(nextTy);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomFromViewportPoint(ox, oy, factor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

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

  // Connector paths — orientation-aware
  const connectors = useMemo(() => {
    const paths: { d: string; highlight: boolean }[] = [];
    for (const p of PEOPLE) {
      if (p.children.length === 0) continue;
      const pp = px(p);
      const highlight = p.id === focusId || p.children.includes(focusId);
      const cps = p.children.map((cid) => ({ id: cid, pos: px(BY_ID.get(cid)!) }));

      if (isH) {
        // Parent on the RIGHT side of canvas; children to the LEFT
        const pLeft = pp.x - CARD_W / 2;
        const cRight = cps[0].pos.x + CARD_W / 2;
        const midX = (pLeft + cRight) / 2;
        paths.push({ d: `M ${pLeft} ${pp.y} L ${midX} ${pp.y}`, highlight });
        const ys = cps.map((c) => c.pos.y);
        if (ys.length > 1) {
          paths.push({ d: `M ${midX} ${Math.min(...ys, pp.y)} L ${midX} ${Math.max(...ys, pp.y)}`, highlight });
        } else if (ys[0] !== pp.y) {
          paths.push({ d: `M ${midX} ${pp.y} L ${midX} ${ys[0]}`, highlight });
        }
        for (const c of cps) {
          paths.push({ d: `M ${midX} ${c.pos.y} L ${c.pos.x + CARD_W / 2} ${c.pos.y}`, highlight: highlight || c.id === focusId });
        }
      } else {
        const pBot = pp.y + CARD_H / 2;
        const childGen = BY_ID.get(p.children[0])!.gen;
        const midY = (BANDS_Y[p.gen] * SCALE_Y + PAD_Y + CARD_H / 2 + BANDS_Y[childGen] * SCALE_Y + PAD_Y - CARD_H / 2) / 2;
        paths.push({ d: `M ${pp.x} ${pBot} L ${pp.x} ${midY}`, highlight });
        const xs = cps.map((c) => c.pos.x);
        if (xs.length > 1) {
          paths.push({ d: `M ${Math.min(...xs, pp.x)} ${midY} L ${Math.max(...xs, pp.x)} ${midY}`, highlight });
        } else if (xs[0] !== pp.x) {
          paths.push({ d: `M ${pp.x} ${midY} L ${xs[0]} ${midY}`, highlight });
        }
        for (const c of cps) {
          paths.push({ d: `M ${c.pos.x} ${midY} L ${c.pos.x} ${c.pos.y - CARD_H / 2}`, highlight: highlight || c.id === focusId });
        }
      }
    }
    return paths;
  }, [focusId, isH, px]);

  return (
    <main
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ background: T.pageBg, color: T.text }}
    >
      <header
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: T.panelBorder }}
      >
        <Link to="/" className="text-xs opacity-70 hover:opacity-100">← Back</Link>
        <div className="text-center">
          <h1 className="text-sm font-semibold">{HEADER[0] ?? "Britton Family Tree"}</h1>
          <p className="text-[10px] opacity-60">{HEADER[1]}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] opacity-80">
          <span className="hidden md:inline opacity-70">↑↓←→ navigate · Home: root · scroll to zoom · drag to pan</span>
          <button
            onClick={() => setOrientation(isH ? "vertical" : "horizontal")}
            className="rounded border px-2 py-0.5 hover:opacity-80"
            style={{ borderColor: T.panelBorder }}
            title="Toggle orientation"
          >
            {isH ? "Vertical" : "Horizontal"}
          </button>
          <button
            onClick={() => setThemeName(themeName === "dark" ? "light" : "dark")}
            className="rounded border px-2 py-0.5 hover:opacity-80"
            style={{ borderColor: T.panelBorder }}
            title="Toggle theme"
          >
            {themeName === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
          <button
            onClick={() => { setScale(1); centerOn(focusId, 1); }}
            className="rounded border px-2 py-0.5 hover:opacity-80"
            style={{ borderColor: T.panelBorder }}
          >
            Reset
          </button>
        </div>
      </header>

      <div
        ref={viewportRef}
        className="relative flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ background: T.canvasBg }}
      >
        <div
          style={{
            position: "absolute", left: 0, top: 0,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: canvasW, height: canvasH,
          }}
        >
          <svg
            width={canvasW} height={canvasH}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            {connectors.map((c, i) => (
              <path
                key={i}
                d={c.d}
                fill="none"
                stroke={c.highlight ? T.connectorHighlight : T.connector}
                strokeWidth={c.highlight ? 2 : 1.25}
                strokeLinecap="square"
              />
            ))}
            {!isH && DASHED.map((d, i) => {
              const x1 = svgToLocalX(d.x1);
              const x2 = svgToLocalX(d.x2);
              const y1 = svgToLocalY(d.y1);
              const y2 = svgToLocalY(d.y2);
              const stroke =
                d.kind === "ydna" ? T.ydnaBorder : d.kind === "mrca" ? "#8a5a2a" : "#8a7a5a";
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

          {PEOPLE.map((p) => {
            const pos = px(p);
            const isFocus = p.id === focusId;
            const isRelated = parentIds.includes(p.id) || childIds.includes(p.id);
            const isYdna = YDNA_IDS.has(p.id);
            const style = isFocus
              ? { background: T.cardFocusBg, color: T.cardFocusText, borderColor: T.cardFocusBorder }
              : isYdna
                ? { background: T.ydnaBg, color: T.text, borderColor: T.ydnaBorder }
                : isRelated
                  ? { background: T.cardRelBg, color: T.text, borderColor: T.cardRelBorder }
                  : { background: T.cardBg, color: T.text, borderColor: T.cardBorder };
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
                  borderWidth: 2,
                  borderStyle: "solid",
                  ...style,
                  zIndex: isFocus ? 10 : undefined,
                  boxShadow: isFocus ? "0 4px 12px rgba(0,0,0,0.25)" : undefined,
                }}
                className="overflow-hidden rounded-sm px-2 py-1 transition-colors flex flex-col items-center justify-center text-center"
              >
                <div className="whitespace-normal break-words text-[11px] font-semibold leading-tight">{p.name}</div>
                {p.details.slice(0, 3).map((d, i) => (
                  <div key={i} className="whitespace-normal break-words text-[9px] leading-tight opacity-80">{d}</div>
                ))}
              </button>
            );
          })}

          {!isH && KIT_LABELS.map((label, i) => (
            <div
              key={`kit-label-${i}`}
              style={{
                position: "absolute",
                left: svgToLocalX(label.x),
                top: svgToLocalY(label.y),
                width: label.w * SCALE_X,
                minHeight: label.h * SCALE_Y,
                background: T.canvasBg,
                borderColor: T.ydnaBorder,
                color: T.ydnaBorder,
              }}
              className="pointer-events-none rounded-sm border px-1 py-0.5 text-center text-[10px] italic leading-tight"
            >
              {label.lines.map((line) => <div key={line}>{line}</div>)}
            </div>
          ))}

          {!isH && NOTE_BLOCKS.map((b, i) => (
            <div
              key={`note-${i}`}
              style={{
                position: "absolute",
                left: b.x * SCALE_X + PAD_X - CARD_W / 2,
                top: b.y * SCALE_Y + PAD_Y - 8,
                width: 280,
                color: T.noteText,
              }}
              className={[
                "pointer-events-none leading-snug italic",
                b.x < 2700 && b.y > 1200 ? "text-[13px]" : "text-[10px]",
              ].join(" ")}
            >
              {b.lines.map((l, j) => (
                <div key={j} dangerouslySetInnerHTML={{ __html: l }} />
              ))}
            </div>
          ))}

          {!isH && (
            <div
              style={{ position: "absolute", left: 40, top: 40, width: 1100, color: T.text }}
              className="pointer-events-none"
            >
              <h2 className="text-[28px] font-bold leading-tight">{HEADER[0]}</h2>
              <div className="mt-2 text-[15px] italic" style={{ color: T.textMuted }}>{HEADER[1]}</div>
              <div className="mt-4 text-[14px]">{HEADER[2]}</div>
              <div className="text-[14px]">{HEADER[3]}</div>
              <div className="mt-1 text-[12px]" style={{ color: T.textSubtle }}>{HEADER[4]}</div>
              <div className="mt-3 flex items-center gap-2 text-[12px]">
                <span className="inline-block h-3 w-3 border" style={{ background: T.cardRelBg, borderColor: "#8a5a2a" }} />
                <span>{HEADER[5]}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px]">
                <span className="inline-block h-3 w-3 border" style={{ background: T.ydnaBg, borderColor: T.ydnaBorder }} />
                <span>{HEADER[6]}</span>
              </div>
              <div className="mt-3 text-[12px] italic" style={{ color: T.textSubtle }}>{HEADER[7]}</div>
              <div className="text-[12px] italic" style={{ color: T.textSubtle }}>{HEADER[8]}</div>
              <div className="text-[12px] italic" style={{ color: T.textSubtle }}>{HEADER[9]}</div>
            </div>
          )}
        </div>

        <div
          className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-md border px-2 py-1 backdrop-blur"
          style={{ background: T.panelBg, borderColor: T.panelBorder }}
        >
          <button onClick={() => zoomFromCenter(0.8)} className="px-2 text-sm hover:opacity-70">−</button>
          <span className="min-w-[3rem] text-center text-[10px] tabular-nums">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoomFromCenter(1.25)} className="px-2 text-sm hover:opacity-70">+</button>
        </div>

        <div
          className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-md rounded-md border p-3 text-xs shadow-md backdrop-blur"
          style={{ background: T.panelBg, borderColor: T.panelBorder, color: T.text }}
        >
          <div className="text-[9px] uppercase tracking-widest opacity-50">Generation {focus.gen}</div>
          <div className="text-sm font-semibold">{focus.name}</div>
          {focus.details.map((d, i) => (
            <div key={i} className="opacity-80">{d}</div>
          ))}
        </div>
      </div>
    </main>
  );
}
