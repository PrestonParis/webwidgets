import { automationErrorSchema } from '@/lib/automationContracts/errors';
import {
    taskCompleteInputSchema,
    taskCreateInputSchema,
    taskReceiptSchema,
    taskUpdateInputSchema,
} from './capabilitySchemas';
import type { CapabilityRegistration } from './types';

const taskReceipt = {
    taskId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Review launch checklist',
    notes: null,
    dueAt: null,
    completed: false,
    completedAt: null,
    verifiedUpdatedAt: '2026-09-08T12:00:00.000Z',
};

const common = {
    owner: 'typescript_worker' as const,
    errorSchema: automationErrorSchema,
    requiredIntegrations: ['none'] as const,
    requiredScopes: Object.freeze({}),
    idempotencyStrategy: 'canonical_action_request' as const,
    executionPolicy: Object.freeze({
        timeoutSeconds: 30,
        maxAttempts: 3,
        concurrencyKey: 'user' as const,
    }),
    estimateResources: () => ({
        providerCalls: 1,
        modelTokens: 0,
        costMicrounits: 0,
        activeSeconds: 2,
    }),
    observability: Object.freeze({
        eventNamespace: 'automation.capability' as const,
        recordInputHash: true as const,
        recordOutputHash: true as const,
        redactionPolicy: 'registry_fields' as const,
    }),
    redactedInputFields: [] as const,
};

export const taskCapabilities: readonly CapabilityRegistration[] = [
    {
        ...common,
        name: 'tasks.create',
        version: '1',
        definitionHash:
            'a4b509058e3156ef8676bf7e7f77c36fe4ddaa0346b439800b1d891bfeae11cf',
        inputSchema: taskCreateInputSchema,
        outputSchema: taskReceiptSchema,
        riskClass: 'reversible_write',
        reversibility: 'compensatable',
        binding: {
            executorId: 'supabase.rpc.execute_approved_task_action',
            verifierId: 'supabase.receipt.task_action',
            compensationId: 'supabase.rpc.undo_task_action',
        },
        fixture: {
            id: 'tasks.create.v1',
            input: {
                title: 'Review launch checklist',
                notes: '',
                dueAt: null,
                sourceReference: null,
            },
            output: taskReceipt,
            testReference:
                'services/sync-worker/src/tests/taskActionProcessor.test.ts; supabase/tests/009_real_task_actions.test.sql',
        },
    },
    {
        ...common,
        name: 'tasks.update',
        version: '1',
        definitionHash:
            'a7633d0b4c2c83afcd331b86801ab0a22f62f5179682603cabcc5716af00ab9f',
        inputSchema: taskUpdateInputSchema,
        outputSchema: taskReceiptSchema,
        riskClass: 'reversible_write',
        reversibility: 'compensatable',
        binding: {
            executorId: 'supabase.rpc.execute_approved_task_action',
            verifierId: 'supabase.receipt.task_action',
            compensationId: 'supabase.rpc.undo_task_action',
        },
        fixture: {
            id: 'tasks.update.v1',
            input: {
                taskId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                expectedUpdatedAt: '2026-09-08T12:00:00.000Z',
                title: 'Review final launch checklist',
            },
            output: { ...taskReceipt, title: 'Review final launch checklist' },
            testReference:
                'services/sync-worker/src/tests/taskActionProcessor.test.ts; supabase/tests/009_real_task_actions.test.sql',
        },
    },
    {
        ...common,
        name: 'tasks.complete',
        version: '1',
        definitionHash:
            'c449aa0cd88d286e9a1192698621a9ab40b48b99789bbd15809ed5934cfbc022',
        inputSchema: taskCompleteInputSchema,
        outputSchema: taskReceiptSchema,
        riskClass: 'sensitive',
        reversibility: 'manual',
        binding: {
            executorId: 'supabase.rpc.execute_approved_task_action',
            verifierId: 'supabase.receipt.task_action',
        },
        fixture: {
            id: 'tasks.complete.v1',
            input: {
                taskId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                expectedUpdatedAt: '2026-09-08T12:00:00.000Z',
            },
            output: {
                ...taskReceipt,
                completed: true,
                completedAt: '2026-09-08T12:00:01.000Z',
            },
            testReference:
                'services/sync-worker/src/tests/taskActionProcessor.test.ts; supabase/tests/009_real_task_actions.test.sql',
        },
    },
];
