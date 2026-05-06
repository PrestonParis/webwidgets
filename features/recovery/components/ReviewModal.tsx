'use client';

import { ReviewDay } from '../hooks/useReviewModal';

interface ReviewModalProps {
    days: ReviewDay[];
    saving: boolean;
    onToggle: (date: Date) => void;
    onSetTime: (date: Date, time: string) => void;
    onSave: () => Promise<void>;
    onClose: () => void;
}

const DAY_FMT: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
};

export default function ReviewModal({
    days,
    saving,
    onToggle,
    onSetTime,
    onSave,
    onClose,
}: ReviewModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                            Review Days
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            {days.length === 0
                                ? "You're all caught up!"
                                : `${days.length} day${days.length !== 1 ? 's' : ''} to review`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 text-lg leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-gray-50 dark:divide-zinc-800">
                    {days.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400 dark:text-zinc-500">
                            Nothing to review. Keep it up! 🎉
                        </div>
                    ) : (
                        days.map((day) => (
                            <div
                                key={day.date.toISOString()}
                                className="flex items-center gap-3 px-5 py-3"
                            >
                                <span className="text-xs text-gray-500 dark:text-zinc-400 w-24 shrink-0">
                                    {day.date.toLocaleDateString(
                                        undefined,
                                        DAY_FMT,
                                    )}
                                </span>
                                <div className="flex items-center gap-2 flex-1">
                                    <button
                                        onClick={() => {
                                            if (day.relapsed)
                                                onToggle(day.date);
                                        }}
                                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                                            !day.relapsed
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        ✓ Clean
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!day.relapsed)
                                                onToggle(day.date);
                                        }}
                                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                                            day.relapsed
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        Relapsed
                                    </button>
                                    {day.relapsed && (
                                        <input
                                            type="time"
                                            value={day.time}
                                            onChange={(e) =>
                                                onSetTime(
                                                    day.date,
                                                    e.target.value,
                                                )
                                            }
                                            className="text-xs px-2 py-1 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 outline-none focus:border-red-400"
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            void onSave();
                        }}
                        disabled={saving}
                        className="flex-1 py-2 text-xs rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save review'}
                    </button>
                </div>
            </div>
        </div>
    );
}
