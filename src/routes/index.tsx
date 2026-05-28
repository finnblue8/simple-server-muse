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
          {
            label: "Medzilaborce District 1869 Hungarian Census",
            href: "https://bit.ly/census-1869",
          },
          {
            label: "Medzilaborce District 1930 Czechoslovak Census",
            href: "https://bit.ly/census-1930",
          },
          {
            label: "Find-A-Grave virtual cemetery",
            href: "https://www.findagrave.com/user/profile/49960056",
          },
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
      { label: "Britton Research — TBD" },
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
  // For each category: a stack of selected indices. Length = depth in the tree.
  const [paths, setPaths] = useState<number[][]>(categories.map(() => [0]));
  const [time, setTime] = useState(() => new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(160);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // Column width scales with viewport. Active column gets centered.
      setColWidth(Math.max(110, Math.min(180, Math.round(w / 6))));
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
        if (depth > 0) {
          updatePath(active, path.slice(0, -1));
        } else {
          setActive((a) => Math.max(0, a - 1));
        }
      } else if (e.key === "ArrowRight") {
        if (selectedItem?.children) {
          updatePath(active, [...path, 0]);
        } else {
          setActive((a) => Math.min(categories.length - 1, a + 1));
        }
      } else if (e.key === "ArrowUp") {
        const next = [...path];
        next[next.length - 1] = Math.max(0, next[next.length - 1] - 1);
        updatePath(active, next);
      } else if (e.key === "ArrowDown") {
        const next = [...path];
        next[next.length - 1] = Math.min(currentItems.length - 1, next[next.length - 1] + 1);
        updatePath(active, next);
      } else if (e.key === "Enter" || e.key === " ") {
        if (selectedItem?.href) {
          window.open(selectedItem.href, "_blank", "noopener");
        } else if (selectedItem?.children) {
          updatePath(active, [...path, 0]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, depth, path, selectedItem, currentItems.length]);

  const timeLabel = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateLabel = time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  // Translate the cross so the active column is centered on screen.
  // Each column slot is colWidth wide, centered around its own center.
  // active column index = `active`; translate by (centerIndex - active) * colWidth
  // We'll place the row starting at left: 50%, then translateX(-colWidth/2) so col 0 sits centered,
  // then shift by -active*colWidth so the active one sits at center.
  const translateX = -active * colWidth - colWidth / 2;

  return (
    <main className="relative h-screen w-screen overflow-hidden text-foreground">
      <div className="xmb-bg" />
      <div className="xmb-wave" />
      <div className="xmb-ribbon" style={{ top: "30%" }} />
      <div className="xmb-ribbon" style={{ top: "55%", opacity: 0.3 }} />

      {/* Top bar: clock only */}
      <header className="relative z-10 flex items-center justify-end px-6 pt-6 text-sm font-light xmb-text-glow sm:px-10">
        <div className="text-right leading-tight">
          <div className="text-base">{timeLabel}</div>
          <div className="text-xs opacity-70">{dateLabel}</div>
        </div>
      </header>

      {/* XMB cross — centered around the active column */}
      <section
        ref={containerRef}
        className="absolute left-1/2 top-1/2 z-10 -translate-y-1/2"
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
                onClick={() => setActive(i)}
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
                <div className="xmb-label mt-3 text-xs uppercase tracking-[0.18em] xmb-text-glow">
                  {c.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submenu column for the active category — vertical list anchored under active icon */}
        <ul
          className="absolute top-[120px] text-left text-sm font-light sm:text-base"
          style={{
            left: active * colWidth + colWidth / 2 + 28,
            minWidth: 240,
            maxWidth: "min(70vw, 460px)",
          }}
        >
          {currentItems.map((item, j) => {
            const isSel = j === selectedIdx;
            const hasChildren = !!item.children;
            const content = (
              <span className="flex items-center gap-2">
                <span>{item.label}</span>
                {hasChildren && <span className="opacity-60">›</span>}
              </span>
            );
            return (
              <li
                key={`${depth}-${j}-${item.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSel) {
                    const next = [...path];
                    next[next.length - 1] = j;
                    updatePath(active, next);
                    return;
                  }
                  if (item.href) {
                    window.open(item.href, "_blank", "noopener");
                  } else if (hasChildren) {
                    updatePath(active, [...path, 0]);
                  }
                }}
                className={`xmb-subitem mb-2 cursor-pointer xmb-text-glow ${isSel ? "selected" : ""}`}
              >
                {item.href && isSel ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>

        {/* Breadcrumb / back hint when drilled in */}
        {depth > 0 && (
          <div
            className="absolute -top-2 text-[10px] uppercase tracking-[0.2em] opacity-60 xmb-text-glow"
            style={{ left: active * colWidth + colWidth / 2 + 28 }}
          >
            ‹ back
          </div>
        )}
      </section>

      {/* Footer hint */}
      <footer className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center px-6 text-[11px] font-light opacity-70 xmb-text-glow sm:bottom-6 sm:text-xs">
        <span>← → navigate · ↑ ↓ select · enter to open</span>
      </footer>
    </main>
  );
}
