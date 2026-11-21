import { queryOptions } from "@tanstack/react-query";
import { getListings } from "./listings.functions";

export const listingsQuery = queryOptions({ queryKey: ["listings"], queryFn: () => getListings(), staleTime: 5 * 60_000 });
