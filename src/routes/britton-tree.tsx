import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import treeData from "@/data/britton-tree.json";

export const Route = createFileRoute("/britton-tree")({
  head: () => ({
    meta: [
      { title: "Britton Family Tree" },
      { name: "description", content: "Interactive Britton family tree — navigate generations with arrow keys." },
    ],
  }),
  component: BrittonTree,
});

type Person = {
  id: number;
  gen: number;
  cx: number;
  name: string;
  details: string[];
  parents: number[];
  children: number[];
};

const PEOPLE = treeData.people as Person[];
const HEADER = treeData.header as string[];

// Pick the canonical root (Adam Britton — generation 0)
const ROOT_ID = PEOPLE.find((p) => p.gen === 0)?.id ?? 0;

function BrittonTree() {
  const [focusId, setFocusId] = useState<number>(ROOT_ID);
  const focus = PEOPLE[focusId];
  const parentIds = focus.parents;
  const childIds = focus.children;

  // Siblings = children of the (first) parent, OR all gen-mates if no parent.
  const siblingIds = useMemo(() => {
    if (parentIds.length > 0) return PEOPLE[parentIds[0]].children;
    return PEOPLE.filter((p) => p.gen === focus.gen && p.parents.length === 0)
      .sort((a, b) => a.cx - b.cx)
      .map((p) => p.id);
  }, [focus.gen, parentIds]);

  const siblingIndex = Math.max(0, siblingIds.indexOf(focusId));

  const go = useCallback((id: number) => setFocusId(id), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (parentIds.length > 0) go(parentIds[0]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (childIds.length > 0) go(childIds[0]);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (siblingIndex > 0) go(siblingIds[siblingIndex - 1]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (siblingIndex < siblingIds.length - 1) go(siblingIds[siblingIndex + 1]);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(ROOT_ID);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parentIds, childIds, siblingIds, siblingIndex, go]);

  // Breadcrumb path from root → focus (walk parents[0] up)
  const path = useMemo(() => {
    const out: Person[] = [];
    let cur: Person | undefined = focus;
    const seen = new Set<number>();
    while (cur && !seen.has(cur.id)) {
      out.unshift(cur);
      seen.add(cur.id);
      cur = cur.parents[0] !== undefined ? PEOPLE[cur.parents[0]] : undefined;
    }
    return out;
  }, [focus]);

  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/" className="text-xs opacity-70 hover:opacity-100">← Back</Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold">{HEADER[0] ?? "Britton Family Tree"}</h1>
            <p className="text-[11px] opacity-60">{HEADER[1]}</p>
          </div>
          <div className="text-[11px] opacity-50">
            ↑ parent · ↓ child · ← → siblings · Home: root
          </div>
        </div>
      </header>

      {/* Breadcrumb / lineage */}
      <nav className="mx-auto max-w-6xl px-6 pt-4 text-xs opacity-70">
        {path.map((p, i) => (
          <span key={p.id}>
            {i > 0 && <span className="mx-2 opacity-40">›</span>}
            <button
              onClick={() => go(p.id)}
              className={p.id === focusId ? "font-semibold underline" : "hover:underline"}
            >
              {p.name}
            </button>
          </span>
        ))}
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        {/* Parents row */}
        <Row label="Parent" emptyLabel="— earliest known ancestor —">
          {parentIds.map((id) => (
            <PersonCard key={id} person={PEOPLE[id]} onClick={() => go(id)} variant="parent" />
          ))}
        </Row>

        {/* Focus + siblings row */}
        <Row label={`Generation ${focus.gen}${siblingIds.length > 1 ? ` · sibling ${siblingIndex + 1} of ${siblingIds.length}` : ""}`}>
          {siblingIds.map((id) => {
            const isFocus = id === focusId;
            return (
              <div key={id} ref={isFocus ? focusRef : undefined}>
                <PersonCard
                  person={PEOPLE[id]}
                  onClick={() => go(id)}
                  variant={isFocus ? "focus" : "sibling"}
                />
              </div>
            );
          })}
        </Row>

        {/* Children row */}
        <Row label={`Children (${childIds.length})`} emptyLabel="— no recorded male issue —">
          {childIds.map((id) => (
            <PersonCard key={id} person={PEOPLE[id]} onClick={() => go(id)} variant="child" />
          ))}
        </Row>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-8 text-[11px] opacity-50">
        {HEADER.slice(2).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </footer>
    </main>
  );
}

function Row({
  label,
  emptyLabel,
  children,
}: {
  label: string;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const isEmpty = arr.filter(Boolean).length === 0;
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-widest opacity-50">{label}</div>
      {isEmpty ? (
        <div className="text-xs italic opacity-40">{emptyLabel ?? "—"}</div>
      ) : (
        <div className="flex flex-wrap gap-2">{children}</div>
      )}
    </div>
  );
}

function PersonCard({
  person,
  onClick,
  variant,
}: {
  person: Person;
  onClick: () => void;
  variant: "focus" | "sibling" | "parent" | "child";
}) {
  const base =
    "text-left rounded-md border px-3 py-2 transition-colors min-w-[10rem] max-w-[14rem]";
  const styles = {
    focus: "border-foreground bg-foreground text-background shadow-sm",
    sibling: "border-foreground/20 bg-foreground/5 hover:bg-foreground/10",
    parent: "border-foreground/30 bg-foreground/10 hover:bg-foreground/15",
    child: "border-foreground/20 bg-foreground/5 hover:bg-foreground/10",
  }[variant];
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      <div className="text-sm font-medium leading-tight">{person.name}</div>
      {person.details.length > 0 && (
        <div className="mt-1 space-y-0.5 text-[11px] opacity-80">
          {person.details.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
      )}
    </button>
  );
}
