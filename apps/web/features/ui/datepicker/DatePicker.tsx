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
const selectCls =
    'h-8 px-2 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-300 outline-none focus:border-purple-400 cursor-pointer appearance-none text-center';

function TimeSelector({
    hour,
    minute,
    second,
    ampm,
    setHour,
    setMinute,
    setSecond,
    setAmpm,
}: {
    hour: number;
    minute: number;
    second: number;
    ampm: 'AM' | 'PM';
    setHour: (v: number) => void;
    setMinute: (v: number) => void;
    setSecond: (v: number) => void;
    setAmpm: (v: 'AM' | 'PM') => void;
}) {
    const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(value, max));

    return (
        <div className="flex items-center justify-center gap-1.5 px-3 pb-3 border-b border-gray-100 dark:border-zinc-800">
            <input
                type="number"
                min={1}
                max={12}
                step={1}
                value={hour}
                onChange={(e) =>
                    setHour(clamp(Number(e.target.value || 1), 1, 12))
                }
                className={selectCls}
            />
            <span className="text-gray-400 dark:text-zinc-500 font-bold text-sm">
                :
            </span>
            <input
                type="number"
                min={0}
                max={59}
                step={1}
                value={minute}
                onChange={(e) =>
                    setMinute(clamp(Number(e.target.value || 0), 0, 59))
                }
                className={selectCls}
            />
            <span className="text-gray-400 dark:text-zinc-500 font-bold text-sm">
                :
            </span>
            <input
                type="number"
                min={0}
                max={59}
                step={1}
                value={second}
                onChange={(e) =>
                    setSecond(clamp(Number(e.target.value || 0), 0, 59))
                }
                className={selectCls}
            />
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
                second={state.second}
                ampm={state.ampm}
                setHour={state.setHour}
                setMinute={state.setMinute}
                setSecond={state.setSecond}
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
