import { describe, expect, it } from 'vitest';
import {
    createAutomationPolicyEvaluator,
    evaluateAutomationPolicy,
    type AutomationPolicyRequest,
} from '@/lib/automationPolicy';
import { productionBindingCatalog } from '@/lib/capabilityRegistry/bindings';
import { productionCapabilityRegistry } from '@/lib/capabilityRegistry/productionRegistry';
import { CapabilityRegistry } from '@/lib/capabilityRegistry/registry';
import type {
    CapabilityRegistration,
    CapabilityRiskClass,
} from '@/lib/capabilityRegistry/types';

const ids = {
    decision: '11111111-1111-4111-8111-111111111111',
    objective: '22222222-2222-4222-8222-222222222222',
    plan: '33333333-3333-4333-8333-333333333333',
    step: '44444444-4444-4444-8444-444444444444',
    user: '55555555-5555-4555-8555-555555555555',
    budget: '66666666-6666-4666-8666-666666666666',
};

const taskPayload = {
    title: 'Review launch checklist',
    notes: '',
    dueAt: null,
    sourceReference: null,
};

function requestFor(
    name = 'tasks.create',
    version = '1',
): AutomationPolicyRequest {
    const key = `${name}@${version}`;
    return {
        contractVersion: '2.0' as const,
        decisionId: ids.decision,
        objectiveId: ids.objective,
        planId: ids.plan,
        stepId: ids.step,
        userId: ids.user,
        objectiveStatus: 'active' as const,
        capabilityName: name,
        capabilityVersion: version,
        payload: taskPayload,
        permittedCapabilityKeys: [key],
        consent: {
            state: 'active' as const,
            capabilityKeys: [key],
        },
        connections: {
            state: 'current' as const,
            grants: [],
        },
        delegation: {
            state: 'disabled' as const,
            capabilityKeys: [],
        },
        budget: {
            id: ids.budget,
            status: 'active' as const,
            maxAttempts: 3,
            maxProviderCalls: 5,
            maxModelTokens: 0,
            maxCostMicrounits: 0,
            maxActiveSeconds: 30,
            attemptsUsed: 0,
            providerCallsUsed: 0,
            modelTokensUsed: 0,
            costMicrounitsUsed: 0,
            activeSecondsUsed: 0,
        },
        evaluatedAt: '2026-09-18T12:00:00.000Z',
        expiresAt: '2026-09-18T12:05:00.000Z',
    };
}

function registrationWithRisk(riskClass: CapabilityRiskClass) {
    const source = productionCapabilityRegistry.get('tasks.create', '1');
    if (!source) throw new Error('Expected production task capability');
    return {
        ...source,
        name: `test.${riskClass}`,
        riskClass,
    } satisfies CapabilityRegistration;
}

function evaluatorWithRisk(riskClass: CapabilityRiskClass) {
    const registration = registrationWithRisk(riskClass);
    const registry = new CapabilityRegistry(
        [registration],
        productionBindingCatalog,
    );
    return {
        evaluate: createAutomationPolicyEvaluator(registry),
        request: requestFor(registration.name, registration.version),
    };
}

describe('V2 policy approval and delegation', () => {
    it('requires approval for a reversible write by default', async () => {
        const decision = await evaluateAutomationPolicy(requestFor());

        expect(decision.decision).toBe('require_approval');
        expect(decision.requiresApproval).toBe(true);
        expect(decision.reasonCodes).toEqual(['approval_required']);
        expect(decision.capabilityName).toBe('tasks.create');
        expect(decision.payloadHash).toMatch(/^[a-f0-9]{64}$/u);
    });

    it('allows only an exact current delegation for reversible writes', async () => {
        const input = requestFor();
        input.delegation = {
            state: 'current',
            capabilityKeys: ['tasks.create@1'],
        };

        const decision = await evaluateAutomationPolicy(input);

        expect(decision.decision).toBe('allow');
        expect(decision.reasonCodes).toEqual(['exact_delegation_allowed']);
    });

    it('does not let delegation bypass mandatory sensitive approval', async () => {
        const input = requestFor('tasks.complete', '1');
        input.payload = {
            taskId: '77777777-7777-4777-8777-777777777777',
            expectedUpdatedAt: '2026-09-18T11:00:00.000Z',
        };
        input.delegation = {
            state: 'current',
            capabilityKeys: ['tasks.complete@1'],
        };

        const decision = await evaluateAutomationPolicy(input);

        expect(decision.decision).toBe('require_approval');
        expect(decision.reasonCodes).toEqual(['mandatory_approval_required']);
    });
});

describe('V2 policy fail-closed gates', () => {
    it('denies an unknown capability without exposing internals', async () => {
        const decision = await evaluateAutomationPolicy(
            requestFor('unknown.action', '1'),
        );

        expect(decision.decision).toBe('deny');
        expect(decision.riskClass).toBe('prohibited');
        expect(decision.reasonCodes).toEqual(['capability_version_unknown']);
    });

    it('denies invalid capability input with a stable reason', async () => {
        const input = requestFor();
        input.payload = { title: '' };

        const decision = await evaluateAutomationPolicy(input);

        expect(decision.decision).toBe('deny');
        expect(decision.reasonCodes).toEqual(['capability_input_invalid']);
    });

    it('fails closed across objective, consent, connection, and budget gates', async () => {
        const input = requestFor();
        input.objectiveStatus = 'cancel_requested';
        input.permittedCapabilityKeys = [];
        input.consent.state = 'stale';
        input.connections.state = 'stale';
        input.budget.status = 'exhausted';

        const decision = await evaluateAutomationPolicy(input);

        expect(decision.decision).toBe('deny');
        expect(decision.reasonCodes).toEqual([
            'objective_not_runnable',
            'capability_not_permitted',
            'consent_not_granted',
            'connection_snapshot_stale',
            'budget_not_active',
        ]);
    });

    it('denies when the next attempt would exceed a resource budget', async () => {
        const input = requestFor();
        input.budget.providerCallsUsed = input.budget.maxProviderCalls;

        const decision = await evaluateAutomationPolicy(input);

        expect(decision.decision).toBe('deny');
        expect(decision.reasonCodes).toEqual(['budget_exceeded']);
    });

    it('rejects a missing authority snapshot at the boundary', async () => {
        const input = requestFor();
        const invalid = { ...input, consent: undefined };

        await expect(evaluateAutomationPolicy(invalid)).rejects.toThrow();
    });

    it('rejects policy decisions with an excessive validity window', async () => {
        const input = requestFor();
        input.expiresAt = '2026-09-18T12:05:01.000Z';

        await expect(evaluateAutomationPolicy(input)).rejects.toThrow();
    });
});

describe('V2 policy provider gates', () => {
    it('gates external delegation behind provider scope and exact policy', async () => {
        const input = requestFor('calendar.create_event', '1');
        input.payload = {
            provider: 'google',
            accountId: '77777777-7777-4777-8777-777777777777',
            calendarId: 'primary',
            title: 'Project review',
            description: null,
            location: null,
            attendees: [],
            allDay: false,
            startsAt: '2026-09-19T14:00:00.000Z',
            endsAt: '2026-09-19T14:30:00.000Z',
            timezone: 'America/New_York',
        };

        const decision = await evaluateAutomationPolicy(input);

        expect(decision.decision).toBe('deny');
        expect(decision.reasonCodes).toContain('connection_scope_missing');

        input.connections.grants = [
            {
                integration: 'google_calendar',
                scopes: ['calendar:write'],
            },
        ];
        const reviewDecision = await evaluateAutomationPolicy(input);
        expect(reviewDecision.decision).toBe('require_approval');

        input.delegation = {
            state: 'current',
            capabilityKeys: ['calendar.create_event@1'],
        };
        const delegatedDecision = await evaluateAutomationPolicy(input);
        expect(delegatedDecision.decision).toBe('allow');
    });
});

describe('V2 policy risk contract', () => {
    it('hashes semantically identical payloads identically', async () => {
        const first = await evaluateAutomationPolicy(requestFor());
        const input = requestFor();
        input.payload = {
            sourceReference: null,
            dueAt: null,
            notes: '',
            title: 'Review launch checklist',
        };
        const second = await evaluateAutomationPolicy(input);

        expect(second.payloadHash).toBe(first.payloadHash);
    });

    it.each(['read', 'draft'] as const)(
        'allows eligible %s capabilities without approval',
        async (riskClass) => {
            const { evaluate, request } = evaluatorWithRisk(riskClass);
            const decision = await evaluate(request);

            expect(decision.decision).toBe('allow');
            expect(decision.reasonCodes).toEqual(['low_risk_allowed']);
        },
    );

    it.each(['sensitive', 'destructive'] as const)(
        'requires mandatory approval for %s capabilities',
        async (riskClass) => {
            const { evaluate, request } = evaluatorWithRisk(riskClass);
            request.delegation = {
                state: 'current',
                capabilityKeys: [`test.${riskClass}@1`],
            };
            const decision = await evaluate(request);

            expect(decision.decision).toBe('require_approval');
            expect(decision.reasonCodes).toEqual([
                'mandatory_approval_required',
            ]);
        },
    );

    it('denies prohibited registered capabilities', async () => {
        const { evaluate, request } = evaluatorWithRisk('prohibited');
        const decision = await evaluate(request);

        expect(decision.decision).toBe('deny');
        expect(decision.reasonCodes).toEqual(['capability_prohibited']);
    });
});
