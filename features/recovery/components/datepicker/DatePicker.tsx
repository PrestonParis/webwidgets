'use client';

import { useDatePickerState } from '@/hooks/global/useDatePickerState';
import { getMonthMeta } from '@/lib/utils/time';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { QuickActions } from './QuickActions';
import { FooterActions } from './FooterActions';
import { DatePickerProps } from '@/types/recovery';

export default function DatePicker({
    value,
    onChange,
    onCancel,
}: DatePickerProps) {
    const state = useDatePickerState(value);

    const today = new Date();

    const { firstDay, daysInMonth } = getMonthMeta(
        state.viewYear,
        state.viewMonth,
    );

    const handleSave = () => {
        onChange(state.buildDate().toISOString());
    };

    return (
        <div className="bg-white rounded-2xl w-72">
            <CalendarHeader
                label="month label here"
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
            />

            <QuickActions onSelect={() => {}} />

            <FooterActions onCancel={onCancel} onSave={handleSave} />
        </div>
    );
}
