import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import {
    workflowProposalSchema,
    workflowActionPayloadSchema,
} from '@/lib/workflowActions/contracts';
import {
    workflowRequestSchema,
    workflowWorkspaceSchema,
} from '@/lib/workflowActions/receipts';
import {
    workflowKeySchema,
    parseWorkflowParameters,
} from '@/lib/n8n/n8nSchemas';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { requireWorkflowMutation, workflowActionError } from './_lib/http';
const configSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    config: z.record(z.string(), z.unknown()),
});
export async function GET() {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const [configs, requests, outcomes] = await Promise.all([
            supabaseAdmin
                .from('automation_configs')
                .select('id,name,config')
                .eq('user_id', userId)
                .eq('state', 'enabled'),
            supabaseAdmin
                .from('action_requests')
                .select('*')
                .eq('user_id', userId)
                .eq('action_id', 'automation.run')
                .order('requested_at', { ascending: false })
                .limit(20),
            supabaseAdmin
                .from('workflow_action_dispatches')
                .select('action_request_id,receipt')
                .eq('user_id', userId)
                .order('reserved_at', { ascending: false })
                .limit(20),
        ]);
        if (configs.error || requests.error || outcomes.error)
            throw new Error('workflow_workspace_unavailable');
        const usable = (configs.data ?? []).flatMap((entry) => {
            const config = configSchema.safeParse(entry);
            if (!config.success) return [];
            const key = workflowKeySchema.safeParse(
                config.data.config.workflowKey,
            );
            return key.success
                ? [
                      {
                          id: config.data.id,
                          name: config.data.name,
                          workflowKey: key.data,
                      },
                  ]
                : [];
        });
        return NextResponse.json(
            workflowWorkspaceSchema.parse({
                enabled: process.env.PROVIDER_ACTIONS_ENABLED === 'true',
                configured: Boolean(
                    process.env.N8N_BASE_URL && process.env.N8N_API_KEY,
                ),
                configs: usable,
                requests: requests.data,
                outcomes: outcomes.data,
            }),
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error) {
        return workflowActionError(error);
    }
}
export async function POST(request: Request) {
    try {
        requireWorkflowMutation(request);
        const { supabaseAdmin, userId } = await createCredentialClients();
        const input = workflowProposalSchema.parse(await request.json());
        const validated = parseWorkflowParameters(
            input.workflow.workflowKey,
            input.workflow.parameters,
            userId,
        );
        const normalizedRecord = z
            .record(z.string(), z.json())
            .parse(validated);
        delete normalizedRecord.userId;
        const workflow = workflowActionPayloadSchema.parse({
            ...input.workflow,
            parameters: normalizedRecord,
        });
        const result = await supabaseAdmin.rpc('propose_workflow_action', {
            p_user_id: userId,
            p_payload: workflow,
            p_payload_hash: await hashJson(workflow),
            p_idempotency_key: input.idempotencyKey,
        });
        if (result.error) throw new Error(result.error.message);
        return NextResponse.json(workflowRequestSchema.parse(result.data), {
            status: 201,
        });
    } catch (error) {
        return workflowActionError(error);
    }
}
