import { sampleListings, type Listing } from "./listings";

let cache: { at: number; data: Listing[]; live: boolean } | null = null;
const SIX_HOURS = 6 * 60 * 60 * 1000;

type BayutHit = {
  externalID: string; title: string; price: number; area: number; rooms: number; baths: number;
  purpose: string; location?: { name: string; level: number }[]; category?: { name: string }[];
  coverPhoto?: { url: string }; agency?: { name: string };
};

async function fetchBayut(key: string, purpose: string): Promise<Listing[]> {
  const res = await fetch(
    `https://bayut.p.rapidapi.com/properties/list?locationExternalIDs=5002&purpose=${purpose}&hitsPerPage=25&lang=en`,
    { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "bayut.p.rapidapi.com" } },
  );
  if (!res.ok) throw new Error(`Bayut ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { hits: BayutHit[] };
  return json.hits.map((h) => {
    const area = Math.round((h.area || 0) * 10.764);
    return {
      id: h.externalID,
      title: h.title,
      price: h.price,
      area,
      pricePerSqft: area ? Math.round(h.price / area) : 0,
      beds: h.rooms ?? 0,
      baths: h.baths ?? 0,
      community: h.location?.find((l) => l.level === 2)?.name ?? h.location?.[1]?.name ?? "Dubai",
      type: h.category?.[1]?.name ?? "Apartment",
      purpose: h.purpose === "for-rent" ? "rent" : "sale",
      photo: h.coverPhoto?.url ?? "",
      photos: h.coverPhoto?.url ? [h.coverPhoto.url] : [],
      description: h.title,
      agency: h.agency?.name ?? "",
      url: `https://www.bayut.com/property/details-${h.externalID}.html`,
    };
  });
}

export async function loadListings(): Promise<{ data: Listing[]; live: boolean }> {
  if (cache && Date.now() - cache.at < SIX_HOURS) return cache;
  const key = process.env["RAPIDAPI_KEY"];
  if (key) {
    try {
      const [r, s] = await Promise.all([fetchBayut(key, "for-rent"), fetchBayut(key, "for-sale")]);
      cache = { at: Date.now(), data: [...r, ...s].filter((l) => l.area > 0), live: true };
      return cache;
    } catch (e) {
      console.error("Bayut fetch failed, using sample data", e);
    }
  }
  cache = { at: Date.now(), data: sampleListings(), live: false };
  return cache;
}
