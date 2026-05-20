'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { WidgetSettings } from '@/features/widgets/types/widgets';
import {
    useWidgetSettingsStore,
    type StoreWidgetEntry,
} from '@/features/widgets/hooks/useWidgetSettingsStore';

interface ContextValue {
    getSettings: (widgetId: string, widgetType: string) => WidgetSettings;
    updateSettings: (
        widgetId: string,
        widgetType: string,
        patch: Partial<WidgetSettings>,
    ) => void;
    ready: boolean;
}

const WidgetSettingsContext = createContext<ContextValue | null>(null);

export function WidgetSettingsProvider({
    widgets,
    children,
}: {
    widgets: StoreWidgetEntry[];
    children: ReactNode;
}) {
    const { user } = useAuth();
    const { getSettings, updateSettings, ready } = useWidgetSettingsStore(
        user?.id,
        widgets,
    );
    return (
        <WidgetSettingsContext.Provider
            value={{ getSettings, updateSettings, ready }}
        >
            {children}
        </WidgetSettingsContext.Provider>
    );
}

export function useWidgetSettingsContext(): ContextValue | null {
    return useContext(WidgetSettingsContext);
}
