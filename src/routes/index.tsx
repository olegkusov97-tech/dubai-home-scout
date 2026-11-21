import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatAED } from "@/lib/listings";
import { AppNav } from "@/components/AppNav";
import { PropertyCard } from "@/components/PropertyCard";
import { getListings } from "@/lib/listings.functions";
import { filterListings, rankListings, type SortKey } from "@/lib/listings";

const HERO = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=75";
const listingsQuery = queryOptions({ queryKey: ["listings"], queryFn: () => getListings() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DubaiNest — Rank Dubai properties by price & area" },
      { name: "description", content: "Explore Dubai listings ranked by price, area and best value per square foot." },
      { property: "og:title", content: "DubaiNest — Rank Dubai properties" },
      { property: "og:description", content: "Explore Dubai listings ranked by price, area and best value." },
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
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "area-desc", label: "Largest" },
  { key: "area-asc", label: "Smallest" },
];

const sel = "glass h-11 rounded-xl px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

function Explorer() {
  const { data } = useSuspenseQuery(listingsQuery);
  const all = data.data;
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState<"" | "rent" | "sale">("");
  const [type, setType] = useState("");
  const [community, setCommunity] = useState("");
  const [beds, setBeds] = useState("");
  const [price, setPrice] = useState<[number, number] | null>(null);
  const [minArea, setMinArea] = useState("");
  const [sort, setSort] = useState<SortKey>("value");

  const communities = useMemo(() => [...new Set(all.map((l) => l.community))].sort(), [all]);
  const medians = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of communities) {
      const v = all.filter((l) => l.community === c).map((l) => l.pricePerSqft).sort((a, b) => a - b);
      m[c] = v[Math.floor(v.length / 2)] ?? 0;
    }
    return m;
  }, [all, communities]);

  const bounds = useMemo(() => {
    const p = all.filter((l) => !purpose || l.purpose === purpose).map((l) => l.price);
    const step = purpose === "rent" ? 5000 : 50000;
    return { min: Math.floor(Math.min(...p) / step) * step, max: Math.ceil(Math.max(...p) / step) * step, step };
  }, [all, purpose]);
  const range = price ?? [bounds.min, bounds.max];

  const results = useMemo(() => {
    let r = filterListings(all, {
      ...(purpose && { purpose }),
      ...(type && { type }),
      ...(community && { community }),
      ...(beds && { minBeds: Number(beds) }),
      ...(price && { minPrice: price[0], maxPrice: price[1] }),
      ...(minArea && { minArea: Number(minArea) }),
    });
    if (q) r = r.filter((l) => `${l.title} ${l.community}`.toLowerCase().includes(q.toLowerCase()));
    return rankListings(r, sort);
  }, [all, purpose, type, community, beds, price, minArea, q, sort]);

  const activeCount = [purpose, type, community, beds, minArea, price].filter(Boolean).length;
  const filters = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <select className={sel} value={purpose} onChange={(e) => { setPurpose(e.target.value as "" | "rent" | "sale"); setPrice(null); }}>
          <option value="">Rent & sale</option><option value="rent">Rent</option><option value="sale">Sale</option>
        </select>
        <select className={sel} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Any type</option><option>Apartment</option><option>Villa</option><option>Townhouse</option>
        </select>
        <select className={sel} value={community} onChange={(e) => setCommunity(e.target.value)}>
          <option value="">All communities</option>
          {communities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={sel} value={beds} onChange={(e) => setBeds(e.target.value)}>
          <option value="">Any beds</option>{[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+ beds</option>)}
        </select>
        <input className={`${sel} col-span-2 md:col-span-1`} type="number" inputMode="numeric" placeholder="Min area sqft" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
      </div>
      <div className="glass rounded-xl px-4 py-3">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price{purpose === "rent" ? " / yr" : ""}</span>
          <span className="font-medium">{formatAED(range[0])} – {formatAED(range[1])}</span>
        </div>
        <Slider aria-label="Price range" min={bounds.min} max={bounds.max} step={bounds.step} value={range}
          onValueChange={(v) => setPrice([v[0] ?? bounds.min, v[1] ?? bounds.max])} className="py-2" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <AppNav />
      <section className="relative overflow-hidden">
        <img src={HERO} alt="Dubai skyline" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:pb-14 sm:pt-28">
          <h1 className="fade-up font-display text-4xl font-semibold leading-tight sm:text-7xl">
            Find your place <br />in <span className="text-gold">Dubai</span>
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            {all.length} listings ranked by price, size and value per square foot.
            {!data.live && " Showing sample listings."}
          </p>
          <div className="glass mt-8 flex max-w-2xl items-center gap-2 rounded-2xl p-2">
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search community or property…" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <Link to="/chat" className="bg-gold flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Ask AI</span>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="hidden md:block">{filters}</div>
        <Sheet>
          <SheetTrigger asChild>
            <button className="glass flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium md:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && <span className="bg-gold rounded-full px-2 text-xs">{activeCount}</span>}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="mt-4 pb-6">{filters}</div>
          </SheetContent>
        </Sheet>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground"><span>Rank by</span><span>{results.length} results</span></div>
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {SORTS.map((s) => (
            <button key={s.key} onClick={() => setSort(s.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${sort === s.key ? "bg-gold shadow-glow" : "glass text-muted-foreground hover:text-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((l, i) => <PropertyCard key={l.id} l={l} rank={i + 1} median={medians[l.community]} />)}
        </div>
        {results.length === 0 && <p className="py-20 text-center text-muted-foreground">No listings match these filters.</p>}
      </main>
    </div>
  );
}
