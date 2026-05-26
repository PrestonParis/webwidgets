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
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="supplement-name" className={labelCls}>
                            Supplement
                        </label>
                        <input
                            id="supplement-name"
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
                    </div>
                    <div>
                        <label htmlFor="supplement-brand" className={labelCls}>
                            Brand
                        </label>
                        <input
                            id="supplement-brand"
                            type="text"
                            placeholder="Optional"
                            value={form.supplementBrand ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementBrand',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                    <datalist id="supplement-suggestions">
                        {COMMON_SUPPLEMENTS.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label htmlFor="supplement-form" className={labelCls}>
                            Form
                        </label>
                        <select
                            id="supplement-form"
                            value={form.supplementForm ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementForm',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        >
                            <option value="">Select</option>
                            <option value="capsule">Capsule</option>
                            <option value="tablet">Tablet</option>
                            <option value="powder">Powder</option>
                            <option value="liquid">Liquid</option>
                            <option value="gummy">Gummy</option>
                            <option value="softgel">Softgel</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label
                            htmlFor="supplement-dose-amount"
                            className={labelCls}
                        >
                            Dose
                        </label>
                        <input
                            id="supplement-dose-amount"
                            type="number"
                            min={0}
                            step={0.1}
                            placeholder="200"
                            value={form.supplementDoseAmount ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementDoseAmount',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="supplement-dose-unit"
                            className={labelCls}
                        >
                            Unit
                        </label>
                        <input
                            id="supplement-dose-unit"
                            type="text"
                            placeholder="mg"
                            value={form.supplementDoseUnit ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementDoseUnit',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="supplement-dose" className={labelCls}>
                            Dose label
                        </label>
                        <input
                            id="supplement-dose"
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
                    <div>
                        <label htmlFor="supplement-time" className={labelCls}>
                            Time taken
                        </label>
                        <input
                            id="supplement-time"
                            type="time"
                            value={form.supplementTime ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementTime',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="supplement-status" className={labelCls}>
                        Status
                    </label>
                    <select
                        id="supplement-status"
                        value={form.supplementStatus ?? 'taken'}
                        onChange={(e) =>
                            updateField('supplementStatus', e.target.value)
                        }
                        className={inputCls}
                    >
                        <option value="taken">Taken</option>
                        <option value="skipped">Skipped</option>
                        <option value="missed">Missed</option>
                        <option value="planned">Planned</option>
                    </select>
                </div>

                {form.supplementStatus === 'skipped' && (
                    <div>
                        <label
                            htmlFor="supplement-skip-reason"
                            className={labelCls}
                        >
                            Skip reason
                        </label>
                        <input
                            id="supplement-skip-reason"
                            value={form.supplementSkipReason ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementSkipReason',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label
                            htmlFor="supplement-active-ingredients"
                            className={labelCls}
                        >
                            Active ingredients
                        </label>
                        <input
                            id="supplement-active-ingredients"
                            placeholder="Magnesium glycinate"
                            value={form.supplementActiveIngredients ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementActiveIngredients',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="supplement-inactive-ingredients"
                            className={labelCls}
                        >
                            Inactive ingredients
                        </label>
                        <input
                            id="supplement-inactive-ingredients"
                            placeholder="Gelatin, rice flour"
                            value={form.supplementInactiveIngredients ?? ''}
                            onChange={(e) =>
                                updateField(
                                    'supplementInactiveIngredients',
                                    e.target.value || undefined,
                                )
                            }
                            className={inputCls}
                        />
                    </div>
                </div>

                <details className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 p-2">
                    <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-zinc-300">
                        Effectiveness and side effects
                    </summary>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                            <label
                                htmlFor="supplement-outcome"
                                className={labelCls}
                            >
                                Target outcome
                            </label>
                            <select
                                id="supplement-outcome"
                                value={form.supplementTargetOutcome ?? ''}
                                onChange={(e) =>
                                    updateField(
                                        'supplementTargetOutcome',
                                        e.target.value || undefined,
                                    )
                                }
                                className={inputCls}
                            >
                                <option value="">Select</option>
                                <option value="sleep">Sleep</option>
                                <option value="energy">Energy</option>
                                <option value="focus">Focus</option>
                                <option value="recovery">Recovery</option>
                                <option value="digestion">Digestion</option>
                                <option value="mood">Mood</option>
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="supplement-effectiveness"
                                className={labelCls}
                            >
                                Effectiveness 1-10
                            </label>
                            <input
                                id="supplement-effectiveness"
                                type="number"
                                min={1}
                                max={10}
                                value={form.supplementEffectiveness ?? ''}
                                onChange={(e) =>
                                    updateField(
                                        'supplementEffectiveness',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    )
                                }
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="supplement-side-effect"
                                className={labelCls}
                            >
                                Side effect
                            </label>
                            <input
                                id="supplement-side-effect"
                                value={form.supplementSideEffect ?? ''}
                                onChange={(e) =>
                                    updateField(
                                        'supplementSideEffect',
                                        e.target.value || undefined,
                                    )
                                }
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="supplement-side-effect-severity"
                                className={labelCls}
                            >
                                Severity 1-10
                            </label>
                            <input
                                id="supplement-side-effect-severity"
                                type="number"
                                min={1}
                                max={10}
                                value={form.supplementSideEffectSeverity ?? ''}
                                onChange={(e) =>
                                    updateField(
                                        'supplementSideEffectSeverity',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    )
                                }
                                className={inputCls}
                            />
                        </div>
                    </div>
                </details>
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
