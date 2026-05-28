'use client';

import superjson, { type SuperJSONResult } from 'superjson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActionRequestEnvelope } from '@/features/actions/lib/schemas/actionPayloadSchemas';
import type { ActionEngineResult } from '@/features/actions/lib/schemas/actionResultSchemas';
import type { ActionDefinitionMetadata } from '@/features/actions/lib/schemas/definitionSchemas';

async function invokeAction(
    envelope: ActionRequestEnvelope,
): Promise<ActionEngineResult> {
    const response = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(superjson.serialize(envelope)),
    });
    const payload = (await response.json()) as SuperJSONResult;
    const result = superjson.deserialize<ActionEngineResult>(payload);
    if (!response.ok || result.status === 'failed') {
        const msg =
            result.status === 'failed'
                ? result.message
                : 'Action invocation failed';
        throw new Error(msg);
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
    const raw = (await response.json()) as SuperJSONResult;
    return superjson.deserialize<ActionDefinitionMetadata[]>(raw);
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
