'use client';

import { BookText } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';
import { tiptapToPreviewText } from '@/lib/utils/tiptap';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';

interface JournalRow {
    id: string;
    title: string;
    content: string;
    type: string;
    created_at: string;
}

export default function JournalWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'journal',
        'journal',
    );
    const { payload, loading } = useWidgetData('journal', 'journal');

    // Extract journal records from the adapter payload
    const records = (
        (payload?.sources['journals']?.data as JournalRow[] | null) ?? []
    ).filter((r): r is JournalRow => r != null && r.type === 'journal');

    const latestEntry = records[0] ?? null;
    const count = records.length;

    return (
        <WidgetShell
            icon={<BookText />}
            title="Journal"
            badge={
                loading ? '…' : `${count} ${count === 1 ? 'Entry' : 'Entries'}`
            }
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="journal"
            widgetType="journal"
            footerHref="/journal"
            footerLabel="+ New Entry"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="journals"
                    displayName="Journal"
                />
            }
        >
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-4 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"
                        />
                    ))}
                </div>
            ) : latestEntry ? (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                        Latest &bull;{' '}
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
