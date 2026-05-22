'use client';

import { useState } from 'react';
import type {
    CustomCategoryDef,
    FieldDef,
    FieldType,
} from '@/features/tracking/types/customCategories';

const FIELD_TYPES: { type: FieldType; label: string }[] = [
    { type: 'number', label: 'Number' },
    { type: 'text', label: 'Text' },
    { type: 'boolean', label: 'Yes / No' },
    { type: 'select', label: 'Dropdown' },
    { type: 'range', label: 'Range (slider)' },
];

const COLOR_OPTIONS = [
    'indigo',
    'teal',
    'rose',
    'amber',
    'cyan',
    'violet',
    'emerald',
    'sky',
];

const EMOJI_SUGGESTIONS = [
    '📊',
    '💧',
    '🧘',
    '💤',
    '🚴',
    '🎯',
    '🧪',
    '📝',
    '🔬',
    '🌡️',
    '⚡',
    '🏃',
];

interface FieldEditorProps {
    field: FieldDef;
    index: number;
    onChange: (i: number, f: FieldDef) => void;
    onRemove: (i: number) => void;
}

function FieldEditor({ field, index, onChange, onRemove }: FieldEditorProps) {
    const updateOptionalNumber = (key: 'min' | 'max', raw: string) => {
        const next = { ...field };
        if (raw) next[key] = Number(raw);
        else delete next[key];
        onChange(index, next);
    };

    const updateOptionalUnit = (raw: string) => {
        const next = { ...field };
        if (raw) next.unit = raw;
        else delete next.unit;
        onChange(index, next);
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 p-3 space-y-2">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Field name (e.g. Amount)"
                    value={field.label}
                    onChange={(e) =>
                        onChange(index, {
                            ...field,
                            label: e.target.value,
                            key: e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, '_'),
                        })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400"
                />
                <select
                    value={field.type}
                    onChange={(e) =>
                        onChange(index, {
                            ...field,
                            type: e.target.value as FieldType,
                        })
                    }
                    className="text-xs px-2 py-1 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none"
                >
                    {FIELD_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => onRemove(index)}
                    className="text-red-400 hover:text-red-600 text-xs"
                >
                    ✕
                </button>
            </div>
            {(field.type === 'number' || field.type === 'range') && (
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={field.min ?? ''}
                        onChange={(e) =>
                            updateOptionalNumber('min', e.target.value)
                        }
                        className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={field.max ?? ''}
                        onChange={(e) =>
                            updateOptionalNumber('max', e.target.value)
                        }
                        className="w-20 px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Unit (e.g. ml)"
                        value={field.unit ?? ''}
                        onChange={(e) => updateOptionalUnit(e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                    />
                </div>
            )}
            {field.type === 'select' && (
                <input
                    type="text"
                    placeholder="Options, comma-separated (e.g. Low, Medium, High)"
                    value={(field.options ?? []).join(', ')}
                    onChange={(e) =>
                        onChange(index, {
                            ...field,
                            options: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                        })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none"
                />
            )}
        </div>
    );
}

interface CreateFormProps {
    onSave: (
        label: string,
        emoji: string,
        color: string,
        fields: FieldDef[],
    ) => void;
    onCancel: () => void;
}

function CreateForm({ onSave, onCancel }: CreateFormProps) {
    const [label, setLabel] = useState('');
    const [emoji, setEmoji] = useState('📊');
    const [color, setColor] = useState('indigo');
    const [fields, setFields] = useState<FieldDef[]>([
        { key: 'value', label: 'Value', type: 'number' },
    ]);

    const updateField = (i: number, f: FieldDef) =>
        setFields((prev) => prev.map((x, j) => (j === i ? f : x)));
    const removeField = (i: number) =>
        setFields((prev) => prev.filter((_, j) => j !== i));
    const addField = () =>
        setFields((prev) => [
            ...prev,
            { key: `field_${prev.length}`, label: '', type: 'text' },
        ]);

    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
                        Emoji
                    </p>
                    <div className="flex flex-wrap gap-1 w-36">
                        {EMOJI_SUGGESTIONS.map((e) => (
                            <button
                                key={e}
                                onClick={() => setEmoji(e)}
                                className={`text-base p-1 rounded-lg transition-colors ${emoji === e ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
                            Name
                        </p>
                        <input
                            type="text"
                            placeholder="e.g. Water Intake"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
                            Color
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {COLOR_OPTIONS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-5 h-5 rounded-full bg-${c}-500 transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
                    Fields
                </p>
                {fields.map((f, i) => (
                    <FieldEditor
                        key={i}
                        field={f}
                        index={i}
                        onChange={updateField}
                        onRemove={removeField}
                    />
                ))}
                <button
                    onClick={addField}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                    + Add field
                </button>
            </div>

            <div className="flex gap-2 justify-end pt-1">
                <button
                    onClick={onCancel}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() =>
                        label.trim() &&
                        onSave(label.trim(), emoji, color, fields)
                    }
                    disabled={!label.trim()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                    Create category
                </button>
            </div>
        </div>
    );
}

interface CustomCategoryManagerProps {
    categories: CustomCategoryDef[];
    onAdd: (
        label: string,
        emoji: string,
        color: string,
        fields: FieldDef[],
    ) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export function CustomCategoryManager({
    categories,
    onAdd,
    onDelete,
    onClose,
}: CustomCategoryManagerProps) {
    const [showCreate, setShowCreate] = useState(categories.length === 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                        Custom categories
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 text-lg"
                    >
                        ✕
                    </button>
                </div>

                {categories.length > 0 && (
                    <div className="space-y-2">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-zinc-800"
                            >
                                <span className="text-xl">{cat.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                                        {cat.label}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                        {cat.fields.length} field
                                        {cat.fields.length !== 1 ? 's' : ''} ·
                                        ID: {cat.id}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onDelete(cat.id)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {showCreate ? (
                    <CreateForm
                        onSave={(label, emoji, color, fields) => {
                            onAdd(label, emoji, color, fields);
                            setShowCreate(false);
                        }}
                        onCancel={() => setShowCreate(false)}
                    />
                ) : (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-full text-xs py-2 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-500 hover:border-indigo-500 transition-colors"
                    >
                        + New custom category
                    </button>
                )}
            </div>
        </div>
    );
}
