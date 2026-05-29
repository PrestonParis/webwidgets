import type { ConfidenceScore } from '@/features/intelligence/types/inference';

export function confidence(value: number, threshold = 0.7): ConfidenceScore {
    const clamped = Math.max(0, Math.min(1, value));
    return {
        value: clamped,
        threshold,
        label:
            clamped >= 0.8 ? 'high' : clamped >= threshold ? 'medium' : 'low',
    };
}
