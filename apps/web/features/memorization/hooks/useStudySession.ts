'use client';

import { useCallback, useState } from 'react';
import type { MemoryDifficulty } from '../types/memorization';
import type { MemoryCardRecord } from './useMemorization';

export interface SessionStats {
    total: number;
    again: number;
    hard: number;
    good: number;
    easy: number;
}

export function useStudySession(
    initialQueue: MemoryCardRecord[],
    gradeCard: (id: string, difficulty: MemoryDifficulty) => Promise<void>,
) {
    const [queue, setQueue] = useState<MemoryCardRecord[]>(() => [
        ...initialQueue,
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [stats, setStats] = useState<SessionStats>({
        total: initialQueue.length,
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
    });
    const [grading, setGrading] = useState(false);

    const currentCard = queue[currentIndex] ?? null;
    const isComplete = currentIndex >= queue.length;
    const progress =
        queue.length > 0 ? Math.min(currentIndex / queue.length, 1) : 0;

    const flip = useCallback(() => setIsFlipped(true), []);

    const grade = useCallback(
        async (difficulty: MemoryDifficulty) => {
            if (!currentCard || grading) return;
            setGrading(true);
            setStats((s) => ({ ...s, [difficulty]: s[difficulty] + 1 }));
            await gradeCard(currentCard.id, difficulty);
            // Re-queue 'again' cards at the end
            if (difficulty === 'again') {
                setQueue((q) => [...q, currentCard]);
                setStats((s) => ({ ...s, total: s.total + 1 }));
            }
            setIsFlipped(false);
            setCurrentIndex((i) => i + 1);
            setGrading(false);
        },
        [currentCard, gradeCard, grading],
    );

    return {
        currentCard,
        isFlipped,
        flip,
        grade,
        isComplete,
        progress,
        stats,
        grading,
        queueLength: queue.length,
    };
}
