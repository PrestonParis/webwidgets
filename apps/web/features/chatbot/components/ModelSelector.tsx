'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
    MODEL_OPTIONS,
    PROVIDER_LABELS,
} from '@/features/chatbot/lib/modelProviders';
import type { ModelOption } from '@/features/chatbot/types/chat';
import type {
    ModelProvider,
    ModelSelectorProps,
} from '@/features/chatbot/types/chat';

export function ModelSelector({
    selectedModel,
    onSelect,
    savedProviders,
    availability = [],
}: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const current =
        MODEL_OPTIONS.find((m) => m.modelId === selectedModel) ??
        (MODEL_OPTIONS[0] as ModelOption);
    const providers = ['anthropic', 'openai', 'google'] as ModelProvider[];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg px-2.5 py-1.5 transition-colors"
            >
                {current.label}
                <ChevronDown className="w-3 h-3" />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 w-64 overflow-hidden">
                    {providers.map((provider) => {
                        const models = MODEL_OPTIONS.filter(
                            (m) => m.provider === provider,
                        );
                        const providerAvailability = availability.find(
                            (item) => item.provider === provider,
                        );
                        const hasUserKey = savedProviders.includes(provider);
                        const hasServerKey =
                            providerAvailability?.hasServerKey ?? false;
                        const isAvailable =
                            providerAvailability?.available ??
                            (hasUserKey ||
                                !models.some((model) => model.requiresUserKey));
                        return (
                            <div key={provider}>
                                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                                    {PROVIDER_LABELS[provider]}
                                    {hasServerKey && !hasUserKey && (
                                        <span className="ml-1 text-emerald-500">
                                            · server key
                                        </span>
                                    )}
                                    {!isAvailable && (
                                        <span className="ml-1 text-amber-500">
                                            · key required
                                        </span>
                                    )}
                                </div>
                                {models.map((model) => (
                                    <button
                                        key={model.modelId}
                                        type="button"
                                        onClick={() => {
                                            onSelect(
                                                model.modelId,
                                                model.provider,
                                            );
                                            setOpen(false);
                                        }}
                                        disabled={!isAvailable}
                                        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-zinc-100">
                                            {model.label}
                                        </span>
                                        {model.modelId === selectedModel && (
                                            <Check className="w-3.5 h-3.5 text-[#4f6ef7]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                    <div className="border-t border-gray-100 dark:border-zinc-800 px-3 py-2">
                        <a
                            href="/settings"
                            className="text-xs text-[#4f6ef7] hover:underline"
                        >
                            Manage API keys →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
