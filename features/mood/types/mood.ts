export interface MoodEntry {
    id: string;
    user_id: string;
    score: number;
    mood: number;
    logged_date: string;
    logged_at: string;
    note: string | null;
}

export interface HistoryItem {
    date: string;
    entry?: MoodEntry;
}
