import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { productionBindingCatalog } from '@/lib/capabilityRegistry/bindings';
import {
    PRODUCTION_CAPABILITY_KEYS,
    productionCapabilityRegistry,
} from '@/lib/capabilityRegistry/productionRegistry';
import {
    CapabilityRegistry,
    CapabilityRegistryError,
} from '@/lib/capabilityRegistry/registry';
import { taskCapabilities } from '@/lib/capabilityRegistry/taskCapabilities';
import type { CapabilityRegistration } from '@/lib/capabilityRegistry/types';

function taskRegistration(overrides: Partial<CapabilityRegistration> = {}) {
    const registration = taskCapabilities[0];
    if (!registration) throw new Error('missing test registration');
    return { ...registration, ...overrides };
}

describe('V2 production capability registry', () => {
    it('registers only the five inventory-confirmed production actions', () => {
        expect(PRODUCTION_CAPABILITY_KEYS).toEqual([
            'tasks.create@1',
            'tasks.update@1',
            'tasks.complete@1',
            'calendar.create_event@1',
            'email.draft@1',
        ]);
        expect(productionCapabilityRegistry.names()).not.toContain(
            'system.generate_briefing',
        );
        expect(productionCapabilityRegistry.names()).not.toContain(
            'email.send',
        );
        expect(productionCapabilityRegistry.names()).not.toContain(
            'automation.run',
        );
    });

    it('fails closed on duplicate and incomplete registrations', () => {
        const valid = taskRegistration();
        expect(
            () =>
                new CapabilityRegistry(
                    [valid, valid],
                    productionBindingCatalog,
                ),
        ).toThrowError(
            new CapabilityRegistryError('duplicate_capability_version'),
        );
        expect(
            () =>
                new CapabilityRegistry(
                    [
                        taskRegistration({
                            binding: {
                                executorId: 'missing.executor',
                                verifierId: valid.binding.verifierId,
                                compensationId: 'supabase.rpc.undo_task_action',
                            },
                        }),
                    ],
                    productionBindingCatalog,
                ),
        ).toThrowError(new CapabilityRegistryError('executor_binding_missing'));
    });

    it('rejects placeholder bindings and incompatible fixtures', () => {
        expect(
            () =>
                new CapabilityRegistry(
                    [
                        taskRegistration({
                            binding: {
                                executorId: 'mock.executor',
                                verifierId: 'supabase.receipt.task_action',
                            },
                        }),
                    ],
                    productionBindingCatalog,
                ),
        ).toThrow();
        expect(
            () =>
                new CapabilityRegistry(
                    [taskRegistration({ inputSchema: z.strictObject({}) })],
                    productionBindingCatalog,
                ),
        ).toThrow();
    });

    it('filters discovery by policy, connection, and normalized scope', () => {
        const allKeys = new Set(PRODUCTION_CAPABILITY_KEYS);
        const noConnections = productionCapabilityRegistry.discover({
            policyEligibleKeys: allKeys,
            connections: new Map(),
        });
        expect(noConnections.map(({ name }) => name)).toEqual([
            'tasks.create',
            'tasks.update',
            'tasks.complete',
        ]);

        const withCalendar = productionCapabilityRegistry.discover({
            policyEligibleKeys: new Set(['calendar.create_event@1']),
            connections: new Map([
                ['google_calendar', new Set(['calendar:write'])],
            ]),
        });
        expect(withCalendar).toHaveLength(1);
        expect(withCalendar[0]).not.toHaveProperty('binding');
        expect(withCalendar[0]).not.toHaveProperty('inputSchema');
        expect(withCalendar[0]).not.toHaveProperty('fixture');
        expect(withCalendar[0]).not.toHaveProperty('owner');
    });

    it('keeps registered metadata immutable at runtime', () => {
        const registration = productionCapabilityRegistry.get(
            'calendar.create_event',
            '1',
        );
        expect(registration).not.toBeNull();
        expect(Object.isFrozen(registration)).toBe(true);
        expect(Object.isFrozen(registration?.executionPolicy)).toBe(true);
        expect(Object.isFrozen(registration?.observability)).toBe(true);
        expect(Object.isFrozen(registration?.requiredIntegrations)).toBe(true);
        expect(
            Object.isFrozen(registration?.requiredScopes.google_calendar),
        ).toBe(true);
        expect(Object.isFrozen(registration?.fixture.input)).toBe(true);
    });

    it('validates inputs before estimating and blocks active-plan removal', () => {
        expect(
            productionCapabilityRegistry.estimate('tasks.create', '1', {
                title: 'Follow up',
            }),
        ).toEqual({
            providerCalls: 1,
            modelTokens: 0,
            costMicrounits: 0,
            activeSeconds: 2,
        });
        expect(() =>
            productionCapabilityRegistry.estimate('tasks.create', '1', {}),
        ).toThrow();
        expect(() =>
            productionCapabilityRegistry.assertCanRemove(
                'tasks.create',
                '1',
                new Set(['tasks.create@1']),
            ),
        ).toThrowError(
            new CapabilityRegistryError('capability_version_in_active_plan'),
        );
    });
});
