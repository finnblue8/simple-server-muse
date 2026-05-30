import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/britton-map")({
  head: () => ({
    meta: [
      { title: "Britton Settlement Map" },
      { name: "description", content: "Interactive map of Britton family settlement locations through history." },
    ],
  }),
  component: BrittonMapPage,
});

type Settlement = {
  id: number;
  name: string;
  region: string;
  period: string;
  lat: number;
  lng: number;
  description: string;
  /** when true, connection from previous point uses a long ocean-crossing arrow style */
  oceanCrossing?: boolean;
};

const SETTLEMENTS: Settlement[] = [
  {
    id: 1,
    name: "Villers-Sire-Nicole",
    region: "Nord, France (Western Europe)",
    period: "c. 250 – 350 CE",
    lat: 50.2833,
    lng: 3.9833,
    description:
      "Earliest inferred origin of the paternal line. Y-DNA evidence places the Britton male line in Western Europe — most likely northeastern France, Belgium, or the Netherlands — during the late Roman period.",
  },
  {
    id: 2,
    name: "Ilfracombe",
    region: "North Devon, England",
    period: "c. 1550 – 1677",
    lat: 51.2083,
    lng: -4.1167,
    description:
      "First documented home of Adam Britton (c.1550–1633) and his descendants. The family lived as residents of this North Devon coastal town for over a century.",
  },
  {
    id: 3,
    name: "West Down",
    region: "North Devon, England",
    period: "1677 – 1711",
    lat: 51.1833,
    lng: -4.0833,
    description:
      "Humphrey Britton (1650–1717) moved the line inland from Ilfracombe to the parish of West Down.",
  },
  {
    id: 4,
    name: "Braunton",
    region: "North Devon, England",
    period: "1711 – 1756",
    lat: 51.1063,
    lng: -4.1602,
    description:
      "Adam Britton (1683–1740) settled the family in Braunton, one of the largest villages in England at the time.",
  },
  {
    id: 5,
    name: "Barnstaple",
    region: "North Devon, England",
    period: "1756 – 1788",
    lat: 51.0810,
    lng: -4.0590,
    description:
      "Humphry Britton (1717–1777) moved to the market town and port of Barnstaple. This is also the approximate departure point for the later emigration to North America.",
  },
  {
    id: 6,
    name: "Lynton",
    region: "North Devon, England",
    period: "1788 – 1819",
    lat: 51.2308,
    lng: -3.8358,
    description:
      "John Britton (1757–1815) and family relocated east along the Exmoor coast to Lynton.",
  },
  {
    id: 7,
    name: "Bratton Fleming",
    region: "North Devon, England",
    period: "1819 – 1837",
    lat: 51.1167,
    lng: -3.9667,
    description:
      "John Adam Britton (1790–1862) raised his family at Bratton Fleming on the edge of Exmoor.",
  },
  {
    id: 8,
    name: "New York City",
    region: "New York, USA",
    period: "c. 1840s (arrival)",
    lat: 40.7128,
    lng: -74.0060,
    description:
      "Inferred arrival point in North America. John Edward Britton is believed to have emigrated from the Barnstaple area to the United States in the 1840s, most likely landing in New York City.",
    oceanCrossing: true,
  },
  {
    id: 9,
    name: "Bridgeport, Belmont County",
    region: "Ohio, USA",
    period: "c. 1855 – 1861",
    lat: 40.0712,
    lng: -80.7445,
    description:
      "First documented North American home of the William Ira Britton line, attested by the 1860 U.S. Census. William Ira served in Co. D, 43rd Ohio Volunteer Infantry from 1861–65.",
  },
];

// Build an arched curve between two lat/lng points (returned as [lat,lng][]).
function archedPath(
  a: [number, number],
  b: [number, number],
  bend = 0.25,
  steps = 64
): [number, number][] {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  // midpoint
  const mLat = (lat1 + lat2) / 2;
  const mLng = (lng1 + lng2) / 2;
  // perpendicular offset (rotate vector 90°)
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const cLat = mLat + -dLng * bend;
  const cLng = mLng + dLat * bend;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * cLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * cLng + t * t * lng2;
    pts.push([lat, lng]);
  }
  return pts;
}

function BrittonMapPage() {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Settlement | null>(SETTLEMENTS[0]);
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null); // index of leg = settlement.id of endpoint
  const [Lib, setLib] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const RL = await import("react-leaflet");
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLib({ RL, L: L.default ?? L });
    })();
  }, []);

  const legs = useMemo(() => {
    const out: { from: Settlement; to: Settlement; path: [number, number][] }[] = [];
    for (let i = 1; i < SETTLEMENTS.length; i++) {
      const from = SETTLEMENTS[i - 1];
      const to = SETTLEMENTS[i];
      const bend = to.oceanCrossing ? 0.35 : 0.25;
      out.push({ from, to, path: archedPath([from.lat, from.lng], [to.lat, to.lng], bend) });
    }
    return out;
  }, []);

  const selectLeg = (idx: number) => {
    setSelectedLeg(idx);
    setSelected(null);
  };
  const selectPoint = (s: Settlement) => {
    setSelected(s);
    setSelectedLeg(null);
  };

  const activeLeg = selectedLeg != null ? legs[selectedLeg] : null;

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold sm:text-xl">Britton Family Settlement Map</h1>
            <p className="text-xs opacity-70 sm:text-sm">
              Migration of the Britton male line from late-Roman Europe to 19th-century Ohio.
            </p>
          </div>
          <Link to="/" className="text-xs underline opacity-80 hover:opacity-100 sm:text-sm">
            ← Home
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 64px)" }}>
        {/* Map */}
        <div className="relative flex-1 min-h-[400px]">
          {mounted && Lib ? (
            <LeafletMap
              Lib={Lib}
              settlements={SETTLEMENTS}
              legs={legs}
              selected={selected}
              selectedLeg={selectedLeg}
              onSelectPoint={selectPoint}
              onSelectLeg={selectLeg}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm opacity-60">
              Loading map…
            </div>
          )}
        </div>

        {/* Side panel: timeline + details */}
        <aside className="flex w-full flex-col border-t border-border bg-card lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80">Timeline</h2>
          </div>
          <ol className="flex-1 overflow-y-auto px-2 py-2">
            {SETTLEMENTS.map((s, idx) => {
              const isSel = selected?.id === s.id;
              const leg = idx > 0 ? legs[idx - 1] : null;
              const legSel = selectedLeg === idx - 1;
              return (
                <li key={s.id}>
                  {leg && (
                    <button
                      onClick={() => selectLeg(idx - 1)}
                      className={`ml-3 my-1 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                        legSel ? "bg-accent text-accent-foreground" : "opacity-60 hover:opacity-100 hover:bg-muted"
                      }`}
                    >
                      <span className="text-[10px]">↳</span>
                      <span className="italic">
                        Migration: {leg.from.name} → {leg.to.name}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => selectPoint(s)}
                    className={`flex w-full items-start gap-3 rounded px-2 py-2 text-left transition-colors ${
                      isSel ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <span className="mt-1 inline-block h-3 w-3 flex-shrink-0 rounded-full bg-red-500 ring-2 ring-red-500/30" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {idx + 1}. {s.name}
                      </span>
                      <span className="block text-xs opacity-70">{s.region}</span>
                      <span className="block text-xs opacity-70">{s.period}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="border-t border-border px-4 py-3 text-sm">
            {selected && (
              <>
                <div className="text-base font-semibold">{selected.name}</div>
                <div className="text-xs opacity-70">{selected.region}</div>
                <div className="mb-2 text-xs opacity-70">{selected.period}</div>
                <p className="text-sm leading-relaxed opacity-90">{selected.description}</p>
              </>
            )}
            {activeLeg && (
              <>
                <div className="text-base font-semibold">
                  {activeLeg.from.name} → {activeLeg.to.name}
                </div>
                <div className="mb-2 text-xs opacity-70">
                  {activeLeg.from.period} → {activeLeg.to.period}
                </div>
                <p className="text-sm leading-relaxed opacity-90">
                  {activeLeg.to.oceanCrossing
                    ? "Transatlantic emigration from the Barnstaple area of North Devon to the United States, most likely arriving at the port of New York. The exact ship and year are not documented, but family tradition and circumstantial evidence place the crossing in the 1840s."
                    : `The family relocated from ${activeLeg.from.name} (${activeLeg.from.region}) to ${activeLeg.to.name} (${activeLeg.to.region}) between ${activeLeg.from.period} and ${activeLeg.to.period}.`}
                </p>
              </>
            )}
            {!selected && !activeLeg && (
              <p className="text-xs opacity-60">Select a location or migration leg to read more.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function LeafletMap({
  Lib,
  settlements,
  legs,
  selected,
  selectedLeg,
  onSelectPoint,
  onSelectLeg,
}: {
  Lib: any;
  settlements: Settlement[];
  legs: { from: Settlement; to: Settlement; path: [number, number][] }[];
  selected: Settlement | null;
  selectedLeg: number | null;
  onSelectPoint: (s: Settlement) => void;
  onSelectLeg: (i: number) => void;
}) {
  const { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } = Lib.RL;

  return (
    <MapContainer
      center={[48, -20] as [number, number]}
      zoom={4}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {legs.map((leg, i) => {
        const isSel = selectedLeg === i;
        return (
          <Polyline
            key={i}
            positions={leg.path}
            pathOptions={{
              color: isSel ? "#ef4444" : "#b91c1c",
              weight: isSel ? 4 : 2.5,
              opacity: isSel ? 1 : 0.85,
              dashArray: "6 8",
            }}
            eventHandlers={{ click: () => onSelectLeg(i) }}
          >
            <Tooltip sticky>
              {leg.from.name} → {leg.to.name}
            </Tooltip>
          </Polyline>
        );
      })}
      {settlements.map((s) => {
        const isSel = selected?.id === s.id;
        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={isSel ? 9 : 6}
            pathOptions={{
              color: "#7f1d1d",
              weight: 2,
              fillColor: "#ef4444",
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelectPoint(s) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div className="text-xs">
                <div className="font-semibold">{s.name}</div>
                <div>{s.period}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
