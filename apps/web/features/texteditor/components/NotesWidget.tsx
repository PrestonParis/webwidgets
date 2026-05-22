'use client';

import { StickyNote } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { WidgetNoteEditor } from './WidgetNoteEditor';

export default function NotesWidget() {
    const { settings, updateSettings } = useWidgetSettings('notes', 'notes');

    return (
        <WidgetShell
            icon={<StickyNote size={16} />}
            title="Notes"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="notes"
            widgetType="notes"
            footerHref="/texteditor?mode=note"
            footerLabel="Open in TextEditor →"
        >
            <WidgetNoteEditor noteType="note" />
        </WidgetShell>
    );
}
