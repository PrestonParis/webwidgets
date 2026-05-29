import type { MemoryDifficulty } from '../types/memorization';

const GRADE: Record<MemoryDifficulty, number> = {
    again: 1,
    hard: 2,
    good: 4,
    easy: 5,
};

export interface SM2Input {
    interval_days: number;
    ease: number;
    repetitions: number;
}

export interface SM2Output {
    interval_days: number;
    ease: number;
    repetitions: number;
    status: string;
    due_date: string;
}

export function applyGrade(card: SM2Input, grade: MemoryDifficulty): SM2Output {
    const score = GRADE[grade];
    let { interval_days, ease, repetitions } = card;

    if (score <= 2) {
        interval_days = 1;
        repetitions = 0;
    } else {
        if (repetitions === 0) interval_days = 1;
        else if (repetitions === 1) interval_days = 6;
        else interval_days = Math.round(interval_days * ease);
        ease = Math.max(
            1.3,
            ease + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02),
        );
        repetitions++;
    }

    const due = new Date();
    due.setDate(due.getDate() + interval_days);

    return {
        interval_days,
        ease,
        repetitions,
        status:
            score <= 2
                ? 'learning'
                : interval_days >= 21
                  ? 'mastered'
                  : 'review',
        due_date: due.toISOString(),
    };
}

export function previewInterval(
    card: SM2Input,
    grade: MemoryDifficulty,
): string {
    const days = applyGrade(card, grade).interval_days;
    if (days === 1) return '1d';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.round(days / 7)}w`;
    return `${Math.round(days / 30)}mo`;
}

export function formatInterval(days: number): string {
    if (days <= 1) return '1d';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.round(days / 7)}w`;
    return `${Math.round(days / 30)}mo`;
}
