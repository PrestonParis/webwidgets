'use client';

import { create } from 'zustand';
import type { MetricsFilter } from '../types/metrics';
import { DEFAULT_FILTER } from '../types/metrics';

interface MetricsFilterStore extends MetricsFilter {
    setDateRange: (from: string, to: string) => void;
    setUserSegment: (v: string) => void;
    setWidgetCategory: (v: string) => void;
    setEnvironment: (v: string) => void;
    setModelVersion: (v: string) => void;
    setActionType: (v: string) => void;
    reset: () => void;
}

export const useMetricsFilter = create<MetricsFilterStore>((set) => ({
    ...DEFAULT_FILTER,

    setDateRange: (from, to) => set((s) => ({ dateRange: { from, to }, ...s })),
    setUserSegment: (userSegment) => set({ userSegment }),
    setWidgetCategory: (widgetCategory) => set({ widgetCategory }),
    setEnvironment: (environment) => set({ environment }),
    setModelVersion: (modelVersion) => set({ modelVersion }),
    setActionType: (actionType) => set({ actionType }),
    reset: () => set({ ...DEFAULT_FILTER }),
}));
