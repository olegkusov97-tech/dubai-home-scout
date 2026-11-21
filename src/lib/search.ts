import type { Filters, Purpose, SortKey } from "./listings";

export type ExploreSearch = {
  mode?: Purpose;
  type?: string;
  community?: string;
  beds?: number;
  minArea?: number;
  pmin?: number;
  pmax?: number;
  sort?: SortKey;
  q?: string;
};

const SORTS: SortKey[] = ["value", "price-asc", "price-desc", "area-desc", "area-asc"];
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.slice(0, 80) : undefined);

export function parseExploreSearch(s: Record<string, unknown>): ExploreSearch {
  const out: ExploreSearch = {};
  if (s["mode"] === "sale") out.mode = "sale";
  const type = str(s["type"]); if (type) out.type = type;
  const community = str(s["community"]); if (community) out.community = community;
  const q = str(s["q"]); if (q) out.q = q;
  for (const k of ["beds", "minArea", "pmin", "pmax"] as const) { const n = num(s[k]); if (n != null) out[k] = n; }
  if (SORTS.includes(s["sort"] as SortKey) && s["sort"] !== "value") out.sort = s["sort"] as SortKey;
  return out;
}

export function toFilters(s: ExploreSearch): Filters {
  const f: Filters = { purpose: s.mode ?? "rent" };
  if (s.type) f.type = s.type;
  if (s.community) f.community = s.community;
  if (s.beds != null) f.minBeds = s.beds;
  if (s.minArea != null) f.minArea = s.minArea;
  if (s.pmin != null) f.minPrice = s.pmin;
  if (s.pmax != null) f.maxPrice = s.pmax;
  return f;
}

export function fromFilters(f: Filters & { sort?: SortKey }): ExploreSearch {
  const s: ExploreSearch = {};
  if (f.purpose === "sale") s.mode = "sale";
  if (f.type) s.type = f.type;
  if (f.community) s.community = f.community;
  if (f.minBeds != null) s.beds = f.minBeds;
  if (f.minArea != null) s.minArea = f.minArea;
  if (f.minPrice != null) s.pmin = f.minPrice;
  if (f.maxPrice != null) s.pmax = f.maxPrice;
  if (f.sort && f.sort !== "value") s.sort = f.sort;
  return s;
}
