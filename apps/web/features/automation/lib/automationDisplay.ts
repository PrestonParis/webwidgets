import type {
    AutomationRunStatus,
    AutomationSafetyLevel,
    AutomationSchedule,
    AutomationStatus,
} from '@/features/automation/types/automation';
// ─── Status badge styles ───────────────────────────────────────────────────────

export const STATUS_BADGE_STYLES: Record<AutomationStatus, string> = {
    enabled:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    draft: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    needs_setup:
        'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    needs_approval:
        'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    provider_missing:
        'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

export const STATUS_LABELS: Record<AutomationStatus, string> = {
    enabled: 'Enabled',
    paused: 'Paused',
    draft: 'Draft',
    needs_setup: 'Needs setup',
    needs_approval: 'Needs approval',
    provider_missing: 'Provider missing',
    error: 'Error',
};

// ─── Safety level badge styles ─────────────────────────────────────────────────

export const SAFETY_BADGE_STYLES: Record<AutomationSafetyLevel, string> = {
    local_only:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    read_only:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    draft_only: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    approval_required:
        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    external_write: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    disabled: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

export const SAFETY_LABELS: Record<AutomationSafetyLevel, string> = {
    local_only: 'Local only',
    read_only: 'Read only',
    draft_only: 'Draft only',
    approval_required: 'Approval required',
    external_write: 'External write',
    destructive: 'Destructive',
    disabled: 'Disabled',
};

// Safety levels that touch external services and must show warnings.
export function isExternalSafetyLevel(level: AutomationSafetyLevel): boolean {
    return (
        level === 'external_write' ||
        level === 'destructive' ||
        level === 'approval_required'
    );
}

// ─── Run status styles ─────────────────────────────────────────────────────────

export const RUN_STATUS_STYLES: Record<AutomationRunStatus, string> = {
    queued: 'text-zinc-500 dark:text-zinc-400',
    running: 'text-blue-600 dark:text-blue-400',
    waiting_for_approval: 'text-amber-600 dark:text-amber-400',
    completed: 'text-emerald-600 dark:text-emerald-400',
    failed: 'text-red-600 dark:text-red-400',
    skipped: 'text-zinc-400 dark:text-zinc-500',
    cancelled: 'text-zinc-400 dark:text-zinc-500',
};

export const RUN_STATUS_LABELS: Record<AutomationRunStatus, string> = {
    queued: 'Queued',
    running: 'Running',
    waiting_for_approval: 'Waiting for approval',
    completed: 'Completed',
    failed: 'Failed',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
};

// ─── Emoji lookup ──────────────────────────────────────────────────────────────

export function widgetEmoji(_widgetId: string): string {
    return '⚙️';
}

// ─── Schedule summary ──────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function scheduleSummary(schedule?: AutomationSchedule): string {
    if (!schedule) return 'No schedule';
    const at = schedule.time ? ` at ${schedule.time}` : '';
    switch (schedule.type) {
        case 'one_time':
            return `Once${at}`;
        case 'daily':
            return `Daily${at}`;
        case 'weekly': {
            if (schedule.days && schedule.days.length > 0) {
                const names = schedule.days
                    .map((d) => DAY_LABELS[d] ?? '')
                    .filter(Boolean)
                    .join(', ');
                return `Weekly on ${names}${at}`;
            }
            return `Weekly${at}`;
        }
        case 'monthly':
            return `Monthly${at}`;
        case 'specific_days': {
            const names = (schedule.days ?? [])
                .map((d) => DAY_LABELS[d] ?? '')
                .filter(Boolean)
                .join(', ');
            return names ? `${names}${at}` : `Selected days${at}`;
        }
        case 'custom':
            return schedule.interval
                ? `Every ${schedule.interval} min`
                : 'Custom';
        default:
            return 'Scheduled';
    }
}

// ─── Relative time ─────────────────────────────────────────────────────────────

export function relativeTime(iso?: string): string {
    if (!iso) return 'N/A';
    const diff = Date.parse(iso) - Date.now();
    const abs = Math.abs(diff);
    const minutes = Math.round(abs / 60_000);
    const hours = Math.round(abs / 3_600_000);
    const days = Math.round(abs / 86_400_000);
    const suffix = diff < 0 ? 'ago' : 'from now';
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ${suffix}`;
    if (hours < 24) return `${hours}h ${suffix}`;
    return `${days}d ${suffix}`;
}

export function formatDuration(ms?: number): string {
    if (ms === undefined) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}
