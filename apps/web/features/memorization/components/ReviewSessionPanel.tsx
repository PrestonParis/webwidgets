'use client';

import { ReviewSession } from './ReviewSession';
import type { MemoryDifficulty } from '../types/memorization';
import type { MemoryCardRecord } from '../hooks/useMemorization';

interface ReviewSessionPanelProps {
    deckTitle: string;
    queue: MemoryCardRecord[];
    gradeCard: (id: string, grade: MemoryDifficulty) => Promise<void>;
    onExit: () => void;
}

export function ReviewSessionPanel(props: ReviewSessionPanelProps) {
    return (
        <div className="mx-auto max-w-4xl">
            <ReviewSession {...props} />
        </div>
    );
}
