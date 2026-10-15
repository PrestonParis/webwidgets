import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    createConversation,
    listConversations,
} from '@/features/chatbot/services/chatService';
import type { ModelProvider } from '@/features/chatbot/types/chat';

const createSchema = z.object({
    model: z.string().min(1),
    provider: z.enum(['anthropic', 'openai', 'google']),
    title: z.string().optional(),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const conversations = await listConversations(supabase, userId);
        return NextResponse.json({ conversations });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = createSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const conversation = await createConversation(
            supabase,
            userId,
            body.data.model,
            body.data.provider as ModelProvider,
            body.data.title,
        );
        return NextResponse.json({ conversation });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
