import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import iconUsers from "@/assets/icon-users.png";
import iconNetwork from "@/assets/icon-network.png";
import sndCursor from "@/assets/snd_cursor.mp3";
import sndCancel from "@/assets/snd_cancel.mp3";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Robert Britton's site" },
      { name: "description", content: "Personal website and home server landing page." },
      { property: "og:title", content: "Robert Britton's site" },
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
      { label: "About My Research — coming soon" },
      {
        label: "Rusyn Research",
        children: [
          { label: "Who are The Rusyns?", href: "https://en.wikipedia.org/wiki/Rusyns" },
          { label: "Medzilaborce District 1869 Hungarian Census", href: "https://bit.ly/census-1869" },
          { label: "Medzilaborce District 1930 Czechoslovak Census", href: "https://bit.ly/census-1930" },
          { label: "Find-A-Grave virtual cemetery", href: "https://www.findagrave.com/user/profile/49960056" },
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
        ],
      },
    ],
  },
];

const MONTH_COLORS = [
  "#CBCBCB", "#D8BF1A", "#6DB217", "#E17E9A", "#178816", "#9A61C8",
  "#02CDC7", "#0C76C0", "#B444C0", "#E5A708", "#875B1E", "#E3412A",
];

function getSeasonalColor(date: Date): string {
  const hex = MONTH_COLORS[date.getMonth()];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const h = date.getHours() + date.getMinutes() / 60;
  // Sun curve: peak at 10am, gentle dimming so text stays readable at night
  const curve = (Math.cos(((h - 10) * Math.PI) / 14) + 1) / 2; // 0..1
  const brightness = 0.75 + 0.25 * curve; // 0.75..1.0
  const mix = (c: number) => Math.round(c * brightness);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
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

  const bgColor = getSeasonalColor(time ?? new Date());

  return (
    <main className="xmb-lock relative h-screen w-screen overflow-hidden text-foreground">
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
        <h1 className="text-lg font-light tracking-wide sm:text-2xl">Robert Britton's site</h1>
        <p className="mt-1 text-[11px] font-light opacity-70 sm:text-xs">
          Navigate tabs with arrow keys or mouse.
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
                    <c.IconComp strokeWidth={1.25} className="h-9 w-9" style={{ color: "#CBCBCB" }} />
                  ) : null}
                </div>
                <div
                  className="xmb-label mt-3 text-[11px] uppercase tracking-[0.18em] xmb-text-glow sm:text-xs"
                  style={{ color: c.key === "research" ? "#CBCBCB" : undefined }}
                >
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>

        {currentItems.length > 0 && (
          <ul
            className="absolute text-left text-sm font-light sm:text-base"
            style={{
              top: 120,
              left: active * colWidth,
              width: colWidth,
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
                <span className="flex items-center justify-center gap-2 text-center">
                  <span>{item.label}</span>
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
                  className={`xmb-subitem mb-2 cursor-pointer xmb-text-glow ${isSel ? "selected" : ""}`}
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
