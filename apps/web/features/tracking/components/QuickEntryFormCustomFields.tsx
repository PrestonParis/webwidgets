'use client';

import type { FieldDef } from '@/features/tracking/types/customCategories';
import type { useQuickEntryForm } from '@/features/tracking/hooks/useQuickEntryForm';

interface CustomFieldsProps {
    fields: FieldDef[];
    form: ReturnType<typeof useQuickEntryForm>['form'];
    updateField: ReturnType<typeof useQuickEntryForm>['updateField'];
}

const fieldCls =
    'w-full px-2 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400';

export function CustomFields({ fields, form, updateField }: CustomFieldsProps) {
    if (fields.length === 0) return null;

    return (
        <div className="space-y-2">
            {fields.map((field) => {
                const rawVal = form.metadata[field.key];
                const strVal =
                    typeof rawVal === 'string' || typeof rawVal === 'number'
                        ? String(rawVal)
                        : '';

                if (field.type === 'boolean') {
                    return (
                        <label
                            key={field.key}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={rawVal === true}
                                onChange={(e) =>
                                    updateField('metadata', {
                                        ...form.metadata,
                                        [field.key]: e.target.checked,
                                    })
                                }
                                className="rounded"
                            />
                            <span className="text-xs text-gray-700 dark:text-zinc-300">
                                {field.label}
                            </span>
                        </label>
                    );
                }

                if (field.type === 'range') {
                    const min = field.min ?? 0;
                    const max = field.max ?? 10;
                    const step = field.step ?? 1;
                    const numVal = typeof rawVal === 'number' ? rawVal : min;
                    return (
                        <div key={field.key}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600 dark:text-zinc-400">
                                    {field.label}
                                </span>
                                <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                    {numVal}
                                    {field.unit ? ` ${field.unit}` : ''}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={numVal}
                                onChange={(e) =>
                                    updateField('metadata', {
                                        ...form.metadata,
                                        [field.key]: Number(e.target.value),
                                    })
                                }
                                className="w-full accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                <span>{min}</span>
                                <span>{max}</span>
                            </div>
                        </div>
                    );
                }

                if (field.type === 'select') {
                    const options = field.options ?? [];
                    return (
                        <div key={field.key}>
                            <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                                {field.label}
                            </label>
                            <select
                                value={strVal}
                                onChange={(e) =>
                                    updateField('metadata', {
                                        ...form.metadata,
                                        [field.key]: e.target.value,
                                    })
                                }
                                className={fieldCls}
                            >
                                <option value="">Select…</option>
                                {options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                }

                if (field.type === 'number') {
                    return (
                        <div key={field.key}>
                            <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                                {field.label}
                                {field.unit ? ` (${field.unit})` : ''}
                            </label>
                            <input
                                type="number"
                                min={field.min}
                                max={field.max}
                                step={field.step ?? 1}
                                value={strVal}
                                placeholder={
                                    field.required ? 'Required' : 'Optional'
                                }
                                onChange={(e) =>
                                    updateField('metadata', {
                                        ...form.metadata,
                                        [field.key]: e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    })
                                }
                                className={fieldCls}
                            />
                        </div>
                    );
                }

                return (
                    <div key={field.key}>
                        <label className="block text-xs text-gray-600 dark:text-zinc-400 mb-1">
                            {field.label}
                        </label>
                        <input
                            type="text"
                            value={strVal}
                            placeholder={
                                field.required ? 'Required' : 'Optional'
                            }
                            onChange={(e) =>
                                updateField('metadata', {
                                    ...form.metadata,
                                    [field.key]: e.target.value || undefined,
                                })
                            }
                            className={fieldCls}
                        />
                    </div>
                );
            })}
        </div>
    );
}
