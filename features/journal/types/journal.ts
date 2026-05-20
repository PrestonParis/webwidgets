import { Editor } from '@tiptap/react';
export interface JournalEntry {
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    deleted_at: string | null;
    created_at: string;
    type: 'journal' | 'document';
}

export interface EntryCardProps {
    entry: JournalEntry;
    onDelete: (id: number) => void;
    onEdit?: (entry: JournalEntry) => void;
    onRestore?: (id: number) => void;
    isTrash?: boolean;
}

export interface JournalFormProps {
    editor: Editor | null; // ← Changed from 'any' to proper Editor type
    title: string;
    onTitleChange: (title: string) => void;
    isEditing: boolean;
    isSaving: boolean;
    focusMode: boolean;
    onFocusToggle: () => void;
    onCancel: () => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
    wordCount: number;
    autosaved: boolean;
}

export interface EntryCardActionsProps {
    entry: JournalEntry;
    isTrash?: boolean | undefined;
    isConfirming: boolean;
    onEdit?: ((entry: JournalEntry) => void) | undefined;
    onDelete: (id: number) => void;
    onRestore?: ((id: number) => void) | undefined;
    onConfirmStart: () => void;
    onConfirmCancel: () => void;
}
