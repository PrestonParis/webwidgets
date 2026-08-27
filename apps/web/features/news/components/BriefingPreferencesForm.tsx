'use client';

import { useState } from 'react';
import type { BriefingPreferences } from '@/lib/briefings/types';

export function BriefingPreferencesForm({
    initial,
    saving,
    onSave,
}: {
    initial: BriefingPreferences;
    saving: boolean;
    onSave: (preferences: BriefingPreferences) => void;
}) {
    const [dailyEnabled, setDailyEnabled] = useState(initial.dailyEnabled);
    const [localTime, setLocalTime] = useState(initial.localTime);
    return (
        <form
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-zinc-200 pt-4 text-xs dark:border-zinc-800"
            onSubmit={(event) => {
                event.preventDefault();
                const detectedTimezone =
                    Intl.DateTimeFormat().resolvedOptions().timeZone;
                onSave({
                    ...initial,
                    dailyEnabled,
                    localTime,
                    timezone:
                        initial.timezone === 'UTC' && detectedTimezone
                            ? detectedTimezone
                            : initial.timezone,
                });
            }}
        >
            <label className="inline-flex items-center gap-2 font-medium">
                <input
                    checked={dailyEnabled}
                    onChange={(event) => setDailyEnabled(event.target.checked)}
                    type="checkbox"
                />
                Daily briefing
            </label>
            <label className="grid gap-1">
                <span>Local time</span>
                <input
                    className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
                    onChange={(event) => setLocalTime(event.target.value)}
                    type="time"
                    value={localTime}
                />
            </label>
            <button
                className="rounded-md border border-zinc-300 px-2 py-1 font-semibold disabled:opacity-50 dark:border-zinc-700"
                disabled={saving}
                type="submit"
            >
                {saving ? 'Saving…' : 'Save schedule'}
            </button>
        </form>
    );
}
