'use client';

import { cn } from '@/lib/utils/utils';
import type {
    AutomationSafetyLevel,
    AutomationStatus,
} from '@/features/automation/types/automation';
import {
    SAFETY_BADGE_STYLES,
    SAFETY_LABELS,
    STATUS_BADGE_STYLES,
    STATUS_LABELS,
} from '@/features/automation/lib/automationDisplay';

const BADGE_BASE = 'rounded-full px-2 py-0.5 text-[10px] font-semibold';

export function StatusBadge({ status }: { status: AutomationStatus }) {
    return (
        <span className={cn(BADGE_BASE, STATUS_BADGE_STYLES[status])}>
            {STATUS_LABELS[status]}
        </span>
    );
}

export function SafetyBadge({ level }: { level: AutomationSafetyLevel }) {
    return (
        <span className={cn(BADGE_BASE, SAFETY_BADGE_STYLES[level])}>
            {SAFETY_LABELS[level]}
        </span>
    );
}

export function Toggle({
    enabled,
    disabled = false,
    onClick,
    label,
}: {
    enabled: boolean;
    disabled?: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-40',
                enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700',
            )}
        >
            <span
                className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
