'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    /** Clickable / hoverable card */
    interactive?: boolean;
    /** Selected / active state */
    selected?: boolean;
    /** Glassmorphism overlay */
    glass?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({
    children,
    interactive = false,
    selected = false,
    glass = false,
    padding = 'md',
    className,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
                paddingMap[padding],
                interactive &&
                    'cursor-pointer transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700',
                selected &&
                    'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100',
                glass && 'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function CardHeader({
    title,
    description,
    action,
    className,
}: CardHeaderProps) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-4 mb-4',
                className,
            )}
        >
            <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {title}
                </p>
                {description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

interface CardFooterProps {
    children: ReactNode;
    className?: string;
    border?: boolean;
}

export function CardFooter({
    children,
    className,
    border = true,
}: CardFooterProps) {
    return (
        <div
            className={cn(
                'mt-4 pt-4 flex items-center justify-between gap-2',
                border && 'border-t border-zinc-100 dark:border-zinc-800',
                className,
            )}
        >
            {children}
        </div>
    );
}
