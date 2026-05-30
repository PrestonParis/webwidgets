'use client';

import { useCallback, useState } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'error' | 'success' | 'info';
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback(
        (
            message: string,
            type: 'error' | 'success' | 'info' = 'info',
            duration = 5000,
        ) => {
            const id = Math.random().toString(36).slice(2);
            const toast: Toast = { id, message, type, duration };
            setToasts((prev) => [...prev, toast]);
            if (duration) {
                setTimeout(() => {
                    setToasts((prev) => prev.filter((t) => t.id !== id));
                }, duration);
            }
            return id;
        },
        [],
    );

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const error = useCallback(
        (message: string, duration?: number) =>
            show(message, 'error', duration),
        [show],
    );

    const success = useCallback(
        (message: string, duration?: number) =>
            show(message, 'success', duration),
        [show],
    );

    const info = useCallback(
        (message: string, duration?: number) => show(message, 'info', duration),
        [show],
    );

    return { toasts, show, dismiss, error, success, info };
}
