import { QueryClient } from '@tanstack/react-query';

/**
 * WebView-only QueryClient. Kept separate from `src/lib/queryClient.ts`
 * so caching / refetch policy tuned for the embedded shell can't leak
 * into the desktop site.
 *
 * Tuning rationale (matches Flutter's "feels native" defaults):
 *   - `staleTime: 2 * 60_000` — back-nav inside the WebView serves the
 *     last response instantly; queries don't refetch until 2 minutes
 *     have passed (Flutter pages didn't refresh every time the user
 *     popped back; pull-to-refresh covers the explicit case).
 *   - `gcTime: 30 * 60_000` — survive long tab swaps and screen-off /
 *     resume cycles. Most webview lists are tiny JSON, RAM cost is
 *     negligible compared to the perceived snappiness.
 *   - `refetchOnMount: false` — even if a query is stale, don't refetch
 *     on remount (the back-nav flicker the user complained about).
 *     Pull-to-refresh and explicit invalidation cover the real cases.
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
                staleTime: 2 * 60_000,
                gcTime: 30 * 60_000,
                refetchOnMount: false,
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
