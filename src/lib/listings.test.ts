import { describe, expect, it } from "vitest";
import { assessValue, filterListings, rankListings, sampleListings, type Listing } from "./listings";

const L = (id: string, price: number, area = 1000, extra: Partial<Listing> = {}): Listing => ({
  id, title: id, price, area, pricePerSqft: Math.round(price / area), beds: 1, baths: 1, community: "JLT",
  type: "Apartment", purpose: "rent", photo: "", photos: [], agency: "", description: "", url: "", ...extra,
});

describe("best value", () => {
  it("computes % below the comparable median price per sqft", () => {
    const all = [L("a", 80000), L("b", 100000), L("c", 100000), L("d", 100000)];
    const v = assessValue(all[0]!, all);
    expect(v.status).toBe("ok");
    if (v.status === "ok") { expect(v.diffPct).toBeCloseTo(20); expect(v.label).toBe("below"); }
  });
  it("reports insufficient data with fewer than 3 comparables", () => {
    const all = [L("a", 80000), L("b", 100000), L("c", 100000)];
    expect(assessValue(all[0]!, all).status).toBe("insufficient");
  });
  it("ignores listings of a different purpose, beds or very different area", () => {
    const all = [L("a", 80000), L("b", 100000, 1000, { purpose: "sale" }), L("c", 100000, 1000, { beds: 2 }), L("d", 100000, 3000)];
    expect(assessValue(all[0]!, all).status).toBe("insufficient");
  });
  it("ranks insufficient-data listings last under Best value", () => {
    const all = [L("x", 10000, 1000, { beds: 5 }), L("a", 80000), L("b", 100000), L("c", 100000), L("d", 120000)];
    const values = Object.fromEntries(all.map((l) => [l.id, assessValue(l, all)]));
    const r = rankListings(all, "value", values).map((l) => l.id);
    expect(r[0]).toBe("a");
    expect(r.at(-1)).toBe("x");
  });
});

describe("sample data & filters", () => {
  const all = sampleListings();
  it("has unique ids and both rent and sale", () => {
    expect(new Set(all.map((l) => l.id)).size).toBe(all.length);
    expect(all.some((l) => l.purpose === "rent") && all.some((l) => l.purpose === "sale")).toBe(true);
  });
  it("combines filters", () => {
    const r = filterListings(all, { purpose: "rent", community: "Dubai Marina", minBeds: 2, maxPrice: 200000 });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((l) => l.purpose === "rent" && l.community === "Dubai Marina" && l.beds >= 2 && l.price <= 200000)).toBe(true);
  });
});
