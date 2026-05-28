import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import iconUsers from "@/assets/icon-users.png";
import iconNetwork from "@/assets/icon-network.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Personal Site" },
      { name: "description", content: "Personal website and home server landing page." },
      { property: "og:title", content: "Home — Personal Site" },
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
  IconComp?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  items: XmbItem[];
};

const categories: XmbCategory[] = [
  {
    key: "profile",
    label: "Profile",
    iconSrc: iconUsers,
    items: [
      { label: "About — coming soon" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/robertjbritton/" },
    ],
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
        children: [{ label: "TBD" }],
      },
    ],
  },
];

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
  const [active, setActive] = useState(0);
  // For each category: a stack of selected indices. Length = depth+1.
  const [paths, setPaths] = useState<number[][]>(categories.map(() => [0]));
  const [time, setTime] = useState(() => new Date());
  const [colWidth, setColWidth] = useState(160);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // Column width scales with viewport, capped for sanity.
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (depth > 0) updatePath(active, path.slice(0, -1));
        else setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "ArrowRight") {
        if (selectedItem?.children) updatePath(active, [...path, 0]);
        else setActive((a) => Math.min(categories.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        const next = [...path];
        next[next.length - 1] = Math.max(0, next[next.length - 1] - 1);
        updatePath(active, next);
      } else if (e.key === "ArrowDown") {
        const next = [...path];
        next[next.length - 1] = Math.min(currentItems.length - 1, next[next.length - 1] + 1);
        updatePath(active, next);
      } else if (e.key === "Enter" || e.key === " ") {
        if (selectedItem?.href) window.open(selectedItem.href, "_blank", "noopener");
        else if (selectedItem?.children) updatePath(active, [...path, 0]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, depth, path, selectedItem, currentItems.length]);

  const timeLabel = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateLabel = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  // Center the active column horizontally: translate row so active sits at 50vw.
  const translateX = -active * colWidth - colWidth / 2;

  return (
    <main className="relative h-screen w-screen overflow-hidden text-foreground">
      <div className="xmb-bg" />
      <div className="xmb-wave" />
      <div className="xmb-ribbon" style={{ top: "30%" }} />
      <div className="xmb-ribbon" style={{ top: "55%", opacity: 0.3 }} />

      {/* Top bar: clock only */}
      <header className="relative z-10 flex items-center justify-end px-4 pt-4 text-sm font-light xmb-text-glow sm:px-10 sm:pt-6">
        <div className="text-right leading-tight">
          <div className="text-base">{timeLabel}</div>
          <div className="text-xs opacity-70">{dateLabel}</div>
        </div>
      </header>

      {/* XMB cross — active column is centered on screen via translateX.
          Icon row sits at vertical center; submenu drops vertically below the active icon. */}
      <section
        ref={containerRef}
        className="absolute left-1/2 top-1/2 z-10"
        style={{
          transform: `translate(${translateX}px, -50%)`,
          transition: "transform 0.35s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        {/* Icon row */}
        <div className="flex items-start">
          {categories.map((c, i) => {
            const isActive = i === active;
            return (
              <div
                key={c.key}
                className={`xmb-col flex flex-col items-center ${isActive ? "active" : ""}`}
                style={{ width: colWidth }}
                onClick={() => {
                  setActive(i);
                  updatePath(i, [0]);
                }}
              >
                <div className="xmb-icon">
                  {c.iconSrc ? (
                    <img
                      src={c.iconSrc}
                      alt=""
                      className="h-10 w-10 object-contain"
                      style={{ filter: "invert(1) drop-shadow(0 0 6px rgba(255,255,255,0.65))" }}
                    />
                  ) : c.IconComp ? (
                    <c.IconComp strokeWidth={1.25} className="h-9 w-9" />
                  ) : null}
                </div>
                <div className="xmb-label mt-3 text-[11px] uppercase tracking-[0.18em] xmb-text-glow sm:text-xs">
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submenu — vertical list directly under the active icon (true XMB layout) */}
        <ul
          className="absolute text-left text-sm font-light sm:text-base"
          style={{
            top: 120,
            left: active * colWidth,
            width: colWidth,
          }}
        >
          {depth > 0 && (
            <li className="mb-2 text-[10px] uppercase tracking-[0.2em] opacity-60 xmb-text-glow">
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
                updatePath(active, [...path.slice(0, -1), j, 0]);
              } else {
                // selection only (e.g. coming-soon labels)
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
      </section>

      {/* Footer hint */}
      <footer className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center px-4 text-[10px] font-light opacity-70 xmb-text-glow sm:bottom-6 sm:text-xs">
        <span className="text-center">← → navigate · ↑ ↓ select · click or enter to open</span>
      </footer>
    </main>
  );
}
