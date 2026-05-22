'use client';

import { useState } from 'react';
import { to24Hour } from '@/lib/utils/time';

export function useDatePickerState(value: string) {
    const initial = new Date(value);

    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    const [selDay, setSelDay] = useState(initial.getDate());
    const [selMonth, setSelMonth] = useState(initial.getMonth());
    const [selYear, setSelYear] = useState(initial.getFullYear());
    const [hour, setHour] = useState(initial.getHours() % 12 || 12);
    const [minute, setMinute] = useState(initial.getMinutes());
    const [second, setSecond] = useState(initial.getSeconds());
    const [ampm, setAmpm] = useState<'AM' | 'PM'>(
        initial.getHours() >= 12 ? 'PM' : 'AM',
    );

    const changeMonth = (dir: number) => {
        const d = new Date(viewYear, viewMonth + dir);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
    };

    const setFromDate = (t: Date) => {
        setViewYear(t.getFullYear());
        setViewMonth(t.getMonth());
        setSelYear(t.getFullYear());
        setSelMonth(t.getMonth());
        setSelDay(t.getDate());
        const h = t.getHours();
        setAmpm(h >= 12 ? 'PM' : 'AM');
        setHour(h % 12 || 12);
        setMinute(t.getMinutes());
        setSecond(t.getSeconds());
    };

    const buildDate = () => {
        const h24 = to24Hour(hour, ampm);
        return new Date(selYear, selMonth, selDay, h24, minute, second);
    };

    return {
        viewYear,
        viewMonth,
        selDay,
        selMonth,
        selYear,
        hour,
        minute,
        second,
        ampm,
        setViewYear,
        setViewMonth,
        setSelDay,
        setSelMonth,
        setSelYear,
        setHour,
        setMinute,
        setSecond,
        setAmpm,
        changeMonth,
        setFromDate,
        buildDate,
    };
}
