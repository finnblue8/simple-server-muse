import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import eleanoraAsset from "@/assets/eleanora.png.asset.json";
import ilfracombeAsset from "@/assets/ilfracombe.jpg.asset.json";
import ilfracombe2Asset from "@/assets/ilfracombe2.jpg.asset.json";
import westdownAsset from "@/assets/westdown.jpg.asset.json";
import barnstapleAsset from "@/assets/barnstaple.webp.asset.json";
import lyntonAsset from "@/assets/lynton.jpg.asset.json";
import brattonflemingAsset from "@/assets/brattonfleming.jpg.asset.json";
import brattonfleming2Asset from "@/assets/brattonfleming2.jpg.asset.json";
import eriecanalAsset from "@/assets/eriecanal.gif.asset.json";
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

type Photo = { src: string; caption?: string };

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
  photos?: Photo[];
};

const PHOTOS_BY_ID: Record<number, Photo[]> = {
  3: [
    { src: ilfracombeAsset.url },
    {
      src: ilfracombe2Asset.url,
      caption:
        "Church of The Holy Trinity, Ilfracombe, built in 1322 on the site of an old Saxon church dating to 1263, the original family church.",
    },
  ],
  4: [
    { src: westdownAsset.url, caption: "Church of St. Calixtus, West Down" },
  ],
  6: [{ src: barnstapleAsset.url }],
  7: [{ src: lyntonAsset.url }],
  8: [
    { src: brattonflemingAsset.url },
    {
      src: brattonfleming2Asset.url,
      caption: "Church of St. Peter, Bratton Fleming, attended by John Adam Britton and family.",
    },
  ],
  9: [
    {
      src: eriecanalAsset.url,
      caption:
        "The Erie Canal is a historic canal in upstate New York that runs east–west between the Hudson River and Lake Erie. Completed in 1825, the canal was the first navigable waterway connecting the Atlantic Ocean to the upper Great Lakes above Niagara Falls, vastly reducing the costs of transporting people and goods across the Appalachians. The Erie Canal accelerated the settlement of the Great Lakes region, the westward expansion of the United States, and the economic ascendancy of New York state.",
    },
  ],
  14: [
    {
      src: "/photos/island10.jpg",
      caption:
        "Bombardment and Capture of Island Number Ten on the Mississippi River, April 7, 1862. Colored lithograph published by Currier & Ives, New York, c. 1862. It depicts the bombardment of the Confederate fortifications on Island Number Ten by Federal gunboats and mortar boats. Ships seen include (left to right): Mound City, Louisville, USS Pittsburg, Carondelet, Flagship Benton, Cincinnati, Saint Louis and Conestoga (timberclad). Mortar boats are firing from along the river bank.",
    },
  ],
  18: [
    { src: "/photos/corinth1.jpg" },
    { src: "/photos/corinth1-2.jpg", caption: "Halleck's army marches towards Corinth." },
  ],
  23: [
    { src: "/photos/corinth2-2.jpg" },
    { src: "/photos/corinth2.jpg" },
  ],
  32: [
    { src: "/photos/resac.jpg", caption: "Geary's Second Brigade attacking Confederate positions." },
  ],
  33: [
    {
      src: "/photos/dallas.jpg",
      caption:
        "General Sherman's Campaign — The Rebel Assault on Logan's Position in the Battle at Dallas, May 28, 1864. Sketched by Theodore R. Davis.",
    },
  ],
  34: [
    { src: "/photos/newhopechurch.jpg", caption: "Confederate entrenchments at New Hope Church." },
    { src: "/photos/allatoona.jpg", caption: "Battle of Allatoona Pass, 1897 illustration." },
  ],
  35: [
    {
      src: "/photos/kennesaw.jpg",
      caption: "The Army of the Cumberland swinging around Kennesaw Mountain.",
    },
  ],
  44: [
    { src: "/photos/marchtothesea.jpg", caption: "Sherman's March to the Sea by F. O. C. Darley." },
  ],
  51: [
    {
      src: "/photos/burning.jpg",
      caption: "The Burning of Columbia, South Carolina, on February 17, 1865, as depicted in Harper's Weekly.",
    },
  ],
  53: [
    {
      src: "/photos/bentonville.jpg",
      caption:
        "Appeared in the April 22, 1865 issue of Frank Leslie's Illustrated Newspaper. The print shows the Union Army charging the Confederate line and the rebels retreating. From Original Prints, Audio Visual Materials, Special Collections, State Archives of North Carolina.",
    },
  ],
  57: [
    {
      src: "/photos/grandreview.jpg",
      caption:
        "Grand Review of the Armies on Pennsylvania Avenue in Washington, D.C., heading northwest from the United States Capitol (dome visible in rear) toward the White House at 15th Street N.W., past the U.S. Treasury Department building, at the conclusion of the American Civil War, May 23–24, 1865.",
    },
  ],
  74: [
    {
      src: eleanoraAsset.url,
      caption: "Historical view of Eleanora, McCalmont Township, Jefferson County, Pennsylvania.",
    },
  ],
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
    name: "St. Clairsville (Enlistment)",
    region: "Belmont County, Ohio",
    period: "6 December 1861",
    lat: 40.0809,
    lng: -80.8989,
    era: "william_ira",
    description:
      "Volunteered for Union Army service. Physical description at enlistment: 5'8\", light complexion, blue eyes (alt. gray — pension file p. 100), dark hair, occupation: miner. See pension file p. 90.",
  },
  {
    id: 12,
    name: "Mount Vernon (43rd OVI organized)",
    region: "Knox County, Ohio",
    period: "21 December 1861 – 21 February 1862",
    lat: 40.3934,
    lng: -82.4857,
    era: "william_ira",
    description: "43rd Ohio Volunteer Infantry Regiment organized here.",
  },
  {
    id: 13,
    name: "Siege of New Madrid",
    region: "New Madrid, Missouri",
    period: "3 – 14 March 1862",
    lat: 36.5867,
    lng: -89.5281,
    era: "william_ira",
    description: "Siege operations against New Madrid, Mo.",
  },
  {
    id: 14,
    name: "Island No. 10",
    region: "Mississippi River / Tiptonville, Tennessee",
    period: "15 March – 8 April 1862",
    lat: 36.4453,
    lng: -89.4773,
    era: "william_ira",
    description:
      "Participation in the Battle of Island No. 10; siege and capture of Island No. 10 on the Mississippi River and capture of McCall's forces at Tiptonville, Mo.",
  },
  {
    id: 15,
    name: "Expedition to Fort Pillow",
    region: "Fort Pillow, Tennessee",
    period: "13 – 17 April 1862",
    lat: 35.6376,
    lng: -89.8345,
    era: "william_ira",
    description: "Expedition to Fort Pillow, Tenn.",
  },
  {
    id: 16,
    name: "Hamburg Landing",
    region: "Hamburg, Hardin County, Tennessee",
    period: "18 – 22 April 1862",
    lat: 35.0479,
    lng: -88.2622,
    era: "william_ira",
    description: "Moved to Hamburg Landing, Tennessee.",
  },
  {
    id: 17,
    name: "Action at Monterey",
    region: "Monterey, Tennessee",
    period: "29 April 1862",
    lat: 34.9656,
    lng: -88.6147,
    era: "william_ira",
    description: "Action at Monterey, Tennessee.",
  },
  {
    id: 18,
    name: "Siege of Corinth",
    region: "Corinth, Mississippi",
    period: "29 April – 30 May 1862",
    lat: 34.9343,
    lng: -88.5222,
    era: "william_ira",
    description: "Siege of Corinth, Mississippi.",
  },
  {
    id: 19,
    name: "Pursuit to Booneville",
    region: "Booneville, Mississippi",
    period: "30 May – 12 June 1862",
    lat: 34.6614,
    lng: -88.5675,
    era: "william_ira",
    description: "Occupation of Corinth and pursuit to Booneville, Mississippi.",
  },
  {
    id: 20,
    name: "Clear Creek",
    region: "Mississippi",
    period: "13 June – 20 August 1862",
    lat: 34.8500,
    lng: -88.5100,
    era: "william_ira",
    description: "Duty at Clear Creek, Mississippi.",
  },
  {
    id: 21,
    name: "Bear Creek",
    region: "Alabama",
    period: "21 August – 11 September 1862",
    lat: 34.2731,
    lng: -87.9844,
    era: "william_ira",
    description: "Duty at Bear Creek, Alabama.",
  },
  {
    id: 22,
    name: "Battle of Iuka",
    region: "Iuka, Mississippi",
    period: "19 September 1862",
    lat: 34.8112,
    lng: -88.1903,
    era: "william_ira",
    description: "Battle of Iuka, Mississippi.",
  },
  {
    id: 23,
    name: "Second Battle of Corinth (Wounded)",
    region: "Corinth, Mississippi",
    period: "3 – 4 October 1862",
    lat: 34.9343,
    lng: -88.5222,
    era: "william_ira",
    description:
      "Suffered a wound to the right breast during the 43rd Ohio's defense of Battery Robinett at the Second Battle of Corinth, in which 1/4 of the 43rd's soldiers were killed or wounded. See compiled service record pp. 4, 5, 10, 11, 15. Also a buckshot wound below the left knee — pension application file 2, p. 7. A letter to the editors of St. Clairsville's Belmont Chronicle, dated 24 October 1862 from Corinth and published 20 November, written by Crawford Armstrong of D Company, 43rd Ohio, details the company's actions on 4 October.",
  },
  {
    id: 24,
    name: "Recovery in 43rd Ohio Camp",
    region: "Corinth, Mississippi (camp)",
    period: "5 October 1862 – c. April 1863",
    lat: 34.9343,
    lng: -88.5222,
    era: "william_ira",
    description:
      "Recovery in the 43rd Ohio camp. William Ira sent $15 in wages home to Rachel Britton (\"Mrs. R Britton\") in March 1863, noted in the 19 March issue. Exact length of stay recovering in camp not known.",
  },
  {
    id: 25,
    name: "Tuscumbia",
    region: "Alabama",
    period: "15 – 23 April 1863",
    lat: 34.7311,
    lng: -87.7028,
    era: "william_ira",
    description: "Duty at Tuscumbia, Alabama.",
  },
  {
    id: 26,
    name: "Town Creek",
    region: "Alabama",
    period: "28 April 1863",
    lat: 34.6809,
    lng: -87.4053,
    era: "william_ira",
    description: "Engagement at Town Creek, Alabama.",
  },
  {
    id: 27,
    name: "Camp at Memphis",
    region: "Memphis, Tennessee",
    period: "29 April – October 1863",
    lat: 35.1495,
    lng: -90.0490,
    era: "william_ira",
    description: "Duty in camp at Memphis, Tennessee.",
  },
  {
    id: 28,
    name: "Camp at Prospect (Re-enlistment)",
    region: "Prospect, Giles County, Tennessee",
    period: "October 1863 – January 1864",
    lat: 35.0698,
    lng: -87.0625,
    era: "william_ira",
    description:
      "Duty in camp at Prospect, Tennessee. Re-enlisted as a veteran volunteer 23 December 1863 while the 43rd Ohio was stationed at Prospect before the Atlanta Campaign. Height given as about 5.65 feet. See compiled service record pp. 6, 7.",
  },
  {
    id: 29,
    name: "Bridgeport (Furlough)",
    region: "Belmont County, Ohio",
    period: "January 1864",
    lat: 40.0712,
    lng: -80.7445,
    era: "william_ira",
    description:
      "Placed on a 30-day furlough from the 43rd Ohio after re-enlistment, before the Atlanta Campaign. See compiled service record p. 19.",
  },
  {
    id: 30,
    name: "Return to Camp at Prospect",
    region: "Prospect, Giles County, Tennessee",
    period: "February 1864",
    lat: 35.0698,
    lng: -87.0625,
    era: "william_ira",
    description: "Return to camp at Prospect, Tennessee after furlough.",
  },
  {
    id: 31,
    name: "Sugar Valley",
    region: "Georgia (Atlanta Campaign)",
    period: "9 May 1864",
    lat: 34.5562,
    lng: -85.0269,
    era: "william_ira",
    description: "Atlanta Campaign — Sugar Valley, Georgia.",
  },
  {
    id: 32,
    name: "Battle of Resaca",
    region: "Resaca, Georgia (Atlanta Campaign)",
    period: "13 – 15 May 1864",
    lat: 34.5798,
    lng: -84.9466,
    era: "william_ira",
    description: "Atlanta Campaign — Battle of Resaca, Georgia.",
  },
  {
    id: 33,
    name: "Advance on Dallas",
    region: "Dallas, Georgia (Atlanta Campaign)",
    period: "18 – 25 May 1864",
    lat: 33.9237,
    lng: -84.8407,
    era: "william_ira",
    description: "Atlanta Campaign — advance on Dallas, Georgia.",
  },
  {
    id: 34,
    name: "Pumpkin Vine Creek / New Hope Church / Allatoona",
    region: "Dallas area, Georgia (Atlanta Campaign)",
    period: "25 May – 5 June 1864",
    lat: 33.9587,
    lng: -84.7716,
    era: "william_ira",
    description:
      "Atlanta Campaign — operations on the line of Pumpkin Vine Creek and battles about Dallas, New Hope Church, and Allatoona Hills, Georgia.",
  },
  {
    id: 35,
    name: "Assault on Kennesaw",
    region: "Kennesaw Mountain, Georgia (Atlanta Campaign)",
    period: "27 June 1864",
    lat: 33.9737,
    lng: -84.5777,
    era: "william_ira",
    description: "Atlanta Campaign — assault on Kennesaw, Georgia.",
  },
  {
    id: 36,
    name: "Nickajack Creek / Ruff's Mill",
    region: "Smyrna area, Georgia (Atlanta Campaign)",
    period: "2 – 5 July 1864",
    lat: 33.8612,
    lng: -84.5550,
    era: "william_ira",
    description: "Atlanta Campaign — battles near Nickajack Creek and Battle of Ruff's Mill, Georgia.",
  },
  {
    id: 37,
    name: "Chattahoochee River",
    region: "North of Atlanta, Georgia (Atlanta Campaign)",
    period: "6 – 17 July 1864",
    lat: 33.8801,
    lng: -84.4495,
    era: "william_ira",
    description: "Atlanta Campaign — battles near the Chattahoochee River, north of Atlanta, Georgia.",
  },
  {
    id: 38,
    name: "Decatur (Captured & Escaped)",
    region: "Decatur, Georgia (Atlanta Campaign)",
    period: "22 July 1864",
    lat: 33.7748,
    lng: -84.2963,
    era: "william_ira",
    description:
      "Atlanta Campaign — captured by Confederate troops at Decatur, Georgia during the Battle of Atlanta, but escaped.",
  },
  {
    id: 39,
    name: "Siege of Atlanta",
    region: "Atlanta, Georgia (Atlanta Campaign)",
    period: "23 July – 25 August 1864",
    lat: 33.7490,
    lng: -84.3880,
    era: "william_ira",
    description: "Atlanta Campaign — siege of Atlanta, Georgia.",
  },
  {
    id: 40,
    name: "Flank Movement on Jonesboro",
    region: "Jonesboro, Georgia (Atlanta Campaign)",
    period: "25 – 30 August 1864",
    lat: 33.5215,
    lng: -84.3540,
    era: "william_ira",
    description: "Atlanta Campaign — flank movement on Jonesboro, Georgia.",
  },
  {
    id: 41,
    name: "Battle of Jonesboro",
    region: "Jonesboro, Georgia (Atlanta Campaign)",
    period: "31 August – 1 September 1864",
    lat: 33.5215,
    lng: -84.3540,
    era: "william_ira",
    description: "Atlanta Campaign — Battle of Jonesboro, Georgia.",
  },
  {
    id: 42,
    name: "Lovejoy",
    region: "Lovejoy, Georgia (Atlanta Campaign)",
    period: "2 – 6 September 1864",
    lat: 33.4404,
    lng: -84.3132,
    era: "william_ira",
    description: "Atlanta Campaign — Lovejoy, Georgia.",
  },
  {
    id: 43,
    name: "Operations against Hood",
    region: "Northern Georgia & northern Alabama",
    period: "29 September – 3 November 1864",
    lat: 34.2570,
    lng: -85.1647,
    era: "william_ira",
    description:
      "Operations against Confederate General Hood in northern Georgia and northern Alabama.",
  },
  {
    id: 44,
    name: "Sherman's March to the Sea",
    region: "Monteith Swamp, Georgia",
    period: "15 November – 10 December 1864",
    lat: 32.1813,
    lng: -81.2701,
    era: "william_ira",
    description:
      "Sherman's March to the Sea. Participated in the Battle of Monteith Swamp, during or shortly after which he contracted an illness from wading in river and swamp, contributing to loss of hearing in his left ear and to heart disease — various pages (incl. p. 82) of pension application file 2.",
  },
  {
    id: 45,
    name: "Siege of Savannah",
    region: "Savannah, Georgia",
    period: "10 – 21 December 1864",
    lat: 32.0809,
    lng: -81.0912,
    era: "william_ira",
    description: "Siege of Savannah, Georgia.",
  },
  {
    id: 46,
    name: "Reconnaissance to the Salkehatchie",
    region: "Salkehatchie River, South Carolina (Carolinas Campaign)",
    period: "20 January 1865",
    lat: 33.0500,
    lng: -81.0500,
    era: "william_ira",
    description: "Campaign of the Carolinas — reconnaissance to the Salkehatchie River, South Carolina.",
  },
  {
    id: 47,
    name: "Rivers & Broxton Bridges (Skirmishes)",
    region: "Salkehatchie River, South Carolina (Carolinas Campaign)",
    period: "2 February 1865",
    lat: 33.0254,
    lng: -81.0773,
    era: "william_ira",
    description:
      "Campaign of the Carolinas — skirmishes at Rivers and Broxton Bridges, Salkehatchie River, South Carolina.",
  },
  {
    id: 48,
    name: "Rivers Bridge (Action)",
    region: "Salkehatchie River, South Carolina (Carolinas Campaign)",
    period: "3 February 1865",
    lat: 33.0254,
    lng: -81.0773,
    era: "william_ira",
    description: "Campaign of the Carolinas — actions at Rivers Bridge, Salkehatchie River, South Carolina.",
  },
  {
    id: 49,
    name: "Binnaker's Bridge",
    region: "South Edisto River, South Carolina (Carolinas Campaign)",
    period: "9 February 1865",
    lat: 33.5240,
    lng: -81.0270,
    era: "william_ira",
    description: "Campaign of the Carolinas — Binnaker's Bridge, South Edisto River, South Carolina.",
  },
  {
    id: 50,
    name: "Orangeburg",
    region: "Orangeburg, South Carolina (Carolinas Campaign)",
    period: "12 – 13 February 1865",
    lat: 33.4918,
    lng: -80.8556,
    era: "william_ira",
    description: "Campaign of the Carolinas — Orangeburg, South Carolina.",
  },
  {
    id: 51,
    name: "Columbia",
    region: "Columbia, South Carolina (Carolinas Campaign)",
    period: "16 – 17 February 1865",
    lat: 34.0007,
    lng: -81.0348,
    era: "william_ira",
    description: "Campaign of the Carolinas — Columbia, South Carolina.",
  },
  {
    id: 52,
    name: "Juniper Creek near Cheraw",
    region: "Cheraw, South Carolina (Carolinas Campaign)",
    period: "3 March 1865",
    lat: 34.6976,
    lng: -79.8929,
    era: "william_ira",
    description: "Campaign of the Carolinas — Juniper Creek near Cheraw, South Carolina.",
  },
  {
    id: 53,
    name: "Battle of Bentonville",
    region: "Bentonville, North Carolina (Carolinas Campaign)",
    period: "19 – 20 March 1865",
    lat: 35.3071,
    lng: -78.3208,
    era: "william_ira",
    description: "Campaign of the Carolinas — Battle of Bentonville, North Carolina.",
  },
  {
    id: 54,
    name: "Occupation of Goldsboro",
    region: "Goldsboro, North Carolina (Carolinas Campaign)",
    period: "24 March 1865",
    lat: 35.3849,
    lng: -77.9928,
    era: "william_ira",
    description: "Campaign of the Carolinas — occupation of Goldsboro, North Carolina.",
  },
  {
    id: 55,
    name: "Advance on Raleigh",
    region: "Raleigh, North Carolina (Carolinas Campaign)",
    period: "10 – 14 April 1865",
    lat: 35.7796,
    lng: -78.6382,
    era: "william_ira",
    description: "Campaign of the Carolinas — advance on and occupation of Raleigh, North Carolina.",
  },
  {
    id: 56,
    name: "March to Washington, D.C.",
    region: "Virginia (en route)",
    period: "29 April – 24 May 1865",
    lat: 37.5407,
    lng: -77.4360,
    era: "william_ira",
    description:
      "March to Washington, D.C. for the celebration following the surrender of the Confederates on 9 April 1865.",
  },
  {
    id: 57,
    name: "Grand Review of the Armies",
    region: "Washington, D.C.",
    period: "24 May 1865",
    lat: 38.9072,
    lng: -77.0369,
    era: "william_ira",
    description: "Participation in the Grand Review of the Armies, Washington, D.C.",
  },
  {
    id: 58,
    name: "Mustered Out at Louisville",
    region: "Louisville, Kentucky",
    period: "June 1865",
    lat: 38.2527,
    lng: -85.7585,
    era: "william_ira",
    description: "43rd Ohio Infantry officially mustered out of service at Louisville, Kentucky.",
  },
  {
    id: 59,
    name: "Return to Bridgeport",
    region: "Belmont County, Ohio",
    period: "July 1865",
    lat: 40.0712,
    lng: -80.7445,
    era: "william_ira",
    description: "Return to home in Bridgeport post-Civil War.",
  },
  {
    id: 60,
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
    id: 61,
    name: "Northern Washington County",
    region: "Pennsylvania (exact location unknown)",
    period: "1 January 1867",
    lat: 40.300,
    lng: -80.350,
    era: "william_ira",
    description: "Birthplace of Emma Irene Britton. Exact location within northern Washington County is undocumented.",
  },
  {
    id: 62,
    name: "West Middletown",
    region: "Washington County, Pennsylvania",
    period: "25 March 1868",
    lat: 40.2270,
    lng: -80.4220,
    era: "william_ira",
    description: "Birthplace of William Britton.",
  },
  {
    id: 63,
    name: "Smith Township",
    region: "Washington County, Pennsylvania",
    period: "22 September 1869 – 1870",
    lat: 40.3470,
    lng: -80.3870,
    era: "william_ira",
    description: "Birthplace of Ida May Britton.",
  },
  {
    id: 64,
    name: "Berlin",
    region: "Somerset County, Pennsylvania",
    period: "20 October 1873",
    lat: 39.9173,
    lng: -78.9586,
    era: "william_ira",
    description: "Birthplace of John Henry Britton.",
  },
  {
    id: 65,
    name: "Bakerstown",
    region: "Allegheny County, Pennsylvania",
    period: "12 June 1875",
    lat: 40.6531,
    lng: -79.9342,
    era: "william_ira",
    description: "Birthplace of Alice Britton.",
  },
  {
    id: 66,
    name: "Cross Creek",
    region: "Washington County, Pennsylvania",
    period: "2 June 1877",
    lat: 40.2728,
    lng: -80.4042,
    era: "william_ira",
    description: "Birthplace of Charles Britton.",
  },
  {
    id: 67,
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
    id: 68,
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
    id: 69,
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
    id: 70,
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
    id: 71,
    name: "Carroll Township",
    region: "Washington County, Pennsylvania",
    period: "June 1890",
    lat: 40.1450,
    lng: -79.9970,
    era: "william_ira",
    description: "Recorded location at the 1890 U.S. Census, Veterans Schedules.",
  },
  {
    id: 72,
    name: "Elkhorn, Forward Township",
    region: "Allegheny County, Pennsylvania",
    period: "13 January 1891",
    lat: 40.2220149,
    lng: -79.9636615,
    era: "william_ira",
    description:
      "See pension file p. 23. Further supported by reference to daughter Emma Irene Grell (née Britton) in a Moline, Illinois newspaper celebrating the 25th anniversary of the issuance of a marriage license to Charles Grell and Emma Britton, 24, of Elkhorn, PA.",
  },
  {
    id: 73,
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
    id: 74,
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
    id: 75,
    name: "Coal Center",
    region: "Washington County, Pennsylvania",
    period: "1900 – c. 1905",
    lat: 40.1267,
    lng: -79.8920,
    era: "william_ira",
    description: "Family residence in Coal Center from 1900 to about 1905.",
  },
  {
    id: 76,
    name: "Pleasant City",
    region: "Guernsey County, Ohio",
    period: "January 1905 – 1910",
    lat: 39.9020,
    lng: -81.5454,
    era: "william_ira",
    description: "Family residence in Pleasant City from January 1905 to 1910.",
  },
  {
    id: 77,
    name: "Brilliant",
    region: "Jefferson County, Ohio",
    period: "1910 – c. 1913",
    lat: 40.2620,
    lng: -80.6184,
    era: "william_ira",
    description: "Family residence in Brilliant from 1910 to about 1913.",
  },
  {
    id: 78,
    name: "Moline",
    region: "Rock Island County, Illinois",
    period: "1913",
    lat: 41.5067,
    lng: -90.5151,
    era: "william_ira",
    description: "Family residence in Moline in 1913.",
  },
  {
    id: 79,
    name: "Powhatan Point",
    region: "Belmont County, Ohio",
    period: "c. 1914 – 1922",
    lat: 39.8612,
    lng: -80.8167,
    era: "william_ira",
    description: "Family residence in Powhatan Point from about 1914 to 1922.",
  },
  {
    id: 80,
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
    id: 81,
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
    id: 82,
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
    id: 83,
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
    id: 84,
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
  const [dark, setDark] = useState(true);
  const [Lib, setLib] = useState<any>(null);
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const RL = await import("react-leaflet");
      const L = await import("leaflet");
      setLib({ RL, L: L.default ?? L });
    })();
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowLeft")
        setLightbox((lb) =>
          lb ? { ...lb, index: (lb.index - 1 + lb.photos.length) % lb.photos.length } : lb,
        );
      else if (e.key === "ArrowRight")
        setLightbox((lb) =>
          lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : lb,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);
  useEffect(() => {
    setDetailsExpanded(false);
  }, [selected?.id, selectedLeg, selectedRoute]);






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

  // On mobile, keep the active timeline card centered in the horizontal filmstrip.
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    let id: string | null = null;
    if (selected) {
      id = `timeline-card-${selected.id}`;
    } else if (selectedLeg != null) {
      const leg = legs.find((l) => l.idx === selectedLeg);
      if (leg) id = `timeline-card-${leg.to.id}`;
    } else if (selectedRoute === "erie-canal") {
      id = "timeline-card-9";
    }
    const el = id ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selected, selectedLeg, selectedRoute, legs]);

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
      <div className="border-b border-border px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
          <div className="flex items-center justify-between gap-2 sm:min-w-0 sm:block">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-xl">Britton Family Settlement Map</h1>
              <p className="hidden truncate text-xs opacity-70 sm:block sm:text-sm">
                Migration from late-Roman Europe to early-20th-century America.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={() => setDark((d) => !d)}
                className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                aria-label="Toggle dark mode"
              >
                {dark ? "☀" : "☾"}
              </button>
              <Link to="/" className="text-xs underline opacity-80">← Home</Link>
            </div>
          </div>
          <div className="-mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {eraButton("All", "all")}
            {eraButton("English Era", "english")}
            {eraButton("William Ira Era", "william_ira")}
            {eraButton("Post-William Ira", "post_william_ira")}
          </div>
          <div className="hidden items-center justify-end gap-3 sm:flex">
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

      <div
        className="flex flex-col lg:h-[calc(100dvh-72px)] lg:flex-row"
      >
        <div className="relative h-[45dvh] min-h-[280px] flex-none lg:h-auto lg:min-h-[400px] lg:flex-1">

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

          {(selected || activeLeg || selectedRoute === "erie-canal") && (() => {
            const headerTitle = selected
              ? selected.name
              : activeLeg
              ? `${activeLeg.from.name} → ${activeLeg.to.name}`
              : ERIE_CANAL_ROUTE.label;
            const headerSub = selected
              ? selected.region
              : activeLeg
              ? `${activeLeg.from.period} → ${activeLeg.to.period}`
              : "c. 1840s — English Era";
            return (
              <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-[1000] max-h-[75%] overflow-hidden rounded-lg border border-border bg-card/95 text-sm text-card-foreground shadow-xl backdrop-blur sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:max-h-[calc(100%-1.5rem)] sm:w-[360px]">
                {/* Header bar — always visible */}
                <div className="flex items-start gap-2 border-b border-border/60 px-3 py-2 sm:px-4 sm:py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold sm:text-base">{headerTitle}</div>
                    <div className="truncate text-[11px] opacity-70 sm:text-xs">{headerSub}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsExpanded((v) => !v)}
                    className="rounded-full border border-border bg-background/80 px-2 py-1 text-[11px] font-medium hover:bg-background sm:hidden"
                    aria-label={detailsExpanded ? "Hide details" : "Show details"}
                  >
                    {detailsExpanded ? "Hide ▴" : "Details ▾"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelected(null); setSelectedLeg(null); setSelectedRoute(null); }}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-border bg-background/80 text-base leading-none text-foreground/80 shadow-sm hover:bg-background hover:text-foreground"
                    aria-label="Close details"
                  >
                    ×
                  </button>
                </div>
                {/* Body — hidden on mobile until expanded, always shown on desktop */}
                <div className={`${detailsExpanded ? "block" : "hidden"} sm:block max-h-[60vh] overflow-y-auto px-3 py-3 sm:max-h-[calc(100vh-10rem)] sm:px-4`}>
                  {selected && (() => {
                    const photos = PHOTOS_BY_ID[selected.id] ?? [];
                    return (
                      <>
                        <div className="mb-2 text-xs opacity-70">{selected.period}</div>
                        <p className="text-sm leading-relaxed opacity-90">{selected.description}</p>
                        {photos.length > 0 && (
                          <div className={`mt-3 grid gap-2 ${photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                            {photos.map((p, i) => (
                              <button
                                key={p.src}
                                type="button"
                                className="britton-photo-thumb"
                                onClick={() => setLightbox({ photos, index: i })}
                                aria-label={p.caption ? `Expand photo: ${p.caption}` : "Expand photo"}
                              >
                                <img src={p.src} alt={p.caption ?? selected.name} loading="lazy" />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {activeLeg && (
                    <p className="text-sm leading-relaxed opacity-90">
                      The family relocated from {activeLeg.from.name} ({activeLeg.from.region}) to {activeLeg.to.name} (
                      {activeLeg.to.region}) between {activeLeg.from.period} and {activeLeg.to.period}.
                    </p>
                  )}
                  {selectedRoute === "erie-canal" && (
                    <p className="text-sm leading-relaxed opacity-90">{ERIE_CANAL_ROUTE.description}</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>



        <aside className="flex w-full flex-col border-t border-border bg-card lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="border-b border-border px-4 py-2 lg:px-4 lg:py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80">Timeline</h2>
              <span className="text-[10px] opacity-60 lg:hidden">{visibleSettlements.length} events</span>
            </div>
          </div>
          <ol className="flex flex-1 snap-x snap-mandatory flex-row gap-3 overflow-x-auto px-3 py-3 lg:flex-col lg:gap-0 lg:overflow-y-auto lg:overflow-x-visible lg:px-2 lg:py-2 lg:snap-align-none no-scrollbar">
            {visibleSettlements.map((s) => {
              const isSel = selected?.id === s.id;
              const leg = legs.find((l) => l.to.id === s.id);
              const legSel = leg && selectedLeg === leg.idx;
              const number = SETTLEMENTS.findIndex((x) => x.id === s.id) + 1;
              return (
                <li key={s.id} id={`timeline-card-${s.id}`} className="w-[260px] flex-shrink-0 snap-start lg:w-full lg:flex-none lg:snap-align-none">
                  <div className="flex h-full flex-col gap-1">
                    {leg && (
                      <button
                        onClick={() => selectLeg(leg.idx)}
                        className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[10px] transition-colors lg:my-1 lg:ml-3 lg:w-[calc(100%-1.5rem)] lg:text-xs ${
                          legSel ? "bg-accent text-accent-foreground" : "opacity-60 hover:bg-muted hover:opacity-100"
                        }`}
                      >
                        <span className="text-[10px]">↳</span>
                        <span className="truncate italic">
                          Migration: {leg.from.name} → {leg.to.name}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => selectPoint(s)}
                      className={`flex flex-1 w-full flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors lg:flex-row lg:items-start lg:gap-3 lg:rounded lg:border-0 lg:bg-transparent lg:p-2 ${
                        isSel
                          ? "bg-accent text-accent-foreground max-lg:ring-2 max-lg:ring-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white ring-2 ring-red-600/30">
                        {number}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="line-clamp-2 text-sm font-medium lg:line-clamp-none">{s.name}</span>
                        <span className="line-clamp-2 text-xs opacity-70 lg:line-clamp-none">{s.region}</span>
                        <span className="line-clamp-1 text-xs opacity-70 lg:line-clamp-none">{s.period}</span>
                      </span>
                    </button>
                    {s.id === 9 && showErieCanal && (
                      <button
                        onClick={selectErie}
                        className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[10px] transition-colors lg:my-1 lg:ml-3 lg:w-[calc(100%-1.5rem)] lg:text-xs ${
                          selectedRoute === "erie-canal"
                            ? "bg-accent text-accent-foreground"
                            : "opacity-70 hover:bg-muted hover:opacity-100"
                        }`}
                      >
                        <span className="text-[10px]">⇢</span>
                        <span className="truncate italic text-sky-600 dark:text-sky-400">
                          Erie Canal route → Ohio
                        </span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[2000] flex flex-col bg-black/90 p-2 backdrop-blur-sm sm:p-6"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>
              {lightbox.index + 1} / {lightbox.photos.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-white hover:bg-white/20"
              aria-label="Close"
            >
              ✕ Close
            </button>
          </div>
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.photos.length > 1 && (
              <button
                onClick={() =>
                  setLightbox((lb) =>
                    lb ? { ...lb, index: (lb.index - 1 + lb.photos.length) % lb.photos.length } : lb,
                  )
                }
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-2xl text-white hover:bg-white/30 sm:left-4"
                aria-label="Previous photo"
              >
                ‹
              </button>
            )}
            <img
              src={lightbox.photos[lightbox.index].src}
              alt={lightbox.photos[lightbox.index].caption ?? ""}
              className="max-h-full max-w-full object-contain"
            />
            {lightbox.photos.length > 1 && (
              <button
                onClick={() =>
                  setLightbox((lb) =>
                    lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : lb,
                  )
                }
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-2xl text-white hover:bg-white/30 sm:right-4"
                aria-label="Next photo"
              >
                ›
              </button>
            )}
          </div>
          {lightbox.photos[lightbox.index].caption && (
            <figcaption
              className="mx-auto mt-2 max-w-3xl px-2 text-center text-xs italic text-white/85 sm:text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.photos[lightbox.index].caption}
            </figcaption>
          )}
        </div>
      )}
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
                </Fragment>
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
