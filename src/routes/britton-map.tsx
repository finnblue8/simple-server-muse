import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/britton-map")({
  head: () => ({
    meta: [
      { title: "Britton Settlement Map" },
      { name: "description", content: "Interactive map of Britton family settlement locations through history." },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
    ],
  }),
  component: BrittonMapPage,
});

type Era = "english" | "william_ira" | "post_william_ira";

type Settlement = {
  id: number;
  name: string;
  region: string;
  period: string;
  lat: number;
  lng: number;
  description: string;
  era: Era;
  /** when true, do NOT draw a line from the previous settlement to this one */
  skipConnectionFromPrevious?: boolean;
};

const SETTLEMENTS: Settlement[] = [
  {
    id: 1,
    name: "Western Europe",
    region: "Villers-Sire-Nicole, Nord, France (NE France / Belgium / Netherlands)",
    period: "c. 250 – 350 CE",
    lat: 50.2833,
    lng: 3.9833,
    era: "english",
    description:
      "Earliest inferred origin of the paternal line. The Britton Y-DNA haplogroup R-BY11801 (YFull Y-351800*), a branch of the very rare R-L151 line S-1194, points to a common ancestor most likely living in modern-day northeastern France, Belgium, or the Netherlands during the late Roman period.",
  },
  {
    id: 2,
    name: "Migration into England",
    region: "Entry into Britain — exact route & timing unknown",
    period: "c. 350 – 1550 CE",
    lat: 51.30,
    lng: -1.50,
    era: "english",
    skipConnectionFromPrevious: true,
    description:
      "It is not yet clear from Y-DNA evidence exactly when the ancestors of the Britton family entered England. Two viable migration paths are shown.\n\nTraditionally the surname Britton is associated with the Norman French followers of William the Conqueror after the Norman Conquest of 1066 — a form of the Breton name tied to Normandy and Brittany. Before Robbie's BigY testing, a distant Y-DNA match with a French \"le Breton\" man suggested our ancestors fit this Norman pattern.\n\nHowever, the finding that we belong to haplogroup S-1194 — present in England since roughly 400–200 BCE or earlier — may suggest the Britton male line was already in Britain long before 1066, potentially predating the Roman Conquest. How and when the family reached North Devon is undocumented; they first appear there with the birth of Adam's children in the 1580s, and even Adam himself may not have been a lifelong Devon resident.",
  },
  {
    id: 3,
    name: "Ilfracombe",
    region: "North Devon, England",
    period: "c. 1550 – 1677",
    lat: 51.2083,
    lng: -4.1167,
    era: "english",
    skipConnectionFromPrevious: true,
    description:
      "First documented home of Adam Britton (c.1550–1633) and his descendants. The family lived as residents of this North Devon coastal town for over a century.",
  },
  {
    id: 4,
    name: "West Down",
    region: "North Devon, England",
    period: "1677 – 1711",
    lat: 51.1833,
    lng: -4.0833,
    era: "english",
    description: "Humphrey Britton (1650–1717) moved the line inland from Ilfracombe to the parish of West Down.",
  },
  {
    id: 5,
    name: "Braunton",
    region: "North Devon, England",
    period: "1711 – 1756",
    lat: 51.1063,
    lng: -4.1602,
    era: "english",
    description: "Adam Britton (1683–1740) settled the family in Braunton, one of the largest villages in England at the time.",
  },
  {
    id: 6,
    name: "Barnstaple",
    region: "North Devon, England",
    period: "1756 – 1788",
    lat: 51.0810,
    lng: -4.0590,
    era: "english",
    description:
      "Humphry Britton (1717–1777) moved to the market town and port of Barnstaple. This is also the approximate departure point for the later emigration to North America.",
  },
  {
    id: 7,
    name: "Lynton",
    region: "North Devon, England",
    period: "1788 – 1819",
    lat: 51.2308,
    lng: -3.8358,
    era: "english",
    description: "John Britton (1757–1815) and family relocated east along the Exmoor coast to Lynton.",
  },
  {
    id: 8,
    name: "Bratton Fleming",
    region: "North Devon, England",
    period: "1819 – 1837",
    lat: 51.1167,
    lng: -3.9667,
    era: "english",
    description: "John Adam Britton (1790–1862) raised his family at Bratton Fleming on the edge of Exmoor.",
  },
  {
    id: 9,
    name: "New York City",
    region: "New York, USA",
    period: "c. 1840s (arrival)",
    lat: 40.7128,
    lng: -74.0060,
    era: "english",
    description:
      "Inferred arrival point in North America. John Edward Britton is believed to have emigrated from the Barnstaple area to the United States in the 1840s, most likely landing in New York City.",
  },
  {
    id: 10,
    name: "Bridgeport, Belmont County",
    region: "Ohio, USA",
    period: "c. 1855 – 1861",
    lat: 40.0712,
    lng: -80.7445,
    era: "william_ira",
    skipConnectionFromPrevious: true,
    description:
      "First documented North American home of the William Ira Britton line, attested by the 1860 U.S. Census. William Ira served in Co. D, 43rd Ohio Volunteer Infantry from 1861–65. Exact route from the NYC arrival point is undocumented.",
  },
  {
    id: 11,
    name: "West Alexander",
    region: "Washington County, Pennsylvania",
    period: "27 July 1865",
    lat: 40.0742,
    lng: -80.5320,
    era: "william_ira",
    description:
      "Marriage location of William Ira Britton and Mary Elizabeth Miller — an undocumented \"Gretna Green\" style marriage.",
  },
  {
    id: 12,
    name: "Northern Washington County",
    region: "Pennsylvania (exact location unknown)",
    period: "1 January 1867",
    lat: 40.300,
    lng: -80.350,
    era: "william_ira",
    description: "Birthplace of Emma Irene Britton. Exact location within northern Washington County is undocumented.",
  },
  {
    id: 13,
    name: "West Middletown",
    region: "Washington County, Pennsylvania",
    period: "25 March 1868",
    lat: 40.2270,
    lng: -80.4220,
    era: "william_ira",
    description: "Birthplace of William Britton.",
  },
  {
    id: 14,
    name: "Smith Township",
    region: "Washington County, Pennsylvania",
    period: "22 September 1869 – 1870",
    lat: 40.3470,
    lng: -80.3870,
    era: "william_ira",
    description: "Birthplace of Ida May Britton.",
  },
  {
    id: 15,
    name: "Berlin",
    region: "Somerset County, Pennsylvania",
    period: "20 October 1873",
    lat: 39.9173,
    lng: -78.9586,
    era: "william_ira",
    description: "Birthplace of John Henry Britton.",
  },
  {
    id: 16,
    name: "Bakerstown",
    region: "Allegheny County, Pennsylvania",
    period: "12 June 1875",
    lat: 40.6531,
    lng: -79.9342,
    era: "william_ira",
    description: "Birthplace of Alice Britton.",
  },
  {
    id: 17,
    name: "Cross Creek",
    region: "Washington County, Pennsylvania",
    period: "2 June 1877",
    lat: 40.2728,
    lng: -80.4042,
    era: "william_ira",
    description: "Birthplace of Charles Britton.",
  },
  {
    id: 18,
    name: "Brazil",
    region: "Clay County, Indiana",
    period: "1878",
    lat: 39.5237,
    lng: -87.1253,
    era: "william_ira",
    description:
      "Family left rural Washington County, PA at this time. Documented in pension application file 2, page 67; mentioned throughout in various capacities by numerous individuals.",
  },
  {
    id: 19,
    name: "Huntsville",
    region: "Madison County, Alabama",
    period: "21 March 1880",
    lat: 34.7304,
    lng: -86.5861,
    era: "william_ira",
    description:
      "Son Harry was born here on 21 Mar 1880 (personal testimony in pension file, page 100). Length of stay unclear — probably brief, as William Ira only mentioned AL once in the pension file.",
  },
  {
    id: 20,
    name: "Nashville (District 13)",
    region: "Tennessee",
    period: "1 June 1880",
    lat: 36.1627,
    lng: -86.7816,
    era: "william_ira",
    description:
      "Family was in Nashville at the time of the 1880 U.S. Census, less than three months after son Harry's birth in Huntsville. Length of stay unclear; not mentioned in the pension file.",
  },
  {
    id: 21,
    name: "Brazil",
    region: "Clay County, Indiana",
    period: "15 January 1882 – June 1890",
    lat: 39.5237,
    lng: -87.1253,
    era: "william_ira",
    description:
      "Birthplace of daughter Anna (1882). In 1884 began seeing Jacob F. Smith, M.D. for injuries (pension file 2, p. 28). 15 January 1886 referenced in pension file. 7 Feb 1889 applied for increase in invalid pension (pension file 2, p. 9).",
  },
  {
    id: 22,
    name: "Carroll Township",
    region: "Washington County, Pennsylvania",
    period: "June 1890",
    lat: 40.1450,
    lng: -79.9970,
    era: "william_ira",
    description: "Recorded location at the 1890 U.S. Census, Veterans Schedules.",
  },
  {
    id: 23,
    name: "Elkhorn, Forward Township",
    region: "Allegheny County, Pennsylvania",
    period: "13 January 1891",
    lat: 40.5400,
    lng: -79.9700,
    era: "william_ira",
    description:
      "See pension file p. 23. Further supported by reference to daughter Emma Irene Grell (née Britton) in a Moline, Illinois newspaper celebrating the 25th anniversary of the issuance of a marriage license to Charles Grell and Emma Britton, 24, of Elkhorn, PA.",
  },
  {
    id: 24,
    name: "Brownsville",
    region: "Fayette County, Pennsylvania",
    period: "11 August 1892",
    lat: 40.0234,
    lng: -79.8895,
    era: "william_ira",
    description:
      "Applied for increase in rate of invalid pension (pension file 2, p. 11). His age is given as 66 — the only time his birth year was ever alleged as 1826.",
  },
  {
    id: 25,
    name: "Eleanora, McCalmont Township",
    region: "Jefferson County, Pennsylvania",
    period: "March 1896 – July 1899",
    lat: 41.0306,
    lng: -78.8478,
    era: "william_ira",
    description:
      "William Ira Britton (1896) born here in March. Alice Britton married William James Pierce in November. William Britton (1868) murdered December 1896. 26 June 1897 applied for increase in pension (pension file 2, p. 80). 3 August 1898 applied again (pension file 2, p. 44), filed from Brookville.",
  },
  {
    id: 26,
    name: "Coal Center",
    region: "Washington County, Pennsylvania",
    period: "1900 – c. 1905",
    lat: 40.1267,
    lng: -79.8920,
    era: "william_ira",
    description: "Family residence in Coal Center from 1900 to about 1905.",
  },
  {
    id: 27,
    name: "Pleasant City",
    region: "Guernsey County, Ohio",
    period: "January 1905 – 1910",
    lat: 39.9020,
    lng: -81.5454,
    era: "william_ira",
    description: "Family residence in Pleasant City from January 1905 to 1910.",
  },
  {
    id: 28,
    name: "Brilliant",
    region: "Jefferson County, Ohio",
    period: "1910 – c. 1913",
    lat: 40.2620,
    lng: -80.6184,
    era: "william_ira",
    description: "Family residence in Brilliant from 1910 to about 1913.",
  },
  {
    id: 29,
    name: "Moline",
    region: "Rock Island County, Illinois",
    period: "1913",
    lat: 41.5067,
    lng: -90.5151,
    era: "william_ira",
    description: "Family residence in Moline in 1913.",
  },
  {
    id: 30,
    name: "Powhatan Point",
    region: "Belmont County, Ohio",
    period: "c. 1914 – 1922",
    lat: 39.8612,
    lng: -80.8167,
    era: "william_ira",
    description: "Family residence in Powhatan Point from about 1914 to 1922.",
  },
  {
    id: 31,
    name: "Clover Ridge & Beallsville",
    region: "Washington Twp., Belmont Co. & Monroe Co., Ohio",
    period: "1930 – c. 1955",
    lat: 39.8444,
    lng: -81.0376,
    era: "post_william_ira",
    description:
      "Family residence in Clover Ridge, Washington Township, Belmont County, Ohio, and also in Beallsville, Monroe County, Ohio.",
  },
  {
    id: 32,
    name: "Cuyahoga Falls",
    region: "Summit County, Ohio",
    period: "1955 – c. 1970",
    lat: 41.1339,
    lng: -81.4846,
    era: "post_william_ira",
    description:
      "Move north after Charles Willis Britton Sr. was discharged from U.S. Army active duty in Busan, Korea.",
  },
  {
    id: 33,
    name: "Hudson",
    region: "Summit County, Ohio",
    period: "1970 – c. 1987",
    lat: 41.2400,
    lng: -81.4404,
    era: "post_william_ira",
    description:
      "Britton Construction Corporation was formed in Summit County on 15 September 1972 and over the next decade was responsible for many homes and commercial real estate in Hudson and northern Summit County. Charles Willis Britton Sr. died 30 May 1981 in Akron, Ohio.",
  },
  {
    id: 34,
    name: "Bedford",
    region: "Cuyahoga County, Ohio",
    period: "1987 – 2002",
    lat: 41.3931,
    lng: -81.5368,
    era: "post_william_ira",
    description:
      "James Richard Britton lives in a condo with brother Charles Willis Britton Jr., and eventually with wife Nancy Ann Michaels after 1998.",
  },
  {
    id: 35,
    name: "Parma",
    region: "Cuyahoga County, Ohio",
    period: "2002 – present",
    lat: 41.4047,
    lng: -81.7229,
    era: "post_william_ira",
    description: "Current family residence in Parma, Cuyahoga County, Ohio.",
  },
];

// Two viable migration paths into England (Node 2 — c. 350–1550 CE). The
// exact route is undocumented; both are plausible based on Y-DNA evidence
// and surname history. A third arrow continues from eastern England west
// to North Devon, where the family first appears in the 1580s.
const ENGLAND_MIGRATION_PATHS: { id: string; label: string; waypoints: [number, number][] }[] = [
  {
    id: "channel-east",
    label: "Channel crossing from the east → Canterbury",
    waypoints: [
      [51.0350, 2.3770], // Dunkirk / NE France coast
      [51.2802, 1.0789], // Canterbury, Kent
    ],
  },
  {
    id: "normandy-brighton",
    label: "Normandy → Brighton (Norman pattern)",
    waypoints: [
      [49.4944, 0.1079], // Le Havre / Normandy coast
      [50.8225, -0.1372], // Brighton, Sussex
    ],
  },
  {
    id: "east-to-devon",
    label: "Eastern England → North Devon",
    waypoints: [
      [51.2802, 1.0789], // Canterbury
      [51.2083, -4.1167], // Ilfracombe, North Devon
    ],
  },
];

// Erie Canal historical migration route — the inferred path John Edward Britton
// likely took from New York City (node 9) to Ohio in the 1840s. This is
// the closing leg of the English Era.
const ERIE_CANAL_ROUTE: {
  id: "erie-canal";
  era: Era;
  label: string;
  description: string;
  waypoints: [number, number][];
} = {
  id: "erie-canal",
  era: "english",
  label: "Erie Canal route (NYC → Ohio)",
  description:
    "Inferred final leg of the English Era. From New York City, John Edward Britton most likely traveled up the Hudson River to Albany, then west along the Erie Canal through Utica, Syracuse, Rochester, and Buffalo, before continuing across Lake Erie to Cleveland and on into eastern Ohio. The Erie Canal (opened 1825) was the dominant westward migration corridor for immigrants arriving at New York in the 1840s.",
  waypoints: [
    [40.7128, -74.0060], // New York City
    [42.6526, -73.7562], // Albany (Hudson River)
    [43.1009, -75.2327], // Utica
    [43.0481, -76.1474], // Syracuse
    [43.1566, -77.6088], // Rochester
    [42.8864, -78.8784], // Buffalo (Lake Erie)
    [41.4993, -81.6944], // Cleveland, OH
    [40.0712, -80.7445], // Bridgeport, Belmont County, OH
  ],
};

type EraFilter = "all" | Era;

function BrittonMapPage() {
  const [mounted, setMounted] = useState(false);
  const [eraFilter, setEraFilter] = useState<EraFilter>("all");
  const [selected, setSelected] = useState<Settlement | null>(SETTLEMENTS[0]);
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<"erie-canal" | null>(null);
  const [dark, setDark] = useState(false);
  const [Lib, setLib] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const RL = await import("react-leaflet");
      const L = await import("leaflet");
      setLib({ RL, L: L.default ?? L });
    })();
  }, []);

  const visibleSettlements = useMemo(
    () => SETTLEMENTS.filter((s) => eraFilter === "all" || s.era === eraFilter),
    [eraFilter]
  );

  const legs = useMemo(() => {
    const visIds = new Set(visibleSettlements.map((s) => s.id));
    const out: { from: Settlement; to: Settlement; idx: number }[] = [];
    for (let i = 1; i < SETTLEMENTS.length; i++) {
      const to = SETTLEMENTS[i];
      const from = SETTLEMENTS[i - 1];
      if (to.skipConnectionFromPrevious) continue;
      if (!visIds.has(from.id) || !visIds.has(to.id)) continue;
      out.push({ from, to, idx: i - 1 });
    }
    return out;
  }, [visibleSettlements]);

  const showErieCanal = eraFilter === "all" || eraFilter === "english";

  const selectLeg = (legIdx: number) => {
    setSelectedLeg(legIdx);
    setSelected(null);
    setSelectedRoute(null);
  };
  const selectPoint = (s: Settlement) => {
    setSelected(s);
    setSelectedLeg(null);
    setSelectedRoute(null);
  };
  const selectErie = () => {
    setSelectedRoute("erie-canal");
    setSelected(null);
    setSelectedLeg(null);
  };

  const activeLeg = legs.find((l) => l.idx === selectedLeg) ?? null;

  const eraButton = (label: string, value: EraFilter) => (
    <button
      onClick={() => setEraFilter(value)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        eraFilter === value
          ? "bg-red-600 text-white"
          : "border border-border bg-background hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main
      className={`${dark ? "dark" : ""} min-h-screen w-full bg-background text-foreground`}
    >
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold sm:text-xl">Britton Family Settlement Map</h1>
            <p className="truncate text-xs opacity-70 sm:text-sm">
              Migration from late-Roman Europe to early-20th-century America.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {eraButton("All", "all")}
            {eraButton("English Era", "english")}
            {eraButton("William Ira Era", "william_ira")}
            {eraButton("Post-William Ira", "post_william_ira")}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {dark ? "☀ Light" : "☾ Dark"}
            </button>
            <Link to="/" className="text-xs underline opacity-80 hover:opacity-100 sm:text-sm">
              ← Home
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 72px)" }}>
        <div className="relative flex-1 min-h-[400px]">
          {mounted && Lib ? (
            <LeafletMap
              Lib={Lib}
              dark={dark}
              settlements={visibleSettlements}
              legs={legs}
              selected={selected}
              selectedLeg={selectedLeg}
              showErieCanal={showErieCanal}
              erieSelected={selectedRoute === "erie-canal"}
              onSelectPoint={selectPoint}
              onSelectLeg={selectLeg}
              onSelectErie={selectErie}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm opacity-60">Loading map…</div>
          )}
        </div>

        <aside className="flex w-full flex-col border-t border-border bg-card lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80">Timeline</h2>
          </div>
          <ol className="flex-1 overflow-y-auto px-2 py-2">
            {visibleSettlements.map((s) => {
              const isSel = selected?.id === s.id;
              const leg = legs.find((l) => l.to.id === s.id);
              const legSel = leg && selectedLeg === leg.idx;
              const number = SETTLEMENTS.findIndex((x) => x.id === s.id) + 1;
              return (
                <li key={s.id}>
                  {leg && (
                    <button
                      onClick={() => selectLeg(leg.idx)}
                      className={`my-1 ml-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                        legSel ? "bg-accent text-accent-foreground" : "opacity-60 hover:bg-muted hover:opacity-100"
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
                    <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white ring-2 ring-red-600/30">
                      {number}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{s.name}</span>
                      <span className="block text-xs opacity-70">{s.region}</span>
                      <span className="block text-xs opacity-70">{s.period}</span>
                    </span>
                  </button>
                  {/* After node 8, surface the Erie Canal historical route */}
                  {s.id === 9 && showErieCanal && (
                    <button
                      onClick={selectErie}
                      className={`my-1 ml-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                        selectedRoute === "erie-canal"
                          ? "bg-accent text-accent-foreground"
                          : "opacity-70 hover:bg-muted hover:opacity-100"
                      }`}
                    >
                      <span className="text-[10px]">⇢</span>
                      <span className="italic text-sky-600 dark:text-sky-400">
                        Erie Canal route → Ohio (English Era ends)
                      </span>
                    </button>
                  )}
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
                  The family relocated from {activeLeg.from.name} ({activeLeg.from.region}) to {activeLeg.to.name} (
                  {activeLeg.to.region}) between {activeLeg.from.period} and {activeLeg.to.period}.
                </p>
              </>
            )}
            {selectedRoute === "erie-canal" && (
              <>
                <div className="text-base font-semibold text-sky-600 dark:text-sky-400">
                  {ERIE_CANAL_ROUTE.label}
                </div>
                <div className="mb-2 text-xs opacity-70">c. 1840s — closing leg of the English Era</div>
                <p className="text-sm leading-relaxed opacity-90">{ERIE_CANAL_ROUTE.description}</p>
              </>
            )}
            {!selected && !activeLeg && !selectedRoute && (
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
  dark,
  settlements,
  legs,
  selected,
  selectedLeg,
  showErieCanal,
  erieSelected,
  onSelectPoint,
  onSelectLeg,
  onSelectErie,
}: {
  Lib: any;
  dark: boolean;
  settlements: Settlement[];
  legs: { from: Settlement; to: Settlement; idx: number }[];
  selected: Settlement | null;
  selectedLeg: number | null;
  showErieCanal: boolean;
  erieSelected: boolean;
  onSelectPoint: (s: Settlement) => void;
  onSelectLeg: (i: number) => void;
  onSelectErie: () => void;
}) {
  const { MapContainer, TileLayer, Marker, Polyline, Tooltip } = Lib.RL;
  const L = Lib.L;

  const makeIcon = (n: number, isSel: boolean) =>
    L.divIcon({
      className: "britton-marker",
      html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:${isSel ? 30 : 24}px;height:${isSel ? 30 : 24}px;
        border-radius:9999px;
        background:${isSel ? "#facc15" : "#dc2626"};
        color:${isSel ? "#1f2937" : "white"};
        font-weight:700;font-size:${isSel ? 13 : 11}px;
        border:2px solid ${isSel ? "#a16207" : "#7f1d1d"};
        box-shadow:0 0 0 3px ${isSel ? "rgba(250,204,21,0.35)" : "rgba(239,68,68,0.25)"};
        font-family:ui-sans-serif,system-ui,sans-serif;
        line-height:1;
      ">${n}</div>`,
      iconSize: [isSel ? 30 : 24, isSel ? 30 : 24],
      iconAnchor: [isSel ? 15 : 12, isSel ? 15 : 12],
    });

  const erieEnd = ERIE_CANAL_ROUTE.waypoints[ERIE_CANAL_ROUTE.waypoints.length - 1];
  const erieArrowIcon = L.divIcon({
    className: "britton-erie-arrow",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:22px;height:22px;border-radius:9999px;
      background:${erieSelected ? "#0ea5e9" : "#0284c7"};
      color:white;font-weight:700;font-size:14px;line-height:1;
      border:2px solid #0c4a6e;
      box-shadow:0 0 0 3px rgba(14,165,233,0.25);
      font-family:ui-sans-serif,system-ui,sans-serif;
    ">➤</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution = dark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer
      center={[45, -40] as [number, number]}
      zoom={3}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: dark ? "#0b1220" : undefined }}
    >
      <TileLayer
        key={dark ? "dark" : "light"}
        attribution={tileAttribution}
        url={tileUrl}
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {legs.map((leg) => {
        const isSel = selectedLeg === leg.idx;
        const isFromSelected = selected?.id === leg.from.id;
        return (
          <Polyline
            key={leg.idx}
            positions={[
              [leg.from.lat, leg.from.lng],
              [leg.to.lat, leg.to.lng],
            ]}
            pathOptions={{
              color: isFromSelected ? "#facc15" : isSel ? "#ef4444" : "#b91c1c",
              weight: isFromSelected ? 4 : isSel ? 4 : 2.5,
              opacity: isFromSelected || isSel ? 1 : 0.85,
              dashArray: "6 8",
              className: isFromSelected ? "britton-leg-active" : undefined,
            }}
            eventHandlers={{ click: () => onSelectLeg(leg.idx) }}
          >
            <Tooltip sticky>
              {leg.from.name} → {leg.to.name}
            </Tooltip>
          </Polyline>
        );
      })}

      {showErieCanal && (
        <>
          <Polyline
            positions={ERIE_CANAL_ROUTE.waypoints}
            pathOptions={{
              color: erieSelected ? "#0ea5e9" : "#0284c7",
              weight: erieSelected ? 5 : 3.5,
              opacity: erieSelected ? 1 : 0.9,
              dashArray: "10 6",
              className: erieSelected ? "britton-leg-active britton-erie-active" : "britton-erie-line",
            }}
            eventHandlers={{ click: onSelectErie }}
          >
            <Tooltip sticky>Erie Canal route (c. 1840s) — NYC → Ohio</Tooltip>
          </Polyline>
          <Marker
            position={erieEnd as [number, number]}
            icon={erieArrowIcon}
            eventHandlers={{ click: onSelectErie }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              Erie Canal route ends — arrival in Ohio
            </Tooltip>
          </Marker>
        </>
      )}

      {showErieCanal && (() => {
        const node2 = SETTLEMENTS.find((x) => x.id === 2)!;
        const highlight = selected?.id === 2;
        const color = highlight ? "#10b981" : "#059669";
        const arrowIcon = L.divIcon({
          className: "britton-england-arrow",
          html: `<div style="
            display:flex;align-items:center;justify-content:center;
            width:20px;height:20px;border-radius:9999px;
            background:${color};color:white;font-weight:700;font-size:13px;line-height:1;
            border:2px solid #064e3b;
            box-shadow:0 0 0 3px rgba(16,185,129,0.25);
            font-family:ui-sans-serif,system-ui,sans-serif;
          ">➤</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        return (
          <>
            {ENGLAND_MIGRATION_PATHS.map((path) => {
              const end = path.waypoints[path.waypoints.length - 1];
              return (
                <Fragment key={path.id}>
                  <Polyline
                    positions={path.waypoints}
                    pathOptions={{
                      color,
                      weight: highlight ? 4 : 3,
                      opacity: highlight ? 1 : 0.9,
                      dashArray: "8 6",
                      className: highlight ? "britton-leg-active" : undefined,
                    }}
                    eventHandlers={{ click: () => onSelectPoint(node2) }}
                  >
                    <Tooltip sticky>{path.label} (c. 350–1550 CE — viable path)</Tooltip>
                  </Polyline>
                  <Marker
                    position={end as [number, number]}
                    icon={arrowIcon}
                    eventHandlers={{ click: () => onSelectPoint(node2) }}
                  >
                    <Tooltip direction="top" offset={[0, -10]}>{path.label}</Tooltip>
                  </Marker>
                </span>
              );
            })}
          </>
        );
      })()}

      {settlements.map((s) => {
        const isSel = selected?.id === s.id;
        const number = SETTLEMENTS.findIndex((x) => x.id === s.id) + 1;
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={makeIcon(number, isSel)}
            eventHandlers={{ click: () => onSelectPoint(s) }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              <div className="text-xs">
                <div className="font-semibold">
                  {number}. {s.name}
                </div>
                <div>{s.period}</div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
