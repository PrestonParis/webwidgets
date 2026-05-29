'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

interface WidgetBodyBudgetContextValue {
    enabled: boolean;
    activeIds: Set<string>;
    request: (id: string) => void;
    release: (id: string) => void;
}

const WidgetBodyBudgetContext =
    createContext<WidgetBodyBudgetContextValue | null>(null);

export function WidgetBodyBudgetProvider({
    children,
    enabled,
    maxActive,
}: {
    children: ReactNode;
    enabled: boolean;
    maxActive: number;
}) {
    const [activeIds, setActiveIds] = useState<string[]>([]);

    const request = useCallback(
        (id: string) => {
            if (!enabled) return;
            setActiveIds((current) => {
                if (current.includes(id)) return current;
                if (current.length < maxActive) return [...current, id];
                return [...current.slice(1), id];
            });
        },
        [enabled, maxActive],
    );

    const release = useCallback(
        (id: string) => {
            if (!enabled) return;
            setActiveIds((current) =>
                current.filter((active) => active !== id),
            );
        },
        [enabled],
    );

    const value = useMemo(
        () => ({
            enabled,
            activeIds: new Set(activeIds),
            request,
            release,
        }),
        [activeIds, enabled, release, request],
    );

    return (
        <WidgetBodyBudgetContext.Provider value={value}>
            {children}
        </WidgetBodyBudgetContext.Provider>
    );
}

export function useWidgetBodyBudget(widgetId: string, shouldBeActive: boolean) {
    const budget = useContext(WidgetBodyBudgetContext);

    return {
        budget,
        active: !budget?.enabled || budget.activeIds.has(widgetId),
        shouldBeActive,
    };
}
