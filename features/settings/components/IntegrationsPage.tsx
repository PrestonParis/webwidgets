'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2, Link2Off } from 'lucide-react';
import { groupedProviders } from '@/features/settings/lib/integrationCatalog';
import type { IntegrationProvider } from '@/features/settings/lib/integrationCatalog';
import { useIntegrations } from '@/features/settings/hooks/useIntegrations';
import { cn } from '@/lib/utils/utils';

// ─── integration card ─────────────────────────────────────────────────────────

interface CardProps {
    provider: IntegrationProvider;
    connected: boolean;
    hasKey: boolean;
    saving: boolean;
    onConnect: (p: IntegrationProvider) => void;
    onSaveKey: (id: string, key: string) => void;
    onRemoveKey: (id: string) => void;
}

function IntegrationCard({
    provider,
    connected,
    saving,
    onConnect,
    onSaveKey,
    onRemoveKey,
}: CardProps) {
    const [expanded, setExpanded] = useState(false);
    const [keyValue, setKeyValue] = useState('');

    const statusDot = connected ? (
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
    ) : (
        <span className="w-2 h-2 rounded-full bg-gray-200 dark:bg-zinc-700 shrink-0" />
    );

    if (provider.comingSoon) {
        return (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 opacity-50">
                {statusDot}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                        {provider.name}
                        <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
                            Soon
                        </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {provider.description}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-start gap-3 p-4">
                {statusDot}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                        {provider.name}
                        {provider.beta && (
                            <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-500 px-1.5 py-0.5 rounded-full">
                                Beta
                            </span>
                        )}
                        {connected && (
                            <Check size={12} className="text-emerald-500" />
                        )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {provider.description}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {connected && provider.connectMethod === 'api_key' && (
                        <button
                            onClick={() => onRemoveKey(provider.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                        >
                            <Link2Off size={12} /> Remove
                        </button>
                    )}
                    {!connected && provider.connectMethod === 'oauth' && (
                        <button
                            onClick={() => onConnect(provider)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                        >
                            Connect
                        </button>
                    )}
                    {provider.connectMethod === 'api_key' && !connected && (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                expanded
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                            )}
                        >
                            {expanded ? (
                                <ChevronUp size={12} />
                            ) : (
                                <ChevronDown size={12} />
                            )}
                            {expanded ? 'Cancel' : 'Add key'}
                        </button>
                    )}
                </div>
            </div>
            {expanded && provider.connectMethod === 'api_key' && (
                <div className="px-4 pb-4 flex gap-2 border-t border-gray-50 dark:border-zinc-800 pt-3">
                    <input
                        type="password"
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        placeholder={
                            provider.keyPlaceholder ?? 'Paste your API key'
                        }
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]"
                        autoComplete="off"
                    />
                    <button
                        onClick={() => {
                            void onSaveKey(provider.id, keyValue);
                            setExpanded(false);
                            setKeyValue('');
                        }}
                        disabled={!keyValue.trim() || saving}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-[#4f6ef7] text-white hover:bg-[#3d5ce0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                    >
                        {saving ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : null}
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
    const { states, loading, saving, connectGoogle, saveKey, removeKey } =
        useIntegrations();
    const groups = groupedProviders();

    const handleConnect = (provider: IntegrationProvider) => {
        if (
            provider.connectMethod === 'oauth' &&
            (provider.group === 'google' || provider.group === 'microsoft')
        ) {
            void connectGoogle(provider.oauthScopes ?? []);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-bold">Integrations</h1>
                <p className="text-sm text-gray-500">
                    Connect your tools and services to power your dashboard.
                </p>
            </div>
            {groups.map(({ group, label, providers }) => (
                <div key={group} className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        {label}
                    </h2>
                    <div className="grid gap-2">
                        {providers.map((provider) => {
                            const state = states[provider.id] ?? {
                                connected: false,
                                hasKey: false,
                            };
                            return (
                                <IntegrationCard
                                    key={provider.id}
                                    provider={provider}
                                    connected={state.connected}
                                    hasKey={state.hasKey}
                                    saving={saving === provider.id}
                                    onConnect={handleConnect}
                                    onSaveKey={(id, key) =>
                                        void saveKey(id, key)
                                    }
                                    onRemoveKey={(id) => void removeKey(id)}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
