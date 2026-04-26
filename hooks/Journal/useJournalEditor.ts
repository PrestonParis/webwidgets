import { useState, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { JournalEntry } from '@/types/journal';

export function useJournalEditor() {
    const [title, setTitle] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const isEditingRef = useRef(false);

    const editor = useEditor({
        immediatelyRender: false, // This already handles SSR correctly
        editable: true,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "What's on your mind today…",
            }),
            CharacterCount,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'min-h-[180px] outline-none prose prose-stone dark:prose-invert max-w-none text-sm leading-relaxed',
            },
        },
    });

    const startEditing = (entry: JournalEntry) => {
        isEditingRef.current = true;
        setEditingId(entry.id);
        setTitle(entry.title);
        editor?.commands.setContent(entry.content);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        isEditingRef.current = false;
        setEditingId(null);
        setTitle('');
        editor?.commands.clearContent();
    };

    const resetForm = () => {
        isEditingRef.current = false;
        setEditingId(null);
        setTitle('');
        editor?.commands.clearContent();
    };

    const getContent = () => editor?.getHTML() || '';
    const isValid = () =>
        title.trim() && getContent() && getContent() !== '<p></p>';

    // Editor is ready when it exists (TipTap handles SSR automatically)
    const isEditorReady = !!editor;

    return {
        editor,
        title,
        setTitle,
        editingId,
        isEditing: editingId !== null,
        isMounted: isEditorReady, // Use editor readiness instead
        startEditing,
        cancelEditing,
        resetForm,
        getContent,
        isValid,
    };
}
