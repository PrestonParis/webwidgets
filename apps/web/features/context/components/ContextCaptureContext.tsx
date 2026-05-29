'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type {
    ContextEntryType,
    ContextCaptureProviderProps,
    UpsertEntryPayload,
} from '@/features/context/types/context';

interface CaptureEvent {
    widgetType: string;
    eventType: string;
    data?: Record<string, unknown>;
}

interface ContextCaptureContextValue {
    capture: (
        widgetType: string,
        eventType: string,
        data?: Record<string, unknown>,
    ) => void;
    pendingCaptures: CaptureEvent[];
    flushCaptures: () => CaptureEvent[];
    permissionsEnabled: boolean;
}

const ContextCaptureContext = createContext<ContextCaptureContextValue>({
    capture: () => undefined,
    pendingCaptures: [],
    flushCaptures: () => [],
    permissionsEnabled: false,
});

export function ContextCaptureProvider({
    children,
    permissionsEnabled = true,
    onCapture,
}: ContextCaptureProviderProps) {
    const [pendingCaptures, setPendingCaptures] = useState<CaptureEvent[]>([]);

    const capture = useCallback(
        (
            widgetType: string,
            eventType: string,
            data?: Record<string, unknown>,
        ) => {
            if (!permissionsEnabled) return;
            const event: CaptureEvent = {
                widgetType,
                eventType,
                ...(data !== undefined && { data }),
            };
            setPendingCaptures((prev) => [...prev.slice(-49), event]);

            if (onCapture) {
                const payload: UpsertEntryPayload = {
                    entityId: `widget-${widgetType}`,
                    entryType: 'widget' as ContextEntryType,
                    label: widgetType,
                    data: {
                        lastInteraction: eventType,
                        lastInteractionAt: new Date().toISOString(),
                        ...(data ?? {}),
                    },
                };
                onCapture(payload);
            }
        },
        [permissionsEnabled, onCapture],
    );

    const flushCaptures = useCallback(() => {
        const captured = [...pendingCaptures];
        setPendingCaptures([]);
        return captured;
    }, [pendingCaptures]);

    return (
        <ContextCaptureContext.Provider
            value={{
                capture,
                pendingCaptures,
                flushCaptures,
                permissionsEnabled,
            }}
        >
            {children}
        </ContextCaptureContext.Provider>
    );
}

export function useContextCapture() {
    return useContext(ContextCaptureContext);
}
