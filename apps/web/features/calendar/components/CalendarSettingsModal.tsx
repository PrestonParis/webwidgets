'use client';

import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type {
    CalendarCategory,
    CalendarSettings,
} from '../lib/calendarSettings';
import { COLOR_ID_LABELS } from '../lib/calendarSettings';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180];
const inputCls =
    'w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm px-3 py-2 outline-none focus:border-[#4f6ef7] transition-colors';

interface CalendarSettingsModalProps {
    settings: CalendarSettings;
    onSave: (next: CalendarSettings) => void;
    onClose: () => void;
}

export function CalendarSettingsModal({
    settings,
    onSave,
    onClose,
}: CalendarSettingsModalProps) {
    const [categories, setCategories] = useState<CalendarCategory[]>(() =>
        settings.categories.map((c) => ({ ...c })),
    );
    const [defaultDuration, setDefaultDuration] = useState(
        settings.defaultDurationMinutes,
    );
    const [editingId, setEditingId] = useState<string | null>(null);

    function updateCategory(id: string, patch: Partial<CalendarCategory>) {
        setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        );
    }

    function addCategory() {
        const id = `cat_${Date.now()}`;
        const newCat: CalendarCategory = {
            id,
            name: '',
            colorId: '8',
            defaultDurationMinutes: 60,
            emoji: '📅',
        };
        setCategories((prev) => [...prev, newCat]);
        setEditingId(id);
    }

    function deleteCategory(id: string) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        if (editingId === id) setEditingId(null);
    }

    function handleSave() {
        onSave({
            categories: categories.filter((c) => c.name.trim()),
            defaultDurationMinutes: defaultDuration,
        });
        onClose();
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
                    <h2 className="text-sm font-semibold text-zinc-100">
                        Calendar Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={15} className="text-zinc-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    {/* Default duration */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                            Default event duration
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DURATION_OPTIONS.map((min) => (
                                <button
                                    key={min}
                                    type="button"
                                    onClick={() => setDefaultDuration(min)}
                                    className={cn(
                                        'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                        defaultDuration === min
                                            ? 'bg-[#4f6ef7] text-white'
                                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                                    )}
                                >
                                    {min < 60
                                        ? `${min}m`
                                        : `${min / 60}h${min % 60 ? `${min % 60}m` : ''}`}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1.5 text-[11px] text-zinc-500">
                            Used when no category is selected
                        </p>
                    </div>

                    {/* Categories */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                Event categories
                            </label>
                            <button
                                onClick={addCategory}
                                className="flex items-center gap-1 text-xs font-semibold text-[#4f6ef7] hover:text-blue-300 transition-colors"
                            >
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">
                            Selecting a category when creating an event sets its
                            color and duration. Color maps to Google Calendar —
                            visible in your integrated calendar.
                        </p>

                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <div key={cat.id}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingId(
                                                editingId === cat.id
                                                    ? null
                                                    : cat.id,
                                            )
                                        }
                                        className={cn(
                                            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                                            editingId === cat.id
                                                ? 'bg-zinc-800'
                                                : 'hover:bg-zinc-800/50',
                                        )}
                                    >
                                        <span className="text-base w-6 text-center shrink-0">
                                            {cat.emoji}
                                        </span>
                                        <span className="flex-1 text-sm text-zinc-200 font-medium">
                                            {cat.name || (
                                                <span className="text-zinc-500 italic">
                                                    Unnamed
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            className={cn(
                                                'w-3 h-3 rounded-full shrink-0',
                                                COLOR_ID_LABELS[cat.colorId]
                                                    ?.bg ?? 'bg-zinc-500',
                                            )}
                                        />
                                        <span className="text-xs text-zinc-500 shrink-0">
                                            {cat.defaultDurationMinutes < 60
                                                ? `${cat.defaultDurationMinutes}m`
                                                : `${cat.defaultDurationMinutes / 60}h`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCategory(cat.id);
                                            }}
                                            className="shrink-0 text-zinc-600 hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </button>

                                    {editingId === cat.id && (
                                        <div className="mx-2 mb-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3 space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-medium text-zinc-500 block mb-1">
                                                        Name
                                                    </label>
                                                    <input
                                                        className={inputCls}
                                                        value={cat.name}
                                                        onChange={(e) =>
                                                            updateCategory(
                                                                cat.id,
                                                                {
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder="Category name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-zinc-500 block mb-1">
                                                        Emoji
                                                    </label>
                                                    <input
                                                        className={inputCls}
                                                        value={cat.emoji}
                                                        onChange={(e) =>
                                                            updateCategory(
                                                                cat.id,
                                                                {
                                                                    emoji: e
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                        placeholder="📅"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-medium text-zinc-500 block mb-1">
                                                    Duration
                                                </label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {DURATION_OPTIONS.map(
                                                        (min) => (
                                                            <button
                                                                key={min}
                                                                type="button"
                                                                onClick={() =>
                                                                    updateCategory(
                                                                        cat.id,
                                                                        {
                                                                            defaultDurationMinutes:
                                                                                min,
                                                                        },
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
                                                                    cat.defaultDurationMinutes ===
                                                                        min
                                                                        ? 'bg-[#4f6ef7] text-white'
                                                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
                                                                )}
                                                            >
                                                                {min < 60
                                                                    ? `${min}m`
                                                                    : `${min / 60}h${min % 60 ? `${min % 60}m` : ''}`}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-medium text-zinc-500 block mb-1.5">
                                                    Color (syncs to Google
                                                    Calendar)
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(
                                                        COLOR_ID_LABELS,
                                                    ).map(
                                                        ([
                                                            id,
                                                            { label, bg },
                                                        ]) => (
                                                            <button
                                                                key={id}
                                                                type="button"
                                                                title={label}
                                                                onClick={() =>
                                                                    updateCategory(
                                                                        cat.id,
                                                                        {
                                                                            colorId:
                                                                                id,
                                                                        },
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'w-6 h-6 rounded-full transition-transform hover:scale-110',
                                                                    bg,
                                                                    cat.colorId ===
                                                                        id &&
                                                                        'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110',
                                                                )}
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-800 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 rounded-lg bg-[#4f6ef7] text-white text-sm font-medium hover:bg-[#3d5ce0] transition-colors"
                    >
                        Save settings
                    </button>
                </div>
            </div>
        </div>
    );
}
