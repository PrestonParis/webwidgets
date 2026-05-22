import { useMemo } from 'react';
import { MoodEntry } from '@/features/mood/types/mood';

// Computed once when the module loads — pure from React's perspective,
// stable for the lifetime of the app session.
const SESSION_START = Date.now();

function localDateStr(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function useMoodHistory(entries: MoodEntry[]) {
    const last7 = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = localDateStr(SESSION_START - (6 - i) * 86_400_000);
            const entry = entries.find((e) => e.logged_date === date);
            return { date, entry };
        });
    }, [entries]);

    return {
        last7,
        today: localDateStr(SESSION_START),
    };
}
