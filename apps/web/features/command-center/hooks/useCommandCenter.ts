'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    completeTask,
    fetchAutomationSummary,
    fetchBriefingSummary,
    fetchCandidates,
    fetchSeenState,
    fetchTasks,
    fetchTimelineSummary,
    markCommandCenterSeen,
    reviewCandidate,
    setAutomationPaused,
} from '../api/commandCenterClient';

export function useCommandCenter() {
    const client = useQueryClient();
    const marked = useRef(false);
    const timeline = useQuery({
        queryKey: ['command-center', 'timeline'],
        queryFn: fetchTimelineSummary,
    });
    const briefing = useQuery({
        queryKey: ['command-center', 'briefing'],
        queryFn: fetchBriefingSummary,
    });
    const candidates = useQuery({
        queryKey: ['command-center', 'candidates'],
        queryFn: fetchCandidates,
    });
    const tasks = useQuery({
        queryKey: ['command-center', 'tasks'],
        queryFn: fetchTasks,
    });
    const automation = useQuery({
        queryKey: ['command-center', 'automation'],
        queryFn: fetchAutomationSummary,
    });
    const seen = useQuery({
        queryKey: ['command-center', 'seen'],
        queryFn: fetchSeenState,
    });
    const markSeen = useMutation({ mutationFn: markCommandCenterSeen });
    useEffect(() => {
        if (marked.current || !seen.isSuccess || !timeline.isSuccess) return;
        marked.current = true;
        markSeen.mutate();
    }, [markSeen, seen.isSuccess, timeline.isSuccess]);
    const review = useMutation({
        mutationFn: (input: {
            candidateId: string;
            body: Record<string, unknown>;
        }) => reviewCandidate(input.candidateId, input.body),
        onSuccess: () => {
            void client.invalidateQueries({
                queryKey: ['command-center', 'candidates'],
            });
            void client.invalidateQueries({
                queryKey: ['command-center', 'tasks'],
            });
        },
    });
    const finishTask = useMutation({
        mutationFn: completeTask,
        onSuccess: () =>
            client.invalidateQueries({
                queryKey: ['command-center', 'tasks'],
            }),
    });
    const pause = useMutation({
        mutationFn: setAutomationPaused,
        onSuccess: () =>
            client.invalidateQueries({
                queryKey: ['command-center', 'automation'],
            }),
    });
    return {
        timeline,
        briefing,
        candidates,
        tasks,
        automation,
        seen,
        review,
        finishTask,
        pause,
    };
}

export type CommandCenterController = ReturnType<typeof useCommandCenter>;
