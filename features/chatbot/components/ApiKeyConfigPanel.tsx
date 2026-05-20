'use client';

import { useState } from 'react';
import { Key, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import {
    PROVIDER_LABELS,
    ALL_PROVIDERS,
} from '@/features/chatbot/lib/modelProviders';
import type { ModelProvider } from '@/features/chatbot/types/chat';
import { useModelKeys } from '@/features/chatbot/hooks/useModelKeys';

function KeyRow({
    provider,
    hasKey,
    onSave,
    onRemove,
    saving,
}: {
    provider: ModelProvider;
    hasKey: boolean;
    onSave: (key: string) => void;
    onRemove: () => void;
    saving: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState('');
    const [visible, setVisible] = useState(false);

    const handleSave = () => {
        if (!value.trim()) return;
        onSave(value.trim());
        setValue('');
        setEditing(false);
    };

    if (hasKey && !editing) {
        return (
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-zinc-300">
                        {PROVIDER_LABELS[provider]}
                    </span>
                    <span className="text-xs text-gray-400">key saved</span>
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-1 text-red-400 hover:text-red-500"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    if (editing) {
        return (
            <div className="flex flex-col gap-1.5 py-2">
                <span className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {PROVIDER_LABELS[provider]}
                </span>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type={visible ? 'text' : 'password'}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={`${PROVIDER_LABELS[provider]} API key`}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30"
                        />
                        <button
                            type="button"
                            onClick={() => setVisible((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {visible ? (
                                <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                                <Eye className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !value.trim()}
                        className="px-3 py-1.5 text-xs bg-[#4f6ef7] text-white rounded-lg disabled:opacity-40"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-gray-400">
                <Key className="w-3.5 h-3.5" />
                <span className="text-sm">{PROVIDER_LABELS[provider]}</span>
            </div>
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-[#4f6ef7] hover:underline"
            >
                Add key
            </button>
        </div>
    );
}

export function ApiKeyConfigPanel() {
    const { savedProviders, saving, hasKey, save, remove } = useModelKeys();

    return (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-[#4f6ef7]" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                    Model API Keys
                </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
                Anthropic models work out of the box. Add your own keys to
                unlock OpenAI and Google models.
            </p>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {ALL_PROVIDERS.map((provider) => (
                    <KeyRow
                        key={provider}
                        provider={provider}
                        hasKey={hasKey(provider)}
                        onSave={(key) => void save(provider, key)}
                        onRemove={() => void remove(provider)}
                        saving={saving}
                    />
                ))}
            </div>
        </div>
    );
}
