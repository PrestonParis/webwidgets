import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { Json } from '@/types/supabase';
import type { WidgetSettings } from '@/features/widgets/types/widgets';
import {
    DEFAULT_WIDGET_SETTINGS,
    WIDGET_COLOR_DEFAULTS,
    WIDGET_SIZE_DEFAULTS,
} from '@/features/widgets/types/widgetDefaults';
import { useDebounce } from '@/features/ui/hooks/useDebounce';
import { z } from 'zod';

const scheduleSchema = z
    .object({
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
        days: z.array(z.number()),
    })
    .optional();
const patchSchema = z.object({
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

type Parsed = z.infer<typeof patchSchema>;
export interface StoreWidgetEntry {
    id: string;
    type: string;
}
type SettingsMap = Record<string, WidgetSettings>;

function defaultsFor(widgetType: string): WidgetSettings {
    return {
        ...DEFAULT_WIDGET_SETTINGS,
        color:
            WIDGET_COLOR_DEFAULTS[widgetType] ?? DEFAULT_WIDGET_SETTINGS.color,
        size: WIDGET_SIZE_DEFAULTS[widgetType] ?? DEFAULT_WIDGET_SETTINGS.size,
    };
}

function buildSettingFromParsed(
    d: Parsed,
    defaults: WidgetSettings,
): WidgetSettings {
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

function buildMap(
    widgets: StoreWidgetEntry[],
    data: { widget_id: string; settings: unknown }[] | null,
): SettingsMap {
    const map: SettingsMap = {};
    for (const w of widgets) {
        const defaults = defaultsFor(w.type);
        const row = data?.find((d) => d.widget_id === w.id);
        if (row?.settings) {
            const parsed = patchSchema.safeParse(row.settings);
            if (parsed.success) {
                map[w.id] = buildSettingFromParsed(parsed.data, defaults);
                continue;
            }
        }
        map[w.id] = defaults;
    }
    return map;
}

export function useWidgetSettingsStore(
    userId: string | undefined,
    widgets: StoreWidgetEntry[],
) {
    const [settingsMap, setSettingsMap] = useState<SettingsMap>({});
    const [ready, setReady] = useState(false);
    const pendingUpserts = useRef<Record<string, WidgetSettings>>({});

    useEffect(() => {
        if (!userId || widgets.length === 0) {
            queueMicrotask(() => setReady(true));
            return;
        }
        const ids = widgets.map((w) => w.id);
        void (async () => {
            const { data } = await supabase
                .from('widget_settings')
                .select('widget_id, settings')
                .eq('user_id', userId)
                .in('widget_id', ids);
            setSettingsMap(buildMap(widgets, data));
            setReady(true);
        })();
    }, [userId, widgets]);

    const flushUpserts = useDebounce(() => {
        if (!userId) return;
        const batch = { ...pendingUpserts.current };
        pendingUpserts.current = {};
        const rows = Object.entries(batch).map(([widget_id, settings]) => ({
            user_id: userId,
            widget_id,
            settings: settings as unknown as Json,
        }));
        if (rows.length > 0)
            void supabase
                .from('widget_settings')
                .upsert(rows, { onConflict: 'user_id,widget_id' });
    }, 800);

    const updateSettings = useCallback(
        (
            widgetId: string,
            widgetType: string,
            patch: Partial<WidgetSettings>,
        ) => {
            setSettingsMap((prev) => {
                const next = {
                    ...(prev[widgetId] ?? defaultsFor(widgetType)),
                    ...patch,
                };
                pendingUpserts.current[widgetId] = next;
                flushUpserts();
                return { ...prev, [widgetId]: next };
            });
        },
        [flushUpserts],
    );

    const getSettings = useCallback(
        (widgetId: string, widgetType: string): WidgetSettings =>
            settingsMap[widgetId] ?? defaultsFor(widgetType),
        [settingsMap],
    );

    return { getSettings, updateSettings, ready };
}
