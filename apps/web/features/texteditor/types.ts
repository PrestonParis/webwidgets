export type TextEditorMode = 'document' | 'journal' | 'note';
export type NoteType = TextEditorMode;

export const MODE_LABELS: Record<TextEditorMode, string> = {
    document: 'Document',
    journal: 'Journal',
    note: 'Notes',
};
