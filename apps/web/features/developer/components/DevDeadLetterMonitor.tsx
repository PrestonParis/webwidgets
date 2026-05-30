'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db/supabase';
import { RefreshCw, Trash2, RotateCcw } from 'lucide-react';

interface DeadLetterRow {
    id: string;
    user_id: string;
    message_id: string;
    stage: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function DevDeadLetterMonitor() {
    const [rows, setRows] = useState<DeadLetterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        const { data } = await db
            .from('email_queue')
            .select('*')
            .eq('stage', 'dead-letter')
            .order('updated_at', { ascending: false })
            .limit(100);
        setRows((data as DeadLetterRow[]) ?? []);
        setLoading(false);
    }

    useEffect(() => {
        void load();
    }, []);

    async function retry(row: DeadLetterRow) {
        setRetrying(row.id);
        await db
            .from('email_queue')
            .update({
                status: 'pending',
                stage: 'ingest',
                attempts: 0,
                last_error: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', row.id);
        await load();
        setRetrying(null);
    }

    async function dismiss(id: string) {
        await db.from('email_queue').update({ status: 'done' }).eq('id', id);
        setRows((prev) => prev.filter((r) => r.id !== id));
    }

    return (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                <div>
                    <h3 className="text-sm font-semibold">Dead-Letter Queue</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        Email queue items that failed after 3 attempts
                    </p>
                </div>
                <button
                    onClick={() => void load()}
                    disabled={loading}
                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw
                        size={14}
                        className={loading ? 'animate-spin' : ''}
                    />
                </button>
            </div>

            {loading ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    Loading…
                </div>
            ) : rows.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    No dead-letter items. Queue is healthy ✓
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {rows.map((row) => (
                        <div
                            key={row.id}
                            className="px-4 py-3 flex items-start gap-3"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono font-medium text-gray-800 dark:text-zinc-200 truncate">
                                        {row.message_id}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold shrink-0">
                                        {row.stage}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {row.attempts} attempts
                                    </span>
                                </div>
                                {row.last_error && (
                                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate">
                                        {row.last_error}
                                    </p>
                                )}
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                    Last tried {formatDate(row.updated_at)} ·
                                    created {formatDate(row.created_at)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => void retry(row)}
                                    disabled={retrying === row.id}
                                    title="Retry: resets to pending/ingest"
                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw size={13} />
                                </button>
                                <button
                                    onClick={() => void dismiss(row.id)}
                                    title="Dismiss (mark done)"
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rows.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        {rows.length} items
                    </span>
                    <button
                        onClick={() =>
                            void Promise.all(rows.map((r) => dismiss(r.id)))
                        }
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                        Dismiss all
                    </button>
                </div>
            )}
        </div>
    );
}
