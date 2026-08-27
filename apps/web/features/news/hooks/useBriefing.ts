'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    fetchBriefing,
    requestBriefing,
    saveBriefingFeedback,
    saveBriefingPreferences,
} from '@/features/news/api/briefingClient';

export function useBriefing() {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ['briefing'],
        queryFn: fetchBriefing,
        refetchInterval: (current) =>
            current.state.data?.activeJobId ? 3_000 : 60_000,
    });
    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ['briefing'] });
    const generate = useMutation({
        mutationFn: requestBriefing,
        onSuccess: invalidate,
    });
    const preferences = useMutation({
        mutationFn: saveBriefingPreferences,
        onSuccess: invalidate,
    });
    const feedback = useMutation({
        mutationFn: (input: {
            briefingId: string;
            itemId: string;
            rating: 'useful' | 'not_useful' | 'incorrect';
        }) =>
            saveBriefingFeedback(input.briefingId, input.itemId, input.rating),
        onSuccess: invalidate,
    });
    return { query, generate, preferences, feedback };
}
