'use client';

import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createWebViewQueryClient } from './client';

/**
 * Provider for the WebView-scoped QueryClient. Created once per mount
 * (lazy `useState` so SSR/hydration share the same instance per render).
 * The desktop site keeps using `src/lib/queryClient.ts` — the two trees
 * never share cache.
 */
export function WebViewQueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(() => createWebViewQueryClient());
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
