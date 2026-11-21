import { Info } from "lucide-react";
import { formatAED, type ValueAssessment } from "@/lib/listings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function valueText(v: ValueAssessment) {
  if (v.status !== "ok") return "Insufficient comparable data";
  const pct = Math.abs(Math.round(v.diffPct));
  if (v.label === "near") return `Near comparable median (${v.diffPct >= 0 ? "-" : "+"}${pct}%)`;
  return `${pct}% ${v.label === "below" ? "below" : "above"} comparable listings`;
}

export function BestValueExplainer({ children }: { children?: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            <Info className="h-3.5 w-3.5" /> How is this calculated?
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2 text-sm">
        <p className="font-semibold">How Best Value works</p>
        <p className="text-muted-foreground">We compare each listing with similar sample listings: same Rent/Buy type, community, property type and bedrooms, with floor area within ±35%.</p>
        <p className="rounded-lg bg-secondary p-2 font-mono text-xs">Difference % = (comparable median AED/sqft − listing AED/sqft) ÷ comparable median × 100</p>
        <p className="text-muted-foreground">Positive = cheaper per sqft than similar listings. Within ±5% counts as "near median". With fewer than 3 comparables we show "Insufficient comparable data" and rank the listing last.</p>
        <p className="text-xs text-muted-foreground">Based on sample listings only — not real Dubai market statistics.</p>
      </PopoverContent>
    </Popover>
  );
}

export function ValueIndicator({ v, detailed }: { v: ValueAssessment | undefined; detailed?: boolean }) {
  if (!v) return null;
  if (v.status !== "ok") {
    return <p className="text-xs text-muted-foreground">Insufficient comparable data{detailed ? ` — only ${v.comparables} similar listing${v.comparables === 1 ? "" : "s"} found.` : ""}</p>;
  }
  const tone = v.label === "below" ? "text-success" : v.label === "above" ? "text-destructive" : "text-muted-foreground";
  // Position on a -30%..+30% scale; left = more expensive, right = cheaper.
  const pos = Math.max(0, Math.min(100, 50 + (v.diffPct / 30) * 50));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={`font-semibold ${tone}`}>{valueText(v)}</span>
        <span className="text-muted-foreground">{v.comparables} comps</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-secondary" aria-hidden>
        <div className="absolute inset-y-0 left-1/2 w-px bg-muted-foreground/60" />
        <div className="bg-gold absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-glow" style={{ left: `${pos}%` }} />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>Above</span><span>Median</span><span>Below</span></div>
      {detailed && <p className="text-xs text-muted-foreground">Comparable median: {formatAED(v.medianPpsf)}/sqft across {v.comparables} similar listings.</p>}
    </div>
  );
}
