import { z } from 'zod';
import { automationErrorSchema } from '@/lib/automationContracts/errors';
import { capabilityRegistrationMetadataSchema } from './registrationSchema';
import type {
    CapabilityDiscoveryContext,
    CapabilityIntegration,
    CapabilityRegistration,
    DiscoveredCapability,
} from './types';

const resourceEstimateSchema = z
    .object({
        providerCalls: z.number().int().min(0),
        modelTokens: z.number().int().min(0),
        costMicrounits: z.number().int().min(0),
        activeSeconds: z.number().int().min(0),
    })
    .strict();

export interface CapabilityBindingCatalog {
    executors: ReadonlySet<string>;
    verifiers: ReadonlySet<string>;
    compensations: ReadonlySet<string>;
}

export class CapabilityRegistryError extends Error {
    constructor(readonly code: string) {
        super(`Capability registry rejected: ${code}`);
        this.name = 'CapabilityRegistryError';
    }
}

function keyOf(name: string, version: string) {
    return `${name}@${version}`;
}

function validateBindings(
    registration: CapabilityRegistration,
    bindings: CapabilityBindingCatalog,
) {
    if (!bindings.executors.has(registration.binding.executorId)) {
        throw new CapabilityRegistryError('executor_binding_missing');
    }
    if (!bindings.verifiers.has(registration.binding.verifierId)) {
        throw new CapabilityRegistryError('verifier_binding_missing');
    }
    const compensationId = registration.binding.compensationId;
    if (registration.reversibility === 'compensatable' && !compensationId) {
        throw new CapabilityRegistryError('compensation_binding_missing');
    }
    if (compensationId && !bindings.compensations.has(compensationId)) {
        throw new CapabilityRegistryError('compensation_binding_unknown');
    }
}

function validateRegistration(
    registration: CapabilityRegistration,
    bindings: CapabilityBindingCatalog,
) {
    capabilityRegistrationMetadataSchema.parse({
        name: registration.name,
        version: registration.version,
        definitionHash: registration.definitionHash,
        owner: registration.owner,
        requiredIntegrations: registration.requiredIntegrations,
        requiredScopes: registration.requiredScopes,
        riskClass: registration.riskClass,
        reversibility: registration.reversibility,
        idempotencyStrategy: registration.idempotencyStrategy,
        executionPolicy: registration.executionPolicy,
        binding: registration.binding,
        observability: registration.observability,
        redactedInputFields: registration.redactedInputFields,
        fixture: registration.fixture,
    });
    validateBindings(registration, bindings);
    registration.inputSchema.parse(registration.fixture.input);
    registration.outputSchema.parse(registration.fixture.output);
    registration.errorSchema.parse(
        automationErrorSchema.parse({
            category: 'internal',
            code: 'fixture_failure',
            retryable: false,
            safeMessage: 'The operation could not be completed.',
            details: {},
        }),
    );
    resourceEstimateSchema.parse(
        registration.estimateResources(registration.fixture.input),
    );
}

function hasIntegration(
    integration: CapabilityIntegration,
    registration: CapabilityRegistration,
    connections: CapabilityDiscoveryContext['connections'],
) {
    if (integration === 'none') return true;
    const granted = connections.get(integration);
    if (!granted) return false;
    const required = registration.requiredScopes[integration] ?? [];
    return required.every((scope) => granted.has(scope));
}

function isDiscoverable(
    registration: CapabilityRegistration,
    context: CapabilityDiscoveryContext,
) {
    const key = keyOf(registration.name, registration.version);
    if (!context.policyEligibleKeys.has(key)) return false;
    return registration.requiredIntegrations.some((integration) =>
        hasIntegration(integration, registration, context.connections),
    );
}

function publicDescriptor(
    registration: CapabilityRegistration,
): DiscoveredCapability {
    return Object.freeze({
        name: registration.name,
        version: registration.version,
        riskClass: registration.riskClass,
        reversibility: registration.reversibility,
        requiredIntegrations: registration.requiredIntegrations,
        resourceEstimate: Object.freeze(
            resourceEstimateSchema.parse(
                registration.estimateResources(registration.fixture.input),
            ),
        ),
    });
}

function freezeFixtureValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return Object.freeze(value.map(freezeFixtureValue));
    }
    if (value !== null && typeof value === 'object') {
        return Object.freeze(
            Object.fromEntries(
                Object.entries(value).map(([key, item]) => [
                    key,
                    freezeFixtureValue(item),
                ]),
            ),
        );
    }
    return value;
}

function freezeRegistration(
    registration: CapabilityRegistration,
): CapabilityRegistration {
    const requiredScopes = Object.fromEntries(
        Object.entries(registration.requiredScopes).map(
            ([integration, scopes]) => [
                integration,
                Object.freeze([...scopes]),
            ],
        ),
    );
    return Object.freeze({
        ...registration,
        requiredIntegrations: Object.freeze([
            ...registration.requiredIntegrations,
        ]),
        requiredScopes: Object.freeze(requiredScopes),
        executionPolicy: Object.freeze({ ...registration.executionPolicy }),
        binding: Object.freeze({ ...registration.binding }),
        observability: Object.freeze({ ...registration.observability }),
        redactedInputFields: Object.freeze([
            ...registration.redactedInputFields,
        ]),
        fixture: Object.freeze({
            ...registration.fixture,
            input: freezeFixtureValue(registration.fixture.input),
            output: freezeFixtureValue(registration.fixture.output),
        }),
    });
}

export class CapabilityRegistry {
    readonly #registrations: ReadonlyMap<string, CapabilityRegistration>;

    constructor(
        registrations: readonly CapabilityRegistration[],
        bindings: CapabilityBindingCatalog,
    ) {
        const byKey = new Map<string, CapabilityRegistration>();
        for (const registration of registrations) {
            validateRegistration(registration, bindings);
            const key = keyOf(registration.name, registration.version);
            if (byKey.has(key)) {
                throw new CapabilityRegistryError(
                    'duplicate_capability_version',
                );
            }
            byKey.set(key, freezeRegistration(registration));
        }
        this.#registrations = byKey;
    }

    get(name: string, version: string) {
        return this.#registrations.get(keyOf(name, version)) ?? null;
    }

    names() {
        return new Set(
            [...this.#registrations.values()].map(({ name }) => name),
        );
    }

    discover(context: CapabilityDiscoveryContext) {
        return [...this.#registrations.values()]
            .filter((registration) => isDiscoverable(registration, context))
            .map(publicDescriptor);
    }

    estimate(name: string, version: string, input: unknown) {
        const registration = this.get(name, version);
        if (!registration) {
            throw new CapabilityRegistryError('capability_version_unknown');
        }
        const parsedInput = registration.inputSchema.parse(input);
        return resourceEstimateSchema.parse(
            registration.estimateResources(parsedInput),
        );
    }

    assertCanRemove(
        name: string,
        version: string,
        activePlanKeys: ReadonlySet<string>,
    ) {
        if (activePlanKeys.has(keyOf(name, version))) {
            throw new CapabilityRegistryError(
                'capability_version_in_active_plan',
            );
        }
    }
}

export function capabilityKey(name: string, version: string) {
    return keyOf(name, version);
}
