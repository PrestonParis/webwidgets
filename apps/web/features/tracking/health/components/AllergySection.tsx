'use client';

import type {
    AllergySeverity,
    AllergyTrigger,
} from '@/features/tracking/health/lib/types';

const ALLERGY_TRIGGERS: AllergyTrigger[] = [
    'pollen',
    'dust',
    'pet',
    'food',
    'mold',
    'medication',
    'insect',
    'other',
];
const ALLERGY_SEVERITIES: AllergySeverity[] = ['mild', 'moderate', 'severe'];

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-rose-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

interface AllergySectionProps {
    enabled: boolean;
    onToggle: (v: boolean) => void;
    trigger: AllergyTrigger;
    onTriggerChange: (v: AllergyTrigger) => void;
    severity: AllergySeverity;
    onSeverityChange: (v: AllergySeverity) => void;
    symptoms: string;
    onSymptomsChange: (v: string) => void;
}

export function AllergySection({
    enabled,
    onToggle,
    trigger,
    onTriggerChange,
    severity,
    onSeverityChange,
    symptoms,
    onSymptomsChange,
}: AllergySectionProps) {
    return (
        <div className="space-y-3 rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/50">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="accent-rose-500"
                />
                Log allergy
            </label>
            {enabled && (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label
                                htmlFor="allergy-trigger"
                                className={labelCls}
                            >
                                Trigger
                            </label>
                            <select
                                id="allergy-trigger"
                                value={trigger}
                                onChange={(e) =>
                                    onTriggerChange(
                                        e.target.value as AllergyTrigger,
                                    )
                                }
                                className={inputCls}
                            >
                                {ALLERGY_TRIGGERS.map((t) => (
                                    <option
                                        key={t}
                                        value={t}
                                        className="capitalize"
                                    >
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="allergy-severity"
                                className={labelCls}
                            >
                                Severity
                            </label>
                            <select
                                id="allergy-severity"
                                value={severity}
                                onChange={(e) =>
                                    onSeverityChange(
                                        e.target.value as AllergySeverity,
                                    )
                                }
                                className={inputCls}
                            >
                                {ALLERGY_SEVERITIES.map((s) => (
                                    <option
                                        key={s}
                                        value={s}
                                        className="capitalize"
                                    >
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="allergy-symptoms" className={labelCls}>
                            Symptoms
                        </label>
                        <input
                            id="allergy-symptoms"
                            type="text"
                            placeholder="e.g. Sneezing, itchy eyes"
                            value={symptoms}
                            onChange={(e) => onSymptomsChange(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
