import { NextResponse } from 'next/server';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { emailActionProposalSchema } from '@/lib/emailActions/contracts';
import { emailRequestSchema } from '@/lib/emailActions/receipts';
import { hashJson } from '@/lib/lifecycle/idempotency';
import {
    emailActionError,
    emailWorkspace,
    requireEmailMutation,
} from './_lib/http';

export async function GET() {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        return NextResponse.json(await emailWorkspace(supabaseAdmin, userId), {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        return emailActionError(error);
    }
}

export async function POST(request: Request) {
    try {
        requireEmailMutation(request);
        const { supabaseAdmin, userId } = await createCredentialClients();
        const input = emailActionProposalSchema.parse(await request.json());
        const result = await supabaseAdmin.rpc('propose_email_action', {
            p_user_id: userId,
            p_action_id: input.actionId,
            p_payload: input.message,
            p_payload_hash: await hashJson(input.message),
            p_idempotency_key: input.idempotencyKey,
        });
        if (result.error) throw new Error(result.error.message);
        return NextResponse.json(emailRequestSchema.parse(result.data), {
            status: 201,
        });
    } catch (error) {
        return emailActionError(error);
    }
}
