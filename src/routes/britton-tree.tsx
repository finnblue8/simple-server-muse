import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import treeData from "@/data/britton-tree.json";
import notionData from "@/data/britton-notion.json";

type BrittonNotionRecord = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  birthLocation: string;
  deathDate: string | null;
  deathLocation: string;
  marriageDate: string | null;
  marriageLocation: string;
};



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

type VertLabel = {
  personId: number;
  lines: string[];
  kind: "ydna" | "mrca";
  position?: "above" | "below";
};
const VERT_LABELS: VertLabel[] = [
  { personId: 0, kind: "ydna", position: "above", lines: ["Haplogroup R-BY11801 &", "YFull R-Y351800*"] },
  { personId: 8, kind: "ydna", lines: ["Possible origin point", "for Raynham branch"] },
  { personId: 10, kind: "ydna", lines: ["Possible origin point", "for Raynham branch"] },
  { personId: 14, kind: "ydna", lines: ["Possible origin point", "for Raynham branch"] },
  { personId: 17, kind: "ydna", lines: ["Possible origin point", "for Raynham branch"] },
  { personId: 18, kind: "ydna", lines: ["Possible origin point", "for Raynham branch"] },
  { personId: 15, kind: "mrca", lines: ["Likely MRCA of the majority", "of Group 11 test kits"] },
  { personId: 22, kind: "ydna", lines: ["Likely origin point for", "A.H. Britton branch"] },
  { personId: 23, kind: "ydna", lines: ["Likely origin point for", "A.H. Britton branch"] },
  { personId: 29, kind: "ydna", lines: ["Likely origin point for", "A.H. Britton branch"] },
  { personId: 33, kind: "ydna", lines: ["Likely origin point for", "A.H. Britton branch"] },
  { personId: 58, kind: "ydna", lines: ["Suspected patriarch of the", "William Ira Britton line, USA"] },
  { personId: 75, kind: "ydna", position: "below", lines: ["Kit 561092 line", "(West Down branch)"] },
  { personId: 77, kind: "ydna", lines: ["Line of Kit 118335"] },
  { personId: 84, kind: "ydna", lines: ["Line of Kit IN134085"] },
  { personId: 130, kind: "ydna", lines: ["Kit B83216 line"] },
  { personId: 134, kind: "ydna", lines: ["Kit B577150 line"] },
];

const SVG_X_OFFSET = 35;
const SCALE_X = 1.6;
const SCALE_Y = 1.75;
const CARD_W = 150;
const CARD_H = 104;
const PAD_X = 80;
const PAD_Y = 120;
const SVG_MAX_X = Math.max(...ALL.map((p) => p.cx)) + 100;
const CANVAS_W = SVG_MAX_X * SCALE_X + PAD_X * 2;
const CANVAS_H = (BANDS_Y[BANDS_Y.length - 1] + 80) * SCALE_Y + PAD_Y * 2;

const svgToLocalX = (x: number) => (x - SVG_X_OFFSET) * SCALE_X + PAD_X;
const svgToLocalY = (y: number) => y * SCALE_Y + PAD_Y;


const BY_ID = new Map<number, Person>(ALL.map((p) => [p.id, p]));

// Vertical layout: gens stacked top→bottom (ancestors top), siblings left→right by cx
function pxV(p: Person) {
  return {
    x: p.cx * SCALE_X + PAD_X,
    y: (BANDS_Y[p.gen] ?? p.y) * SCALE_Y + PAD_Y,
  };
}

// Horizontal layout: gens stacked left→right (ancestors right), siblings top→bottom
const H_COL_W = 220;
const H_MAX_BAND = BANDS_Y[BANDS_Y.length - 1];
function pxH(p: Person) {
  return {
    x: (BANDS_Y[BANDS_Y.length - 1] - (BANDS_Y[p.gen] ?? p.y)) * 0.6 + PAD_X,
    y: p.cx * 0.35 + PAD_Y,
  };
}
const CANVAS_W_H = H_MAX_BAND * 0.6 + PAD_X * 2 + CARD_W;
const CANVAS_H_H = SVG_MAX_X * 0.35 + PAD_Y * 2 + CARD_H;

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
  const [cardId, setCardId] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [themeName, setThemeName] = useState<"light" | "dark">("dark");
  const T = themeName === "dark" ? DARK : LIGHT;

  const notionById = useMemo(() => {
    const m = new Map<number, BrittonNotionRecord>();
    for (const r of notionData as BrittonNotionRecord[]) m.set(r.id, r);
    return m;
  }, []);


  const isH = false;
  const px = pxV;
  const canvasW = CANVAS_W;
  const canvasH = CANVAS_H;

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

  // Touch pinch-to-zoom + single-finger pan
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let pinch: { dist: number; cx: number; cy: number } | null = null;
    let pan: { x: number; y: number; moved: boolean } | null = null;

    const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const rectPt = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const c = rectPt((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        pinch = { dist: dist(a, b), cx: c.x, cy: c.y };
        pan = null;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        pan = { x: t.clientX - txRef.current, y: t.clientY - tyRef.current, moved: false };
      }
    };
    const onMove = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const d = dist(a, b);
        const c = rectPt((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
        const factor = d / pinch.dist;
        zoomFromViewportPoint(c.x, c.y, factor);
        // account for pan of pinch center
        const dx = c.x - pinch.cx;
        const dy = c.y - pinch.cy;
        const nTx = txRef.current + dx;
        const nTy = tyRef.current + dy;
        txRef.current = nTx; tyRef.current = nTy;
        setTx(nTx); setTy(nTy);
        pinch = { dist: d, cx: c.x, cy: c.y };
      } else if (pan && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const nx = t.clientX - pan.x;
        const ny = t.clientY - pan.y;
        if (Math.abs(nx - txRef.current) + Math.abs(ny - tyRef.current) > 3) pan.moved = true;
        txRef.current = nx; tyRef.current = ny;
        setTx(nx); setTy(ny);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) pan = null;
    };

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
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
        style={{ background: T.canvasBg, touchAction: "none" }}
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
            {!isH && VERT_LABELS.map((lbl, i) => {
              const p = BY_ID.get(lbl.personId);
              if (!p) return null;
              const pos = px(p);
              const gap = 28;
              const isAbove = lbl.position === "above";
              const y1 = isAbove ? pos.y - CARD_H / 2 - gap : pos.y + CARD_H / 2;
              const y2 = isAbove ? pos.y - CARD_H / 2 : pos.y + CARD_H / 2 + gap;
              const stroke = lbl.kind === "mrca" ? "#a86a32" : T.ydnaBorder;
              return (
                <line
                  key={`vl-${i}`}
                  x1={pos.x} y1={y1} x2={pos.x} y2={y2}
                  stroke={stroke} strokeWidth={1.4} strokeDasharray="5,3"
                />
              );
            })}
            {!isH && (() => {
              const a = BY_ID.get(58);
              const b = BY_ID.get(125);
              if (!a || !b) return null;
              const ap = px(a);
              const bp = px(b);
              const yA = ap.y + CARD_H / 2;
              const yB = bp.y - CARD_H / 2;
              const midY = (BANDS_Y[9] * SCALE_Y + PAD_Y + BANDS_Y[10] * SCALE_Y + PAD_Y) / 2 + 60;
              return (
                <path
                  d={`M ${ap.x} ${yA} L ${ap.x} ${midY} L ${bp.x} ${midY} L ${bp.x} ${yB}`}
                  fill="none" stroke={T.ydnaBorder} strokeWidth={1.2} strokeDasharray="3,3"
                />
              );
            })()}

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
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragging.current?.moved) return;
                  setFocusId(p.id);
                  setCardId(p.id);
                }}

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

          {!isH && VERT_LABELS.map((lbl, i) => {
            const p = BY_ID.get(lbl.personId);
            if (!p) return null;
            const pos = px(p);
            const labelW = 190;
            const lineH = 14;
            const labelH = lbl.lines.length * lineH + 10;
            const gap = 28;
            const isAbove = lbl.position === "above";
            const top = isAbove ? pos.y - CARD_H / 2 - gap - labelH : pos.y + CARD_H / 2 + gap;
            const color = lbl.kind === "mrca" ? "#a86a32" : T.ydnaBorder;
            return (
              <div
                key={`kit-label-${i}`}
                style={{
                  position: "absolute",
                  left: pos.x - labelW / 2,
                  top,
                  width: labelW,
                  background: T.canvasBg,
                  borderColor: color,
                  color,
                }}
                className="pointer-events-none rounded-sm border px-1 py-0.5 text-center text-[11px] italic leading-tight"
              >
                {lbl.lines.map((line, j) => <div key={j}>{line}</div>)}
              </div>
            );
          })}


          {!isH && NOTE_BLOCKS.map((b, i) => {
            const isKitsBlock = b.x > 2100 && b.x < 2400 && b.y > 1200 && b.y < 1400;
            const isWilliamIraBlock = b.x < 300 && b.y > 1200 && b.y < 1500;
            const isWide = isKitsBlock || isWilliamIraBlock;
            return (
              <div
                key={`note-${i}`}
                style={{
                  position: "absolute",
                  left: b.x * SCALE_X + PAD_X - CARD_W / 2,
                  top: b.y * SCALE_Y + PAD_Y - 8,
                  width: isWide ? 420 : 320,
                  color: T.noteText,
                }}
                className={[
                  "pointer-events-none leading-snug italic",
                  isKitsBlock ? "text-[18px]" : isWilliamIraBlock ? "text-[15px]" : b.x < 2700 && b.y > 1200 ? "text-[15px]" : "text-[10px]",
                ].join(" ")}
              >
                {b.lines.map((l, j) => (
                  <div key={j} dangerouslySetInnerHTML={{ __html: l }} />
                ))}
              </div>
            );
          })}

          {!isH && (
            <div
              style={{ position: "absolute", left: 40, top: 40, width: 420, color: T.text }}
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

      {cardId !== null && (() => {
        const person = BY_ID.get(cardId);
        if (!person) return null;
        const rec = notionById.get(cardId);
        const fmt = (d: string | null) => d ?? "—";
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setCardId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-lg border p-5 shadow-2xl"
              style={{ background: T.cardBg, color: T.text, borderColor: T.cardBorder }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-50">Generation {person.gen}</div>
                  <h3 className="text-lg font-semibold">{person.name}</h3>
                </div>
                <button
                  onClick={() => setCardId(null)}
                  className="rounded px-2 py-0.5 text-sm hover:opacity-70"
                  style={{ borderColor: T.panelBorder }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {person.details.length > 0 && (
                <div className="mt-2 text-xs italic" style={{ color: T.textSubtle }}>
                  {person.details.map((d, i) => <div key={i}>{d}</div>)}
                </div>
              )}

              <div className="mt-4 border-t pt-3 text-sm" style={{ borderColor: T.panelBorder }}>
                <div className="mb-2 text-[10px] uppercase tracking-widest opacity-50">
                  Britton Family Database
                </div>
                {!rec && (
                  <div className="opacity-70">No matching record (ID {cardId}).</div>
                )}

                {rec && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="opacity-60">Name</dt>
                    <dd>{[rec.firstName, rec.lastName].filter(Boolean).join(" ") || "—"}</dd>
                    <dt className="opacity-60">Born</dt>
                    <dd>{fmt(rec.birthDate)}{rec.birthLocation ? ` · ${rec.birthLocation}` : ""}</dd>
                    <dt className="opacity-60">Married</dt>
                    <dd>{fmt(rec.marriageDate)}{rec.marriageLocation ? ` · ${rec.marriageLocation}` : ""}</dd>
                    <dt className="opacity-60">Died</dt>
                    <dd>{fmt(rec.deathDate)}{rec.deathLocation ? ` · ${rec.deathLocation}` : ""}</dd>
                  </dl>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}

