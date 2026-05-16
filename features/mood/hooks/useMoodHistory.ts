import { useMemo } from 'react';
import { MoodEntry } from '@/features/mood/types/mood';

// Computed once when the module loads — pure from React's perspective,
// stable for the lifetime of the app session.
const SESSION_START = Date.now();

export function useMoodHistory(entries: MoodEntry[]) {
    const last7 = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(SESSION_START - (6 - i) * 86_400_000)
                .toISOString()
                .split('T')[0]!;
            const entry = entries.find((e) => e.logged_date === date);
            return { date, entry };
        });
    }, [entries]);

    return {
        last7,
        today: new Date(SESSION_START).toISOString().split('T')[0]!,
    };
}
