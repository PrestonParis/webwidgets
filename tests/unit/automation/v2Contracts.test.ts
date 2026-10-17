import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    capabilityResultSchema,
    createCapabilityRequestSchema,
} from '@/lib/automationContracts/capabilities';
import { createAutomationContractSet } from '@/lib/automationContracts/boundaries';
import { safeProviderError } from '@/lib/automationContracts/errors';
import { automationEventSchema } from '@/lib/automationContracts/events';
import capabilityFixture from '@/lib/automationContracts/fixtures/capability-request.v2.json';
import eventFixture from '@/lib/automationContracts/fixtures/step-ready-event.v2.json';
import { approvalSchema } from '@/lib/automationContracts/governance';
import {
    createObjectivePlanStepSchema,
    createObjectiveRequestSchema,
    objectiveSchema,
} from '@/lib/automationContracts/objectives';
import {
    AutomationContractValidationError,
    deserializeContract,
    parseApiRequest,
    parseDatabaseRow,
    parseProviderResult,
    parseQueuePayload,
    serializeContract,
} from '@/lib/automationContracts/parsers';

const id = {
    objective: '11111111-1111-4111-8111-111111111111',
    user: '22222222-2222-4222-8222-222222222222',
    run: '33333333-3333-4333-8333-333333333333',
    attempt: '44444444-4444-4444-8444-444444444444',
    request: '55555555-5555-4555-8555-555555555555',
    policy: '66666666-6666-4666-8666-666666666666',
    budget: '77777777-7777-4777-8777-777777777777',
    plan: '88888888-8888-4888-8888-888888888888',
    step: '99999999-9999-4999-8999-999999999999',
    approval: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
} as const;
const timestamp = '2026-09-08T12:00:00.000Z';

function capabilityRequest(name = 'tasks.create') {
    return {
        contractVersion: '2.0',
        requestId: id.request,
        objectiveId: id.objective,
        runId: id.run,
        attemptId: id.attempt,
        userId: id.user,
        capability: { name, version: '1' },
        input: { title: 'Follow up' },
        inputHash: '1111111111111111',
        idempotencyKey: 'objective:step:attempt',
        policyDecisionId: id.policy,
        budgetId: id.budget,
        ownershipEpoch: 1,
        deadlineAt: timestamp,
    };
}

function objectiveRow() {
    return {
        contractVersion: '2.0',
        id: id.objective,
        userId: id.user,
        workspaceId: null,
        clientRequestKey: 'client-request-1',
        title: 'Prepare tomorrow',
        maturityLevel: 4,
        status: 'submitted',
        stateVersion: 2,
        deadlineAt: null,
        submittedAt: timestamp,
        completedAt: null,
        cancellationRequestedAt: null,
        cancellationReason: null,
        archivedAt: null,
        retentionExpiresAt: '2027-09-08T12:00:00.000Z',
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

describe('V2 automation contracts', () => {
    it('uses the same schema instances at web and worker boundaries', () => {
        const contracts = createAutomationContractSet(
            new Set(['tasks.create']),
        );
        expect(contracts.worker.event).toBe(automationEventSchema);
        expect(contracts.worker.capabilityResult).toBe(capabilityResultSchema);

        const request = {
            contractVersion: '2.0',
            clientRequestKey: 'request-1',
            title: 'Prepare tomorrow',
            maturityLevel: 4,
            intent: 'Prepare a bounded plan for tomorrow',
            successConditions: [{ kind: 'plan_created' }],
            stopConditions: [{ kind: 'deadline' }],
        } satisfies z.input<typeof createObjectiveRequestSchema>;
        expect(parseApiRequest(contracts.web.createObjective, request)).toEqual(
            {
                ...request,
                scope: {},
                expectedOutputs: [],
                failureConditions: [],
            },
        );
    });

    it('keeps language-neutral worker fixtures compatible', () => {
        const contracts = createAutomationContractSet(
            new Set(['tasks.create']),
        );
        expect(
            parseQueuePayload(contracts.worker.event, eventFixture).eventType,
        ).toBe('step.ready');
        expect(
            parseQueuePayload(
                contracts.worker.capabilityRequest,
                capabilityFixture,
            ).capability.name,
        ).toBe('tasks.create');
    });

    it('strictly validates enriched database rows', () => {
        expect(parseDatabaseRow(objectiveSchema, objectiveRow())).toEqual(
            objectiveRow(),
        );
        expect(() =>
            parseDatabaseRow(objectiveSchema, {
                ...objectiveRow(),
                untrusted_column: true,
            }),
        ).toThrow(AutomationContractValidationError);
    });

    it('fails closed for unknown contract versions', () => {
        try {
            parseApiRequest(createObjectiveRequestSchema, {
                contractVersion: '3.0',
            });
            expect.unreachable('unknown versions must be rejected');
        } catch (error) {
            expect(error).toBeInstanceOf(AutomationContractValidationError);
            if (!(error instanceof AutomationContractValidationError))
                throw error;
            expect(error.code).toBe('unsupported_version');
        }
    });

    it('rejects capability names outside the supplied registry', () => {
        const schema = createCapabilityRequestSchema(new Set(['tasks.create']));
        expect(() =>
            parseQueuePayload(schema, capabilityRequest('shell.execute')),
        ).toThrowError(expect.objectContaining({ code: 'unknown_capability' }));
        expect(
            parseQueuePayload(schema, capabilityRequest()).capability.name,
        ).toBe('tasks.create');

        const stepSchema = createObjectivePlanStepSchema(
            new Set(['tasks.create']),
        );
        expect(() =>
            parseApiRequest(stepSchema, {
                contractVersion: '2.0',
                id: id.step,
                planId: id.plan,
                objectiveId: id.objective,
                userId: id.user,
                stepKey: 'unsafe-step',
                position: 0,
                capabilityName: 'shell.execute',
                capabilityVersion: '1',
                riskClass: 'prohibited',
                input: {},
                inputHash: '3333333333333333',
                expectedPostconditions: [],
                retryPolicy: {},
                timeoutSeconds: 60,
                idempotencyScope: 'objective-step',
            }),
        ).toThrowError(expect.objectContaining({ code: 'unknown_capability' }));
    });

    it('rejects provider extras and never surfaces raw provider text', () => {
        const rawMessage = 'upstream token=private-value';
        expect(() =>
            parseProviderResult(capabilityResultSchema, {
                contractVersion: '2.0',
                requestId: id.request,
                attemptId: id.attempt,
                status: 'failed',
                error: safeProviderError('provider_rejected', 'quota', false),
                completedAt: timestamp,
                rawMessage,
            }),
        ).toThrowError(AutomationContractValidationError);
        const safe = safeProviderError('provider_unavailable', 'offline', true);
        expect(JSON.stringify(safe)).not.toContain(rawMessage);
        expect(safe.safeMessage).toBe(
            'The provider operation did not complete.',
        );
    });

    it('round-trips queue payloads with deterministic object ordering', () => {
        const first = { ...capabilityRequest(), input: { z: 1, a: 2 } };
        const second = { ...capabilityRequest(), input: { a: 2, z: 1 } };
        const schema = createCapabilityRequestSchema(new Set(['tasks.create']));
        const serialized = serializeContract(schema, first);
        expect(serialized).toBe(serializeContract(schema, second));
        expect(deserializeContract(schema, serialized)).toEqual(second);
    });

    it('rejects unknown event kinds before worker dispatch', () => {
        expect(() =>
            parseQueuePayload(automationEventSchema, {
                contractVersion: '2.0',
                eventId: id.request,
                objectiveId: id.objective,
                userId: id.user,
                correlationId: 'correlation-1',
                sequence: 1,
                ownershipEpoch: 1,
                occurredAt: timestamp,
                eventType: 'provider.execute_arbitrary',
            }),
        ).toThrowError(AutomationContractValidationError);
    });

    it('binds approval to the exact payload independent of key order', () => {
        const approval = {
            contractVersion: '2.0',
            id: id.approval,
            objectiveId: id.objective,
            planId: id.plan,
            stepId: id.step,
            policyDecisionId: id.policy,
            userId: id.user,
            payload: { title: 'Follow up', priority: 1 },
            payloadHash: '2222222222222222',
            payloadVersion: 1,
            status: 'approved',
            decidedBy: id.user,
            decidedPayload: { priority: 1, title: 'Follow up' },
            decidedPayloadHash: '2222222222222222',
            decidedPayloadVersion: 1,
            requestedAt: timestamp,
            decidedAt: timestamp,
            expiresAt: '2026-09-08T13:00:00.000Z',
        };
        expect(approvalSchema.parse(approval).status).toBe('approved');
        expect(() =>
            approvalSchema.parse({
                ...approval,
                decidedPayload: { title: 'Changed' },
            }),
        ).toThrow();
    });
});
