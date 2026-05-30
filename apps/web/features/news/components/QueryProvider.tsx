'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

export function NewsQueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 0,
                        staleTime: 30_000,
                        gcTime: 5 * 60_000,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            }),
    );
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}
