import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Building2, ExternalLink, Loader2, X } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { PropertyCard } from "@/components/PropertyCard";
import { chatFind } from "@/lib/listings.functions";
import { listingsQuery } from "@/lib/listings-query";
import { assessAll, filterListings, formatAED, rankListings, type Listing, type ValueAssessment } from "@/lib/listings";
import type { FinderFilters } from "@/lib/parse-query";
import { fromFilters } from "@/lib/search";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Property Finder — DubaiNest" },
      { name: "description", content: "Describe your ideal Dubai home in plain words; we turn it into filters and show matching listings." },
      { property: "og:title", content: "AI Property Finder — DubaiNest" },
      { property: "og:description", content: "Describe your ideal Dubai home and get matching listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQuery),
  component: Chat,
});

type Result = { filters: FinderFilters; relaxed: string[]; source: "ai" | "parser" };
type Msg = { role: "user" | "assistant"; content: string; result?: Result };
const CHIPS = [
  "1-bedroom apartment in Dubai Marina under AED 90,000 per year",
  "Family villa to buy under 6M",
  "Studio for rent in JVC",
  "Largest apartment to buy in Downtown",
];

const LABEL: Record<keyof FinderFilters, (v: never) => string> = {
  purpose: (v: string) => (v === "rent" ? "Rent" : "Buy"),
  community: (v: string) => v,
  type: (v: string) => v,
  minBeds: (v: number) => (v === 0 ? "Studio+" : `${v}+ beds`),
  minPrice: (v: number) => `From ${formatAED(v)}`,
  maxPrice: (v: number) => `Up to ${formatAED(v)}`,
  minArea: (v: number) => `${v.toLocaleString("en-US")}+ sqft`,
  sort: (v: string) => `Sort: ${v}`,
};

function ResultBlock({ r, all, values, onChange }: { r: Result; all: Listing[]; values: Record<string, ValueAssessment>; onChange: (f: FinderFilters) => void }) {
  const found = useMemo(() => rankListings(filterListings(all, r.filters), r.filters.sort ?? "value", values), [all, r.filters, values]);
  const keys = (Object.keys(r.filters) as (keyof FinderFilters)[]).filter((k) => r.filters[k] != null);
  return (
    <div className="space-y-3">
      <div className="glass space-y-2 rounded-xl p-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Filters {r.source === "ai" ? "understood by AI" : "from rule-based parser (AI unavailable)"} — tap × to remove
        </p>
        <div className="flex flex-wrap gap-2">
          {keys.length === 0 && <span className="text-sm text-muted-foreground">No filters recognised.</span>}
          {keys.map((k) => (
            <button key={k} onClick={() => { const { [k]: _, ...rest } = r.filters; onChange(rest); }} className="bg-secondary flex h-9 items-center gap-1 rounded-full px-3 text-sm">
              {LABEL[k](r.filters[k] as never)} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          {!r.filters.purpose && (["rent", "sale"] as const).map((p) => (
            <button key={p} onClick={() => onChange({ ...r.filters, purpose: p })} className="flex h-9 items-center rounded-full border border-dashed border-primary px-3 text-sm text-accent-foreground">
              + {p === "rent" ? "Rent" : "Buy"}
            </button>
          ))}
        </div>
        {!r.filters.purpose && <p className="text-xs text-muted-foreground">Rent or buy wasn't specified — showing both.</p>}
        {r.relaxed.length > 0 && <p className="text-xs text-muted-foreground">No exact match, so the {r.relaxed.join(" and ")} filter was removed.</p>}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{found.length} matching sample listings</span>
          <Link to="/" search={fromFilters(r.filters)} className="flex items-center gap-1 text-accent-foreground hover:underline">Edit in Explore <ExternalLink className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
      {found.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing matches. Try removing the community, budget or bedrooms filter above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {found.slice(0, 6).map((l, i) => <PropertyCard key={l.id} l={l} rank={i + 1} value={values[l.id]} compact />)}
        </div>
      )}
    </div>
  );
}

function Chat() {
  const { data } = useSuspenseQuery(listingsQuery);
  const values = useMemo(() => assessAll(data.data), [data.data]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, busy]);
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await chatFind({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, { role: "assistant", content: res.reply, result: { filters: res.filters, relaxed: res.relaxed, source: res.source } }]);
    } catch (e) {
      console.error("chatFind failed", e);
      setMsgs([...next, { role: "assistant", content: "Couldn't reach the server — check your connection and try again." }]);
    } finally { setBusy(false); }
  }

  const update = (i: number, f: FinderFilters) =>
    setMsgs((m) => m.map((x, j) => (j === i && x.result ? { ...x, result: { ...x.result, filters: f, relaxed: [] } } : x)));

  return (
    <div className="flex h-dvh flex-col">
      <AppNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
          {msgs.length === 0 && (
            <div className="fade-up py-10 text-center">
              <div className="bg-gold mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"><Building2 className="h-7 w-7" /></div>
              <h1 className="mt-6 font-display text-3xl font-semibold sm:text-5xl">Describe the <span className="text-gold">home</span> you want</h1>
              <p className="mt-3 text-sm text-muted-foreground">AI turns your words into search filters you can edit, then shows matches from the same sample listings as Explore.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {CHIPS.map((c) => <button key={c} onClick={() => send(c)} className="glass min-h-10 rounded-full px-4 py-2 text-sm transition-colors hover:text-accent-foreground">{c}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="flex justify-end"><div className="bg-gold max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 text-sm">{m.content}</div></div>
          ) : (
            <div key={i} className="fade-up space-y-3">
              <div className="max-w-none text-sm leading-relaxed [&_p]:mb-2"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              {m.result && <ResultBlock r={m.result} all={data.data} values={values} onChange={(f) => update(i, f)} />}
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching listings…</div>}
          <div ref={endRef} />
        </div>
      </div>
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass mx-3 my-3 flex max-w-4xl items-end gap-2 rounded-2xl p-2 sm:mx-auto sm:my-4">
          <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="e.g. 2-bed apartment to rent in JLT under 110k" className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="bg-gold flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
        </form>
      </div>
    </div>
  );
}
