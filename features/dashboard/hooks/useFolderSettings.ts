'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/features/ui/hooks/useDebounce';
import { z } from 'zod';
import type { Json } from '@/types/supabase';
import type {
    WidgetColor,
    WidgetBackground,
} from '@/features/widgets/types/widgets';

export interface FolderSettings {
    color: WidgetColor;
    background: WidgetBackground;
    /** 0 = fully opaque (solid), 100 = fully transparent */
    opacity: number;
    /** 0–200, where 100 = normal brightness */
    brightness: number;
}

export const DEFAULT_FOLDER_SETTINGS: FolderSettings = {
    color: 'blue',
    background: 'default',
    opacity: 0,
    brightness: 100,
};

const schema = z.object({
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
    background: z.enum(['default', 'glass', 'solid']).optional(),
    opacity: z.number().min(0).max(100).optional(),
    brightness: z.number().min(0).max(200).optional(),
});

export function useFolderSettings(folderId: string) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<FolderSettings>(
        DEFAULT_FOLDER_SETTINGS,
    );

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        void (async () => {
            const { data } = await supabase
                .from('widget_settings')
                .select('settings')
                .eq('user_id', user.id)
                .eq('widget_id', folderId)
                .maybeSingle();
            if (cancelled) return;
            if (data?.settings) {
                const parsed = schema.safeParse(data.settings);
                if (parsed.success) {
                    setSettings({
                        color:
                            parsed.data.color ?? DEFAULT_FOLDER_SETTINGS.color,
                        background:
                            parsed.data.background ??
                            DEFAULT_FOLDER_SETTINGS.background,
                        opacity:
                            parsed.data.opacity ??
                            DEFAULT_FOLDER_SETTINGS.opacity,
                        brightness:
                            parsed.data.brightness ??
                            DEFAULT_FOLDER_SETTINGS.brightness,
                    });
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user?.id, folderId]);

    const persist = useDebounce((next: FolderSettings) => {
        if (!user?.id) return;
        void supabase
            .from('widget_settings')
            .upsert(
                {
                    user_id: user.id,
                    widget_id: folderId,
                    settings: next as unknown as Json,
                },
                { onConflict: 'user_id,widget_id' },
            )
            .then(({ error }) => {
                if (error)
                    console.error('useFolderSettings upsert error:', error);
            });
    }, 600);

    const updateSettings = useCallback(
        (patch: Partial<FolderSettings>) => {
            setSettings((prev) => {
                const next = { ...prev, ...patch };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    return { settings, updateSettings };
}
