'use client';

import { useEffect, useState } from 'react';
import { bodyZoneEntrySchema } from '@/features/tracking/health/lib/schemas';
import {
    BODY_ZONE_LABELS,
    type BodyZoneEntry,
    type BodyZoneId,
    type PainType,
    type Severity,
} from '@/features/tracking/health/lib/types';

interface ZonePopoverProps {
    zoneId: BodyZoneId | null;
    existing: BodyZoneEntry | undefined;
    onSave: (entry: BodyZoneEntry) => void;
    onClear: () => void;
    onClose: () => void;
}

const btnCls = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors';

export default function ZonePopover({
    zoneId,
    existing,
    onSave,
    onClear,
    onClose,
}: ZonePopoverProps) {
    const [type, setType] = useState<PainType>(existing?.type ?? 'soreness');
    const [intensity, setIntensity] = useState<Severity>(
        existing?.intensity ?? 3,
    );
    const [notes, setNotes] = useState(existing?.notes ?? '');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setType(existing?.type ?? 'soreness');
            setIntensity(existing?.intensity ?? 3);
            setNotes(existing?.notes ?? '');
            setError(null);
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [zoneId, existing]);

    if (!zoneId) return null;

    const handleSave = () => {
        const candidate: BodyZoneEntry = {
            type,
            intensity,
            timestamp: new Date().toISOString(),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        };
        const result = bodyZoneEntrySchema.safeParse(candidate);
        if (!result.success) {
            setError(result.error.issues[0]?.message ?? 'Invalid entry');
            return;
        }
        onSave(candidate);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 sm:absolute sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bg-transparent sm:p-0"
            role="dialog"
            aria-modal="true"
            aria-label={`Log ${BODY_ZONE_LABELS[zoneId]}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-xs space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                        {BODY_ZONE_LABELS[zoneId]}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                    >
                        ✕
                    </button>
                </div>

                <div>
                    <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">
                        Type
                    </span>
                    <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-zinc-800">
                        {(['soreness', 'injury'] as PainType[]).map(
                            (option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setType(option)}
                                    className={`flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize ${
                                        type === option
                                            ? 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                                            : 'text-gray-500 dark:text-zinc-400'
                                    }`}
                                >
                                    {option}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="zone-intensity"
                        className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600 dark:text-zinc-400"
                    >
                        <span>Intensity</span>
                        <span className="font-semibold text-gray-900 dark:text-zinc-100">
                            {intensity}/10
                        </span>
                    </label>
                    <input
                        id="zone-intensity"
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={intensity}
                        onChange={(e) =>
                            setIntensity(Number(e.target.value) as Severity)
                        }
                        className="w-full accent-rose-500"
                    />
                </div>

                <div>
                    <label
                        htmlFor="zone-notes"
                        className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400"
                    >
                        Notes
                    </label>
                    <textarea
                        id="zone-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder="Optional details"
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-rose-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}

                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        type="button"
                        onClick={handleSave}
                        className={`${btnCls} bg-rose-500 text-white hover:bg-rose-600`}
                    >
                        Save
                    </button>
                    {existing && (
                        <button
                            type="button"
                            onClick={onClear}
                            className={`${btnCls} border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30`}
                        >
                            Clear
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className={`${btnCls} bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
