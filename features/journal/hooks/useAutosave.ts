import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

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

    const restoreDraft = () => {
        if (!editor) return;

        try {
            const raw = localStorage.getItem('journal_draft');
            if (!raw) return;
            const { title: t, content: c } = JSON.parse(raw);
            return { title: t || '', content: c || '' };
        } catch {
            return null;
        }
    };

    const clearDraft = () => {
        localStorage.removeItem('journal_draft');
    };

    return { autosaved, restoreDraft, clearDraft };
}
