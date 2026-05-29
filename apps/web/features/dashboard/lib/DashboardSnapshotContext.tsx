'use client';

import { createContext, useContext } from 'react';
import type {
    ScreenSnapshot,
    WidgetSnapshot,
} from '@/features/widgets/types/snapshot';

const DashboardSnapshotContext = createContext<ScreenSnapshot | null>(null);

export function DashboardSnapshotProvider({
    snapshot,
    children,
}: {
    snapshot: ScreenSnapshot | null;
    children: React.ReactNode;
}) {
    return (
        <DashboardSnapshotContext.Provider value={snapshot}>
            {children}
        </DashboardSnapshotContext.Provider>
    );
}

export function useDashboardSnapshotContext() {
    return useContext(DashboardSnapshotContext);
}

export function useWidgetSnapshot<T = unknown>(
    widgetId: string,
): WidgetSnapshot<T> | null {
    const snapshot = useDashboardSnapshotContext();
    return (
        (snapshot?.widgets[widgetId] as WidgetSnapshot<T> | undefined) ?? null
    );
}
