import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { extractText } from '@/features/inbox/lib/gmailBody';
import type { GmailPart } from '@/features/inbox/lib/gmailBody';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const raw = await params;
    // Snapshot IDs are prefixed "gmail:<msgId>" — strip the prefix before
    // passing to the Gmail API which only accepts the raw message ID.
    const id = raw.id.startsWith('gmail:') ? raw.id.slice(6) : raw.id;
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
