'use client';

import dynamic from 'next/dynamic';
import { PageLoading } from '@/features/ui/loading';

const ViewPage = dynamic(
    () =>
        import('@/features/view/components/ViewPage').then(
            (module) => module.ViewPage,
        ),
    {
        ssr: false,
        loading: () => <PageLoading message="Loading viewer" />,
    },
);

export function ViewClient() {
    return <ViewPage />;
}
