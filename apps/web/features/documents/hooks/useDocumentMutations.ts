'use client';

import { useCallback } from 'react';

interface CreateDocumentInput {
    title?: string;
    content?: string;
    format?: 'markdown' | 'plain_text' | 'rich_text' | 'json';
    sourceFileId?: string;
    tags?: string[];
}

interface UpdateDocumentInput {
    title?: string;
    content?: string;
    format?: 'markdown' | 'plain_text' | 'rich_text' | 'json';
    tags?: string[];
    metadata?: Record<string, unknown>;
}

export function useDocumentMutations(onSuccess?: () => void) {
    const createDocument = useCallback(
        async (data: CreateDocumentInput) => {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create document');
            const json = (await res.json()) as { data: unknown };
            onSuccess?.();
            return json.data;
        },
        [onSuccess],
    );

    const updateDocument = useCallback(
        async (id: string, data: UpdateDocumentInput) => {
            const res = await fetch(`/api/documents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update document');
            const json = (await res.json()) as { data: unknown };
            onSuccess?.();
            return json.data;
        },
        [onSuccess],
    );

    const archiveDocument = useCallback(
        async (id: string) => {
            const res = await fetch(`/api/documents/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 204)
                throw new Error('Failed to archive document');
            onSuccess?.();
        },
        [onSuccess],
    );

    return { createDocument, updateDocument, archiveDocument };
}
