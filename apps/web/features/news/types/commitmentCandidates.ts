import type { CommitmentCandidateRecord } from '@/lib/commitments/types';

export interface CommitmentCandidateCardProps {
    candidate: CommitmentCandidateRecord;
    disabled: boolean;
    onReview: (body: Record<string, unknown>) => void;
    onRetry: (actionRequestId: string) => void;
    onUndo: (actionRequestId: string) => void;
}
