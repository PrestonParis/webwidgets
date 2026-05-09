'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Json } from '@/types/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    DEFAULT_WIDGET_SETTINGS,
    WIDGET_COLOR_DEFAULTS,
    WidgetSettings,
} from '@/features/widgets/types/widgets';
import { useDebounce } from '@/features/ui/hooks/useDebounce';
import { z } from 'zod';

const widgetSettingsObjectSchema = z.object({
    color: z.enum([
        'blue',
        'green',
        'amber',
        'purple',
        'red',
        'emerald',
        'zinc',
        'pink',
        'orange',
    ]),
    size: z.enum(['compact', 'default', 'large']),
    background: z.enum(['default', 'glass', 'solid']),
    view: z.enum(['timer', 'heatmap']).optional(),
});

const widgetSettingsPatchSchema = widgetSettingsObjectSchema.partial();

export function useWidgetSettings(widgetId: string, widgetType: string) {
    const { user } = useAuth();

    const defaultSettings = useMemo(() => {
        return {
            ...DEFAULT_WIDGET_SETTINGS,
            color:
                WIDGET_COLOR_DEFAULTS[widgetType] ??
                DEFAULT_WIDGET_SETTINGS.color,
        };
    }, [widgetType]);

    const [settings, setSettings] = useState<WidgetSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    // ── Load on mount ──────────────────────────
    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;

        void (async () => {
            const { data, error } = await supabase
                .from('widget_settings')
                .select('settings')
                .eq('user_id', user.id)
                .eq('widget_id', widgetId)
                .maybeSingle();

            if (cancelled) return;
            if (error) console.error('useWidgetSettings load error:', error);

            if (data?.settings) {
                const parsed = widgetSettingsPatchSchema.safeParse(
                    data.settings,
                );
                if (parsed.success) {
                    const mergedSettings: WidgetSettings = {
                        color: parsed.data.color ?? defaultSettings.color,
                        size: parsed.data.size ?? defaultSettings.size,
                        background:
                            parsed.data.background ??
                            defaultSettings.background,
                        ...(parsed.data.view !== undefined
                            ? { view: parsed.data.view }
                            : {}),
                    };
                    setSettings(mergedSettings);
                }
            }
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [user, widgetId, defaultSettings]);

    // ── Debounced upsert ───────────────────────
    const persist = useDebounce((next: WidgetSettings) => {
        if (!user?.id) return;
        void supabase
            .from('widget_settings')
            .upsert(
                {
                    user_id: user.id,
                    widget_id: widgetId,
                    settings: next as unknown as Json,
                },
                { onConflict: 'user_id,widget_id' },
            )
            .then(({ error }) => {
                if (error)
                    console.error('useWidgetSettings upsert error:', error);
            });
    }, 800);

    // ── Update helper (merges partial) ────────
    const updateSettings = useCallback(
        (patch: Partial<WidgetSettings>) => {
            setSettings((prev) => {
                const next = { ...prev, ...patch };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    return { settings, updateSettings, loading };
}
