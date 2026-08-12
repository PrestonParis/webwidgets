'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import DatePicker from '@/features/ui/datepicker/DatePicker';
import { useQuickEntryForm } from '@/features/tracking/hooks/useQuickEntryForm';
import {
    BUILT_IN_CATEGORIES,
    getCategoryLabel,
} from '@/features/tracking/constants';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';
import { TrackingIcon } from './TrackingIcon';
import { getTrackingCategoryConfig } from '@/features/tracking/lib/categoryConfig';
import { SleepFields } from './QuickEntryFormSleepFields';
import { WorkoutFields } from './QuickEntryFormWorkoutFields';
import { MealFields } from './QuickEntryFormMealFields';
import { MoodFields } from './QuickEntryFormMoodFields';
import { SupplementFields } from './QuickEntryFormSupplementFields';
import { HealthFields } from './QuickEntryFormHealthFields';
import { CustomFields } from './QuickEntryFormCustomFields';

interface QuickEntryFormProps {
    initialCategory?: string;
    lockCategory?: boolean;
    onSubmit: (entry: BaseTrackingEntry) => Promise<void>;
    onCancel?: () => void;
    customCategories?: CustomCategoryDef[];
    editEntry?: {
        id: string;
        metadata: Record<string, unknown>;
        notes?: string;
        entryDate: string;
    };
}

const btnCls = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors';

function CategoryTabs({
    active,
    onChange,
    customCategories,
}: {
    active: string;
    onChange: (c: string) => void;
    customCategories?: CustomCategoryDef[] | undefined;
}) {
    const all = [
        ...BUILT_IN_CATEGORIES.map((id) => ({
            id,
            label: getCategoryLabel(id),
            icon: getTrackingCategoryConfig(id).icon,
        })),
        ...(customCategories ?? []).map((d) => ({
            id: d.id,
            label: d.label,
            icon: 'Shapes',
        })),
    ];
    return (
        <div className="flex flex-wrap gap-1">
            {all.map((c) => (
                <button
                    key={c.id}
                    type="button"
                    onClick={() => onChange(c.id)}
                    className={`${btnCls} ${active === c.id ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <TrackingIcon name={c.icon} className="h-3.5 w-3.5" />
                        {c.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

function CategoryFields({
    form,
    updateField,
    customDef,
}: {
    form: ReturnType<typeof useQuickEntryForm>['form'];
    updateField: ReturnType<typeof useQuickEntryForm>['updateField'];
    customDef?: CustomCategoryDef | undefined;
}) {
    if (customDef)
        return (
            <CustomFields
                fields={customDef.fields}
                form={form}
                updateField={updateField}
            />
        );
    if (form.category === 'sleep')
        return <SleepFields form={form} updateField={updateField} />;
    if (form.category === 'workout')
        return <WorkoutFields form={form} updateField={updateField} />;
    if (form.category === 'meal')
        return <MealFields form={form} updateField={updateField} />;
    if (form.category === 'mood')
        return <MoodFields form={form} updateField={updateField} />;
    if (form.category === 'health')
        return <HealthFields form={form} updateField={updateField} />;
    return (
        <SupplementFields
            category={form.category}
            form={form}
            updateField={updateField}
        />
    );
}

export function QuickEntryForm({
    initialCategory,
    lockCategory = false,
    onSubmit,
    onCancel,
    customCategories,
    editEntry,
}: QuickEntryFormProps) {
    const { form, updateField, reset, toBaseEntry, isSaving, setIsSaving } =
        useQuickEntryForm(initialCategory ?? 'sleep', editEntry);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const customDef = customCategories?.find((d) => d.id === form.category);

    const handleSubmit = async () => {
        const entry = toBaseEntry();
        if (!entry) return;
        setIsSaving(true);
        try {
            await onSubmit(entry);
            reset();
        } finally {
            setIsSaving(false);
        }
    };

    const dateLabel = new Date(form.entryDate + 'T00:00:00').toLocaleDateString(
        undefined,
        {
            month: 'short',
            day: 'numeric',
        },
    );

    return (
        <div className="space-y-3 text-sm">
            {!lockCategory && (
                <CategoryTabs
                    active={form.category}
                    onChange={(c) => updateField('category', c)}
                    customCategories={customCategories}
                />
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowDatePicker((v) => !v)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-indigo-400 transition-colors"
                >
                    <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={13} aria-hidden="true" />
                        {dateLabel}
                    </span>
                </button>
                {showDatePicker && (
                    // fixed positioning escapes the widget's overflow:hidden so the
                    // calendar isn't clipped on compact/small widgets
                    <div
                        className="fixed z-200 mt-1"
                        style={{ top: 'auto', left: 'auto' }}
                    >
                        <div className="relative">
                            <DatePicker
                                value={new Date(
                                    form.entryDate + 'T00:00:00',
                                ).toISOString()}
                                onChange={(iso) => {
                                    updateField('entryDate', iso.slice(0, 10));
                                    setShowDatePicker(false);
                                }}
                                onCancel={() => setShowDatePicker(false)}
                                accentColor="#6366f1"
                            />
                        </div>
                    </div>
                )}
            </div>

            <CategoryFields
                form={form}
                updateField={updateField}
                customDef={customDef}
            />

            <div>
                <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={form.notes ?? ''}
                    onChange={(e) =>
                        updateField('notes', e.target.value || undefined)
                    }
                    className="w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400"
                />
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => {
                        void handleSubmit();
                    }}
                    disabled={isSaving}
                    className={`${btnCls} bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50`}
                >
                    {isSaving
                        ? 'Saving…'
                        : editEntry
                          ? 'Update Entry'
                          : 'Log Entry'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={`${btnCls} bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700`}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
