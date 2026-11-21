import { describe, expect, it } from "vitest";
import { parseQuery } from "./parse-query";

describe("parseQuery fallback", () => {
  it("parses the spec example", () => {
    expect(parseQuery("Find me a 1-bedroom apartment in Dubai Marina under AED 90,000 per year")).toEqual({
      purpose: "rent", community: "Dubai Marina", type: "Apartment", minBeds: 1, maxPrice: 90000,
    });
  });
  it("converts monthly budgets to yearly rent and M to millions", () => {
    expect(parseQuery("2 bed in JLT under 10k per month").maxPrice).toBe(120000);
    expect(parseQuery("villa to buy under 6M")).toMatchObject({ purpose: "sale", type: "Villa", maxPrice: 6_000_000 });
  });
});
