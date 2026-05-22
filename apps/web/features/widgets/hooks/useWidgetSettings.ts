'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Json } from '@/types/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { WidgetSettings } from '@/features/widgets/types/widgets';
import {
    DEFAULT_WIDGET_SETTINGS,
    WIDGET_COLOR_DEFAULTS,
    WIDGET_SIZE_DEFAULTS,
} from '@/features/widgets/types/widgetDefaults';
import { useDebounce } from '@/features/ui/hooks/useDebounce';
import { useWidgetSettingsContext } from '@/features/widgets/context/WidgetSettingsContext';
import { z } from 'zod';

const scheduleSchema = z
    .object({
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
        days: z.array(z.number()),
    })
    .optional();

const widgetSettingsPatchSchema = z.object({
    color: z
        .enum([
            'blue',
            'green',
            'amber',
            'purple',
            'red',
            'emerald',
            'zinc',
            'pink',
            'orange',
        ])
        .optional(),
    size: z.enum(['compact', 'default', 'wide', 'large']).optional(),
    background: z.enum(['default', 'glass', 'solid']).optional(),
    opacity: z.number().min(0).max(100).optional(),
    state: z
        .enum(['active', 'passive', 'dormant', 'suspended', 'archived'])
        .optional(),
    pinMode: z.enum(['none', 'viewport', 'canvas', 'anchor']).optional(),
    blur: z.boolean().optional(),
    redact: z.boolean().optional(),
    lowProfile: z.boolean().optional(),
    autoHide: z.boolean().optional(),
    autoHideDuration: z.number().optional(),
    view: z.enum(['timer', 'heatmap']).optional(),
    textEditorMode: z.enum(['document', 'journal', 'note']).optional(),
    timekeepingMode: z
        .enum(['timer', 'pomodoro', 'stopwatch', 'countdown', 'worldclock'])
        .optional(),
    schedule: scheduleSchema,
    anchorId: z.string().optional(),
    crop: z
        .object({
            top: z.number(),
            right: z.number(),
            bottom: z.number(),
            left: z.number(),
        })
        .optional(),
    rules: z
        .array(
            z.object({
                id: z.string(),
                enabled: z.boolean(),
                trigger: z.string(),
                action: z.string(),
            }),
        )
        .optional(),
    backgroundImage: z.string().optional(),
    backgroundBrightness: z.number().optional(),
    customTitle: z.string().optional(),
});

type Parsed = z.infer<typeof widgetSettingsPatchSchema>;

function applyParsed(d: Parsed, defaults: WidgetSettings): WidgetSettings {
    return {
        color: d.color ?? defaults.color,
        size: d.size ?? defaults.size,
        background: d.background ?? defaults.background,
        opacity: d.opacity ?? defaults.opacity,
        state: d.state ?? defaults.state,
        pinMode: d.pinMode ?? defaults.pinMode,
        blur: d.blur ?? defaults.blur,
        redact: d.redact ?? defaults.redact,
        lowProfile: d.lowProfile ?? defaults.lowProfile,
        autoHide: d.autoHide ?? defaults.autoHide,
        autoHideDuration: d.autoHideDuration ?? defaults.autoHideDuration,
        backgroundImage: d.backgroundImage ?? defaults.backgroundImage,
        backgroundBrightness:
            d.backgroundBrightness ?? defaults.backgroundBrightness,
        ...(d.customTitle !== undefined ? { customTitle: d.customTitle } : {}),
        ...(d.view !== undefined ? { view: d.view } : {}),
        ...(d.textEditorMode !== undefined
            ? { textEditorMode: d.textEditorMode }
            : {}),
        ...(d.timekeepingMode !== undefined
            ? { timekeepingMode: d.timekeepingMode }
            : {}),
        ...(d.schedule !== undefined ? { schedule: d.schedule } : {}),
    };
}

export function useWidgetSettings(widgetId: string, widgetType: string) {
    const { user } = useAuth();
    const ctx = useWidgetSettingsContext();

    const defaultSettings = useMemo(
        () => ({
            ...DEFAULT_WIDGET_SETTINGS,
            color:
                WIDGET_COLOR_DEFAULTS[widgetType] ??
                DEFAULT_WIDGET_SETTINGS.color,
            size:
                WIDGET_SIZE_DEFAULTS[widgetType] ??
                DEFAULT_WIDGET_SETTINGS.size,
        }),
        [widgetType],
    );

    const hasCtx = ctx !== null;
    const [localSettings, setLocalSettings] =
        useState<WidgetSettings>(defaultSettings);
    const [localLoading, setLocalLoading] = useState(!hasCtx);

    useEffect(() => {
        if (hasCtx || !user?.id) return;
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
                if (parsed.success)
                    setLocalSettings(applyParsed(parsed.data, defaultSettings));
            }
            setLocalLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [hasCtx, user?.id, widgetId, defaultSettings]);

    const persist = useDebounce((next: WidgetSettings) => {
        if (hasCtx || !user?.id) return;
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

    const localUpdate = useCallback(
        (patch: Partial<WidgetSettings>) => {
            setLocalSettings((prev) => {
                const next = { ...prev, ...patch };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    if (ctx) {
        return {
            settings: ctx.getSettings(widgetId, widgetType),
            updateSettings: (patch: Partial<WidgetSettings>) =>
                ctx.updateSettings(widgetId, widgetType, patch),
            loading: !ctx.ready,
        };
    }
    return {
        settings: localSettings,
        updateSettings: localUpdate,
        loading: Boolean(user?.id) && localLoading,
    };
}
