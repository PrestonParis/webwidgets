'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';

interface AccessibilitySettings {
    high_contrast: boolean;
    reduce_motion: boolean;
    font_size: string;
    transcription_first: boolean;
}

export default function AccessibilityWidget({
    widgetId = 'accessibility',
}: {
    widgetId?: string;
}) {
    const [settings, setSettings] = useState<AccessibilitySettings | null>(
        null,
    );

    useEffect(() => {
        void apiRouteFetch('/api/accessibility/settings')
            .then((r) =>
                r.ok
                    ? (r.json() as Promise<AccessibilitySettings>)
                    : Promise.resolve(null),
            )
            .then((s) => setSettings(s))
            .catch(() => setSettings(null));
    }, []);

    const activeCount = settings
        ? [
              settings.high_contrast,
              settings.reduce_motion,
              settings.transcription_first,
          ].filter(Boolean).length
        : 0;

    return (
        <WidgetShell
            icon={<ShieldCheck size={16} />}
            title="Accessibility"
            badge={
                <span className="text-[10px] font-bold text-emerald-500">
                    AUDIT
                </span>
            }
            widgetId={widgetId}
            widgetType="accessibility"
            footerHref="/accessibility"
            footerLabel="View full audit ->"
        >
            <div className="space-y-2.5">
                {settings === null ? (
                    <p className="text-xs text-zinc-400">Loading…</p>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <ShieldCheck
                                size={14}
                                className="shrink-0 text-emerald-500"
                            />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {activeCount}
                                <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                                    accessibility{' '}
                                    {activeCount === 1 ? 'option' : 'options'}{' '}
                                    active
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="shrink-0 text-xs font-mono text-zinc-400 dark:text-zinc-500 w-3.5 text-center">
                                Aa
                            </span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                Font size:{' '}
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {settings.font_size}
                                </span>
                            </p>
                        </div>
                        {activeCount === 0 && (
                            <p className="text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
                                No accessibility preferences saved yet. Open the
                                audit to configure your workspace.
                            </p>
                        )}
                    </>
                )}
            </div>
        </WidgetShell>
    );
}
