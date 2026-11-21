import { createServerFn } from "@tanstack/react-start";
import { generateChatCompletion, GatewayError } from "@lovable.dev/ai-gateway";
import { assessAll, filterListings, rankListings, type Listing } from "./listings";
import { loadListings } from "./listings.server";
import { parseQuery, type FinderFilters } from "./parse-query";

export const getListings = createServerFn({ method: "GET" }).handler(async () => loadListings());

type ChatMsg = { role: "user" | "assistant"; content: string };

const EXTRACT = `Extract Dubai property search filters from the conversation (latest request wins, keep earlier context unless replaced). Reply ONLY with JSON: {"purpose":"rent"|"sale","community":string,"type":"Apartment"|"Villa"|"Townhouse","minBeds":number,"minPrice":number,"maxPrice":number,"minArea":number,"sort":"price-asc"|"price-desc"|"area-desc"|"area-asc"|"value"}. Omit keys the user did not state — never guess purpose. Rent is AED per year ("10k/month" = 120000). "k"=1000, "M"=1000000. Communities: Dubai Marina, Downtown Dubai, Palm Jumeirah, Business Bay, JVC, JLT, Dubai Hills Estate, Arabian Ranches, Dubai Creek Harbour, Al Barsha.`;

const SYSTEM = `You are DubaiNest's property finder. You get the filters derived from the user's request and the matching SAMPLE listings (not real offers). Reply in the user's language with 2-3 short sentences: summarise what matched and why the top ones stand out (valuePct = % below similar listings' median AED/sqft; null = not enough comparables). Never invent listings or market statistics. If rent vs buy was not specified, ask which they want. If nothing matched, suggest which criterion to relax.`;

const KEYS = ["purpose", "community", "type", "minBeds", "minPrice", "maxPrice", "minArea", "sort"] as const;
function clean(f: Record<string, unknown>): FinderFilters {
  const out: Record<string, unknown> = {};
  for (const k of KEYS) if (f[k] != null && f[k] !== "") out[k] = f[k];
  if (out["purpose"] !== "rent" && out["purpose"] !== "sale") delete out["purpose"];
  return out as FinderFilters;
}

export const chatFind = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: ChatMsg[] }) => {
    if (!Array.isArray(d?.messages)) throw new Error("messages required");
    return { messages: d.messages.slice(-20).map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: String(m.content).slice(0, 4000) })) };
  })
  .handler(async ({ data }) => {
    const { data: all } = await loadListings();
    const values = assessAll(all);
    const convo = data.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";

    let filters: FinderFilters;
    let source: "ai" | "parser" = "ai";
    try {
      const ext = await generateChatCompletion({ model: "openai/gpt-6-astra", messages: [{ role: "system", content: EXTRACT }, { role: "user", content: convo }] });
      const raw = ext.choices[0]?.message?.content ?? "{}";
      filters = clean(JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)));
    } catch (e) {
      console.error("AI extract failed, using rule-based parser", e);
      filters = clean(parseQuery(lastUser));
      source = "parser";
    }

    const run = (f: FinderFilters): Listing[] => rankListings(filterListings(all, f), f.sort ?? "value", values);
    let found = run(filters);
    const relaxed: string[] = [];
    if (!found.length) {
      const { maxPrice, minArea, ...loose } = filters;
      const alt = run(loose);
      if (alt.length && (maxPrice != null || minArea != null)) {
        if (maxPrice != null) relaxed.push("maximum budget");
        if (minArea != null) relaxed.push("minimum area");
        filters = loose; found = alt;
      }
    }

    const top = found.slice(0, 6).map((l) => {
      const v = values[l.id];
      return { id: l.id, title: l.title, price: l.price, area: l.area, purpose: l.purpose, community: l.community, valuePct: v?.status === "ok" ? Math.round(v.diffPct) : null };
    });
    let reply = "";
    if (source === "ai") {
      try {
        const ans = await generateChatCompletion({
          model: "openai/gpt-6-astra",
          messages: [{ role: "system", content: SYSTEM }, ...data.messages,
            { role: "user", content: `[filters: ${JSON.stringify(filters)}${relaxed.length ? `; no exact match, relaxed: ${relaxed.join(", ")}` : ""}; ${found.length} matches; top: ${JSON.stringify(top)}]` }],
        });
        reply = ans.choices[0]?.message?.content ?? "";
      } catch (e) {
        console.error(e);
        if (e instanceof GatewayError && e.httpStatus === 402) reply = "AI credits are used up — results below come from the filters only.";
      }
    }
    if (!reply) {
      reply = source === "parser"
        ? `The AI service is unavailable, so I used a simple rule-based parser. Found ${found.length} matching sample listing${found.length === 1 ? "" : "s"}.`
        : `Found ${found.length} matching sample listing${found.length === 1 ? "" : "s"}.`;
    }
    return { reply, filters, relaxed, source, total: found.length };
  });
