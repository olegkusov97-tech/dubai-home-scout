import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Bath, BedDouble, Heart, MapPin, Ruler } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { BestValueExplainer, ValueIndicator } from "@/components/ValueIndicator";
import { ContactAgentDialog } from "@/components/ContactAgentDialog";
import { useFavorites } from "@/hooks/use-favorites";
import { listingsQuery } from "@/lib/listings-query";
import { assessValue, formatAED } from "@/lib/listings";
import { parseExploreSearch } from "@/lib/search";

export const Route = createFileRoute("/property/$id")({
  validateSearch: parseExploreSearch,
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(listingsQuery);
    const l = d.data.find((x) => x.id === params.id);
    if (!l) throw notFound();
    return { title: l.title, photo: l.photo, price: formatAED(l.price) };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.title} — DubaiNest` },
      { name: "description", content: `${loaderData.title}, ${loaderData.price}. See how it compares with similar listings.` },
      { property: "og:title", content: `${loaderData.title} — DubaiNest` },
      { property: "og:description", content: `${loaderData.price} · compared with similar Dubai listings.` },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: loaderData.photo },
      { name: "twitter:image", content: loaderData.photo },
    ] : [{ title: "Property not found — DubaiNest" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen"><AppNav />
      <div className="py-24 text-center"><p className="font-display text-3xl">Listing not found</p>
        <Link to="/" className="bg-gold mt-6 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold">Back to search</Link></div>
    </div>
  ),
  component: PropertyPage,
});

function PropertyPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(listingsQuery);
  const l = data.data.find((x) => x.id === id)!;
  const value = useMemo(() => assessValue(l, data.data), [l, data.data]);
  const [img, setImg] = useState(0);
  const fav = useFavorites();
  const saved = fav.has(l.id);

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/" search={search} className="inline-flex h-10 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to search results
        </Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-2xl"><img src={l.photos[img] ?? l.photo} alt={l.title} className="aspect-[4/3] w-full object-cover" /></div>
            {l.photos.length > 1 && (
              <div className="mt-3 flex gap-2">
                {l.photos.map((p, i) => (
                  <button key={p + i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} className={`overflow-hidden rounded-xl ring-2 ${i === img ? "ring-primary" : "ring-transparent"}`}>
                    <img src={p} alt="" className="h-16 w-24 object-cover sm:h-20 sm:w-28" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-5">
            <div>
              <span className="glass rounded-full px-3 py-1 text-xs font-medium uppercase">{l.purpose === "rent" ? "For rent" : "For sale"} · Sample listing</span>
              <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{l.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{l.community}, Dubai</p>
            </div>
            <p className="text-gold font-display text-4xl font-bold">{formatAED(l.price)}{l.purpose === "rent" && <span className="font-sans text-base font-normal text-muted-foreground"> /year</span>}</p>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[[BedDouble, l.beds === 0 ? "Studio" : `${l.beds} beds`], [Bath, `${l.baths} baths`], [Ruler, `${l.area.toLocaleString("en-US")} sqft`], [null, `${l.pricePerSqft.toLocaleString("en-US")} AED/sqft`]].map(([Icon, t], i) => (
                <div key={i} className="glass flex items-center gap-2 rounded-xl px-3 py-2.5">{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}{t as string}</div>
              ))}
            </div>
            <div className="glass space-y-3 rounded-2xl p-4">
              <div className="flex items-center justify-between"><p className="font-semibold">Best value assessment</p><BestValueExplainer /></div>
              <ValueIndicator v={value} detailed />
              {value.status === "ok" && (
                <p className="text-xs text-muted-foreground">This listing costs {formatAED(l.price / l.area)}/sqft vs a median of {formatAED(value.medianPpsf)}/sqft for {value.comparables} similar {l.purpose === "rent" ? "rentals" : "sale listings"} ({l.beds === 0 ? "studio" : `${l.beds}-bed`} {l.type.toLowerCase()}s in {l.community}, similar size).</p>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{l.description}</p>
            <p className="text-sm">Listed by <span className="font-medium">{l.agency}</span></p>
            <div className="flex gap-3">
              <ContactAgentDialog l={l}><button className="bg-gold h-12 flex-1 rounded-xl text-sm font-semibold">Contact agent</button></ContactAgentDialog>
              <button onClick={() => fav.toggle(l.id)} aria-pressed={saved} className="glass flex h-12 items-center gap-2 rounded-xl px-4 text-sm">
                <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} /> {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
