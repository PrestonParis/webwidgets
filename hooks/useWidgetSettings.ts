'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
    DEFAULT_WIDGET_SETTINGS,
    WIDGET_COLOR_DEFAULTS,
    WidgetSettings,
} from '@/types/widgets';

const DEBOUNCE_MS = 800;

export function useWidgetSettings(widgetId: string, widgetType: string) {
    const { user } = useAuth();

    const defaultSettings: WidgetSettings = {
        ...DEFAULT_WIDGET_SETTINGS,
        color:
            WIDGET_COLOR_DEFAULTS[widgetType] ?? DEFAULT_WIDGET_SETTINGS.color,
    };

    const [settings, setSettings] = useState<WidgetSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, widgetId]);

    // ── Debounced upsert ───────────────────────
    const persist = useCallback(
        (next: WidgetSettings) => {
            if (!user?.id) return;
            if (debounceRef.current) clearTimeout(debounceRef.current);

            debounceRef.current = setTimeout(async () => {
                const { error } = await supabase.from('widget_settings').upsert(
                    {
                        user_id: user.id,
                        widget_id: widgetId,
                        settings: next,
                    },
                    { onConflict: 'user_id,widget_id' },
                );
                if (error)
                    console.error('useWidgetSettings upsert error:', error);
            }, DEBOUNCE_MS);
        },
        [user?.id, widgetId],
    );

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
