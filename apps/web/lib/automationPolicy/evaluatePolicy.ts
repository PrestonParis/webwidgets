import { policyDecisionSchema } from '@/lib/automationContracts/governance';
import {
    jsonObjectSchema,
    serializeJson,
} from '@/lib/automationContracts/primitives';
import {
    CapabilityRegistry,
    capabilityKey,
} from '@/lib/capabilityRegistry/registry';
import type {
    CapabilityRegistration,
    CapabilityResourceEstimate,
    CapabilityRiskClass,
} from '@/lib/capabilityRegistry/types';
import { productionCapabilityRegistry } from '@/lib/capabilityRegistry/productionRegistry';
import { sha256Text } from '@/lib/lifecycle/idempotency';
import {
    automationPolicyRequestSchema,
    type AutomationPolicyRequest,
} from './schemas';

export const AUTOMATION_POLICY_VERSION = 'v2.policy.1' as const;

type PolicyDecision = 'allow' | 'deny' | 'require_approval';

interface RuleResult {
    decision: PolicyDecision;
    reasonCodes: string[];
}

interface SnapshotHashes {
    consent: string;
    connections: string;
}

const runnableObjectiveStates = new Set(['submitted', 'active']);

function hasRequiredConnection(
    registration: CapabilityRegistration,
    request: AutomationPolicyRequest,
) {
    if (registration.requiredIntegrations.includes('none')) return true;
    return registration.requiredIntegrations.some((integration) => {
        const grant = request.connections.grants.find(
            (candidate) => candidate.integration === integration,
        );
        if (!grant) return false;
        const requiredScopes = registration.requiredScopes[integration] ?? [];
        const grantedScopes = new Set(grant.scopes);
        return requiredScopes.every((scope) => grantedScopes.has(scope));
    });
}

function exceedsBudget(
    budget: AutomationPolicyRequest['budget'],
    estimate: CapabilityResourceEstimate,
) {
    return (
        budget.attemptsUsed + 1 > budget.maxAttempts ||
        budget.providerCallsUsed + estimate.providerCalls >
            budget.maxProviderCalls ||
        budget.modelTokensUsed + estimate.modelTokens > budget.maxModelTokens ||
        budget.costMicrounitsUsed + estimate.costMicrounits >
            budget.maxCostMicrounits ||
        budget.activeSecondsUsed + estimate.activeSeconds >
            budget.maxActiveSeconds
    );
}

function denyReasons(
    request: AutomationPolicyRequest,
    registration: CapabilityRegistration,
    key: string,
    estimate: CapabilityResourceEstimate,
) {
    const reasons: string[] = [];
    if (!runnableObjectiveStates.has(request.objectiveStatus)) {
        reasons.push('objective_not_runnable');
    }
    if (!request.permittedCapabilityKeys.includes(key)) {
        reasons.push('capability_not_permitted');
    }
    if (
        request.consent.state !== 'active' ||
        !request.consent.capabilityKeys.includes(key)
    ) {
        reasons.push('consent_not_granted');
    }
    if (request.connections.state !== 'current') {
        reasons.push('connection_snapshot_stale');
    } else if (!hasRequiredConnection(registration, request)) {
        reasons.push('connection_scope_missing');
    }
    if (request.budget.status !== 'active') {
        reasons.push('budget_not_active');
    } else if (exceedsBudget(request.budget, estimate)) {
        reasons.push('budget_exceeded');
    }
    if (registration.riskClass === 'prohibited') {
        reasons.push('capability_prohibited');
    }
    return reasons;
}

function riskDecision(
    riskClass: CapabilityRiskClass,
    delegated: boolean,
): RuleResult {
    if (riskClass === 'read' || riskClass === 'draft') {
        return { decision: 'allow', reasonCodes: ['low_risk_allowed'] };
    }
    if (
        (riskClass === 'reversible_write' || riskClass === 'external') &&
        delegated
    ) {
        return {
            decision: 'allow',
            reasonCodes: ['exact_delegation_allowed'],
        };
    }
    if (riskClass === 'prohibited') {
        return { decision: 'deny', reasonCodes: ['capability_prohibited'] };
    }
    const reason =
        riskClass === 'sensitive' || riskClass === 'destructive'
            ? 'mandatory_approval_required'
            : 'approval_required';
    return { decision: 'require_approval', reasonCodes: [reason] };
}

async function snapshotHashes(
    request: AutomationPolicyRequest,
): Promise<SnapshotHashes> {
    const consent = {
        state: request.consent.state,
        capabilityKeys: [...request.consent.capabilityKeys].sort(),
    };
    const connections = {
        state: request.connections.state,
        grants: request.connections.grants
            .map((grant) => ({
                integration: grant.integration,
                scopes: [...grant.scopes].sort(),
            }))
            .sort((left, right) =>
                left.integration.localeCompare(right.integration),
            ),
    };
    return {
        consent: await sha256Text(serializeJson(consent)),
        connections: await sha256Text(serializeJson(connections)),
    };
}

function unknownCapabilityDecision(
    request: AutomationPolicyRequest,
    payloadHash: string,
    hashes: SnapshotHashes,
) {
    return policyDecisionSchema.parse({
        contractVersion: request.contractVersion,
        id: request.decisionId,
        objectiveId: request.objectiveId,
        planId: request.planId,
        stepId: request.stepId,
        budgetId: request.budget.id,
        userId: request.userId,
        capabilityName: request.capabilityName,
        capabilityVersion: request.capabilityVersion,
        riskClass: 'prohibited',
        normalizedPayload: request.payload,
        payloadHash,
        policyVersion: AUTOMATION_POLICY_VERSION,
        consentSnapshotHash: hashes.consent,
        connectionSnapshotHash: hashes.connections,
        decision: 'deny',
        reasonCodes: ['capability_version_unknown'],
        requiresApproval: false,
        evaluatedAt: request.evaluatedAt,
        expiresAt: request.expiresAt,
    });
}

function finalRule(
    request: AutomationPolicyRequest,
    registration: CapabilityRegistration,
    key: string,
    estimate: CapabilityResourceEstimate,
): RuleResult {
    const reasons = denyReasons(request, registration, key, estimate);
    if (reasons.length > 0) return { decision: 'deny', reasonCodes: reasons };
    const delegated =
        request.delegation.state === 'current' &&
        request.delegation.capabilityKeys.includes(key);
    return riskDecision(registration.riskClass, delegated);
}

export function createAutomationPolicyEvaluator(registry: CapabilityRegistry) {
    return async (input: unknown) => {
        const request = automationPolicyRequestSchema.parse(input);
        const rawPayloadHash = await sha256Text(serializeJson(request.payload));
        const hashes = await snapshotHashes(request);
        const registration = registry.get(
            request.capabilityName,
            request.capabilityVersion,
        );
        if (!registration) {
            return unknownCapabilityDecision(request, rawPayloadHash, hashes);
        }

        const parsedPayload = registration.inputSchema.safeParse(
            request.payload,
        );
        const key = capabilityKey(registration.name, registration.version);
        if (!parsedPayload.success) {
            return policyDecisionSchema.parse({
                contractVersion: request.contractVersion,
                id: request.decisionId,
                objectiveId: request.objectiveId,
                planId: request.planId,
                stepId: request.stepId,
                budgetId: request.budget.id,
                userId: request.userId,
                capabilityName: registration.name,
                capabilityVersion: registration.version,
                riskClass: registration.riskClass,
                normalizedPayload: request.payload,
                payloadHash: rawPayloadHash,
                policyVersion: AUTOMATION_POLICY_VERSION,
                consentSnapshotHash: hashes.consent,
                connectionSnapshotHash: hashes.connections,
                decision: 'deny',
                reasonCodes: ['capability_input_invalid'],
                requiresApproval: false,
                evaluatedAt: request.evaluatedAt,
                expiresAt: request.expiresAt,
            });
        }

        const normalizedPayload = jsonObjectSchema.parse(parsedPayload.data);
        const payloadHash = await sha256Text(serializeJson(normalizedPayload));
        const estimate = registry.estimate(
            registration.name,
            registration.version,
            normalizedPayload,
        );
        const rule = finalRule(request, registration, key, estimate);
        return policyDecisionSchema.parse({
            contractVersion: request.contractVersion,
            id: request.decisionId,
            objectiveId: request.objectiveId,
            planId: request.planId,
            stepId: request.stepId,
            budgetId: request.budget.id,
            userId: request.userId,
            capabilityName: registration.name,
            capabilityVersion: registration.version,
            riskClass: registration.riskClass,
            normalizedPayload,
            payloadHash,
            policyVersion: AUTOMATION_POLICY_VERSION,
            consentSnapshotHash: hashes.consent,
            connectionSnapshotHash: hashes.connections,
            decision: rule.decision,
            reasonCodes: rule.reasonCodes,
            requiresApproval: rule.decision === 'require_approval',
            evaluatedAt: request.evaluatedAt,
            expiresAt: request.expiresAt,
        });
    };
}

export const evaluateAutomationPolicy = createAutomationPolicyEvaluator(
    productionCapabilityRegistry,
);
