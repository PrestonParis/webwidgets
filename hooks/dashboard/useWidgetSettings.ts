'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/hooks/auth/useAuth';
import {
    DEFAULT_WIDGET_SETTINGS,
    WIDGET_COLOR_DEFAULTS,
    WidgetSettings,
} from '@/types/widgets';
import { useDebounce } from '@/hooks/dashboard/global/useDebounce';

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

        (async () => {
            const { data, error } = await supabase
                .from('widget_settings')
                .select('settings')
                .eq('user_id', user.id)
                .eq('widget_id', widgetId)
                .maybeSingle();

            if (cancelled) return;
            if (error) console.error('useWidgetSettings load error:', error);

            if (data?.settings) {
                setSettings({ ...defaultSettings, ...data.settings });
            }
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [user, widgetId, defaultSettings]);

    // ── Debounced upsert ───────────────────────
    const persist = useDebounce(async (next: WidgetSettings) => {
        if (!user?.id) return;
        const { error } = await supabase.from('widget_settings').upsert(
            {
                user_id: user.id,
                widget_id: widgetId,
                settings: next,
            },
            { onConflict: 'user_id,widget_id' },
        );
        if (error) console.error('useWidgetSettings upsert error:', error);
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
