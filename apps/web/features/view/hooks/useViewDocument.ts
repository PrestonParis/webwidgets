'use client';

import { useQuery } from '@tanstack/react-query';
import type { ViewFileRef } from '@/features/view/schemas/viewSchemas';
import type { NormalizedViewDocument } from '@/features/view/schemas/viewSchemas';

async function parseFile(file: ViewFileRef): Promise<NormalizedViewDocument> {
    const response = await fetch('/api/view/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file }),
    });
    if (!response.ok) throw new Error('Failed to parse file');
    return (await response.json()) as NormalizedViewDocument;
}

export function useViewDocument(file: ViewFileRef | null) {
    return useQuery({
        queryKey: ['view-document', file?.id],
        queryFn: () => parseFile(file!),
        enabled: !!file,
        staleTime: 60_000,
    });
}
