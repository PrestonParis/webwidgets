'use client';

interface CalendarConnectProps {
    onConnect: () => void;
}

export function CalendarConnect({ onConnect }: CalendarConnectProps) {
    return (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>
                    📅
                </span>
                <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                        Connect Google Calendar
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                        Auto-surface events and deadlines from your emails
                    </p>
                </div>
            </div>
            <button
                onClick={onConnect}
                className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
            >
                Connect
            </button>
        </div>
    );
}
