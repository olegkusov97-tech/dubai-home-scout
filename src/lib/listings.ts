export type Purpose = "rent" | "sale";

export type Listing = {
  id: string;
  title: string;
  price: number;
  area: number;
  pricePerSqft: number;
  beds: number;
  baths: number;
  community: string;
  type: string;
  purpose: Purpose;
  photo: string;
  photos: string[];
  agency: string;
  description: string;
  url: string;
};

export type Filters = {
  purpose?: Purpose;
  community?: string;
  type?: string;
  minBeds?: number;
  maxPrice?: number;
  minPrice?: number;
  minArea?: number;
};

export type SortKey = "price-asc" | "price-desc" | "area-desc" | "area-asc" | "value";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

// Interior shots for apartments, house exteriors for villas/townhouses — never skylines.
const APARTMENT_PHOTOS = [
  "1502672260266-1c1ef2d93688", "1522708323590-d24dbb6b0267", "1560448204-e02f11c3d0e2",
  "1493809842364-78817add7ffb", "1586023492125-27b2c045efd7", "1505693416388-ac5ce068fe85",
  "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136", "1600210492486-724fe5c67fb0",
  "1600566753190-17f0baa2a6c3", "1600607687939-ce8a6c25118c", "1617104678098-de229db51175",
].map(img);
const VILLA_PHOTOS = [
  "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c", "1613490493576-7fde63acd811",
  "1580587771525-78b9dba3b914", "1564013799919-ab600027ffc6", "1512917774080-9991f1c4c750",
  "1600047509807-ba8f99d2cdde", "1600573472550-8090b5e0745e",
].map(img);
const TOWNHOUSE_PHOTOS = ["1570129477492-45c003edd2be", "1568605114967-8130f3a36994", "1598928506311-c55ded91a20c", "1574362848149-11496d93a7c7"].map(img);

// [community, sample base AED/sqft for sale, clusters of [type, beds]]
const COMMUNITIES: [string, number, [string, number][]][] = [
  ["Dubai Marina", 1650, [["Apartment", 1], ["Apartment", 2]]],
  ["Downtown Dubai", 2300, [["Apartment", 1], ["Apartment", 2]]],
  ["Palm Jumeirah", 2900, [["Apartment", 2], ["Villa", 4]]],
  ["Business Bay", 1700, [["Apartment", 0], ["Apartment", 1]]],
  ["JVC", 950, [["Apartment", 0], ["Apartment", 1], ["Townhouse", 3]]],
  ["JLT", 1250, [["Apartment", 0], ["Apartment", 2]]],
  ["Dubai Hills Estate", 1900, [["Apartment", 2], ["Villa", 4], ["Townhouse", 3]]],
  ["Arabian Ranches", 1350, [["Villa", 3], ["Townhouse", 3]]],
  ["Dubai Creek Harbour", 1850, [["Apartment", 1], ["Apartment", 3]]],
  ["Al Barsha", 1100, [["Apartment", 1], ["Apartment", 2]]],
];
const AGENCIES = ["Allsopp & Allsopp", "Betterhomes", "haus & haus", "Driven Properties", "fäm Properties", "Espace"];
const FEATURES = ["a balcony with community views", "built-in wardrobes", "a renovated kitchen", "access to a shared pool and gym", "covered parking", "an open-plan living area", "a private garden", "high ceilings and large windows"];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function baseArea(type: string, beds: number) {
  if (type === "Villa") return 2400 + beds * 650;
  if (type === "Townhouse") return 1500 + beds * 350;
  return 420 + beds * 400;
}

function make(i: number, community: string, base: number, type: string, beds: number, purpose: Purpose, counters: Record<string, number>): Listing {
  const area = Math.round(baseArea(type, beds) * (0.9 + rand(i + 3) * 0.2));
  const ppsf = base * (type === "Villa" ? 1.05 : 1) * (0.8 + rand(i + 4) * 0.4);
  const salePrice = Math.round((area * ppsf) / 1000) * 1000;
  const price = purpose === "sale" ? salePrice : Math.round((salePrice * 0.065) / 1000) * 1000;
  const pool = type === "Villa" ? VILLA_PHOTOS : type === "Townhouse" ? TOWNHOUSE_PHOTOS : APARTMENT_PHOTOS;
  const k = (counters[type] = (counters[type] ?? 0) + 1) - 1;
  const photos = [0, 1, 2].map((o) => pool[(k + o * 3) % pool.length]!);
  const bedLabel = beds === 0 ? "Studio" : `${beds}-Bed`;
  const f1 = FEATURES[i % FEATURES.length]!;
  const f2 = FEATURES[(i + 3) % FEATURES.length]!;
  return {
    id: `dn-${String(i + 1).padStart(3, "0")}`,
    title: `${bedLabel} ${type} in ${community}`,
    price,
    area,
    pricePerSqft: Math.round(price / area),
    beds,
    baths: Math.max(1, beds + (type === "Apartment" ? 0 : 1)),
    community,
    type,
    purpose,
    photo: photos[0]!,
    photos,
    agency: AGENCIES[i % AGENCIES.length]!,
    description: `${beds === 0 ? "A studio" : `A ${beds}-bedroom ${type.toLowerCase()}`} of ${area.toLocaleString("en-US")} sqft in ${community}, available ${purpose === "rent" ? "for annual rent" : "for sale"}. Features ${f1} and ${f2}. Sample listing for demonstration only — not a real offer.`,
    url: `https://www.bayut.com/to-${purpose === "rent" ? "rent" : "buy"}/property/dubai/`,
  };
}

export function sampleListings(): Listing[] {
  const out: Listing[] = [];
  const counters: Record<string, number> = {};
  let i = 0;
  for (const [community, base, clusters] of COMMUNITIES) {
    for (const [type, beds] of clusters) {
      for (const purpose of ["rent", "sale"] as const) {
        for (let n = 0; n < 4; n++) out.push(make(i++, community, base, type, beds, purpose, counters));
      }
    }
  }
  // A few one-off properties with no comparables, to show "insufficient data".
  out.push(make(i++, "Palm Jumeirah", 2900, "Villa", 6, "sale", counters));
  out.push(make(i++, "Downtown Dubai", 2300, "Apartment", 4, "rent", counters));
  out.push(make(i++, "Al Barsha", 1100, "Villa", 5, "sale", counters));
  return out;
}

export function filterListings(list: Listing[], f: Filters): Listing[] {
  return list.filter(
    (l) =>
      (!f.purpose || l.purpose === f.purpose) &&
      (!f.community || l.community.toLowerCase().includes(f.community.toLowerCase())) &&
      (!f.type || l.type.toLowerCase() === f.type.toLowerCase()) &&
      (f.minBeds == null || l.beds >= f.minBeds) &&
      (f.maxPrice == null || l.price <= f.maxPrice) &&
      (f.minPrice == null || l.price >= f.minPrice) &&
      (f.minArea == null || l.area >= f.minArea),
  );
}

// ---- Best value: comparison with similar listings ----

export const MIN_COMPARABLES = 3;
export const AREA_TOLERANCE = 0.35;
export const NEAR_BAND = 5;

export type ValueAssessment =
  | { status: "ok"; diffPct: number; medianPpsf: number; comparables: number; label: "below" | "near" | "above" }
  | { status: "insufficient"; comparables: number };

function median(v: number[]) {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** Comparables: same purpose, community, type and bedrooms, floor area within ±35%, excluding the listing itself. */
export function assessValue(l: Listing, all: Listing[]): ValueAssessment {
  const comps = all.filter(
    (o) => o.id !== l.id && o.purpose === l.purpose && o.community === l.community && o.type === l.type &&
      o.beds === l.beds && Math.abs(o.area - l.area) <= l.area * AREA_TOLERANCE,
  );
  if (comps.length < MIN_COMPARABLES) return { status: "insufficient", comparables: comps.length };
  const med = median(comps.map((o) => o.price / o.area));
  const diffPct = ((med - l.price / l.area) / med) * 100;
  const label = diffPct > NEAR_BAND ? "below" : diffPct < -NEAR_BAND ? "above" : "near";
  return { status: "ok", diffPct, medianPpsf: med, comparables: comps.length, label };
}

export function assessAll(all: Listing[]): Record<string, ValueAssessment> {
  const out: Record<string, ValueAssessment> = {};
  for (const l of all) out[l.id] = assessValue(l, all);
  return out;
}

export function rankListings(list: Listing[], sort: SortKey, values?: Record<string, ValueAssessment>): Listing[] {
  const s = [...list];
  const score = (l: Listing) => {
    const v = values?.[l.id];
    return v?.status === "ok" ? v.diffPct : Number.NEGATIVE_INFINITY;
  };
  const cmp: Record<SortKey, (a: Listing, b: Listing) => number> = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "area-desc": (a, b) => b.area - a.area,
    "area-asc": (a, b) => a.area - b.area,
    // Highest % below comparable median first; listings without enough comparables go last.
    value: (a, b) => {
      const d = score(b) - score(a);
      return Number.isNaN(d) ? 0 : d;
    },
  };
  return s.sort(cmp[sort]);
}

export const formatAED = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`;
