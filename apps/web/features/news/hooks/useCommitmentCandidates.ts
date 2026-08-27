'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchCommitmentCandidates,
    generateCommitmentCandidates,
    reviewCommitmentCandidate,
} from '@/features/news/api/commitmentCandidateClient';

export function useCommitmentCandidates() {
    const client = useQueryClient();
    const invalidate = () =>
        client.invalidateQueries({ queryKey: ['commitment-candidates'] });
    const query = useQuery({
        queryKey: ['commitment-candidates'],
        queryFn: fetchCommitmentCandidates,
    });
    const generate = useMutation({
        mutationFn: generateCommitmentCandidates,
        onSuccess: invalidate,
    });
    const review = useMutation({
        mutationFn: (input: {
            candidateId: string;
            body: Record<string, unknown>;
        }) => reviewCommitmentCandidate(input.candidateId, input.body),
        onSuccess: invalidate,
    });
    return { query, generate, review };
}
