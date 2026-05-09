'use client';

import { getMonthMeta } from '@/lib/utils/time';
import { cn } from '@/lib/utils/utils';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { QuickActions } from './QuickActions';
import { FooterActions } from './FooterActions';
import { useDatePickerState } from './useDatePickerState';
import { DatePickerProps, QuickActionKey } from './types';

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const selectCls =
    'h-8 px-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 outline-none focus:border-purple-400 cursor-pointer appearance-none text-center';

function TimeSelector({
    hour,
    minute,
    ampm,
    setHour,
    setMinute,
    setAmpm,
}: {
    hour: number;
    minute: number;
    ampm: 'AM' | 'PM';
    setHour: (v: number) => void;
    setMinute: (v: number) => void;
    setAmpm: (v: 'AM' | 'PM') => void;
}) {
    return (
        <div className="flex items-center justify-center gap-1.5 px-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
            <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className={selectCls}
            >
                {HOURS.map((h) => (
                    <option key={h} value={h}>
                        {h}
                    </option>
                ))}
            </select>
            <span className="text-gray-400 dark:text-zinc-500 font-bold text-sm">
                :
            </span>
            <select
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                className={selectCls}
            >
                {MINUTES.map((m) => (
                    <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                    </option>
                ))}
            </select>
            <button
                onClick={() => setAmpm(ampm === 'AM' ? 'PM' : 'AM')}
                className="h-8 px-3 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
            >
                {ampm}
            </button>
        </div>
    );
}

export default function DatePicker({
    value,
    onChange,
    onCancel,
    allowFuture = false,
    showQuickActions = true,
    className,
    saveLabel = 'Save date',
}: DatePickerProps) {
    const state = useDatePickerState(value);
    const today = new Date();
    const { firstDay, daysInMonth } = getMonthMeta(
        state.viewYear,
        state.viewMonth,
    );
    const monthLabel = `${MONTH_NAMES[state.viewMonth]} ${state.viewYear}`;

    const handleQuickAction = (key: QuickActionKey) => {
        const d = new Date();
        if (key === 'sod') d.setHours(0, 0, 0, 0);
        else if (key === '1hago') d.setHours(d.getHours() - 1);
        else if (key === 'yesterday') {
            d.setDate(d.getDate() - 1);
            d.setHours(0, 0, 0, 0);
        }
        state.setFromDate(d);
    };

    return (
        <div
            className={cn(
                'bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-lg w-72',
                className,
            )}
        >
            <CalendarHeader
                label={monthLabel}
                onPrev={() => state.changeMonth(-1)}
                onNext={() => state.changeMonth(1)}
            />
            <CalendarGrid
                firstDay={firstDay}
                daysInMonth={daysInMonth}
                viewYear={state.viewYear}
                viewMonth={state.viewMonth}
                today={today}
                sel={{
                    day: state.selDay,
                    month: state.selMonth,
                    year: state.selYear,
                }}
                setSel={(day, month, year) => {
                    state.setSelDay(day);
                    state.setSelMonth(month);
                    state.setSelYear(year);
                }}
                allowFuture={allowFuture}
            />
            <TimeSelector
                hour={state.hour}
                minute={state.minute}
                ampm={state.ampm}
                setHour={state.setHour}
                setMinute={state.setMinute}
                setAmpm={state.setAmpm}
            />
            {showQuickActions && <QuickActions onSelect={handleQuickAction} />}
            <FooterActions
                onCancel={onCancel}
                onSave={() => onChange(state.buildDate().toISOString())}
                saveLabel={saveLabel}
            />
        </div>
    );
}
