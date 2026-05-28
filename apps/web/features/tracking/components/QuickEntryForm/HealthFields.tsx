'use client';

import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';
import type { Severity } from '@/features/tracking/health/lib/types';

interface HealthFieldsProps {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const labelCls =
    'mb-1 flex items-center justify-between text-xs font-medium text-gray-600 dark:text-zinc-400';

function readMetricValue(
    form: QuickEntryFormState,
    key: string,
): number | undefined {
    const value = form.metadata[key];
    return typeof value === 'number' ? value : undefined;
}

export function HealthFields({ form, updateField }: HealthFieldsProps) {
    const energyLevel = readMetricValue(form, 'energyLevel');
    const sleepQuality = readMetricValue(form, 'sleepQuality');

    const setMetric = (
        key: 'energyLevel' | 'sleepQuality',
        value: Severity,
    ) => {
        updateField('metadata', { ...form.metadata, [key]: value });
    };

    return (
        <div className="space-y-3">
            <div>
                <label htmlFor="health-quick-energy" className={labelCls}>
                    <span>Energy level</span>
                    <span className="font-semibold text-gray-900 dark:text-zinc-100">
                        {energyLevel ?? '—'}
                        {energyLevel !== undefined ? '/10' : ''}
                    </span>
                </label>
                <input
                    id="health-quick-energy"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={energyLevel ?? 5}
                    onChange={(e) =>
                        setMetric(
                            'energyLevel',
                            Number(e.target.value) as Severity,
                        )
                    }
                    className="w-full accent-rose-500"
                />
            </div>
            <div>
                <label htmlFor="health-quick-sleep" className={labelCls}>
                    <span>Sleep quality</span>
                    <span className="font-semibold text-gray-900 dark:text-zinc-100">
                        {sleepQuality ?? '—'}
                        {sleepQuality !== undefined ? '/10' : ''}
                    </span>
                </label>
                <input
                    id="health-quick-sleep"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={sleepQuality ?? 5}
                    onChange={(e) =>
                        setMetric(
                            'sleepQuality',
                            Number(e.target.value) as Severity,
                        )
                    }
                    className="w-full accent-rose-500"
                />
            </div>
        </div>
    );
}
