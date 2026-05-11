'use client';

import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import type { ProfileEditorProps } from '../types';
import { STANDARD_FIELDS } from '../types';

export function ProfileEditor({ profile, onSave }: ProfileEditorProps) {
    const [fields, setFields] = useState<Record<string, string>>(
        profile.fields,
    );
    const [name, setName] = useState(profile.name);
    const [saving, setSaving] = useState(false);
    const [customKey, setCustomKey] = useState('');

    const standardKeys = new Set(STANDARD_FIELDS.map((f) => f.key));
    const customKeys = Object.keys(fields).filter((k) => !standardKeys.has(k));

    const set = (key: string, val: string) =>
        setFields((prev) => ({ ...prev, [key]: val }));

    const removeCustom = (key: string) =>
        setFields((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });

    const addCustom = () => {
        const key = customKey.trim();
        if (!key || key in fields) return;
        setFields((prev) => ({ ...prev, [key]: '' }));
        setCustomKey('');
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave({ ...profile, name, fields });
        setSaving(false);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Profile name */}
            <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-stone-500 dark:text-zinc-400 w-28 shrink-0">
                    Profile name
                </label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 transition-colors"
                />
            </div>

            {/* Standard fields */}
            <div>
                <p className="text-xs font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                    Your information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STANDARD_FIELDS.map(({ key, label, type }) => (
                        <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs text-stone-500 dark:text-zinc-400">
                                {label}
                            </label>
                            <input
                                type={type ?? 'text'}
                                value={fields[key] ?? ''}
                                onChange={(e) => set(key, e.target.value)}
                                placeholder={label}
                                className="text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 transition-colors"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom fields */}
            <div>
                <p className="text-xs font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                    Custom fields
                </p>
                <div className="flex flex-col gap-2">
                    {customKeys.map((key) => (
                        <div key={key} className="flex items-center gap-2">
                            <span className="text-xs font-mono text-stone-500 dark:text-zinc-400 w-32 shrink-0">
                                {key}
                            </span>
                            <input
                                value={fields[key] ?? ''}
                                onChange={(e) => set(key, e.target.value)}
                                className="flex-1 text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => removeCustom(key)}
                                className="text-red-400 hover:text-red-500 p-1"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCustom();
                                }
                            }}
                            placeholder="field_name"
                            className="w-32 text-xs font-mono bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={addCustom}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-zinc-200 border border-stone-200 dark:border-zinc-700 rounded-lg px-2 py-1.5"
                        >
                            <Plus size={12} /> Add field
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => {
                    void handleSave();
                }}
                disabled={saving}
                className="flex items-center justify-center gap-2 self-end bg-stone-900 dark:bg-amber-500 text-amber-50 dark:text-stone-900 text-sm font-semibold px-5 py-2 rounded-xl hover:bg-stone-700 dark:hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-40"
            >
                <Save size={14} />
                {saving ? 'Saving…' : 'Save profile'}
            </button>
        </div>
    );
}
