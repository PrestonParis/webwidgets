"use client"

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { JournalEntry } from "@/types/journal";
import { tiptapToPreviewText } from "@/app/lib/utils/tiptap";
import { BookText } from "lucide-react";

export default function JournalWidget() {
    const { user } = useAuth();
    const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);
    const [count, setCount] = useState(0);

    const loadJournalData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error, count: totalCount } = await supabase
                .from('journals')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setLatestEntry(data[0] || null);
                setCount(totalCount || data.length);
            }
        } catch (error) {
            console.error("Journal Widget fetch failed:", error);
        }
    }, [user]);

    useEffect(() => {
        loadJournalData();
    }, [loadJournalData]);

    return (
        <div className="group relative bg-white dark:bg-zinc-950 p-6 rounded-3xl border-2 border-transparent hover:border-green-500/50 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 flex flex-col h-full overflow-hidden">
            
            {/* Header with Styled Badge */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                        <BookText className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg">
                        Journal
                    </h3>
                </div>
                
                {/* Total Count Badge */}
                <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    {count} {count === 1 ? 'Entry' : 'Entries'}
                </div>
            </div>

            {/* Content Area */}
            <div className="grow">
                {latestEntry ? (
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            Latest • {new Date(latestEntry.created_at).toLocaleDateString()}
                        </p>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-zinc-100 line-clamp-1 mb-1">
                                {latestEntry.title}
                            </h4>
                            <p className="text-gray-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-3 border-l-2 border-gray-100 dark:border-zinc-800 pl-4 py-1 italic">
                                {tiptapToPreviewText(latestEntry.content)}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <BookText className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-gray-400 dark:text-zinc-500 text-sm font-medium">
                            No entries yet
                        </p>
                    </div>
                )}
            </div>

            {/* Standardized Action Button */}
            <Link 
                href="/journal" 
                className="mt-6 block text-center py-2.5 bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-zinc-400 hover:bg-green-50 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400 rounded-xl text-sm font-semibold transition-colors"
            >
                + New Entry
            </Link>
        </div>
    );
}