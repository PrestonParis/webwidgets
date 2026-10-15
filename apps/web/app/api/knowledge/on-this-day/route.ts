import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

export async function GET() {
    const { supabase } = await createClients();
    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Query journal entries, excluding deleted ones
    const { data: journals } = await supabase
        .from('journals')
        .select('id,created_at,title,content')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

    // Filter to same month-day, different year
    const currentYear = today.getFullYear();
    const memories = (journals ?? [])
        .filter((entry) => {
            const d = new Date(entry.created_at);
            const entryMonthDay = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return entryMonthDay === monthDay && d.getFullYear() < currentYear;
        })
        .map((entry) => ({
            id: entry.id,
            date: entry.created_at,
            title: entry.title || 'Journal entry',
            snippet: entry.content.slice(0, 200),
            yearsAgo: currentYear - new Date(entry.created_at).getFullYear(),
        }));

    return NextResponse.json({
        memories,
        date: today.toISOString().slice(0, 10),
    });
}
