import type { z } from 'zod';
import type { AutomationError } from '@/lib/automationContracts/errors';

export type CapabilityRiskClass =
    | 'read'
    | 'draft'
    | 'reversible_write'
    | 'external'
    | 'sensitive'
    | 'destructive'
    | 'prohibited';

export type CapabilityIntegration =
    | 'none'
    | 'google_calendar'
    | 'google_mail'
    | 'microsoft_mail';

export interface CapabilityResourceEstimate {
    providerCalls: number;
    modelTokens: number;
    costMicrounits: number;
    activeSeconds: number;
}

export interface CapabilityExecutionPolicy {
    timeoutSeconds: number;
    maxAttempts: number;
    concurrencyKey: 'user' | 'connection' | 'objective';
}

export interface CapabilityBinding {
    executorId: string;
    verifierId: string;
    compensationId?: string;
}

export interface CapabilityObservability {
    eventNamespace: 'automation.capability';
    recordInputHash: true;
    recordOutputHash: true;
    redactionPolicy: 'registry_fields';
}

export interface CapabilityFixture {
    id: string;
    input: unknown;
    output: unknown;
    testReference: string;
}

export interface CapabilityRegistration {
    name: string;
    version: string;
    definitionHash: string;
    owner: 'typescript_worker' | 'nextjs_provider_adapter';
    inputSchema: z.ZodType<unknown>;
    outputSchema: z.ZodType<unknown>;
    errorSchema: z.ZodType<AutomationError>;
    requiredIntegrations: readonly CapabilityIntegration[];
    requiredScopes: Readonly<Record<string, readonly string[]>>;
    riskClass: CapabilityRiskClass;
    reversibility: 'compensatable' | 'manual' | 'none';
    idempotencyStrategy: 'canonical_action_request';
    executionPolicy: CapabilityExecutionPolicy;
    estimateResources: (input: unknown) => CapabilityResourceEstimate;
    binding: CapabilityBinding;
    observability: CapabilityObservability;
    redactedInputFields: readonly string[];
    fixture: CapabilityFixture;
}

export interface CapabilityDiscoveryContext {
    connections: ReadonlyMap<CapabilityIntegration, ReadonlySet<string>>;
    policyEligibleKeys: ReadonlySet<string>;
}

export interface DiscoveredCapability {
    name: string;
    version: string;
    riskClass: CapabilityRiskClass;
    reversibility: CapabilityRegistration['reversibility'];
    requiredIntegrations: readonly CapabilityIntegration[];
    resourceEstimate: CapabilityResourceEstimate;
}
