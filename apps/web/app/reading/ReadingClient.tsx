'use client';

import dynamic from 'next/dynamic';
import { PageLoading } from '@/features/ui/loading';

const ReadingPage = dynamic(
    () =>
        import('@/features/reading/components/ReadingPage').then(
            (module) => module.ReadingPage,
        ),
    {
        ssr: false,
        loading: () => <PageLoading message="Loading reading workspace" />,
    },
);

export function ReadingClient() {
    return <ReadingPage />;
}
