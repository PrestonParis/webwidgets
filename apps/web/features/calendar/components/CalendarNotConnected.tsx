'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function CalendarNotConnected() {
    const { connectCalendar } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl">
                📅
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                    Connect Google Calendar
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                    View your events alongside your dashboard
                </p>
            </div>
            <button
                onClick={() => {
                    void connectCalendar();
                }}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
                Connect Calendar
            </button>
        </div>
    );
}
