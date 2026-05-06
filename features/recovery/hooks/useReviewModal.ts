'use client';

import { useState } from 'react';
import { supabase } from '@/lib/db/supabase';

export interface ReviewDay {
    date: Date;
    relapsed: boolean;
    time: string;
    wasRelapsed: boolean;
}

const storageKey = (id: string) => `recovery_last_reviewed_${id}`;

async function fetchExistingRelapses(trackerId: string, from: Date, to: Date) {
    const { data } = await supabase
        .from('relapses')
        .select('relapsed_at')
        .eq('tracker_id', trackerId)
        .gte('relapsed_at', from.toISOString())
        .lte('relapsed_at', to.toISOString());
    const set = new Set<string>();
    const times = new Map<string, string>();
    for (const r of data ?? []) {
        const d = new Date(r.relapsed_at as string);
        const key = d.toISOString().split('T')[0] ?? '';
        set.add(key);
        times.set(
            key,
            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        );
    }
    return { set, times };
}

export function useReviewModal(trackerId: string, startTime: string) {
    const [isOpen, setIsOpen] = useState(false);
    const [days, setDays] = useState<ReviewDay[]>([]);
    const [saving, setSaving] = useState(false);

    const open = async () => {
        const lastReviewed = localStorage.getItem(storageKey(trackerId));
        const from = new Date(lastReviewed ?? startTime);
        from.setHours(0, 0, 0, 0);
        const startDate = new Date(startTime);
        startDate.setHours(0, 0, 0, 0);
        const effectiveFrom = from > startDate ? from : startDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 86400000);

        const { set, times } = await fetchExistingRelapses(
            trackerId,
            effectiveFrom,
            tomorrow,
        );

        const reviewDays: ReviewDay[] = [];
        const cursor = new Date(effectiveFrom);
        if (lastReviewed) cursor.setDate(cursor.getDate() + 1);
        let count = 0;
        while (cursor <= today && count < 90) {
            const key = cursor.toISOString().split('T')[0] ?? '';
            reviewDays.push({
                date: new Date(cursor),
                relapsed: set.has(key),
                time: times.get(key) ?? '12:00',
                wasRelapsed: set.has(key),
            });
            cursor.setDate(cursor.getDate() + 1);
            count++;
        }
        setDays(reviewDays);
        setIsOpen(true);
    };

    const toggle = (date: Date) =>
        setDays((prev) =>
            prev.map((d) =>
                d.date.toDateString() === date.toDateString()
                    ? { ...d, relapsed: !d.relapsed }
                    : d,
            ),
        );

    const setTime = (date: Date, time: string) =>
        setDays((prev) =>
            prev.map((d) =>
                d.date.toDateString() === date.toDateString()
                    ? { ...d, time }
                    : d,
            ),
        );

    const save = async () => {
        setSaving(true);
        try {
            for (const d of days.filter((d) => d.relapsed && !d.wasRelapsed)) {
                const [h = 0, m = 0] = d.time.split(':').map(Number);
                const dt = new Date(d.date);
                dt.setHours(h, m, 0, 0);
                await supabase.from('relapses').insert({
                    tracker_id: trackerId,
                    relapsed_at: dt.toISOString(),
                });
            }
            for (const d of days.filter((d) => !d.relapsed && d.wasRelapsed)) {
                const ds = d.date.toISOString().split('T')[0];
                await supabase
                    .from('relapses')
                    .delete()
                    .eq('tracker_id', trackerId)
                    .gte('relapsed_at', `${ds}T00:00:00`)
                    .lte('relapsed_at', `${ds}T23:59:59`);
            }
            localStorage.setItem(
                storageKey(trackerId),
                new Date().toISOString(),
            );
            setIsOpen(false);
        } finally {
            setSaving(false);
        }
    };

    return {
        isOpen,
        days,
        saving,
        open,
        toggle,
        setTime,
        save,
        close: () => setIsOpen(false),
    };
}
