import type {
    TrackingEntry,
    TrackingCategory,
} from '@/features/tracking/types/tracking';
import {
    getCategoryLabel as _getCatLabel,
    getCategoryColor as _getCatColor,
    getCategoryEmoji as _getCatEmoji,
} from '@/features/tracking/constants';

export function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr + 'T00:00:00Z');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export function formatTime(timeStr?: string): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;

    const hour = parseInt(h, 10);
    const min = parseInt(m, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;
}

export function calculateSleepDuration(
    bedtime?: string,
    wakeTime?: string,
): { hours: number; minutes: number } | null {
    if (!bedtime || !wakeTime) return null;

    const bParts = bedtime.split(':');
    const wParts = wakeTime.split(':');
    const bh = parseInt(bParts[0] ?? '', 10);
    const bm = parseInt(bParts[1] ?? '', 10);
    const wh = parseInt(wParts[0] ?? '', 10);
    const wm = parseInt(wParts[1] ?? '', 10);

    if (isNaN(bh) || isNaN(bm) || isNaN(wh) || isNaN(wm)) return null;

    const bedTotalMin = bh * 60 + bm;
    let wakeTotalMin = wh * 60 + wm;

    if (wakeTotalMin < bedTotalMin) wakeTotalMin += 24 * 60;

    const diffMin = wakeTotalMin - bedTotalMin;
    return { hours: Math.floor(diffMin / 60), minutes: diffMin % 60 };
}

export function formatSleepDuration(hours: number, minutes: number): string {
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

export function groupEntriesByDate(
    entries: TrackingEntry[],
): Map<string, TrackingEntry[]> {
    const grouped = new Map<string, TrackingEntry[]>();
    for (const entry of entries) {
        const list = grouped.get(entry.entryDate) ?? [];
        list.push(entry);
        grouped.set(entry.entryDate, list);
    }
    return grouped;
}

export function filterByDateRange(
    entries: TrackingEntry[],
    startDate: Date,
    endDate: Date,
): TrackingEntry[] {
    return entries.filter((e) => {
        const entryDate = new Date(e.entryDate + 'T00:00:00Z');
        return entryDate >= startDate && entryDate <= endDate;
    });
}

export function getCategoryLabel(category: TrackingCategory): string {
    return _getCatLabel(category);
}

export function categoryColor(category: TrackingCategory): string {
    return _getCatColor(category);
}

export function categoryEmoji(category: TrackingCategory): string {
    return _getCatEmoji(category);
}

export function formatMetadataDisplay(
    category: TrackingCategory,
    metadata: Record<string, unknown>,
): string {
    if (category === 'sleep') {
        const bedtime =
            typeof metadata['bedtime'] === 'string'
                ? metadata['bedtime']
                : undefined;
        const wakeTime =
            typeof metadata['wakeTime'] === 'string'
                ? metadata['wakeTime']
                : undefined;
        const quality =
            typeof metadata['quality'] === 'number'
                ? metadata['quality']
                : undefined;
        const duration = calculateSleepDuration(bedtime, wakeTime);
        if (duration)
            return formatSleepDuration(duration.hours, duration.minutes);
        if (quality !== undefined) return `Quality: ${quality}/10`;
        return '—';
    }

    if (category === 'workout') {
        const parts: string[] = [];
        if (typeof metadata['workoutType'] === 'string')
            parts.push(metadata['workoutType']);
        if (typeof metadata['duration'] === 'number')
            parts.push(`${metadata['duration']}m`);
        if (typeof metadata['intensity'] === 'number')
            parts.push(`${metadata['intensity']}/10`);
        return parts.length > 0 ? parts.join(' • ') : 'Workout';
    }

    if (category === 'meal') {
        const parts: string[] = [];
        if (typeof metadata['description'] === 'string')
            parts.push(metadata['description']);
        if (typeof metadata['protein'] === 'number')
            parts.push(`${metadata['protein']}g protein`);
        return parts.length > 0 ? parts.join(' • ') : 'Meal';
    }

    if (category === 'mood') {
        const score =
            typeof metadata['score'] === 'number' ? metadata['score'] : null;
        return score !== null ? `Mood: ${score}/5` : '—';
    }

    if (category === 'supplement') {
        const name =
            typeof metadata['name'] === 'string'
                ? metadata['name']
                : 'Supplement';
        const taken = metadata['taken'] === true ? 'taken' : 'skipped';
        return `${name} — ${taken}`;
    }

    if (category === 'symptom') {
        const name =
            typeof metadata['name'] === 'string' ? metadata['name'] : 'Symptom';
        const severity =
            typeof metadata['severity'] === 'number'
                ? ` (${metadata['severity']}/10)`
                : '';
        return `${name}${severity}`;
    }

    if (category === 'injury') {
        const location =
            typeof metadata['location'] === 'string'
                ? metadata['location']
                : 'Injury';
        const severity =
            typeof metadata['severity'] === 'number'
                ? ` (${metadata['severity']}/10)`
                : '';
        return `${location}${severity}`;
    }

    return '—';
}
