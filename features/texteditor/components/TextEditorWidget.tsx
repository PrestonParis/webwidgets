'use client';

import { FileText, BookText, StickyNote } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQuickNote } from '@/features/scratchpad/hooks/useQuickNote';
import { tiptapToPreviewText } from '@/lib/utils/tiptap';
import { ModeSelector } from '@/features/texteditor/components/ModeSelector';
import { useLatestEntry } from '@/features/texteditor/hooks/useLatestEntry';
import type { TextEditorMode } from '@/features/texteditor/types';

// --- Mode-specific content ---
function DocumentPreview({ userId }: { userId: string | undefined }) {
    const { entry, count } = useLatestEntry(userId, 'document');
    return (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
                {count} {count === 1 ? 'document' : 'documents'}
            </p>
            {entry ? (
                <div>
                    <h4 className="font-semibold text-stone-900 dark:text-zinc-100 line-clamp-1 text-sm">
                        {entry.title}
                    </h4>
                    <p className="text-stone-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-4 mt-1">
                        {tiptapToPreviewText(entry.content)}
                    </p>
                </div>
            ) : (
                <p className="text-xs text-stone-400 dark:text-zinc-600 italic">
                    No documents yet — open to start writing
                </p>
            )}
        </div>
    );
}

function JournalPreview({ userId }: { userId: string | undefined }) {
    const { entry, count } = useLatestEntry(userId, 'journal');
    return (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
            <p className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">
                {count} {count === 1 ? 'entry' : 'entries'} · Latest{' '}
                {entry ? new Date(entry.created_at).toLocaleDateString() : '—'}
            </p>
            {entry ? (
                <div>
                    <h4 className="font-semibold text-stone-900 dark:text-zinc-100 line-clamp-1 text-sm">
                        {entry.title}
                    </h4>
                    <p className="text-stone-500 dark:text-zinc-400 text-xs leading-relaxed line-clamp-3 mt-1 border-l-2 border-stone-100 dark:border-zinc-800 pl-3 italic">
                        {tiptapToPreviewText(entry.content)}
                    </p>
                </div>
            ) : (
                <p className="text-xs text-stone-400 dark:text-zinc-600 italic">
                    No entries yet
                </p>
            )}
        </div>
    );
}

function ScratchpadInline() {
    const { content, updateContent, status, loaded } = useQuickNote();
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    return (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
            <textarea
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={loaded ? 'Jot something down…' : ''}
                disabled={!loaded}
                className="flex-1 min-h-[100px] resize-none text-sm text-stone-700 dark:text-zinc-300 placeholder:text-stone-300 dark:placeholder:text-zinc-700 bg-transparent outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-zinc-800">
                <span className="text-[10px] text-stone-400 dark:text-zinc-600">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <span
                    className={`text-[10px] transition-opacity ${status === 'idle' ? 'opacity-0' : status === 'saving' ? 'text-stone-400 dark:text-zinc-600 opacity-100' : 'text-emerald-500 opacity-100'}`}
                >
                    {status === 'saving' ? 'Saving…' : 'Saved'}
                </span>
            </div>
        </div>
    );
}

// --- Mode icon map ---
const modeIcons: Record<TextEditorMode, React.ReactNode> = {
    document: <FileText size={15} />,
    journal: <BookText size={15} />,
    scratchpad: <StickyNote size={15} />,
};

// --- Widget root ---
export default function TextEditorWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'texteditor',
        'texteditor',
    );
    const { user } = useAuth();

    const mode: TextEditorMode = settings.textEditorMode ?? 'document';

    const modeSelector = (
        <div>
            <p className="text-xs font-bold mb-2">Mode</p>
            <ModeSelector
                compact
                mode={mode}
                onChange={(m) => updateSettings({ textEditorMode: m })}
            />
        </div>
    );

    const footerLabel =
        mode === 'journal'
            ? '+ New Entry →'
            : mode === 'document'
              ? 'Open →'
              : 'Full screen →';

    return (
        <WidgetShell
            icon={modeIcons[mode]}
            title="TextEditor"
            settingsSlot={modeSelector}
            widgetId="texteditor"
            widgetType="texteditor"
            footerHref={`/texteditor?mode=${mode}`}
            footerLabel={footerLabel}
        >
            {mode === 'document' && <DocumentPreview userId={user?.id} />}
            {mode === 'journal' && <JournalPreview userId={user?.id} />}
            {mode === 'scratchpad' && <ScratchpadInline />}
        </WidgetShell>
    );
}
