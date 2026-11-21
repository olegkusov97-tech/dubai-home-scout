import type { Filters, SortKey } from "./listings";

export const COMMUNITY_NAMES = ["Dubai Marina", "Downtown Dubai", "Palm Jumeirah", "Business Bay", "JVC", "JLT", "Dubai Hills Estate", "Arabian Ranches", "Dubai Creek Harbour", "Al Barsha"];

export type FinderFilters = Filters & { sort?: SortKey };

function money(n: string, unit: string | undefined) {
  const v = Number(n.replace(/,/g, ""));
  const u = (unit ?? "").toLowerCase();
  return u.startsWith("m") ? v * 1_000_000 : u === "k" ? v * 1000 : v;
}

/** Deterministic fallback parser, used when the AI service is unavailable. */
export function parseQuery(text: string): FinderFilters {
  const t = text.toLowerCase();
  const f: FinderFilters = {};
  if (/\b(rent|rental|lease|per year|\/yr|a year|monthly|per month)\b/.test(t)) f.purpose = "rent";
  if (/\b(buy|purchase|for sale|own|invest)\b/.test(t)) f.purpose = "sale";
  const c = COMMUNITY_NAMES.find((n) => t.includes(n.toLowerCase()) || t.includes(n.toLowerCase().replace(" estate", "")) || (n === "Downtown Dubai" && t.includes("downtown")) || (n === "Dubai Marina" && t.includes("marina")));
  if (c) f.community = c;
  if (/villa/.test(t)) f.type = "Villa"; else if (/townhouse/.test(t)) f.type = "Townhouse"; else if (/apartment|flat|studio/.test(t)) f.type = "Apartment";
  const b = t.match(/(\d)\s*-?\s*(bed|br|bedroom)/);
  if (b) f.minBeds = Number(b[1]); else if (/studio/.test(t)) f.minBeds = 0;
  const p = t.match(/(?:under|below|max|up to|less than|<)\s*(?:aed\s*)?([\d.,]+)\s*(k|m|mn|million)?/);
  if (p) {
    let v = money(p[1]!, p[2]);
    if (/month/.test(t)) { v *= 12; f.purpose ??= "rent"; }
    f.maxPrice = v;
  }
  const a = t.match(/(?:over|at least|min(?:imum)?|>)\s*([\d,]+)\s*(?:sq\s*ft|sqft)/);
  if (a) f.minArea = Number(a[1]!.replace(/,/g, ""));
  if (/biggest|largest|spacious/.test(t)) f.sort = "area-desc";
  else if (/cheapest|lowest price/.test(t)) f.sort = "price-asc";
  return f;
}
