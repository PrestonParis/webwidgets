'use client';

import superjson from 'superjson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    ActionEngineResult,
    ActionRequestEnvelope,
} from '@/features/actions/schemas/actionSchemas';
import type { ActionDefinitionMetadata } from '@/features/actions/schemas/definitionSchemas';

async function invokeAction(
    envelope: ActionRequestEnvelope,
): Promise<ActionEngineResult> {
    const response = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(superjson.serialize(envelope)),
    });
    const payload = await response.json();
    const result = superjson.deserialize(payload) as ActionEngineResult;
    if (!response.ok || result.status === 'failed') {
        throw result;
    }
    return result;
}

async function fetchActionMetadata(
    query = '',
): Promise<ActionDefinitionMetadata[]> {
    const response = await fetch(
        `/api/actions?query=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error('Failed to load actions');
    return superjson.deserialize(
        await response.json(),
    ) as ActionDefinitionMetadata[];
}

export function useActionMutation() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: invokeAction,
        onSettled: () => {
            void client.invalidateQueries({ queryKey: ['actions'] });
        },
        retry: (failureCount, error) => {
            const status =
                typeof error === 'object' && error && 'status' in error
                    ? (error as { status?: string }).status
                    : undefined;
            return status !== 'failed' && failureCount < 1;
        },
    });
}

export function useActionMetadataSearch(query: string) {
    return useQuery({
        queryKey: ['actions', 'metadata', query],
        queryFn: () => fetchActionMetadata(query),
        staleTime: 60_000,
    });
}
