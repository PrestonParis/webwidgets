import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { z } from 'zod';

const draftSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
});

export function useAutosave(
    editor: Editor | null,
    title: string,
    enabled: boolean = true,
) {
    const [autosaved, setAutosaved] = useState(false);
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!editor || !enabled) return;

        const handler = () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
            autosaveTimer.current = setTimeout(() => {
                localStorage.setItem(
                    'journal_draft',
                    JSON.stringify({ title, content: editor.getHTML() }),
                );
                setAutosaved(true);
                setTimeout(() => setAutosaved(false), 2000);
            }, 1500);
        };

        editor.on('update', handler);
        return () => {
            editor.off('update', handler);
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, [editor, title, enabled]);

    const restoreDraft = (): { title: string; content: string } | null => {
        if (!editor) return null;

        try {
            const raw = localStorage.getItem('journal_draft');
            if (!raw) return null;
            const parsed = draftSchema.safeParse(JSON.parse(raw) as unknown);
            if (!parsed.success) return null;
            return {
                title: parsed.data.title || '',
                content: parsed.data.content || '',
            };
        } catch {
            return null;
        }
    };

    const clearDraft = () => {
        localStorage.removeItem('journal_draft');
    };

    return { autosaved, restoreDraft, clearDraft };
}
