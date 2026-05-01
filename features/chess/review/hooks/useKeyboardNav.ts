// hooks/useKeyboardNav.ts
import { useEffect } from 'react';
import { KeyboardNavProps } from '@/features/chess/review/types/review';

export function useKeyboardNav({
    tab,
    movesLength,
    onPrev,
    onNext,
    onStart,
    onEnd,
}: KeyboardNavProps) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (tab !== 'review') return;
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowUp') onStart();
            if (e.key === 'ArrowDown') onEnd();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [tab, movesLength, onPrev, onNext, onStart, onEnd]);
}
