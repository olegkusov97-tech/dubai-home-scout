import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { AppNav } from "@/components/AppNav";
import { PropertyCard } from "@/components/PropertyCard";
import { useFavorites } from "@/hooks/use-favorites";
import { listingsQuery } from "@/lib/listings-query";
import { assessAll } from "@/lib/listings";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Saved properties — DubaiNest" },
      { name: "description", content: "Your saved Dubai rentals and homes for sale." },
      { property: "og:title", content: "Saved properties — DubaiNest" },
      { property: "og:description", content: "Your shortlist of Dubai properties." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQuery),
  component: Favorites,
});

function Favorites() {
  const { data } = useSuspenseQuery(listingsQuery);
  const { ids } = useFavorites();
  const values = useMemo(() => assessAll(data.data), [data.data]);
  const list = data.data.filter((l) => ids.includes(l.id));
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-4xl font-semibold">Saved <span className="text-gold">properties</span></h1>
        <p className="mt-2 text-sm text-muted-foreground">Stored on this device.</p>
        {list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No saved properties yet — tap the heart on any listing.</p>
            <Link to="/" className="bg-gold mt-5 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold">Explore listings</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((l) => <PropertyCard key={l.id} l={l} value={values[l.id]} />)}</div>
        )}
      </main>
    </div>
  );
}
