import { useState } from 'react';
import {
    getDayStatus,
    STATUS_CLASSES,
} from '@/features/recovery/lib/calendarUtils';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const LEGEND = [
    { bg: '#C0DD97', color: '#3B6D11', label: 'Clean' },
    { bg: '#F7C1C1', color: '#A32D2D', label: 'Relapse' },
] as const;

export default function CalendarView({
    createdAt,
    relapses,
}: {
    createdAt: string;
    relapses: string[];
}) {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    {viewDate.toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewDate(new Date(year, month - 1))}
                        className="text-xs px-3 py-1 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => setViewDate(new Date(year, month + 1))}
                        className="text-xs px-3 py-1 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                        ›
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {DAY_LABELS.map((d, i) => (
                    <div
                        key={i}
                        className="text-xs text-gray-400 dark:text-zinc-500 py-1"
                    >
                        {d}
                    </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const status = getDayStatus(
                        day,
                        year,
                        month,
                        today,
                        createdAt,
                        relapses,
                    );
                    return (
                        <div
                            key={day}
                            className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] ${STATUS_CLASSES[status]}`}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-3">
                {LEGEND.map(({ bg, color, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-1.5 text-xs text-gray-500"
                    >
                        <span
                            style={{
                                background: bg,
                                color,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                display: 'inline-block',
                            }}
                        />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
