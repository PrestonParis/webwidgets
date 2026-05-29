'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
    createCalendarEvent,
    updateCalendarEvent,
} from '@/features/calendar/api/calendarMutations';
import { isAllDay, EVENT_COLORS } from '@/features/calendar/types/calendar';
import type {
    CalendarEvent,
    CalendarEventInput,
} from '@/features/calendar/types/calendar';
import { useCalendarSettings } from '../hooks/useCalendarSettings';
import { cn } from '@/lib/utils/utils';

interface FormState {
    summary: string;
    description: string;
    location: string;
    allDay: boolean;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    colorId: string;
    categoryId: string;
}

export interface EventFormModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    editEvent?: CalendarEvent | undefined;
    initialData?: Partial<FormState> | undefined;
}

const COLOR_OPTIONS = [
    { id: '', bg: 'bg-blue-500', title: 'Default' },
    ...Object.entries(EVENT_COLORS).map(([id, bg]) => ({ id, bg, title: id })),
];
const inputCls =
    'w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none focus:border-[#4f6ef7] placeholder:text-zinc-600 transition-colors';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1';

function todayStr() {
    return new Date().toISOString().split('T')[0]!;
}

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(total: number): string {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function shiftEndTime(startTime: string, durationMinutes: number): string {
    return minutesToTime(timeToMinutes(startTime) + durationMinutes);
}

function getDuration(startTime: string, endTime: string): number {
    const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    return diff > 0 ? diff : 60;
}

function defaultForm(
    initial?: Partial<FormState>,
    defaultDuration = 60,
): FormState {
    const startTime = initial?.startTime ?? '09:00';
    const endTime =
        initial?.endTime ?? shiftEndTime(startTime, defaultDuration);
    return {
        summary: '',
        description: '',
        location: '',
        allDay: false,
        startDate: todayStr(),
        startTime,
        endDate: todayStr(),
        endTime,
        colorId: '',
        categoryId: '',
        ...initial,
        // always recompute endTime if startTime came from initial but endTime didn't
        ...(initial?.startTime && !initial?.endTime ? { endTime } : {}),
    };
}

function parseEventToForm(event: CalendarEvent): FormState {
    const allDay = isAllDay(event);
    if (allDay) {
        const endRaw = event.end.date ?? '';
        const endDisplay = endRaw
            ? new Date(new Date(endRaw + 'T00:00:00Z').getTime() - 86_400_000)
                  .toISOString()
                  .split('T')[0]!
            : endRaw;
        return {
            summary: event.summary,
            description: event.description ?? '',
            location: event.location ?? '',
            allDay: true,
            startDate: event.start.date ?? '',
            startTime: '09:00',
            endDate: endDisplay,
            endTime: '10:00',
            colorId: event.colorId ?? '',
            categoryId: '',
        };
    }
    const startDt = new Date(event.start.dateTime ?? '');
    const endDt = new Date(event.end.dateTime ?? '');
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
        summary: event.summary,
        description: event.description ?? '',
        location: event.location ?? '',
        allDay: false,
        startDate: (event.start.dateTime ?? '').split('T')[0] ?? '',
        startTime: `${pad(startDt.getHours())}:${pad(startDt.getMinutes())}`,
        endDate: (event.end.dateTime ?? '').split('T')[0] ?? '',
        endTime: `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`,
        colorId: event.colorId ?? '',
        categoryId: '',
    };
}

function buildInput(form: FormState): CalendarEventInput {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const base = {
        summary: form.summary.trim(),
        description: form.description || null,
        location: form.location || null,
        colorId: form.colorId || null,
    };
    if (form.allDay) {
        const endExclusive = new Date(
            new Date(form.endDate + 'T00:00:00Z').getTime() + 86_400_000,
        )
            .toISOString()
            .split('T')[0]!;
        return {
            ...base,
            start: { date: form.startDate },
            end: { date: endExclusive },
        };
    }
    return {
        ...base,
        start: {
            dateTime: `${form.startDate}T${form.startTime}:00`,
            timeZone: tz,
        },
        end: { dateTime: `${form.endDate}T${form.endTime}:00`, timeZone: tz },
    };
}

interface FormFieldsProps {
    form: FormState;
    set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    setStartTime: (t: string) => void;
    error: string | null;
    onSubmit: (e: React.FormEvent) => void;
    defaultDuration: number;
}

function EventFormFields({
    form,
    set,
    setStartTime,
    error,
    onSubmit,
    defaultDuration,
}: FormFieldsProps) {
    const { settings } = useCalendarSettings();

    function handleCategoryClick(catId: string) {
        const same = form.categoryId === catId;
        if (same) {
            set('categoryId', '');
            return;
        }
        const cat = settings.categories.find((c) => c.id === catId);
        if (!cat) return;
        const duration = cat.defaultDurationMinutes;
        set('categoryId', catId);
        set('colorId', cat.colorId);
        set('endTime', shiftEndTime(form.startTime, duration));
        set('endDate', form.startDate);
    }

    return (
        <form
            onSubmit={onSubmit}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
            {/* Categories */}
            {settings.categories.length > 0 && (
                <div>
                    <label className={labelCls}>Category</label>
                    <div className="flex flex-wrap gap-1.5">
                        {settings.categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.id)}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold border transition-colors',
                                    form.categoryId === cat.id
                                        ? 'bg-[#4f6ef7] border-[#4f6ef7] text-white'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500',
                                )}
                            >
                                <span>{cat.emoji}</span>
                                <span>{cat.name}</span>
                                <span className="opacity-50">
                                    {cat.defaultDurationMinutes < 60
                                        ? `${cat.defaultDurationMinutes}m`
                                        : `${cat.defaultDurationMinutes / 60}h`}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label className={labelCls}>Title *</label>
                <input
                    className={inputCls}
                    placeholder="Event title"
                    value={form.summary}
                    onChange={(e) => set('summary', e.target.value)}
                    autoFocus
                />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                    className={`relative w-9 h-5 rounded-full transition-colors ${form.allDay ? 'bg-[#4f6ef7]' : 'bg-zinc-700'}`}
                    onClick={() => set('allDay', !form.allDay)}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.allDay ? 'translate-x-4' : ''}`}
                    />
                </div>
                <span className="text-xs text-zinc-400">All day</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelCls}>Start date</label>
                    <input
                        type="date"
                        className={inputCls}
                        value={form.startDate}
                        onChange={(e) => {
                            set('startDate', e.target.value);
                            // Keep end date in sync if it was same-day
                            if (form.startDate === form.endDate)
                                set('endDate', e.target.value);
                        }}
                    />
                </div>
                {!form.allDay && (
                    <div>
                        <label className={labelCls}>Start time</label>
                        <input
                            type="time"
                            className={inputCls}
                            value={form.startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className={labelCls}>End date</label>
                    <input
                        type="date"
                        className={inputCls}
                        value={form.endDate}
                        onChange={(e) => set('endDate', e.target.value)}
                    />
                </div>
                {!form.allDay && (
                    <div>
                        <label className={labelCls}>End time</label>
                        <input
                            type="time"
                            className={inputCls}
                            value={form.endTime}
                            onChange={(e) => set('endTime', e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div>
                <label className={labelCls}>Location</label>
                <input
                    className={inputCls}
                    placeholder="Add location"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                />
            </div>

            <div>
                <label className={labelCls}>Description</label>
                <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Add description"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                />
            </div>

            <div>
                <label className={labelCls}>Color</label>
                <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            title={c.title}
                            onClick={() => set('colorId', c.id)}
                            className={`w-6 h-6 rounded-full ${c.bg} transition-transform hover:scale-110 ${form.colorId === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
    );
}

export function EventFormModal({
    open,
    onClose,
    onSaved,
    editEvent,
    initialData,
}: EventFormModalProps) {
    if (!open) return null;
    const formKey =
        editEvent?.id ??
        `${initialData?.summary ?? ''}:${initialData?.startDate ?? ''}:${initialData?.startTime ?? ''}`;
    return (
        <EventFormModalContent
            key={formKey}
            onClose={onClose}
            onSaved={onSaved}
            editEvent={editEvent}
            initialData={initialData}
        />
    );
}

function EventFormModalContent({
    onClose,
    onSaved,
    editEvent,
    initialData,
}: Omit<EventFormModalProps, 'open'>) {
    const isEdit = Boolean(editEvent);
    const { settings, getCategoryById } = useCalendarSettings();
    const [form, setForm] = useState<FormState>(() =>
        editEvent
            ? parseEventToForm(editEvent)
            : defaultForm(initialData, settings.defaultDurationMinutes),
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    // When start time changes: preserve the current duration (or category default) and shift end time.
    function setStartTime(newStart: string) {
        setForm((f) => {
            const cat = f.categoryId
                ? getCategoryById(f.categoryId)
                : undefined;
            const duration = cat
                ? cat.defaultDurationMinutes
                : getDuration(f.startTime, f.endTime);
            return {
                ...f,
                startTime: newStart,
                endTime: shiftEndTime(newStart, duration),
                // If the dates were the same, keep end date aligned
                endDate: f.startDate === f.endDate ? f.startDate : f.endDate,
            };
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.summary.trim()) {
            setError('Title is required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const input = buildInput(form);
            if (editEvent) {
                await updateCalendarEvent(editEvent.id, input);
            } else {
                await createCalendarEvent(input);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                    <h2 className="text-sm font-semibold text-zinc-100">
                        {isEdit ? 'Edit Event' : 'New Event'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={15} className="text-zinc-400" />
                    </button>
                </div>
                <EventFormFields
                    form={form}
                    set={set}
                    setStartTime={setStartTime}
                    error={error}
                    defaultDuration={settings.defaultDurationMinutes}
                    onSubmit={(e) => void handleSubmit(e)}
                />
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={(e) =>
                            void handleSubmit(e as unknown as React.FormEvent)
                        }
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg bg-[#4f6ef7] text-white text-sm font-medium hover:bg-[#3d5ce0] disabled:opacity-50 transition-colors"
                    >
                        {saving
                            ? 'Saving…'
                            : isEdit
                              ? 'Save changes'
                              : 'Create event'}
                    </button>
                </div>
            </div>
        </div>
    );
}
