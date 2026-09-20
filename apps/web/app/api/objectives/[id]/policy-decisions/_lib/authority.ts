import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { AutomationPolicyRequest } from '@/lib/automationPolicy';
import {
    accountRowSchema,
    budgetRowSchema,
    connectionRowSchema,
    consentRowSchema,
    objectiveRowSchema,
    planRowSchema,
    stepRowSchema,
    versionRowSchema,
} from './authoritySchemas';
import { buildConnectionGrants } from './connections';
import { persistenceAuthoritySchema, PolicyPersistenceError } from './schemas';

const capabilityKeyPattern = /^[a-z0-9][a-z0-9_.-]+@[1-9][0-9]*$/u;

async function ownedSingle(
    query: PromiseLike<{ data: unknown; error: unknown }>,
) {
    const result = await query;
    if (result.error || result.data === null) {
        throw new PolicyPersistenceError('policy_target_not_found', 404);
    }
    return result.data;
}

function budgetRequest(row: z.infer<typeof budgetRowSchema>) {
    return {
        id: row.id,
        status: row.status,
        maxAttempts: row.max_attempts,
        maxProviderCalls: row.max_provider_calls,
        maxModelTokens: row.max_model_tokens,
        maxCostMicrounits: row.max_cost_microunits,
        maxActiveSeconds: row.max_active_seconds,
        attemptsUsed: row.attempts_used,
        providerCallsUsed: row.provider_calls_used,
        modelTokensUsed: row.model_tokens_used,
        costMicrounitsUsed: row.cost_microunits_used,
        activeSecondsUsed: row.active_seconds_used,
    };
}

async function loadCoreAuthority(
    db: SupabaseClient,
    userId: string,
    objectiveId: string,
    planId: string,
    stepId: string,
) {
    const [objectiveRaw, planRaw, stepRaw] = await Promise.all([
        ownedSingle(
            db
                .from('objectives')
                .select('status')
                .eq('id', objectiveId)
                .eq('user_id', userId)
                .maybeSingle(),
        ),
        ownedSingle(
            db
                .from('objective_plans')
                .select('objective_version_id,status')
                .eq('id', planId)
                .eq('objective_id', objectiveId)
                .eq('user_id', userId)
                .maybeSingle(),
        ),
        ownedSingle(
            db
                .from('objective_plan_steps')
                .select('capability_name,capability_version,input')
                .eq('id', stepId)
                .eq('plan_id', planId)
                .eq('objective_id', objectiveId)
                .eq('user_id', userId)
                .maybeSingle(),
        ),
    ]);
    const objective = objectiveRowSchema.parse(objectiveRaw);
    const plan = planRowSchema.parse(planRaw);
    const step = stepRowSchema.parse(stepRaw);
    if (plan.status !== 'published') {
        throw new PolicyPersistenceError('policy_plan_not_published', 409);
    }
    return { objective, plan, step };
}

async function loadAuthoritySnapshots(
    db: SupabaseClient,
    userId: string,
    objectiveId: string,
    objectiveVersionId: string,
    step: z.infer<typeof stepRowSchema>,
) {
    const [
        versionResult,
        budgetResult,
        consentResult,
        accountResult,
        connectionResult,
        capabilityResult,
    ] = await Promise.all([
        db
            .from('objective_versions')
            .select('permitted_capabilities,policy_version')
            .eq('id', objectiveVersionId)
            .eq('objective_id', objectiveId)
            .eq('user_id', userId)
            .single(),
        db
            .from('objective_budgets')
            .select(
                'id,status,max_attempts,max_provider_calls,max_model_tokens,max_cost_microunits,max_active_seconds,attempts_used,provider_calls_used,model_tokens_used,cost_microunits_used,active_seconds_used',
            )
            .eq('objective_id', objectiveId)
            .eq('objective_version_id', objectiveVersionId)
            .eq('user_id', userId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle(),
        db
            .from('consent_records')
            .select('scope,state')
            .eq('user_id', userId)
            .eq('category', 'automation'),
        db
            .from('user_email_accounts')
            .select('id,provider,integration_connection_id')
            .eq('user_id', userId),
        db
            .from('integration_connections')
            .select('id,provider_id,state,scopes')
            .eq('user_id', userId),
        db
            .from('automation_capability_versions')
            .select('status')
            .eq('name', step.capability_name)
            .eq('version', step.capability_version)
            .eq('status', 'active')
            .maybeSingle(),
    ]);
    if (
        versionResult.error ||
        budgetResult.error ||
        consentResult.error ||
        accountResult.error ||
        connectionResult.error ||
        capabilityResult.error ||
        !versionResult.data ||
        !budgetResult.data ||
        !capabilityResult.data
    ) {
        throw new PolicyPersistenceError('policy_authority_unavailable', 409);
    }
    const version = versionRowSchema.parse(versionResult.data);
    if (version.policy_version !== 'v2.policy.1') {
        throw new PolicyPersistenceError('policy_version_unsupported', 409);
    }
    const consents = z.array(consentRowSchema).parse(consentResult.data);
    const accounts = z
        .array(accountRowSchema)
        .parse(accountResult.data)
        .sort((left, right) => left.id.localeCompare(right.id));
    const connections = z
        .array(connectionRowSchema)
        .parse(connectionResult.data)
        .sort((left, right) => left.id.localeCompare(right.id));
    const consentKeys = consents
        .filter(
            (item) =>
                item.state === 'granted' &&
                capabilityKeyPattern.test(item.scope),
        )
        .map((item) => item.scope);
    return {
        version,
        consentKeys,
        grants: buildConnectionGrants(accounts, connections),
        budget: budgetRequest(budgetRowSchema.parse(budgetResult.data)),
        consents: consents.sort((left, right) =>
            left.scope.localeCompare(right.scope),
        ),
        accounts,
        connections,
    };
}

export async function loadPolicyAuthority(
    db: SupabaseClient,
    userId: string,
    objectiveId: string,
    planId: string,
    stepId: string,
) {
    const { objective, plan, step } = await loadCoreAuthority(
        db,
        userId,
        objectiveId,
        planId,
        stepId,
    );
    const snapshots = await loadAuthoritySnapshots(
        db,
        userId,
        objectiveId,
        plan.objective_version_id,
        step,
    );
    const key = `${step.capability_name}@${step.capability_version}`;
    const request: AutomationPolicyRequest = {
        contractVersion: '2.0',
        decisionId: randomUUID(),
        objectiveId,
        planId,
        stepId,
        userId,
        objectiveStatus: objective.status,
        capabilityName: step.capability_name,
        capabilityVersion: step.capability_version,
        payload: step.input,
        permittedCapabilityKeys: snapshots.version.permitted_capabilities,
        consent: {
            state: snapshots.consentKeys.includes(key) ? 'active' : 'revoked',
            capabilityKeys: snapshots.consentKeys,
        },
        connections: {
            state: 'current',
            grants: snapshots.grants,
        },
        delegation: { state: 'disabled', capabilityKeys: [] },
        budget: snapshots.budget,
    };
    const persistence = persistenceAuthoritySchema.parse({
        objectiveVersionId: plan.objective_version_id,
        stepInput: step.input,
        permittedCapabilityKeys: snapshots.version.permitted_capabilities,
        consentRecords: snapshots.consents,
        connectionAccounts: snapshots.accounts.map((account) => ({
            id: account.id,
            provider: account.provider,
            integrationConnectionId: account.integration_connection_id,
        })),
        integrationConnections: snapshots.connections.map((connection) => ({
            id: connection.id,
            providerId: connection.provider_id,
            state: connection.state,
            scopes: connection.scopes,
        })),
        delegation: { state: 'disabled' },
        budget: snapshots.budget,
    });
    return { request, persistence };
}
