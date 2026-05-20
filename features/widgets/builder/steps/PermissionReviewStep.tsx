'use client';

import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionSchema';

interface PermissionReviewStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

const PERMISSION_ICONS: Record<string, string> = {
    finance_data: '💰',
    tracking_sensitive: '🏥',
    ai_analysis: '🤖',
    automation_actions: '⚙️',
    external_imports: '🌐',
};

export function PermissionReviewStep({
    definition,
}: PermissionReviewStepProps) {
    const permissions = definition.permissions ?? [];
    const actions = definition.actions ?? [];
    const automations = definition.automations ?? [];
    const dataSources = definition.dataSources ?? [];

    const hasAnyConfig =
        permissions.length > 0 || actions.length > 0 || automations.length > 0;

    if (!hasAnyConfig) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-4xl">✅</span>
                <p className="text-sm font-medium text-zinc-300">
                    No special permissions required
                </p>
                <p className="text-xs text-zinc-500">
                    This widget only reads basic display data.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {permissions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                        Data access required
                    </p>
                    <div className="space-y-2">
                        {permissions.map((p) => (
                            <div
                                key={p.scope}
                                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${p.required ? 'border-amber-700 bg-amber-950/20' : 'border-zinc-700 bg-zinc-800/30'}`}
                            >
                                <span className="text-base mt-0.5">
                                    {PERMISSION_ICONS[p.scope] ?? '🔐'}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold text-zinc-200 font-mono">
                                            {p.scope}
                                        </p>
                                        {p.required && (
                                            <span className="text-[9px] text-amber-400 border border-amber-700 rounded px-1">
                                                required
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                        {p.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {actions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                        User actions enabled
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {actions.map((a) => (
                            <span
                                key={a.registryId}
                                className="rounded-full border border-emerald-700 bg-emerald-900/30 px-2.5 py-1 text-xs text-emerald-300"
                            >
                                {a.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {automations.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                        Automations configured
                    </p>
                    <div className="space-y-1.5">
                        {automations.map((a) => (
                            <div
                                key={a.trigger}
                                className="flex items-center gap-2 rounded-xl border border-blue-800 bg-blue-950/20 px-3 py-2"
                            >
                                <span className="text-[10px] font-mono text-blue-400">
                                    {a.trigger}
                                </span>
                                <span className="text-zinc-600">→</span>
                                <span className="text-[10px] font-mono text-blue-300">
                                    {a.action}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dataSources.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                        Connected data
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {dataSources.map((ds) => (
                            <span
                                key={ds.id}
                                className="rounded-full border border-zinc-600 bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400"
                            >
                                {ds.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4">
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                    This widget only accesses the data and performs the actions
                    listed above. No data is sent externally unless an API data
                    source is configured. You can disable or remove this widget
                    at any time from the dashboard.
                </p>
            </div>
        </div>
    );
}
