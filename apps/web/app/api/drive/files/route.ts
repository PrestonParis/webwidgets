import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    size: string;
    webViewLink: string;
    iconLink: string;
}

export async function GET(req: Request) {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const user = await getUserOrThrow(supabase);

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') ?? '';
        const pageSize = Math.min(
            parseInt(searchParams.get('pageSize') ?? '20', 10),
            50,
        );

        // The provider call is the source of truth for connection state. A
        // valid Drive-scoped token can exist even when the optional has_drive
        // bookkeeping flag was not persisted by an older OAuth callback.
        const tokens = await getGoogleTokens(supabaseAdmin, user.id);
        const auth = createGmailClient(tokens);
        const drive = google.drive({ version: 'v3', auth });

        const driveQuery = q
            ? `name contains '${q.replace(/'/g, "\\'")}' and trashed = false`
            : 'trashed = false';

        const res = await drive.files.list({
            q: driveQuery,
            pageSize,
            orderBy: 'modifiedTime desc',
            fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)',
        });

        const files: DriveFile[] = (res.data.files ?? []).map((f) => ({
            id: f.id ?? '',
            name: f.name ?? '',
            mimeType: f.mimeType ?? '',
            modifiedTime: f.modifiedTime ?? '',
            size: f.size ?? '0',
            webViewLink: f.webViewLink ?? '',
            iconLink: f.iconLink ?? '',
        }));

        return NextResponse.json({ connected: true, files });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 401) {
            return NextResponse.json({ connected: false, files: [] });
        }
        return NextResponse.json(
            {
                connected: false,
                files: [],
                error: 'Failed to fetch Drive files',
            },
            { status: 500 },
        );
    }
}
