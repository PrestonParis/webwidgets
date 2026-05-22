// localStorage layer for reading preferences and last-position fallback.
// Server is authoritative; this is a performance shortcut only.

import type { ReadingPreferences } from '@/features/reading/types/plans';
import type { ReadingPosition } from '@/features/reading/types/positions';
import { DEFAULT_READING_PREFERENCES } from '@/features/reading/types/plans';

const PREFS_KEY = 'reading_prefs';
const POSITION_PREFIX = 'reading_pos_';

export function loadPreferences(): ReadingPreferences {
    if (typeof window === 'undefined') return DEFAULT_READING_PREFERENCES;
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return DEFAULT_READING_PREFERENCES;
        return {
            ...DEFAULT_READING_PREFERENCES,
            ...(JSON.parse(raw) as Partial<ReadingPreferences>),
        };
    } catch {
        return DEFAULT_READING_PREFERENCES;
    }
}

export function savePreferences(prefs: ReadingPreferences): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
        // Quota exceeded — silently ignore
    }
}

export function loadLastPosition(documentId: string): ReadingPosition | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(`${POSITION_PREFIX}${documentId}`);
        if (!raw) return null;
        return JSON.parse(raw) as ReadingPosition;
    } catch {
        return null;
    }
}

export function saveLastPosition(
    documentId: string,
    position: ReadingPosition,
): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(
            `${POSITION_PREFIX}${documentId}`,
            JSON.stringify(position),
        );
    } catch {
        // Quota exceeded — silently ignore
    }
}

export function clearLastPosition(documentId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${POSITION_PREFIX}${documentId}`);
}
