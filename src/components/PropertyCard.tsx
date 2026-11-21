import { Bath, BedDouble, ExternalLink, Ruler } from "lucide-react";
import { formatAED, type Listing } from "@/lib/listings";

export function PropertyCard({ l, rank, median, compact }: { l: Listing; rank?: number | undefined; median?: number | undefined; compact?: boolean }) {
  const score = median ? Math.max(0, Math.min(100, 50 + ((median - l.pricePerSqft) / median) * 100)) : null;
  return (
    <article className="glass fade-up group overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className={`relative overflow-hidden ${compact ? "h-32" : "h-48"}`}>
        <img src={l.photo} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {rank != null && <span className="bg-gold absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold">#{rank}</span>}
        <span className="glass absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium uppercase">{l.purpose === "rent" ? "Rent" : "Sale"}</span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{l.community} · {l.type}</p>
          <h3 className="line-clamp-1 font-semibold">{l.title}</h3>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-gold font-display text-2xl font-bold">
            {formatAED(l.price)}
            {l.purpose === "rent" && <span className="text-sm font-normal text-muted-foreground"> /yr</span>}
          </p>
          <p className="text-xs text-muted-foreground">{l.pricePerSqft.toLocaleString()} AED/sqft</p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{l.beds === 0 ? "Studio" : l.beds}</span>
          <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{l.baths}</span>
          <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{l.area.toLocaleString()} sqft</span>
        </div>
        {score != null && !compact && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Value vs {l.community} median</span><span>{Math.round(score)}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="bg-gold h-full rounded-full" style={{ width: `${score}%` }} />
            </div>
          </div>
        )}
        <a href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-accent-foreground hover:underline">
          {l.agency} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}
