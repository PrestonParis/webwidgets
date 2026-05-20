'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { JournalEntry } from '@/features/journal/types/journal';
import { tiptapToPreviewText } from '@/lib/utils/tiptap';
import { BookText } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { z } from 'zod';

const journalEntrySchema: z.ZodType<JournalEntry> = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    image_url: z.string().nullable(),
    deleted_at: z.string().nullable(),
    created_at: z.string(),
    type: z.enum(['journal', 'document']).default('journal'),
});

const journalEntryArraySchema = z.array(journalEntrySchema);

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

                const parsed = journalEntryArraySchema.safeParse(data);
                if (parsed.success && isMounted) {
                    setLatestEntry(parsed.data[0] || null);
                    setCount(totalCount || parsed.data.length);
                }
            } catch (error) {
                console.error('Journal Widget fetch failed:', error);
            }
        };

        void fetch();

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
            widgetId="journal"
            widgetType="journal"
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
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                        <BookText className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
                    </div>
                    <p className="text-gray-400 dark:text-zinc-500 text-sm font-medium">
                        No entries yet
                    </p>
                </div>
            )}
        </WidgetShell>
    );
}
