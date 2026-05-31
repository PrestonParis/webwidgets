'use client';

import { useCallback } from 'react';
import type { ArtifactType } from '@/features/artifacts/types/artifact';

interface CreateArtifactInput {
    type?: ArtifactType;
    title?: string;
    content?: string;
    contentFormat?: 'markdown' | 'json' | 'plain_text';
    sourceFileId?: string;
    sourceDocumentId?: string;
    sourceJobId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface UpdateArtifactInput {
    title?: string;
    content?: string;
    contentFormat?: 'markdown' | 'json' | 'plain_text';
    tags?: string[];
    metadata?: Record<string, unknown>;
}

export function useArtifactMutations(onSuccess?: () => void) {
    const createArtifact = useCallback(
        async (data: CreateArtifactInput) => {
            const res = await fetch('/api/artifacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create artifact');
            const json = (await res.json()) as { data: unknown };
            onSuccess?.();
            return json.data;
        },
        [onSuccess],
    );

    const updateArtifact = useCallback(
        async (id: string, data: UpdateArtifactInput) => {
            const res = await fetch(`/api/artifacts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update artifact');
            const json = (await res.json()) as { data: unknown };
            onSuccess?.();
            return json.data;
        },
        [onSuccess],
    );

    const archiveArtifact = useCallback(
        async (id: string) => {
            const res = await fetch(`/api/artifacts/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 204)
                throw new Error('Failed to archive artifact');
            onSuccess?.();
        },
        [onSuccess],
    );

    return { createArtifact, updateArtifact, archiveArtifact };
}
