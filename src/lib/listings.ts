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
  purpose: "rent" | "sale";
  photo: string;
  agency: string;
  url: string;
};

export type Filters = {
  purpose?: "rent" | "sale";
  community?: string;
  type?: string;
  minBeds?: number;
  maxPrice?: number;
  minPrice?: number;
  minArea?: number;
};

export type SortKey = "price-asc" | "price-desc" | "area-desc" | "area-asc" | "value";

const PHOTOS = [
  "photo-1512453979798-5ea266f8880c",
  "photo-1518684079-3c830dcef090",
  "photo-1600596542815-ffad4c1539a9",
  "photo-1600585154340-be6161a56a0c",
  "photo-1502672260266-1c1ef2d93688",
  "photo-1522708323590-d24dbb6b0267",
  "photo-1560448204-e02f11c3d0e2",
  "photo-1493809842364-78817add7ffb",
].map((p) => `https://images.unsplash.com/${p}?auto=format&fit=crop&w=900&q=70`);

const COMMUNITIES: [string, number][] = [
  ["Dubai Marina", 1650], ["Downtown Dubai", 2300], ["Palm Jumeirah", 2900],
  ["Business Bay", 1700], ["JVC", 950], ["JLT", 1250], ["Dubai Hills Estate", 1900],
  ["Arabian Ranches", 1350], ["Dubai Creek Harbour", 1850], ["Al Barsha", 1100],
];
const AGENCIES = ["Allsopp & Allsopp", "Betterhomes", "haus & haus", "Driven Properties", "fäm Properties", "Espace"];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function sampleListings(): Listing[] {
  const out: Listing[] = [];
  for (let i = 0; i < 50; i++) {
    const [community, base] = COMMUNITIES[i % COMMUNITIES.length]!;
    const villa = (community === "Arabian Ranches" || community === "Dubai Hills Estate" || community === "Palm Jumeirah") && rand(i) > 0.5;
    const type = villa ? "Villa" : rand(i + 7) > 0.85 ? "Townhouse" : "Apartment";
    const beds = villa ? 3 + Math.floor(rand(i + 1) * 3) : Math.floor(rand(i + 2) * 4);
    const area = Math.round((villa ? 2600 : 450) + beds * (villa ? 700 : 420) + rand(i + 3) * 500);
    const purpose: "rent" | "sale" = i % 2 === 0 ? "rent" : "sale";
    const ppsf = base * (0.75 + rand(i + 4) * 0.5);
    const salePrice = Math.round((area * ppsf) / 1000) * 1000;
    const price = purpose === "sale" ? salePrice : Math.round((salePrice * 0.065) / 1000) * 1000;
    const bedLabel = beds === 0 ? "Studio" : `${beds}-Bed`;
    out.push({
      id: `s${i + 1}`,
      title: `${bedLabel} ${type} in ${community}`,
      price,
      area,
      pricePerSqft: Math.round(price / area),
      beds,
      baths: Math.max(1, beds + (villa ? 1 : 0)),
      community,
      type,
      purpose,
      photo: PHOTOS[i % PHOTOS.length]!,
      agency: AGENCIES[i % AGENCIES.length]!,
      url: `https://www.bayut.com/to-${purpose === "rent" ? "rent" : "buy"}/property/dubai/`,
    });
  }
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

export function rankListings(list: Listing[], sort: SortKey): Listing[] {
  const s = [...list];
  const cmp: Record<SortKey, (a: Listing, b: Listing) => number> = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    "area-desc": (a, b) => b.area - a.area,
    "area-asc": (a, b) => a.area - b.area,
    value: (a, b) => a.pricePerSqft - b.pricePerSqft,
  };
  return s.sort(cmp[sort]);
}

export const formatAED = (n: number) => `AED ${n.toLocaleString("en-US")}`;
