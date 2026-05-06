import { useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { useDebounce } from '@/features/ui/hooks/useDebounce';
import {
    makePersistKey,
    makePersistTimestampKey,
} from '../lib/dashboardLayout';

export function useLayoutPersistence(userId: string | undefined) {
    const persistToDb = useDebounce((next: WidgetConfig[], uid: string) => {
        void supabase.from('dashboard_layouts').upsert(
            {
                user_id: uid,
                layout: next,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
        );
    }, 1200);

    return useCallback(
        (next: WidgetConfig[]) => {
            if (!userId) return;
            const ts = new Date().toISOString();
            localStorage.setItem(makePersistKey(userId), JSON.stringify(next));
            localStorage.setItem(makePersistTimestampKey(userId), ts);
            persistToDb(next, userId);
        },
        [userId, persistToDb],
    );
}
