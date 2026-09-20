import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { productionBindingCatalog } from '@/lib/capabilityRegistry/bindings';
import {
    PRODUCTION_CAPABILITY_KEYS,
    productionCapabilityRegistry,
} from '@/lib/capabilityRegistry/productionRegistry';
import {
    CapabilityRegistry,
    CapabilityRegistryError,
    capabilityDefinitionManifest,
} from '@/lib/capabilityRegistry/registry';
import { taskCapabilities } from '@/lib/capabilityRegistry/taskCapabilities';
import type { CapabilityRegistration } from '@/lib/capabilityRegistry/types';

function taskRegistration(overrides: Partial<CapabilityRegistration> = {}) {
    const registration = taskCapabilities[0];
    if (!registration) throw new Error('missing test registration');
    return { ...registration, ...overrides };
}

function canonical(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
    if (value !== null && typeof value === 'object') {
        return `{${Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
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
            activeCapabilityKeys: allKeys,
            policyEligibleKeys: allKeys,
            connections: new Map(),
        });
        expect(noConnections.map(({ name }) => name)).toEqual([
            'tasks.create',
            'tasks.update',
            'tasks.complete',
        ]);

        const withCalendar = productionCapabilityRegistry.discover({
            activeCapabilityKeys: allKeys,
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
        expect(
            productionCapabilityRegistry.discover({
                activeCapabilityKeys: new Set(),
                policyEligibleKeys: allKeys,
                connections: new Map(),
            }),
        ).toEqual([]);
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

    it('pins each version and database row to its executable definition', async () => {
        const hashes = Object.fromEntries(
            PRODUCTION_CAPABILITY_KEYS.map((key) => {
                const [name, version] = key.split('@');
                const registration = productionCapabilityRegistry.get(
                    name!,
                    version!,
                );
                const digest = createHash('sha256')
                    .update(
                        canonical(capabilityDefinitionManifest(registration!)),
                    )
                    .digest('hex');
                return [key, digest];
            }),
        );
        expect(hashes).toEqual(
            Object.fromEntries(
                PRODUCTION_CAPABILITY_KEYS.map((key) => {
                    const [name, version] = key.split('@');
                    return [
                        key,
                        productionCapabilityRegistry.get(name!, version!)!
                            .definitionHash,
                    ];
                }),
            ),
        );
        const migration = await readFile(
            path.resolve(
                process.cwd(),
                'supabase/migrations/202609080006_v2_capability_registry.sql',
            ),
            'utf8',
        );
        for (const [key, hash] of Object.entries(hashes)) {
            const [name, version] = key.split('@');
            expect(migration).toContain(`('${name}', '${version}', '${hash}')`);
        }
    });

    it('resolves every module binding and fixture test reference in CI', async () => {
        const catalogs = [
            productionBindingCatalog.executors,
            productionBindingCatalog.verifiers,
            productionBindingCatalog.compensations,
        ];
        for (const catalog of catalogs) {
            for (const binding of catalog.values()) {
                if (binding.kind !== 'module_export') continue;
                const [file, exportName] = z
                    .tuple([z.string(), z.string()])
                    .parse(binding.reference.split('#'));
                const loaded = z
                    .record(z.string(), z.unknown())
                    .parse(await import(path.resolve(process.cwd(), file)));
                expect(loaded[exportName]).toBeTypeOf('function');
            }
        }
        for (const key of PRODUCTION_CAPABILITY_KEYS) {
            const [name, version] = key.split('@');
            const registration = productionCapabilityRegistry.get(
                name!,
                version!,
            );
            for (const file of registration!.fixture.testReference.split(
                '; ',
            )) {
                await expect(
                    access(path.resolve(process.cwd(), file)),
                ).resolves.toBeUndefined();
            }
        }
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
