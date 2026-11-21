import { createServerFn } from "@tanstack/react-start";
import { generateChatCompletion, GatewayError } from "@lovable.dev/ai-gateway";
import { filterListings, rankListings, type Filters, type Listing, type SortKey } from "./listings";
import { loadListings } from "./listings.server";

export const getListings = createServerFn({ method: "GET" }).handler(async () => loadListings());

type ChatMsg = { role: "user" | "assistant"; content: string };

const EXTRACT = `Extract Dubai property search filters from the conversation (latest request wins, keep earlier context). Reply ONLY with JSON: {"purpose":"rent"|"sale","community":string,"type":"Apartment"|"Villa"|"Townhouse","minBeds":number,"minPrice":number,"maxPrice":number,"minArea":number,"sort":"price-asc"|"price-desc"|"area-desc"|"area-asc"|"value"}. Omit unknown keys. Rent is AED per year ("10k/month" = 120000). "k"=1000, "M"=1000000. Default sort "value". Communities: Dubai Marina, Downtown Dubai, Palm Jumeirah, Business Bay, JVC, JLT, Dubai Hills Estate, Arabian Ranches, Dubai Creek Harbour, Al Barsha.`;

const SYSTEM = `You are DubaiNest, a sharp Dubai real-estate advisor. Search results for the latest request are given to you. Rent prices are AED per year. Communities include Dubai Marina, Downtown Dubai, Palm Jumeirah, Business Bay, JVC, JLT, Dubai Hills Estate, Arabian Ranches, Dubai Creek Harbour, Al Barsha. After searching, reply in the user's language with 2-4 short sentences of reasoning; property cards are shown automatically, so don't list every detail. Mention if filters were relaxed.`;

export const chatFind = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: ChatMsg[] }) => {
    if (!Array.isArray(d?.messages)) throw new Error("messages required");
    return { messages: d.messages.slice(-20).map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) })) };
  })
  .handler(async ({ data }) => {
    const { data: all } = await loadListings();
    const convo = data.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
    try {
      const ext = await generateChatCompletion({
        model: "openai/gpt-6-astra",
        messages: [
          { role: "system", content: EXTRACT },
          { role: "user", content: convo },
        ],
      });
      const raw = ext.choices[0]?.message?.content ?? "{}";
      let f: Filters & { sort?: SortKey } = {};
      try { f = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch { f = {}; }
      let found: Listing[] = rankListings(filterListings(all, f), f.sort ?? "value");
      let relaxed = false;
      if (!found.length) {
        const { maxPrice, minArea, ...loose } = f;
        found = rankListings(filterListings(all, loose), f.sort ?? "value");
        relaxed = true;
      }
      const top = found.slice(0, 6);
      const ans = await generateChatCompletion({
        model: "openai/gpt-6-astra",
        messages: [
          { role: "system", content: SYSTEM },
          ...data.messages,
          { role: "user", content: `[search results${relaxed ? " — no exact match, budget/size filter relaxed" : ""}; ${found.length} total, top ranked]: ${JSON.stringify(top.map(({ photo, url, agency, ...r }) => r))}` },
        ],
      });
      return { reply: ans.choices[0]?.message?.content ?? "", listings: top };
    } catch (e) {
      console.error(e);
      if (e instanceof GatewayError && e.httpStatus === 429) return { reply: "Too many requests — please try again in a moment.", listings: [] };
      if (e instanceof GatewayError && e.httpStatus === 402) return { reply: "AI credits are used up for this workspace.", listings: [] };
      const code = e instanceof GatewayError ? e.code : "app_error";
      return { reply: `The AI service failed (${code}). Please try again.`, listings: [] };
    }
  });
