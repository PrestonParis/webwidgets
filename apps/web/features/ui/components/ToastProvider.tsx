'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
    CheckCircle2Icon,
    XCircleIcon,
    InfoIcon,
    AlertTriangleIcon,
    XIcon,
} from 'lucide-react';
import { useToast, type ToastType } from '@/features/ui/hooks/useToast';
import { cn } from '@/lib/utils/utils';

interface ToastContextValue {
    show: (message: string, type?: ToastType, duration?: number) => string;
    dismiss: (id: string) => void;
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const iconMap: Record<ToastType, typeof CheckCircle2Icon> = {
    success: CheckCircle2Icon,
    error: XCircleIcon,
    info: InfoIcon,
    warning: AlertTriangleIcon,
};

const styleMap: Record<ToastType, string> = {
    success:
        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning:
        'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
};

const iconStyleMap: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const { toasts, show, dismiss, success, error, info, warning } = useToast();

    return (
        <ToastContext.Provider
            value={{ show, dismiss, success, error, info, warning }}
        >
            {children}
            <div
                className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
                aria-live="polite"
                aria-label="Notifications"
            >
                {toasts.map((t) => {
                    const Icon = iconMap[t.type];
                    return (
                        <div
                            key={t.id}
                            role="status"
                            className={cn(
                                'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg pointer-events-auto',
                                'animate-in fade-in slide-in-from-bottom-2 duration-200',
                                styleMap[t.type],
                            )}
                        >
                            <Icon
                                size={16}
                                className={cn(
                                    'mt-0.5 shrink-0',
                                    iconStyleMap[t.type],
                                )}
                            />
                            <p className="flex-1 text-sm font-medium leading-snug">
                                {t.message}
                            </p>
                            <button
                                type="button"
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Dismiss"
                            >
                                <XIcon size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToastContext(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('useToastContext must be used within ToastProvider');
    return ctx;
}
