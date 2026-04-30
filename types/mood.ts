export interface MoodEntry {
    id: string;
    user_id: string;
    score: number;
    logged_date: string;
    note: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface HistoryItem {
    date: string;
    entry?: MoodEntry;
}
