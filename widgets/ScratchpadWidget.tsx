'use client';

import { FileText } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useQuickNote } from '@/hooks/tracking/useQuickNote';

export default function ScratchpadWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'scratchpad',
        'scratchpad',
    );
    const { content, updateContent, status, loaded } = useQuickNote();

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    return (
        <WidgetShell
            icon={<FileText size={16} />}
            title="Scratchpad"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="scratchpad"
            widgetType="scratchpad"
        >
            <textarea
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={loaded ? 'Jot something down…' : ''}
                disabled={!loaded}
                className="w-full h-40 resize-none text-sm text-stone-700 dark:text-zinc-300 placeholder:text-stone-300 dark:placeholder:text-zinc-700 bg-transparent outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
                <span className="text-[10px] text-stone-400 dark:text-zinc-600">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <span
                    className={`text-[10px] transition-opacity ${
                        status === 'idle'
                            ? 'opacity-0'
                            : status === 'saving'
                              ? 'text-stone-400 dark:text-zinc-600 opacity-100'
                              : 'text-green-500 dark:text-green-400 opacity-100'
                    }`}
                >
                    {status === 'saving' ? 'Saving…' : 'Saved'}
                </span>
            </div>
        </WidgetShell>
    );
}
