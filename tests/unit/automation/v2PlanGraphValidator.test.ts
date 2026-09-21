import { describe, expect, it } from 'vitest';
import { productionCapabilityRegistry } from '@/lib/capabilityRegistry/productionRegistry';
import { hashJson } from '@/lib/lifecycle/idempotency';
import {
    PlanGraphValidationError,
    type PlanGraphSnapshot,
    validatePlanGraph,
} from '@/lib/automationPlanning';

const ids = {
    plan: '11111111-1111-4111-8111-111111111111',
    objective: '22222222-2222-4222-8222-222222222222',
    version: '33333333-3333-4333-8333-333333333333',
    user: '44444444-4444-4444-8444-444444444444',
    first: '55555555-5555-4555-8555-555555555555',
    second: '66666666-6666-4666-8666-666666666666',
};

const taskInput = {
    title: 'Review launch checklist',
    notes: '',
    dueAt: null,
    sourceReference: null,
};

async function validSnapshot(): Promise<PlanGraphSnapshot> {
    const inputHash = await hashJson(taskInput);
    const steps = [
        {
            id: ids.first,
            planId: ids.plan,
            objectiveId: ids.objective,
            userId: ids.user,
            stepKey: 'create-review-task',
            position: 0,
            capabilityName: 'tasks.create',
            capabilityVersion: '1',
            riskClass: 'reversible_write' as const,
            input: taskInput,
            inputHash,
            expectedPostconditions: [],
            retryPolicy: {},
            timeoutSeconds: 30,
            idempotencyScope: 'objective-step',
        },
        {
            id: ids.second,
            planId: ids.plan,
            objectiveId: ids.objective,
            userId: ids.user,
            stepKey: 'create-follow-up-task',
            position: 1,
            capabilityName: 'tasks.create',
            capabilityVersion: '1',
            riskClass: 'reversible_write' as const,
            input: { ...taskInput, title: 'Review follow-up' },
            inputHash: await hashJson({
                ...taskInput,
                title: 'Review follow-up',
            }),
            expectedPostconditions: [],
            retryPolicy: {},
            timeoutSeconds: 30,
            idempotencyScope: 'objective-step',
        },
    ];
    const dependencies = [
        {
            planId: ids.plan,
            objectiveId: ids.objective,
            userId: ids.user,
            stepId: ids.second,
            dependsOnStepId: ids.first,
            condition: {},
        },
    ];
    const canonicalGraph = {
        contractVersion: '2.0',
        plan: {
            id: ids.plan,
            objectiveId: ids.objective,
            objectiveVersionId: ids.version,
            userId: ids.user,
            version: 1,
            maturityLevel: 2 as const,
            plannerVersion: 'planner-v1',
            capabilityRegistryVersion: 'registry-v1',
            contextPackageId: null,
            policySnapshotId: null,
            budgetSnapshot: {},
            previousPlanId: null,
            revisionReason: null,
        },
        steps,
        dependencies,
    };
    return {
        contractVersion: '2.0' as const,
        plan: {
            id: ids.plan,
            objectiveId: ids.objective,
            objectiveVersionId: ids.version,
            userId: ids.user,
            version: 1,
            maturityLevel: 2 as const,
            status: 'draft' as const,
            plannerVersion: 'planner-v1',
            capabilityRegistryVersion: 'registry-v1',
            contextPackageId: null,
            policySnapshotId: null,
            budgetSnapshot: {},
            graphHash: await hashJson(canonicalGraph),
            previousPlanId: null,
            revisionReason: null,
            publishedAt: null,
            supersededAt: null,
        },
        steps,
        dependencies,
        activeCapabilityKeys: ['tasks.create@1'],
    };
}

describe('V2 complete plan graph validation', () => {
    it('validates a bounded canonical DAG and its exact hash', async () => {
        const snapshot = await validSnapshot();
        const result = await validatePlanGraph(
            snapshot,
            productionCapabilityRegistry,
        );
        expect(result.graphHash).toBe(snapshot.plan.graphHash);
        expect(result.canonicalGraph.steps).toHaveLength(2);
    });

    it('rejects cycles across otherwise valid steps', async () => {
        const snapshot = await validSnapshot();
        snapshot.dependencies.push({
            ...snapshot.dependencies[0]!,
            stepId: ids.first,
            dependsOnStepId: ids.second,
        });
        await expect(
            validatePlanGraph(snapshot, productionCapabilityRegistry),
        ).rejects.toEqual(new PlanGraphValidationError('dependency_cycle'));
    });

    it('rejects empty and oversized graphs before publication', async () => {
        const empty = await validSnapshot();
        empty.steps = [];
        empty.dependencies = [];
        await expect(
            validatePlanGraph(empty, productionCapabilityRegistry),
        ).rejects.toEqual(new PlanGraphValidationError('plan_empty'));

        const oversized = await validSnapshot();
        oversized.steps = Array.from({ length: 101 }, (_, position) => ({
            ...oversized.steps[0]!,
            id: `55555555-5555-4555-8555-${position.toString(16).padStart(12, '0')}`,
            stepKey: `step-${position}`,
            position,
        }));
        oversized.dependencies = [];
        await expect(
            validatePlanGraph(oversized, productionCapabilityRegistry),
        ).rejects.toEqual(
            new PlanGraphValidationError('plan_step_limit_exceeded'),
        );
    });

    it('rejects inactive capabilities and registry risk drift', async () => {
        const inactive = await validSnapshot();
        inactive.activeCapabilityKeys = [];
        await expect(
            validatePlanGraph(inactive, productionCapabilityRegistry),
        ).rejects.toEqual(new PlanGraphValidationError('capability_inactive'));

        const risk = await validSnapshot();
        risk.steps[0]!.riskClass = 'sensitive';
        await expect(
            validatePlanGraph(risk, productionCapabilityRegistry),
        ).rejects.toEqual(
            new PlanGraphValidationError('capability_risk_mismatch'),
        );
    });

    it('rejects non-contiguous positions and stale input hashes', async () => {
        const positions = await validSnapshot();
        positions.steps[1]!.position = 3;
        await expect(
            validatePlanGraph(positions, productionCapabilityRegistry),
        ).rejects.toEqual(
            new PlanGraphValidationError('step_positions_not_contiguous'),
        );

        const hash = await validSnapshot();
        hash.steps[0]!.inputHash = 'stale-input-hash';
        await expect(
            validatePlanGraph(hash, productionCapabilityRegistry),
        ).rejects.toEqual(
            new PlanGraphValidationError('capability_input_hash_mismatch'),
        );
    });

    it('rejects a graph hash that does not cover the complete graph', async () => {
        const snapshot = await validSnapshot();
        snapshot.plan.budgetSnapshot = { maxAttempts: 4 };
        await expect(
            validatePlanGraph(snapshot, productionCapabilityRegistry),
        ).rejects.toEqual(new PlanGraphValidationError('graph_hash_mismatch'));
    });
});
