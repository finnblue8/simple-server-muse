import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import iconUsers from "@/assets/icon-users.png";
import iconNetwork from "@/assets/icon-network.png";
import sndCursor from "@/assets/snd_cursor.mp3";
import sndCancel from "@/assets/snd_cancel.mp3";
import { getPresetTextColors, useXmbPreset } from "@/lib/xmb-text";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Robert Britton's site - about me and personal projects" },
      { name: "description", content: "Personal website and home server landing page." },
      { property: "og:title", content: "Robert Britton's site - about me and personal projects" },
      { property: "og:description", content: "Personal website and home server landing page." },
    ],
  }),
  component: Index,
});

type XmbItem = {
  label: string;
  href?: string;
  children?: XmbItem[];
};

type XmbCategory = {
  key: string;
  label: string;
  iconSrc?: string;
  IconComp?: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  href?: string;
  items: XmbItem[];
};

const categories: XmbCategory[] = [
  {
    key: "profile",
    label: "Profile",
    iconSrc: iconUsers,
    href: "/about",
    items: [],
  },
  {
    key: "network",
    label: "Network",
    iconSrc: iconNetwork,
    items: [{ label: "Nextcloud", href: "https://robertbritton.co/nextcloud" }],
  },
  {
    key: "research",
    label: "Research",
    IconComp: FlaskConical,
    items: [
      {
        label: "Rusyn Research",
        children: [
          { label: "Who are The Rusyns?", href: "https://en.wikipedia.org/wiki/Rusyns" },
          { label: "Medzilaborce District 1869 Hungarian Census", href: "https://bit.ly/census-1869" },
          { label: "Medzilaborce District 1930 Czechoslovak Census", href: "https://bit.ly/census-1930" },
          { label: "Find-A-Grave virtual cemetery", href: "https://www.findagrave.com/virtual-cemetery/search/49960056" },
          {
            label: "Maps of immigrant destinations",
            children: [
              { label: "Borov", href: "https://maps.app.goo.gl/5djMaDbC4cxRXe9a8" },
              { label: "Čertižné", href: "https://maps.app.goo.gl/To6byCNMtU7S1qxM8" },
              { label: "Kalinov", href: "https://maps.app.goo.gl/RMKymqcMy5SoqVx39" },
              { label: "Palota", href: "https://maps.app.goo.gl/DKKNp6m86w375S1L9" },
            ],
          },
        ],
      },
      {
        label: "Britton Research",
        children: [
          { label: "Family Tree", href: "/britton-tree" },
          { label: "Settlement Map", href: "/britton-map" },
          { label: "R-Y351800 YTree", href: "https://www.yfull.com/tree/r-y351800*/" },
        ],
      },
    ],
  },
];

const MONTH_COLORS = [
  "#CBCBCB", "#D8BF1A", "#6DB217", "#E17E9A", "#178816", "#9A61C8",
  "#02CDC7", "#0C76C0", "#B444C0", "#E5A708", "#875B1E", "#E3412A",
];

function getSeasonalColor(date: Date): { bg: string; r: number; g: number; b: number } {
  const hex = MONTH_COLORS[date.getMonth()];
  const r0 = parseInt(hex.slice(1, 3), 16);
  const g0 = parseInt(hex.slice(3, 5), 16);
  const b0 = parseInt(hex.slice(5, 7), 16);
  const h = date.getHours() + date.getMinutes() / 60;
  const curve = (Math.cos(((h - 10) * Math.PI) / 14) + 1) / 2;
  const brightness = 0.75 + 0.25 * curve;
  const r = Math.round(r0 * brightness);
  const g = Math.round(g0 * brightness);
  const b = Math.round(b0 * brightness);
  return { bg: `rgb(${r}, ${g}, ${b})`, r, g, b };
}

function getReadableTextColors(r: number, g: number, b: number, prevIsDark: boolean) {
  // Perceived luminance (0..255) with hysteresis to prevent flicker near threshold.
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const upper = 170; // switch to dark text above this
  const lower = 150; // switch back to light text below this
  const isDark = prevIsDark ? lum <= upper : lum < lower;
  if (!isDark) {
    return {
      isDark: false,
      fg: "#0a0a0a",
      shadow:
        "0 0 6px rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.35)",
    };
  }
  return {
    isDark: true,
    fg: "#CBCBCB",
    shadow:
      "0 0 6px rgba(255,255,255,0.25), 0 0 18px rgba(255,255,255,0.15)",
  };
}





function getItemsAtPath(cat: XmbCategory, path: number[]): XmbItem[] {
  let items: XmbItem[] = cat.items;
  for (const idx of path) {
    const next = items[idx]?.children;
    if (!next) break;
    items = next;
  }
  return items;
}

function Index() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paths, setPaths] = useState<number[][]>(categories.map(() => [0]));
  const [time, setTime] = useState<Date | null>(null);
  const [colWidth, setColWidth] = useState(160);

  const containerRef = useRef<HTMLDivElement>(null);
  const cursorAudioRef = useRef<HTMLAudioElement | null>(null);
  const cancelAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    cursorAudioRef.current = new Audio(sndCursor);
    cancelAudioRef.current = new Audio(sndCancel);
    cursorAudioRef.current.volume = 0.6;
    cancelAudioRef.current.volume = 0.6;
  }, []);

  const playCursor = () => {
    const a = cursorAudioRef.current;
    if (a) { a.currentTime = 0; a.play().catch(() => {}); }
  };
  const playCancel = () => {
    const a = cancelAudioRef.current;
    if (a) { a.currentTime = 0; a.play().catch(() => {}); }
  };

  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setColWidth(Math.max(96, Math.min(180, Math.round(w / 6))));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const path = paths[active];
  const depth = path.length - 1;
  const cat = categories[active];
  const currentItems = getItemsAtPath(cat, path.slice(0, -1));
  const selectedIdx = path[path.length - 1] ?? 0;
  const selectedItem = currentItems[selectedIdx];

  const updatePath = (i: number, next: number[]) => {
    setPaths((prev) => {
      const cp = [...prev];
      cp[i] = next;
      return cp;
    });
  };

  const changeActive = (next: number) => {
    if (next !== active) {
      playCursor();
      setActive(next);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (depth > 0) {
          playCancel();
          updatePath(active, path.slice(0, -1));
        } else {
          changeActive(Math.max(0, active - 1));
        }
      } else if (e.key === "ArrowRight") {
        if (selectedItem?.children) {
          playCursor();
          updatePath(active, [...path, 0]);
        } else {
          changeActive(Math.min(categories.length - 1, active + 1));
        }
      } else if (e.key === "ArrowUp") {
        const next = [...path];
        const newIdx = Math.max(0, next[next.length - 1] - 1);
        if (newIdx !== next[next.length - 1]) playCursor();
        next[next.length - 1] = newIdx;
        updatePath(active, next);
      } else if (e.key === "ArrowDown") {
        const next = [...path];
        const newIdx = Math.min(currentItems.length - 1, next[next.length - 1] + 1);
        if (newIdx !== next[next.length - 1]) playCursor();
        next[next.length - 1] = newIdx;
        updatePath(active, next);
      } else if (e.key === "Escape") {
        if (depth > 0) {
          playCancel();
          updatePath(active, path.slice(0, -1));
        }
      } else if (e.key === "Enter" || e.key === " ") {
        if (cat.href) {
          navigate({ to: cat.href });
        } else if (selectedItem?.href) {
          window.open(selectedItem.href, "_blank", "noopener");
        } else if (selectedItem?.children) {
          playCursor();
          updatePath(active, [...path, 0]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, depth, path, selectedItem, currentItems.length]);

  const timeLabel = time ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const dateLabel = time ? time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : "";

  const translateX = -active * colWidth - colWidth / 2;

  const [bgSample, setBgSample] = useState<{ r: number; g: number; b: number } | null>(null);
  useEffect(() => {
    const onSample = (e: Event) => {
      const d = (e as CustomEvent).detail as { r: number; g: number; b: number };
      setBgSample(d);
    };
    window.addEventListener("xmb-bg-sample", onSample);
    return () => window.removeEventListener("xmb-bg-sample", onSample);
  }, []);

  const preset = useXmbPreset();
  const seasonal = getSeasonalColor(time ?? new Date());
  const source = bgSample ?? seasonal;
  const prevIsDarkRef = useRef(true);
  const presetColors = preset ? getPresetTextColors(preset) : null;
  const textColors = presetColors
    ? { ...presetColors, isDark: presetColors.fg === "#ffffff" }
    : getReadableTextColors(source.r, source.g, source.b, prevIsDarkRef.current);
  if (!presetColors) prevIsDarkRef.current = textColors.isDark;

  const touchRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <main
      className="xmb-lock relative w-screen overflow-hidden"
      style={{
        height: "100dvh",
        color: textColors.fg,
        ["--xmb-fg" as string]: textColors.fg,
        ["--xmb-text-shadow" as string]: textColors.shadow,
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchRef.current;
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        touchRef.current = null;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) {
          if (selectedItem?.children) {
            playCursor();
            updatePath(active, [...path, 0]);
          } else {
            changeActive(Math.min(categories.length - 1, active + 1));
          }
        } else {
          if (depth > 0) {
            playCancel();
            updatePath(active, path.slice(0, -1));
          } else {
            changeActive(Math.max(0, active - 1));
          }
        }
      }}
    >
      <div className="xmb-bg" />
      <div className="xmb-wave" />
      <div className="xmb-ribbon" style={{ top: "30%" }} />
      <div className="xmb-ribbon" style={{ top: "55%", opacity: 0.3 }} />


      {/* Top bar: clock */}
      <header className="relative z-10 flex items-center justify-end px-4 pt-4 text-sm font-light xmb-text-glow sm:px-10 sm:pt-6">
        <div className="text-right leading-tight">
          <div className="text-base">{timeLabel}</div>
          <div className="text-xs opacity-70">{dateLabel}</div>
        </div>
      </header>

      {/* Page header */}
      <div className="pointer-events-none absolute left-0 right-0 top-4 z-10 flex flex-col items-center px-4 text-center xmb-text-glow sm:top-6">
        <h1 className="text-lg font-light tracking-wide sm:text-2xl">Robert Britton's site - about me and personal projects</h1>
        <p className="mt-1 text-[11px] font-light opacity-70 sm:text-xs">
          Navigate tabs with arrow keys, mouse, or swipe on mobile.
        </p>
      </div>

      <section
        ref={containerRef}
        className="absolute left-1/2 top-1/2 z-10"
        style={{
          transform: `translate(${translateX}px, -50%)`,
          transition: "transform 0.35s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <div className="flex items-start">
          {categories.map((c, i) => {
            const isActive = i === active;
            return (
              <div
                key={c.key}
                className={`xmb-col flex flex-col items-center ${isActive ? "active" : ""}`}
                style={{ width: colWidth }}
                onClick={() => {
                  if (c.href) {
                    navigate({ to: c.href });
                  } else {
                    changeActive(i);
                    updatePath(i, [0]);
                  }
                }}
              >
                <div className="xmb-icon">
                  {c.iconSrc ? (
                    <img
                      src={c.iconSrc}
                      alt=""
                      className="h-10 w-10 object-contain"
                      style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.25))" }}
                    />
                  ) : c.IconComp ? (
                    <c.IconComp
                      strokeWidth={1.25}
                      className="h-10 w-10"
                      style={{ color: "#CBCBCB", filter: "drop-shadow(0 0 6px rgba(0,0,0,0.25))" }}
                    />
                  ) : null}
                </div>
                <div className="xmb-label mt-3 text-[11px] uppercase tracking-[0.18em] xmb-text-glow sm:text-xs">
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>

        {currentItems.length > 0 && (
          <ul
            className="absolute list-none pl-0 text-center text-sm font-light sm:text-base"
            style={{
              top: 120,
              left: active * colWidth + colWidth / 2,
              transform: "translateX(-50%)",
              width: `min(320px, calc(100vw - 32px))`,
            }}
          >
            {depth > 0 && (
              <li
                className="mb-2 cursor-pointer text-[10px] uppercase tracking-[0.2em] opacity-60 xmb-text-glow"
                onClick={(e) => {
                  e.stopPropagation();
                  playCancel();
                  updatePath(active, path.slice(0, -1));
                }}
              >
                ‹ back
              </li>
            )}
            {currentItems.map((item, j) => {
              const isSel = j === selectedIdx;
              const hasChildren = !!item.children;
              const inner = (
                <span className="flex items-center justify-center gap-2 text-center break-words">
                  <span className="break-words text-center">{item.label}</span>
                  {hasChildren && <span className="opacity-60">›</span>}
                </span>
              );
              const handleClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (item.href) {
                  window.open(item.href, "_blank", "noopener");
                } else if (hasChildren) {
                  playCursor();
                  updatePath(active, [...path.slice(0, -1), j, 0]);
                } else {
                  const next = [...path];
                  next[next.length - 1] = j;
                  updatePath(active, next);
                }
              };
              return (
                <li
                  key={`${depth}-${j}-${item.label}`}
                  onClick={handleClick}
                  className={`xmb-subitem mb-2 cursor-pointer rounded-md border px-3 py-2 backdrop-blur-sm transition-all xmb-text-glow ${
                    isSel
                      ? "selected border-white/50 bg-white/15 shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                      : "border-white/15 bg-white/[0.06] hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center px-4 text-[10px] font-light opacity-70 xmb-text-glow sm:bottom-6 sm:text-xs">
        <span className="text-center">← → navigate · ↑ ↓ select · enter to open · esc to go back</span>
      </footer>
    </main>
  );
}
