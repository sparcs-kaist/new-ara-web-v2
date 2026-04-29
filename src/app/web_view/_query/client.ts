import { QueryClient } from '@tanstack/react-query';

/**
 * WebView-only QueryClient. Kept separate from `src/lib/queryClient.ts`
 * so caching / refetch policy tuned for the embedded shell can't leak
 * into the desktop site.
 *
 * Tuning rationale (matches Flutter's "feels native" defaults):
 *   - `staleTime: 30_000`  — back-nav inside the WebView serves the
 *     last response instantly; revalidation runs in the background.
 *   - `gcTime: 5 * 60_000` — kept long enough that bouncing across
 *     four tabs doesn't drop everything.
 *   - `refetchOnWindowFocus: false` — a Flutter app doesn't refetch
 *     every time you tab back to it; the WebView shouldn't either.
 *   - `refetchOnReconnect: true` — when the bridge reports the network
 *     came back, re-pull silently.
 *   - `retry: 1` — single retry; anything beyond that should surface
 *     as an in-page error rather than spinning forever.
 */
export function createWebViewQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                retry: 1,
            },
            mutations: {
                retry: 0,
            },
        },
    });
}
