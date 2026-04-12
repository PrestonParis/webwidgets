"use client"

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export interface JournalEntry {
    id: string; // Changed from number to string for UUID/Google ID compatibility
    title: string;
    content: string;
    created_at: string;
}

function tiptapToPreviewText(html: string) {
    if (!html) return "";

    return html
    .replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, (_, t) => `\n${t.toUpperCase()}\n`)
    .replace(/<li>(.*?)<\/li>/g, "• $1\n")
    .replace(/<\/p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export default function JournalWidget() {
    const { data: session } = useSession();
    const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);
    const [count, setCount] = useState(0);

    const loadJournalData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const { data, error, count: totalCount } = await supabase
                .from('journals')
                .select('*', { count: 'exact' })
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setLatestEntry(data[0] || null);
                setCount(totalCount || data.length);
            }
        } catch (error) {
            console.error("Journal Widget fetch failed:", error);
        }
    }, [session]);

    useEffect(() => {
        loadJournalData();
    }, [loadJournalData]);

    return (
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Journal
                </h3>
                <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {count} Total
                </div>
            </div>

            <div className="grow">
                {latestEntry ? (
                    <div className="space-y-2">
                        <p className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                            LAST ENTRY • {new Date(latestEntry.created_at).toLocaleDateString()}
                        </p>
                        <h4 className="font-bold text-gray-900 dark:text-zinc-100 line-clamp-1">
                            {latestEntry.title}
                        </h4>
                        <p className="text-gray-500 dark:text-zinc-400 text-xs italic line-clamp-3 border-l-2 border-gray-100 dark:border-zinc-800 pl-3">
                            {tiptapToPreviewText(latestEntry.content)}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-4">
                        <p className="text-gray-400 dark:text-zinc-500 text-sm italic text-center">
                            No entries yet...
                        </p>
                    </div>
                )}
            </div>

            <Link 
                href="/journal" 
                className="mt-6 block text-center py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition-all active:scale-[0.98]"
            >
                + New Entry
            </Link>
        </div>
    );
}