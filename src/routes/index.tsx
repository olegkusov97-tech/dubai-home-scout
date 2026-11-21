import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AppNav } from "@/components/AppNav";
import { PropertyCard } from "@/components/PropertyCard";
import { BestValueExplainer } from "@/components/ValueIndicator";
import { listingsQuery } from "@/lib/listings-query";
import { assessAll, filterListings, formatAED, rankListings, type SortKey } from "@/lib/listings";
import { parseExploreSearch, toFilters, type ExploreSearch } from "@/lib/search";

const HERO = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=75";

export const Route = createFileRoute("/")({
  validateSearch: parseExploreSearch,
  head: () => ({
    meta: [
      { title: "DubaiNest — Rent or buy in Dubai, ranked by fair value" },
      { name: "description", content: "Search Dubai rentals and homes for sale, ranked against comparable listings by price per square foot." },
      { property: "og:title", content: "DubaiNest — Dubai properties ranked by fair value" },
      { property: "og:description", content: "Rent or buy in Dubai and see how each listing compares with similar homes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: HERO },
      { name: "twitter:image", content: HERO },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQuery),
  component: Explorer,
});

const SORTS: { key: SortKey; label: string }[] = [
  { key: "value", label: "Best value" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "area-desc", label: "Largest first" },
  { key: "area-asc", label: "Smallest first" },
];

const sel = "glass h-11 rounded-xl px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

function Explorer() {
  const { data } = useSuspenseQuery(listingsQuery);
  const all = data.data;
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const mode = search.mode ?? "rent";
  const sort = search.sort ?? "value";
  const set = (patch: { [K in keyof ExploreSearch]?: ExploreSearch[K] | undefined }) =>
    navigate({ search: (prev) => parseExploreSearch({ ...prev, ...patch }), replace: true, resetScroll: false });

  const values = useMemo(() => assessAll(all), [all]);
  const inMode = useMemo(() => all.filter((l) => l.purpose === mode), [all, mode]);
  const communities = useMemo(() => [...new Set(inMode.map((l) => l.community))].sort(), [inMode]);
  const types = useMemo(() => [...new Set(inMode.map((l) => l.type))].sort(), [inMode]);

  const bounds = useMemo(() => {
    const p = inMode.map((l) => l.price);
    const step = mode === "rent" ? 5000 : 50000;
    return { min: Math.floor(Math.min(...p) / step) * step, max: Math.ceil(Math.max(...p) / step) * step, step };
  }, [inMode, mode]);
  const range: [number, number] = [search.pmin ?? bounds.min, search.pmax ?? bounds.max];

  const results = useMemo(() => {
    let r = filterListings(all, toFilters(search));
    if (search.q) { const q = search.q.toLowerCase(); r = r.filter((l) => `${l.title} ${l.community}`.toLowerCase().includes(q)); }
    return rankListings(r, sort, values);
  }, [all, search, sort, values]);

  const activeCount = [search.type, search.community, search.beds, search.minArea, search.pmin ?? search.pmax, search.q].filter((v) => v != null && v !== "").length;
  const clear = () => navigate({ search: mode === "sale" ? { mode: "sale" } : {}, replace: true, resetScroll: false });

  const modeSwitch = (
    <div role="radiogroup" aria-label="Rent or buy" className="glass inline-flex rounded-xl p-1">
      {(["rent", "sale"] as const).map((m) => (
        <button key={m} role="radio" aria-checked={mode === m} onClick={() => set({ mode: m, pmin: undefined, pmax: undefined, type: undefined, community: undefined })}
          className={`h-10 min-w-24 rounded-lg px-5 text-sm font-semibold transition-all ${mode === m ? "bg-gold shadow-glow" : "text-muted-foreground hover:text-foreground"}`}>
          {m === "rent" ? "Rent" : "Buy"}
        </button>
      ))}
    </div>
  );

  const filters = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <select aria-label="Community" className={sel} value={search.community ?? ""} onChange={(e) => set({ community: e.target.value || undefined })}>
          <option value="">All communities</option>
          {communities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Property type" className={sel} value={search.type ?? ""} onChange={(e) => set({ type: e.target.value || undefined })}>
          <option value="">Any type</option>{types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select aria-label="Bedrooms" className={sel} value={search.beds ?? ""} onChange={(e) => set({ beds: e.target.value === "" ? undefined : Number(e.target.value) })}>
          <option value="">Any beds</option><option value="0">Studio+</option>{[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+ beds</option>)}
        </select>
        <input aria-label="Minimum floor area" className={sel} type="number" inputMode="numeric" min={0} placeholder="Min area (sqft)" value={search.minArea ?? ""}
          onChange={(e) => set({ minArea: e.target.value === "" ? undefined : Number(e.target.value) })} />
      </div>
      <div className="glass rounded-xl px-4 py-3">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{mode === "rent" ? "Annual rent (AED/yr)" : "Purchase price (AED)"}</span>
          <span className="font-medium">{formatAED(range[0])} – {formatAED(range[1])}</span>
        </div>
        <Slider aria-label="Price range" min={bounds.min} max={bounds.max} step={bounds.step} value={range}
          onValueChange={(v) => {
            const lo = v[0] ?? bounds.min, hi = v[1] ?? bounds.max;
            set({ pmin: lo <= bounds.min ? undefined : lo, pmax: hi >= bounds.max ? undefined : hi });
          }} className="py-2" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <AppNav />
      <section className="relative overflow-hidden">
        <img src={HERO} alt="Dubai skyline" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:pb-8 sm:pt-12">
          <h1 className="fade-up font-display text-3xl font-semibold leading-tight sm:text-5xl">
            Find a fairly priced home in <span className="text-gold">Dubai</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Every listing is compared with similar homes by price per sqft.
            {!data.live && " Prototype — showing sample listings, not real offers."}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {modeSwitch}
            <div className="glass flex flex-1 items-center gap-2 rounded-xl p-1.5 sm:max-w-xl">
              <input aria-label="Search" value={search.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Filter by community or title…"
                className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground" />
              <Link to="/chat" className="bg-gold flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold">
                <Sparkles className="h-4 w-4" /> AI Finder
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="hidden md:block">{filters}</div>
        <Sheet>
          <SheetTrigger asChild>
            <button className="glass flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium md:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && <span className="bg-gold rounded-full px-2 text-xs">{activeCount}</span>}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-3 pb-6">{filters}
              {activeCount > 0 && <button onClick={clear} className="glass h-11 w-full rounded-xl text-sm">Clear filters</button>}
            </div>
          </SheetContent>
        </Sheet>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">{results.length} {mode === "rent" ? "rentals" : "homes for sale"} match</span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && <button onClick={clear} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /> Clear filters</button>}
            <BestValueExplainer />
          </div>
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Sort by">
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => set({ sort: s.key })} aria-pressed={sort === s.key}
              className={`h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all ${sort === s.key ? "bg-gold shadow-glow" : "glass text-muted-foreground hover:text-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((l, i) => <PropertyCard key={l.id} l={l} rank={i + 1} value={values[l.id]} from={search} />)}
        </div>
        {results.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-2xl">No {mode === "rent" ? "rentals" : "homes for sale"} match these filters</p>
            <p className="mt-2 text-sm text-muted-foreground">Try widening the price range, lowering bedrooms or minimum area, or choosing another community.</p>
            <button onClick={clear} className="bg-gold mt-5 h-11 rounded-xl px-5 text-sm font-semibold">Clear filters</button>
          </div>
        )}
      </main>
    </div>
  );
}
