'use client';

import type { LucideIcon } from 'lucide-react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface EmptyStateAction {
    label: string;
    onClick: () => void;
}

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
    sm: { icon: 16, title: 'text-sm font-medium', desc: 'text-xs', btn: 'text-xs px-3 py-1.5' },
    md: { icon: 24, title: 'text-sm font-semibold', desc: 'text-sm', btn: 'text-sm px-4 py-2' },
    lg: { icon: 32, title: 'text-base font-semibold', desc: 'text-sm', btn: 'text-sm px-5 py-2.5' },
};

export function EmptyState({
    icon: Icon = InboxIcon,
    title,
    description,
    action,
    className,
    size = 'md',
}: EmptyStateProps) {
    const s = sizeMap[size];
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 py-10 px-6 text-center',
                className,
            )}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                <Icon size={s.icon} />
            </div>
            <div className="space-y-1">
                <p className={cn(s.title, 'text-zinc-900 dark:text-zinc-100')}>{title}</p>
                {description && (
                    <p className={cn(s.desc, 'text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed')}>
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={cn(
                        s.btn,
                        'mt-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium transition-opacity hover:opacity-80',
                    )}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
