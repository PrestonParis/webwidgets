'use client';

import {
    COMMON_SUPPLEMENTS,
    COMMON_SYMPTOMS,
} from '@/features/tracking/trackingData';
import type { QuickEntryFormState } from '@/features/tracking/hooks/useQuickEntryForm';
import type { TrackingCategory } from '@/features/tracking/types/tracking';

interface SupplementFieldsProps {
    category: TrackingCategory;
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
}

const inputCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';
const labelCls =
    'block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1';

export function SupplementFields({
    category,
    form,
    updateField,
}: SupplementFieldsProps) {
    if (category === 'supplement') {
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelCls}>Supplement</label>
                    <input
                        type="text"
                        list="supplement-suggestions"
                        placeholder="e.g. Vitamin D"
                        value={form.supplementName ?? ''}
                        onChange={(e) =>
                            updateField(
                                'supplementName',
                                e.target.value || undefined,
                            )
                        }
                        className={inputCls}
                    />
                    <datalist id="supplement-suggestions">
                        {COMMON_SUPPLEMENTS.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </div>
                <div>
                    <label className={labelCls}>Dose (optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. 2000 IU"
                        value={form.supplementDose ?? ''}
                        onChange={(e) =>
                            updateField(
                                'supplementDose',
                                e.target.value || undefined,
                            )
                        }
                        className={inputCls}
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.supplementTaken ?? true}
                        onChange={(e) =>
                            updateField('supplementTaken', e.target.checked)
                        }
                        className="accent-indigo-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-zinc-300">
                        Taken
                    </span>
                </label>
            </div>
        );
    }

    if (category === 'symptom') {
        const severity = form.symptomSeverity ?? 5;
        return (
            <div className="space-y-3">
                <div>
                    <label className={labelCls}>Symptom</label>
                    <input
                        type="text"
                        list="symptom-suggestions"
                        placeholder="e.g. Headache"
                        value={form.symptomName ?? ''}
                        onChange={(e) =>
                            updateField(
                                'symptomName',
                                e.target.value || undefined,
                            )
                        }
                        className={inputCls}
                    />
                    <datalist id="symptom-suggestions">
                        {COMMON_SYMPTOMS.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </div>
                <div>
                    <label className={labelCls}>
                        Severity —{' '}
                        <span className="text-indigo-500">{severity}/10</span>
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={severity}
                        onChange={(e) =>
                            updateField(
                                'symptomSeverity',
                                parseInt(e.target.value, 10),
                            )
                        }
                        className="w-full accent-indigo-500"
                    />
                </div>
            </div>
        );
    }

    const severity = form.injurySeverity ?? 5;
    return (
        <div className="space-y-3">
            <div>
                <label className={labelCls}>Location</label>
                <input
                    type="text"
                    placeholder="e.g. Left knee"
                    value={form.injuryLocation ?? ''}
                    onChange={(e) =>
                        updateField(
                            'injuryLocation',
                            e.target.value || undefined,
                        )
                    }
                    className={inputCls}
                />
            </div>
            <div>
                <label className={labelCls}>
                    Severity —{' '}
                    <span className="text-indigo-500">{severity}/10</span>
                </label>
                <input
                    type="range"
                    min={1}
                    max={10}
                    value={severity}
                    onChange={(e) =>
                        updateField(
                            'injurySeverity',
                            parseInt(e.target.value, 10),
                        )
                    }
                    className="w-full accent-indigo-500"
                />
            </div>
        </div>
    );
}
