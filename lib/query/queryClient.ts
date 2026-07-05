import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton QueryClient with application-wide default stale/gc times.
 *
 * Individual queries override these defaults where appropriate
 * (see queryKeys.ts for per-query stale times).
 *
 * gcTime (formerly cacheTime): how long inactive query data stays in memory.
 * staleTime: how long data is considered fresh before a background refetch.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Conservative global defaults — individual queries set their own staleTime.
        staleTime: 60 * 1000,          // 1 minute
        gcTime: 5 * 60 * 1000,         // 5 minutes
        retry: 1,                       // retry once on Firestore network errors
        refetchOnWindowFocus: false,    // admin app — don't refetch on tab switch
      },
    },
  });
}

// Browser-side singleton — shared across the entire admin app.
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new client (no singleton on server).
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
