import type {
    Supplement,
    ScheduleWarning,
} from '@/features/tracking/types/supplement';

function toMinutes(hhmm: string): number {
    const parts = hhmm.split(':');
    return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
}

function fmtTime(hhmm: string): string {
    const parts = hhmm.split(':');
    const h = parseInt(parts[0] ?? '0', 10);
    const m = parseInt(parts[1] ?? '0', 10);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatScheduleLabel(s: Supplement): string {
    switch (s.scheduleType) {
        case 'by_time':
            return `By ${fmtTime(s.scheduleStart)}`;
        case 'after_time':
            return `After ${fmtTime(s.scheduleStart)}`;
        case 'window':
            return `${fmtTime(s.scheduleStart)}–${fmtTime(s.scheduleEnd ?? s.scheduleStart)}`;
    }
}

// Warning for an already-recorded log entry
export function getLogWarning(
    supplement: Supplement,
    loggedAt: string,
): ScheduleWarning | null {
    const logTime = new Date(loggedAt);
    const logMins = logTime.getHours() * 60 + logTime.getMinutes();
    const start = toMinutes(supplement.scheduleStart);

    switch (supplement.scheduleType) {
        case 'by_time':
            if (logMins > start) return 'taken_late';
            break;
        case 'after_time':
            if (logMins < start) return 'taken_early';
            break;
        case 'window': {
            const end = toMinutes(
                supplement.scheduleEnd ?? supplement.scheduleStart,
            );
            if (logMins < start || logMins > end) return 'taken_outside_window';
            break;
        }
    }
    return null;
}

// Warning based on current time (before logging)
export function getCurrentWarning(
    supplement: Supplement,
): ScheduleWarning | null {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(supplement.scheduleStart);

    switch (supplement.scheduleType) {
        case 'by_time':
            if (nowMins > start) return 'overdue';
            break;
        case 'after_time':
            if (nowMins < start) return 'not_yet_time';
            break;
        case 'window': {
            const end = toMinutes(
                supplement.scheduleEnd ?? supplement.scheduleStart,
            );
            if (nowMins < start) return 'not_yet_time';
            if (nowMins > end) return 'overdue';
            break;
        }
    }
    return null;
}

export function warningMessage(
    warning: ScheduleWarning,
    supplement: Supplement,
): string {
    const label = formatScheduleLabel(supplement);
    switch (warning) {
        case 'taken_late':
            return `Taken after deadline (${label})`;
        case 'taken_early':
            return `Taken before scheduled time (${label})`;
        case 'taken_outside_window':
            return `Taken outside window (${label})`;
        case 'not_yet_time':
            return `Not yet time (${label})`;
        case 'overdue':
            return `Overdue (${label})`;
    }
}

export function warningShort(warning: ScheduleWarning): string {
    switch (warning) {
        case 'taken_late':
            return 'Taken late';
        case 'taken_early':
            return 'Taken early';
        case 'taken_outside_window':
            return 'Off-schedule';
        case 'not_yet_time':
            return 'Not yet';
        case 'overdue':
            return 'Overdue';
    }
}
