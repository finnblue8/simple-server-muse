import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/notion/v1";
const DATA_SOURCE_ID = "37094df6-b56c-80fe-ac29-000bb903a2cb";

export type BrittonNotionRecord = {
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

type NotionPage = {
  id: string;
  properties: Record<string, any>;
};

function plainText(rt: any[] | undefined): string {
  if (!Array.isArray(rt)) return "";
  return rt.map((r) => r?.plain_text ?? "").join("").trim();
}

function dateStr(prop: any): string | null {
  const d = prop?.date;
  if (!d) return null;
  if (d.end && d.end !== d.start) return `${d.start} – ${d.end}`;
  return d.start ?? null;
}

export const getBrittonRecords = createServerFn({ method: "GET" }).handler(async () => {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY is not configured");

  const results: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const res = await fetch(`${GATEWAY_URL}/data_sources/${DATA_SOURCE_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": NOTION_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Fall back to legacy /databases endpoint
      const res2 = await fetch(`${GATEWAY_URL}/databases/${DATA_SOURCE_ID}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": NOTION_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res2.ok) {
        const text = await res2.text();
        throw new Error(`Notion query failed [${res2.status}]: ${text}`);
      }
      const data2 = await res2.json();
      results.push(...(data2.results ?? []));
      hasMore = !!data2.has_more;
      startCursor = data2.next_cursor ?? undefined;
      continue;
    }

    const data = await res.json();
    results.push(...(data.results ?? []));
    hasMore = !!data.has_more;
    startCursor = data.next_cursor ?? undefined;
  }

  const records: BrittonNotionRecord[] = [];
  for (const page of results) {
    const props = page.properties ?? {};
    const id = props["ID"]?.number ?? props["userDefined:ID"]?.number;
    if (typeof id !== "number") continue;
    records.push({
      id,
      firstName: plainText(props["First Name"]?.title),
      lastName: plainText(props["Last Name"]?.rich_text),
      birthDate: dateStr(props["Birth Date"]),
      birthLocation: plainText(props["Birth Location"]?.rich_text),
      deathDate: dateStr(props["Death Date"]),
      deathLocation: plainText(props["Death Location"]?.rich_text),
      marriageDate: dateStr(props["Marriage Date"]),
      marriageLocation: plainText(props["Marriage Location"]?.rich_text),
    });
  }

  return { records };
});
