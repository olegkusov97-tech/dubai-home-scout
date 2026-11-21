import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, Heart, MapPin, Ruler } from "lucide-react";
import { formatAED, type Listing, type ValueAssessment } from "@/lib/listings";
import type { ExploreSearch } from "@/lib/search";
import { useFavorites } from "@/hooks/use-favorites";
import { ValueIndicator } from "@/components/ValueIndicator";

export function PropertyCard({ l, rank, value, from, compact }: {
  l: Listing; rank?: number | undefined; value?: ValueAssessment | undefined; from?: ExploreSearch | undefined; compact?: boolean;
}) {
  const fav = useFavorites();
  const saved = fav.has(l.id);
  return (
    <article className="glass fade-up group relative overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow">
      <Link to="/property/$id" params={{ id: l.id }} search={from ?? {}} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className={`relative overflow-hidden ${compact ? "h-36" : "h-48"}`}>
          <img src={l.photo} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {rank != null && <span className="bg-gold absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold">#{rank}</span>}
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-gold font-display text-2xl font-bold leading-none">
              {formatAED(l.price)}
              {l.purpose === "rent" && <span className="font-sans text-sm font-normal text-muted-foreground"> /yr</span>}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{l.community} · {l.type}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1"><BedDouble className="h-4 w-4 text-muted-foreground" />{l.beds === 0 ? "Studio" : `${l.beds} bd`}</span>
            <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-muted-foreground" />{l.baths} ba</span>
            <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-muted-foreground" />{l.area.toLocaleString("en-US")} sqft</span>
            <span className="text-muted-foreground">{l.pricePerSqft.toLocaleString("en-US")} AED/sqft</span>
          </div>
          <ValueIndicator v={value} />
          <span className="block text-sm font-medium text-accent-foreground group-hover:underline">View details →</span>
        </div>
      </Link>
      <button type="button" onClick={() => fav.toggle(l.id)} aria-label={saved ? "Remove from favorites" : "Save to favorites"} aria-pressed={saved}
        className="glass absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full">
        <Heart className={`h-5 w-5 ${saved ? "fill-primary text-primary" : ""}`} />
      </button>
    </article>
  );
}
