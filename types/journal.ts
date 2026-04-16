export interface JournalEntry {
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    deleted_at: string | null;
    created_at: string;
}

export interface EntryCardProps {
    entry: JournalEntry;
    onDelete: (id: number) => void;
    onEdit?: (entry: JournalEntry) => void;
    onRestore?: (id: number) => void;
    isTrash?: boolean;
}