'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getResearchStatus,
    listResearchArtifacts,
    runResearchPipeline,
} from '@/features/research/api/researchApi';
import type {
    ResearchPipelineRequest,
    ResearchSourceKind,
} from '@/features/research/types/research';

export function useResearchStatus(
    rootPath?: string,
    sourceKind?: ResearchSourceKind,
) {
    return useQuery({
        queryKey: ['research-status', rootPath ?? 'env', sourceKind ?? 'env'],
        queryFn: () => getResearchStatus(rootPath, sourceKind),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}

export function useResearchArtifacts(
    rootPath: string | undefined,
    sourceKind: ResearchSourceKind | undefined,
    query: string,
) {
    return useQuery({
        queryKey: [
            'research-artifacts',
            rootPath ?? 'none',
            sourceKind ?? 'none',
            query,
        ],
        queryFn: () => listResearchArtifacts(rootPath, sourceKind, query),
        enabled: Boolean(rootPath?.trim()),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}

export function useResearchPipelineMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: ResearchPipelineRequest) =>
            runResearchPipeline(input),
        onSuccess() {
            void queryClient.invalidateQueries({
                queryKey: ['research-artifacts'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['research-status'],
            });
        },
    });
}
