import {
    jsonObjectSchema,
    serializeJson,
} from '@/lib/automationContracts/primitives';
import type { CapabilityRegistry } from '@/lib/capabilityRegistry/registry';
import { capabilityKey } from '@/lib/capabilityRegistry/registry';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { planGraphSnapshotSchema, type PlanGraphSnapshot } from './schemas';

export const MAX_PLAN_STEPS = 100;
export const MAX_PLAN_DEPENDENCIES = 400;

export class PlanGraphValidationError extends Error {
    constructor(readonly code: string) {
        super(`Plan graph rejected: ${code}`);
        this.name = 'PlanGraphValidationError';
    }
}

function assertMembership(snapshot: PlanGraphSnapshot) {
    const { plan } = snapshot;
    const matchesPlan = (row: {
        planId: string;
        objectiveId: string;
        userId: string;
    }) =>
        row.planId === plan.id &&
        row.objectiveId === plan.objectiveId &&
        row.userId === plan.userId;
    if (!snapshot.steps.every(matchesPlan)) {
        throw new PlanGraphValidationError('step_membership_mismatch');
    }
    if (!snapshot.dependencies.every(matchesPlan)) {
        throw new PlanGraphValidationError('dependency_membership_mismatch');
    }
}

function assertShape(snapshot: PlanGraphSnapshot) {
    if (snapshot.steps.length === 0) {
        throw new PlanGraphValidationError('plan_empty');
    }
    if (snapshot.steps.length > MAX_PLAN_STEPS) {
        throw new PlanGraphValidationError('plan_step_limit_exceeded');
    }
    if (snapshot.dependencies.length > MAX_PLAN_DEPENDENCIES) {
        throw new PlanGraphValidationError('plan_dependency_limit_exceeded');
    }
    const ids = new Set(snapshot.steps.map(({ id }) => id));
    const keys = new Set(snapshot.steps.map(({ stepKey }) => stepKey));
    if (
        ids.size !== snapshot.steps.length ||
        keys.size !== snapshot.steps.length
    ) {
        throw new PlanGraphValidationError('duplicate_plan_step');
    }
    const positions = snapshot.steps
        .map(({ position }) => position)
        .sort((a, b) => a - b);
    if (positions.some((position, index) => position !== index)) {
        throw new PlanGraphValidationError('step_positions_not_contiguous');
    }
    assertMembership(snapshot);
}

function assertDependencies(snapshot: PlanGraphSnapshot) {
    const stepIds = new Set(snapshot.steps.map(({ id }) => id));
    const edges = new Set<string>();
    for (const edge of snapshot.dependencies) {
        if (!stepIds.has(edge.stepId) || !stepIds.has(edge.dependsOnStepId)) {
            throw new PlanGraphValidationError('dependency_step_missing');
        }
        if (edge.stepId === edge.dependsOnStepId) {
            throw new PlanGraphValidationError('dependency_self_reference');
        }
        const key = `${edge.stepId}:${edge.dependsOnStepId}`;
        if (edges.has(key)) {
            throw new PlanGraphValidationError('duplicate_dependency');
        }
        edges.add(key);
    }
}

function assertAcyclic(snapshot: PlanGraphSnapshot) {
    const incoming = new Map(snapshot.steps.map(({ id }) => [id, 0]));
    const outgoing = new Map(
        snapshot.steps.map(({ id }) => [id, [] as string[]]),
    );
    for (const edge of snapshot.dependencies) {
        incoming.set(edge.stepId, (incoming.get(edge.stepId) ?? 0) + 1);
        outgoing.get(edge.dependsOnStepId)?.push(edge.stepId);
    }
    const ready = [...incoming]
        .filter(([, count]) => count === 0)
        .map(([id]) => id);
    let visited = 0;
    while (ready.length > 0) {
        const id = ready.pop()!;
        visited += 1;
        for (const next of outgoing.get(id) ?? []) {
            const count = (incoming.get(next) ?? 0) - 1;
            incoming.set(next, count);
            if (count === 0) ready.push(next);
        }
    }
    if (visited !== snapshot.steps.length) {
        throw new PlanGraphValidationError('dependency_cycle');
    }
}

async function normalizedSteps(
    snapshot: PlanGraphSnapshot,
    registry: CapabilityRegistry,
) {
    const active = new Set(snapshot.activeCapabilityKeys);
    return Promise.all(
        snapshot.steps.map(async (step) => {
            const registration = registry.get(
                step.capabilityName,
                step.capabilityVersion,
            );
            if (!registration) {
                throw new PlanGraphValidationError('capability_unknown');
            }
            const key = capabilityKey(registration.name, registration.version);
            if (!active.has(key)) {
                throw new PlanGraphValidationError('capability_inactive');
            }
            if (registration.riskClass !== step.riskClass) {
                throw new PlanGraphValidationError('capability_risk_mismatch');
            }
            const parsed = registration.inputSchema.safeParse(step.input);
            if (!parsed.success) {
                throw new PlanGraphValidationError('capability_input_invalid');
            }
            const input = jsonObjectSchema.parse(parsed.data);
            if (serializeJson(input) !== serializeJson(step.input)) {
                throw new PlanGraphValidationError(
                    'capability_input_not_normalized',
                );
            }
            const inputHash = await hashJson(input);
            if (inputHash !== step.inputHash) {
                throw new PlanGraphValidationError(
                    'capability_input_hash_mismatch',
                );
            }
            return { ...step, input };
        }),
    );
}

export async function validatePlanGraph(
    input: unknown,
    registry: CapabilityRegistry,
) {
    const snapshot = planGraphSnapshotSchema.parse(input);
    if (snapshot.plan.status !== 'draft') {
        throw new PlanGraphValidationError('plan_not_draft');
    }
    assertShape(snapshot);
    assertDependencies(snapshot);
    assertAcyclic(snapshot);
    const steps = await normalizedSteps(snapshot, registry);
    const canonicalGraph = {
        contractVersion: snapshot.contractVersion,
        plan: {
            id: snapshot.plan.id,
            objectiveId: snapshot.plan.objectiveId,
            objectiveVersionId: snapshot.plan.objectiveVersionId,
            userId: snapshot.plan.userId,
            version: snapshot.plan.version,
            maturityLevel: snapshot.plan.maturityLevel,
            plannerVersion: snapshot.plan.plannerVersion,
            capabilityRegistryVersion: snapshot.plan.capabilityRegistryVersion,
            contextPackageId: snapshot.plan.contextPackageId,
            policySnapshotId: snapshot.plan.policySnapshotId,
            budgetSnapshot: snapshot.plan.budgetSnapshot,
            previousPlanId: snapshot.plan.previousPlanId,
            revisionReason: snapshot.plan.revisionReason,
        },
        steps: [...steps].sort((left, right) => left.position - right.position),
        dependencies: [...snapshot.dependencies].sort((left, right) =>
            `${left.stepId}:${left.dependsOnStepId}`.localeCompare(
                `${right.stepId}:${right.dependsOnStepId}`,
            ),
        ),
    };
    const graphHash = await hashJson(canonicalGraph);
    if (graphHash !== snapshot.plan.graphHash) {
        throw new PlanGraphValidationError('graph_hash_mismatch');
    }
    return { graphHash, canonicalGraph };
}
