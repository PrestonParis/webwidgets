'use client';

import { useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ContextCaptureProvider } from '@/features/context/components/ContextCaptureContext';
import { upsertEntry } from '@/features/context/api/contextApi';
import type { UpsertEntryPayload } from '@/features/context/types/context';

const DEBOUNCE_MS = 60_000;

function useDebouncedCapture() {
    const { status } = useAuth();
    const lastUpdated = useRef<Map<string, number>>(new Map());

    return useCallback(
        (payload: UpsertEntryPayload) => {
            if (status !== 'authenticated') return;
            const now = Date.now();
            const last = lastUpdated.current.get(payload.entityId) ?? 0;
            if (now - last < DEBOUNCE_MS) return;
            lastUpdated.current.set(payload.entityId, now);
            void upsertEntry(payload).catch(() => undefined);
        },
        [status],
    );
}

export function ContextCaptureGateway({ children }: { children: ReactNode }) {
    const onCapture = useDebouncedCapture();
    return (
        <ContextCaptureProvider permissionsEnabled onCapture={onCapture}>
            {children}
        </ContextCaptureProvider>
    );
}
