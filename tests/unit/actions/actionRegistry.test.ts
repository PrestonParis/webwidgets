import { describe, expect, it } from 'vitest';
import {
    getActionDefinition,
    searchActionMetadata,
} from '@/features/actions/lib/actionRegistry';
import type { ActionDefinitionMetadata } from '@/features/actions/lib/schemas/definitionSchemas';

describe('action registry', () => {
    it('discovers actions through flexsearch metadata', () => {
        const results = searchActionMetadata('rss');
        expect(
            results.some(
                (action: ActionDefinitionMetadata) =>
                    action.id === 'news.parse_rss_feed',
            ),
        ).toBe(true);
    });

    it('does not execute actions from the registry', () => {
        const definition = getActionDefinition('tasks.create');
        expect(
            definition?.expectedInputs.safeParse({ title: 'Ship engine' })
                .success,
        ).toBe(true);
        expect(definition).not.toHaveProperty('execute');
    });

    it('routes all state-changing task actions to the durable worker', () => {
        for (const actionId of [
            'tasks.create',
            'tasks.update',
            'tasks.complete',
        ]) {
            const definition = getActionDefinition(actionId);
            expect(definition?.queueability).toBe('required');
            expect(definition?.handlerId).toBe(`worker.${actionId}`);
            expect(definition?.handlerId).not.toBe('local.echo');
        }
    });
});
