import type { ReadingPosition } from './positions';

export interface ReadingPlanReading {
    documentId: string;
    versionId?: string;
    position?: ReadingPosition;
    positionEnd?: ReadingPosition;
    label: string; // 'Genesis 1–2', 'Surah 1'
}

export interface ReadingPlanEntry {
    day: number;
    readings: ReadingPlanReading[];
    completed: boolean;
    completedAt?: string;
}

export interface ReadingPlan {
    id: string;
    userId: string;
    title: string;
    description?: string;
    entries: ReadingPlanEntry[];
    startDate?: string; // ISO date
    currentDay: number;
    streak: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ReadingProgress {
    id: string;
    userId: string;
    documentId: string;
    versionId?: string;
    lastPosition: ReadingPosition;
    percentComplete: number;
    timeSpentMinutes: number;
    lastReadAt: string;
    completedAt?: string;
    updatedAt: string;
}

export type ReadingPreferenceFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ReadingPreferenceFontFamily = 'serif' | 'sans' | 'mono';
export type ReadingPreferenceLineHeight = 'normal' | 'relaxed' | 'loose';
export type ReadingPreferenceColumnWidth =
    | 'narrow'
    | 'normal'
    | 'wide'
    | 'full';
export type ReadingPreferenceTheme = 'light' | 'dark' | 'sepia' | 'night';

export interface ReadingPreferences {
    fontSize: ReadingPreferenceFontSize;
    fontFamily: ReadingPreferenceFontFamily;
    lineHeight: ReadingPreferenceLineHeight;
    columnWidth: ReadingPreferenceColumnWidth;
    theme: ReadingPreferenceTheme;
    showVerseNumbers: boolean;
    showFootnotes: boolean;
    showCrossRefs: boolean;
    showOriginalLanguage: boolean;
    preferredVersionId?: string;
}

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
    fontSize: 'base',
    fontFamily: 'serif',
    lineHeight: 'relaxed',
    columnWidth: 'normal',
    theme: 'light',
    showVerseNumbers: true,
    showFootnotes: true,
    showCrossRefs: false,
    showOriginalLanguage: false,
};
