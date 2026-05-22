'use client';

import { useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback((
        message: string,
        type: ToastType = 'info',
        duration = 4000,
    ): string => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type, duration }]);
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
        return id;
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback((msg: string, dur?: number) => show(msg, 'success', dur), [show]);
    const error = useCallback((msg: string, dur?: number) => show(msg, 'error', dur), [show]);
    const info = useCallback((msg: string, dur?: number) => show(msg, 'info', dur), [show]);
    const warning = useCallback((msg: string, dur?: number) => show(msg, 'warning', dur), [show]);

    return { toasts, show, dismiss, success, error, info, warning };
}
