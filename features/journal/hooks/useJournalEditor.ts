import { useState, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

type EditableJournalEntry = {
    id: number;
    title: string;
    content: string;
};

export function useJournalEditor() {
    const [title, setTitle] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const isEditingRef = useRef(false);
    const originalContentRef = useRef<{
        title: string;
        content: string;
    } | null>(null);

    const editor = useEditor({
        immediatelyRender: false,
        autofocus: false,
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
                class: 'min-h-[320px] outline-none prose prose-stone dark:prose-invert max-w-none text-sm leading-relaxed',
            },
        },
    });

    const startEditing = (entry: EditableJournalEntry) => {
        isEditingRef.current = true;
        setEditingId(entry.id);
        setTitle(entry.title);
        editor?.commands.setContent(entry.content);
        originalContentRef.current = {
            title: entry.title,
            content: entry.content,
        };
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isDirty = () => {
        if (!originalContentRef.current) return false;
        return (
            title !== originalContentRef.current.title ||
            (editor?.getHTML() ?? '') !== originalContentRef.current.content
        );
    };

    const cancelEditing = () => {
        isEditingRef.current = false;
        setEditingId(null);
        setTitle('');
        originalContentRef.current = null;
        editor?.commands.clearContent();
    };

    const resetForm = () => {
        isEditingRef.current = false;
        setEditingId(null);
        setTitle('');
        originalContentRef.current = null;
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
        isMounted: isEditorReady,
        isDirty,
        startEditing,
        cancelEditing,
        resetForm,
        getContent,
        isValid,
    };
}
