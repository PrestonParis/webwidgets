import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';

function decodeBase64Url(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
}

interface GmailPart {
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailPart[];
}

function extractText(part: GmailPart): string {
    if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
        for (const child of part.parts) {
            const text = extractText(child);
            if (text) return text;
        }
    }
    return '';
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const tokens = await getGoogleTokens(supabaseAdmin, user.id);
    const auth = createGmailClient(tokens);
    const gmail = google.gmail({ version: 'v1', auth });

    const { data: message } = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'full',
    });

    const payload = message.payload as GmailPart | undefined;
    const body = payload ? extractText(payload) : '';

    return NextResponse.json({ body: body.trim() });
}
