import type { LucideIcon } from 'lucide-react';

export type MemoryDomain =
    | 'Reading'
    | 'Knowledge'
    | 'Language'
    | 'Fitness'
    | 'Workflows'
    | 'General';

export type MemoryDifficulty = 'again' | 'hard' | 'good' | 'easy';
export type MemoryStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface MemoryMetric {
    id: string;
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: 'emerald' | 'blue' | 'amber' | 'rose';
}

export interface MemoryDeck {
    id: string;
    title: string;
    domain: MemoryDomain;
    status: MemoryStatus;
    cards: number;
    due: number;
    retention: number;
    source: string;
    description: string;
}

export interface MemoryReviewCard {
    id: string;
    deckId: string;
    front: string;
    back: string;
    status: MemoryStatus;
    due: string;
    intervalDays: number;
}

export interface MemoryFilters {
    query: string;
    domain: MemoryDomain | 'all';
    status: MemoryStatus | 'all';
}
