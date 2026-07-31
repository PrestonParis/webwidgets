import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useJournalEntries } from '@/features/journal/hooks/useJournalEntries';
import { useJournalEditor } from '@/features/journal/hooks/useJournalEditor';
import { useAutosave } from '@/features/journal/hooks/useAutosave';
import { useJournalManager } from '@/features/journal/hooks/useJournalManager';
import { z } from 'zod';

const draftSchema = z.object({
    title: z.string(),
    content: z.string(),
});

export function useJournalPage() {
    const { user } = useAuth();
    const [focusMode, setFocusMode] = useState(false);

    const entryUtils = useJournalEntries(user?.id);
    const editorUtils = useJournalEditor();

    const { autosaved, restoreDraft, clearDraft } = useAutosave(
        editorUtils.editor,
        editorUtils.title,
        !editorUtils.isEditing,
    );

    const manager = useJournalManager(
        user,
        editorUtils.editor,
        editorUtils,
        entryUtils,
        clearDraft,
    );

    // Destructure stable primitives so the effect doesn't re-run on every render.
    // editorUtils is a new object reference each render — putting it directly in
    // deps would re-fire this effect on every keystroke, causing setContent to
    // steal focus back to the TipTap editor while the user types in the title.
    const { editor, isEditing, setTitle } = editorUtils;
    const hasRestoredDraftRef = useRef(false);

    useEffect(() => {
        if (hasRestoredDraftRef.current || isEditing || !editor) return;
        hasRestoredDraftRef.current = true;
        const draft = restoreDraft();
        const parsed = draftSchema.safeParse(draft);
        if (parsed.success) {
            if (parsed.data.title) setTitle(parsed.data.title);
            editor.commands.setContent(parsed.data.content);
            // setContent dispatches a ProseMirror transaction that can claim focus;
            // blur immediately so the title input stays usable on page load.
            editor.commands.blur();
        }
    }, [editor, isEditing, setTitle, restoreDraft]);

    const wordCount = useMemo(
        () => editorUtils.editor?.storage.characterCount.words() ?? 0,
        [editorUtils.editor],
    );

    return {
        user,
        focusMode,
        setFocusMode,
        entryUtils,
        editorUtils,
        autosaved,
        wordCount,
        ...manager,
    };
}
