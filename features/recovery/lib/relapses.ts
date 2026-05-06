import { supabase } from '@/lib/db/supabase';
import { z } from 'zod';

const relapseRowSchema = z.object({
    relapsed_at: z.string(),
});
const relapseRowsSchema = z.array(relapseRowSchema);

export function toDateKey(date: Date): string {
    return date.toISOString().split('T')[0] ?? '';
}

export function computeLongestStreakDays(
    createdAt: string,
    relapseDates: string[],
): number {
    const sorted = [...new Set(relapseDates)].sort();
    const start = createdAt.split('T')[0] ?? '';
    const today = new Date().toISOString().split('T')[0] ?? '';
    const checkpoints = [start, ...sorted, today];
    let longest = 0;
    for (let i = 0; i + 1 < checkpoints.length; i++) {
        const a = checkpoints[i] ?? '';
        const b = checkpoints[i + 1] ?? '';
        const days = Math.round(
            (new Date(b).getTime() - new Date(a).getTime()) / 86400000,
        );
        if (days > longest) longest = days;
    }
    return Math.max(0, longest);
}

export async function fetchRelapses(trackerId: string): Promise<string[]> {
    const { data } = await supabase
        .from('relapses')
        .select('relapsed_at')
        .eq('tracker_id', trackerId);
    const parsed = relapseRowsSchema.safeParse(data);
    if (!parsed.success) return [];
    return parsed.data.map((r) => r.relapsed_at.split('T')[0] ?? '');
}
