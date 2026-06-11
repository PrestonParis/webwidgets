'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useToast, type Toast } from '@/features/finance/hooks/useToast';

interface ToastContextType {
    toasts: Toast[];
    show: (
        message: string,
        type?: 'error' | 'success' | 'info',
        duration?: number,
    ) => string;
    dismiss: (id: string) => void;
    error: (message: string, duration?: number) => string;
    success: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const toast = useToast();
    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
                {toast.toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-4 ${
                            t.type === 'error'
                                ? 'bg-red-500 text-white'
                                : t.type === 'success'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-blue-500 text-white'
                        }`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToastContext must be used within ToastProvider');
    }
    return ctx;
}
