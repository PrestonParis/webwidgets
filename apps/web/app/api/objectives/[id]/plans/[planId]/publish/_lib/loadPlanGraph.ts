import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    jsonObjectSchema,
    jsonValueSchema,
    nullableTimestampSchema,
    riskClassSchema,
} from '@/lib/automationContracts/primitives';
import type { PlanGraphSnapshot } from '@/lib/automationPlanning';
import { PlanPublicationError } from './schemas';

const maturityLevelSchema = z.number().int().min(1).max(4);
const planRow = z.object({
    id: z.string().uuid(),
    objective_id: z.string().uuid(),
    objective_version_id: z.string().uuid(),
    user_id: z.string().uuid(),
    version: z.number().int(),
    maturity_level: maturityLevelSchema,
    status: z.enum(['draft', 'published', 'superseded', 'invalidated']),
    planner_version: z.string(),
    capability_registry_version: z.string(),
    context_package_id: z.string().uuid().nullable(),
    policy_snapshot_id: z.string().uuid().nullable(),
    budget_snapshot: jsonObjectSchema,
    graph_hash: z.string(),
    previous_plan_id: z.string().uuid().nullable(),
    revision_reason: z.string().nullable(),
    published_at: nullableTimestampSchema,
    superseded_at: nullableTimestampSchema,
});
const stepRow = z.object({
    id: z.string().uuid(),
    plan_id: z.string().uuid(),
    objective_id: z.string().uuid(),
    user_id: z.string().uuid(),
    step_key: z.string(),
    position: z.number(),
    capability_name: z.string(),
    capability_version: z.string(),
    risk_class: riskClassSchema,
    input: jsonObjectSchema,
    input_hash: z.string(),
    expected_postconditions: z.array(jsonValueSchema),
    retry_policy: jsonObjectSchema,
    timeout_seconds: z.number(),
    idempotency_scope: z.string(),
});
const dependencyRow = z.object({
    plan_id: z.string().uuid(),
    objective_id: z.string().uuid(),
    user_id: z.string().uuid(),
    step_id: z.string().uuid(),
    depends_on_step_id: z.string().uuid(),
    condition: jsonObjectSchema,
});
const capabilityRow = z.object({ name: z.string(), version: z.string() });

export async function loadPlanGraph(
    db: SupabaseClient,
    userId: string,
    objectiveId: string,
    planId: string,
): Promise<PlanGraphSnapshot> {
    const [planResult, stepResult, dependencyResult, capabilityResult] =
        await Promise.all([
            db
                .from('objective_plans')
                .select(
                    'id,objective_id,objective_version_id,user_id,version,maturity_level,status,planner_version,capability_registry_version,context_package_id,policy_snapshot_id,budget_snapshot,graph_hash,previous_plan_id,revision_reason,published_at,superseded_at',
                )
                .eq('id', planId)
                .eq('objective_id', objectiveId)
                .eq('user_id', userId)
                .maybeSingle(),
            db
                .from('objective_plan_steps')
                .select(
                    'id,plan_id,objective_id,user_id,step_key,position,capability_name,capability_version,risk_class,input,input_hash,expected_postconditions,retry_policy,timeout_seconds,idempotency_scope',
                )
                .eq('plan_id', planId)
                .eq('objective_id', objectiveId)
                .eq('user_id', userId),
            db
                .from('objective_step_dependencies')
                .select(
                    'plan_id,objective_id,user_id,step_id,depends_on_step_id,condition',
                )
                .eq('plan_id', planId)
                .eq('objective_id', objectiveId)
                .eq('user_id', userId),
            db
                .from('automation_capability_versions')
                .select('name,version')
                .eq('status', 'active'),
        ]);
    if (
        planResult.error ||
        stepResult.error ||
        dependencyResult.error ||
        capabilityResult.error
    ) {
        throw new PlanPublicationError('plan_graph_unavailable', 409);
    }
    if (!planResult.data) {
        throw new PlanPublicationError('plan_not_found', 404);
    }
    const plan = planRow.parse(planResult.data);
    return {
        contractVersion: '2.0',
        plan: {
            id: plan.id,
            objectiveId: plan.objective_id,
            objectiveVersionId: plan.objective_version_id,
            userId: plan.user_id,
            version: plan.version,
            maturityLevel: plan.maturity_level,
            status: plan.status,
            plannerVersion: plan.planner_version,
            capabilityRegistryVersion: plan.capability_registry_version,
            contextPackageId: plan.context_package_id,
            policySnapshotId: plan.policy_snapshot_id,
            budgetSnapshot: plan.budget_snapshot,
            graphHash: plan.graph_hash,
            previousPlanId: plan.previous_plan_id,
            revisionReason: plan.revision_reason,
            publishedAt: plan.published_at,
            supersededAt: plan.superseded_at,
        },
        steps: z
            .array(stepRow)
            .parse(stepResult.data)
            .map((step) => ({
                id: step.id,
                planId: step.plan_id,
                objectiveId: step.objective_id,
                userId: step.user_id,
                stepKey: step.step_key,
                position: step.position,
                capabilityName: step.capability_name,
                capabilityVersion: step.capability_version,
                riskClass: step.risk_class,
                input: step.input,
                inputHash: step.input_hash,
                expectedPostconditions: step.expected_postconditions,
                retryPolicy: step.retry_policy,
                timeoutSeconds: step.timeout_seconds,
                idempotencyScope: step.idempotency_scope,
            })),
        dependencies: z
            .array(dependencyRow)
            .parse(dependencyResult.data)
            .map((edge) => ({
                planId: edge.plan_id,
                objectiveId: edge.objective_id,
                userId: edge.user_id,
                stepId: edge.step_id,
                dependsOnStepId: edge.depends_on_step_id,
                condition: edge.condition,
            })),
        activeCapabilityKeys: z
            .array(capabilityRow)
            .parse(capabilityResult.data)
            .map(({ name, version }) => `${name}@${version}`),
    };
}
