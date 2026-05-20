export type TextEditorMode = 'document' | 'journal' | 'scratchpad';
export type NoteType = 'document' | 'journal';

export const MODE_LABELS: Record<TextEditorMode, string> = {
    document: 'Document',
    journal: 'Journal',
    scratchpad: 'Scratchpad',
};
