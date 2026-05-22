'use client';

import dynamic from 'next/dynamic';
import { PageLoading } from '@/features/ui/loading';

const ReadingWorkspacePage = dynamic(
    () =>
        import('@/features/reading/components/ReadingWorkspacePage').then(
            (module) => module.ReadingWorkspacePage,
        ),
    {
        ssr: false,
        loading: () => <PageLoading message="Loading reading workspace" />,
    },
);

export function ReadingClient() {
    return <ReadingWorkspacePage />;
}
