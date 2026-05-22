import { useState, useMemo } from 'react';
import { useCalendarEvents } from '@/features/calendar/hooks/useCalendarEvents';
import { deleteCalendarEvent } from '@/features/calendar/api/calendarMutations';
import { CalendarEvent, eventStart } from '@/features/calendar/types/calendar';

function buildGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(new Date(year, month, -firstDay.getDay() + i + 1));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }
    while (days.length < 42) {
        days.push(
            new Date(
                year,
                month + 1,
                days.length - lastDay.getDate() - firstDay.getDay() + 1,
            ),
        );
    }
    return days;
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function useCalendarPage() {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [formOpen, setFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<
        CalendarEvent | undefined
    >();

    const { events, loading, isNotConnected, refresh } = useCalendarEvents(
        viewYear,
        viewMonth,
    );

    const grid = useMemo(
        () => buildGrid(viewYear, viewMonth),
        [viewYear, viewMonth],
    );

    const eventsForDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const e of events) {
            const d = eventStart(e);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const arr = map.get(key) ?? [];
            arr.push(e);
            map.set(key, arr);
        }
        return map;
    }, [events]);

    function getDayEvents(date: Date): CalendarEvent[] {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return eventsForDay.get(key) ?? [];
    }

    function prevMonth() {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else setViewMonth((m) => m - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else setViewMonth((m) => m + 1);
    }

    function openCreate() {
        setEditingEvent(undefined);
        setFormOpen(true);
    }
    function openEdit(event: CalendarEvent) {
        setEditingEvent(event);
        setFormOpen(true);
    }

    async function handleDelete(event: CalendarEvent) {
        try {
            await deleteCalendarEvent(event.id);
            refresh();
        } catch {
            // swallow — stale UI corrects on next refresh
        }
    }

    const selectedEvents = getDayEvents(selectedDate);
    const selectedLabel = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
    const createInitialData = { startDate: dateStr, endDate: dateStr };

    return {
        today,
        viewYear,
        viewMonth,
        setViewYear,
        setViewMonth,
        selectedDate,
        setSelectedDate,
        formOpen,
        setFormOpen,
        editingEvent,
        loading,
        isNotConnected,
        refresh,
        grid,
        getDayEvents,
        prevMonth,
        nextMonth,
        openCreate,
        openEdit,
        handleDelete,
        selectedEvents,
        selectedLabel,
        createInitialData,
    };
}
