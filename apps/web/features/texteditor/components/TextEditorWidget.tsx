'use client';

import { FileText, BookText, StickyNote } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { ModeSelector } from '@/features/texteditor/components/ModeSelector';
import { WidgetNoteEditor } from '@/features/texteditor/components/WidgetNoteEditor';
import type { TextEditorMode } from '@/features/texteditor/types/texteditor';

const modeIcons: Record<TextEditorMode, React.ReactNode> = {
    document: <FileText size={15} />,
    journal: <BookText size={15} />,
    note: <StickyNote size={15} />,
};

export default function TextEditorWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'texteditor',
        'texteditor',
    );

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

    return (
        <WidgetShell
            icon={modeIcons[mode]}
            title="TextEditor"
            settingsSlot={modeSelector}
            widgetId="texteditor"
            widgetType="texteditor"
            footerHref={`/texteditor?mode=${mode}`}
            footerLabel={
                mode === 'journal'
                    ? 'All entries →'
                    : mode === 'note'
                      ? 'All notes →'
                      : 'All documents →'
            }
        >
            <WidgetNoteEditor noteType={mode} />
        </WidgetShell>
    );
}
