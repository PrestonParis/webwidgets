'use client';

import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { domainIcons } from '../data';
import type { MemoryDifficulty, MemoryStatus } from '../types';

export const statusStyles: Record<MemoryStatus, string> = {
    new: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300',
    learning:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
    review: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    mastered:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
};

export const gradeStyles: Record<MemoryDifficulty, string> = {
    again: 'bg-rose-600 text-white hover:bg-rose-700',
    hard: 'bg-amber-500 text-white hover:bg-amber-600',
    medium: 'bg-blue-600 text-white hover:bg-blue-700',
    easy: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

export function DomainMark({ domain }: { domain: string }) {
    const Icon = domainIcons[domain] ?? Brain;
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <span
                className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
                )}
            >
                <Icon size={14} />
            </span>
            {domain}
        </span>
    );
}
