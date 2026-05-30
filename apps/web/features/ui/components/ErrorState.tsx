'use client';

import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
    sm: {
        icon: 16,
        title: 'text-sm font-medium',
        msg: 'text-xs',
        btn: 'text-xs px-3 py-1.5 gap-1.5',
    },
    md: {
        icon: 20,
        title: 'text-sm font-semibold',
        msg: 'text-sm',
        btn: 'text-sm px-4 py-2 gap-2',
    },
    lg: {
        icon: 24,
        title: 'text-base font-semibold',
        msg: 'text-sm',
        btn: 'text-sm px-5 py-2.5 gap-2',
    },
};

export function ErrorState({
    title = 'Something went wrong',
    message = 'An error occurred while loading this content.',
    onRetry,
    className,
    size = 'md',
}: ErrorStateProps) {
    const s = sizeMap[size];
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 py-10 px-6 text-center',
                className,
            )}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500">
                <AlertCircleIcon size={s.icon} />
            </div>
            <div className="space-y-1">
                <p className={cn(s.title, 'text-zinc-900 dark:text-zinc-100')}>
                    {title}
                </p>
                <p
                    className={cn(
                        s.msg,
                        'text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed',
                    )}
                >
                    {message}
                </p>
            </div>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className={cn(
                        s.btn,
                        'mt-1 flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',
                    )}
                >
                    <RefreshCwIcon size={12} />
                    Try again
                </button>
            )}
        </div>
    );
}
