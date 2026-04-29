'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { JournalEntry } from '@/types/journal';
import { tiptapToPreviewText } from '@/lib/utils/tiptap';
import { BookText } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';

export default function JournalWidget() {
    const { user } = useAuth();
    const [latestEntry, setLatestEntry] = useState<JournalEntry | null>(null);
    const [count, setCount] = useState(0);

    const { settings, updateSettings } = useWidgetSettings(
        'journal',
        'journal',
    );

    useEffect(() => {
        let isMounted = true;

        const fetch = async () => {
            if (!user?.id) return;

            try {
                const {
                    data,
                    error,
                    count: totalCount,
                } = await supabase
                    .from('journals')
                    .select('*', { count: 'exact' })
                    .eq('user_id', user.id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && isMounted) {
                    setLatestEntry(data[0] || null);
                    setCount(totalCount || data.length);
                }
            } catch (error) {
                console.error('Journal Widget fetch failed:', error);
            }
        };

        fetch();

        return () => {
            isMounted = false;
        };
    }, [user]);

    return (
        <WidgetShell
            icon={<BookText />}
            title="Journal"
            badge={`${count} ${count === 1 ? 'Entry' : 'Entries'}`}
            settings={settings}
            onSettingsChange={updateSettings}
            footerHref="/journal"
            footerLabel="+ New Entry"
        >
            {latestEntry ? (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                        Latest •{' '}
                        {new Date(latestEntry.created_at).toLocaleDateString()}
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
        </WidgetShell>
    );
}
