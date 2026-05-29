'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CommentRecord } from '../types/collaboration';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export function useWorkspaceComments(
    workspaceId: string,
    handoffId: string | null,
) {
    const [comments, setComments] = useState<CommentRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const baseUrl = `/api/collaboration/workspaces/${workspaceId}/comments`;
    const commentsUrl = handoffId
        ? `${baseUrl}?handoff_id=${handoffId}`
        : baseUrl;

    const fetchComments = useCallback(async () => {
        if (!workspaceId) {
            setComments([]);
            return;
        }
        setLoading(true);
        try {
            const data = await cachedJson<CommentRecord[]>(commentsUrl, {
                ttlMs: 10_000,
            });
            setComments(Array.isArray(data) ? data : []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [workspaceId, commentsUrl]);

    useEffect(() => {
        void fetchComments();
    }, [fetchComments]);

    const addComment = useCallback(
        async (body: string): Promise<void> => {
            const res = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body,
                    ...(handoffId ? { handoff_id: handoffId } : {}),
                }),
            });
            if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as {
                    error?: string;
                };
                throw new Error(err.error ?? 'Failed to add comment');
            }
            clearCachedJson(commentsUrl);
            const comment = (await res.json()) as CommentRecord;
            setComments((prev) => [...prev, comment]);
        },
        [baseUrl, commentsUrl, handoffId],
    );

    const deleteComment = useCallback(
        async (commentId: string): Promise<void> => {
            const res = await fetch(`${baseUrl}/${commentId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete comment');
            clearCachedJson(commentsUrl);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
        },
        [baseUrl, commentsUrl],
    );

    const refresh = useCallback(() => {
        clearCachedJson(commentsUrl);
        void fetchComments();
    }, [fetchComments, commentsUrl]);

    return { comments, loading, addComment, deleteComment, refresh };
}
