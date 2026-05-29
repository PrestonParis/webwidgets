'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { useWorkspaceComments } from '../hooks/useWorkspaceComments';

function formatTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

interface CommentsPanelProps {
    workspaceId: string;
    handoffId: string | null;
    currentUserId: string;
}

export function CommentsPanel({
    workspaceId,
    handoffId,
    currentUserId,
}: CommentsPanelProps) {
    const toast = useToastContext();
    const { comments, loading, addComment, deleteComment } =
        useWorkspaceComments(workspaceId, handoffId);
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) return;
        setSubmitting(true);
        try {
            await addComment(body.trim());
            setBody('');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to post comment.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(commentId: string) {
        setDeletingId(commentId);
        try {
            await deleteComment(commentId);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete comment.',
            );
        } finally {
            setDeletingId(null);
        }
    }

    if (!handoffId) {
        return (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
                Select a handoff to view and add comments.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Comments
            </h3>

            {loading ? (
                <div className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Loading comments…
                </div>
            ) : (
                <ul className="max-h-[280px] space-y-3 overflow-y-auto">
                    {comments.length === 0 ? (
                        <li className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
                            No comments yet. Be the first to comment.
                        </li>
                    ) : (
                        comments.map((comment) => {
                            const isMine = comment.author_id === currentUserId;
                            const isDeleting = deletingId === comment.id;
                            return (
                                <li
                                    key={comment.id}
                                    className="flex items-start gap-3"
                                >
                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold uppercase text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                        {comment.author_id
                                            .slice(0, 1)
                                            .toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {formatTime(comment.created_at)}
                                                {comment.edited && (
                                                    <span className="ml-1 italic text-zinc-400">
                                                        (edited)
                                                    </span>
                                                )}
                                            </span>
                                            {isMine && (
                                                <button
                                                    type="button"
                                                    disabled={isDeleting}
                                                    onClick={() =>
                                                        void handleDelete(
                                                            comment.id,
                                                        )
                                                    }
                                                    aria-label="Delete comment"
                                                    className="rounded p-0.5 text-zinc-400 transition hover:text-rose-500 disabled:opacity-50"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                                            {comment.body}
                                        </p>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Add a comment…"
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            void handleSubmit(e as unknown as React.FormEvent);
                        }
                    }}
                    className="flex-1 resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <Button
                    type="submit"
                    size="sm"
                    loading={submitting}
                    disabled={!body.trim()}
                >
                    Post
                </Button>
            </form>
        </div>
    );
}
