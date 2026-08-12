import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import {
    ingestGoogleDriveConnectionContext,
    ingestGoogleDriveFileContext,
} from './contextProducerService';

const SYNC_PAGE_SIZE = 100;

export async function syncGoogleDriveContext(
    admin: SupabaseClient,
    userId: string,
): Promise<number> {
    const tokens = await getGoogleTokens(admin, userId);
    const auth = createGmailClient(tokens);
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
        q: 'trashed = false',
        pageSize: SYNC_PAGE_SIZE,
        orderBy: 'modifiedTime desc',
        fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)',
    });
    const files = res.data.files ?? [];

    await ingestGoogleDriveConnectionContext(admin, userId);
    await Promise.all(
        files.map((f) =>
            ingestGoogleDriveFileContext(admin, userId, {
                id: f.id ?? '',
                name: f.name ?? 'Untitled',
                mimeType: f.mimeType ?? '',
                modifiedTime: f.modifiedTime ?? '',
                size: f.size ?? '0',
                webViewLink: f.webViewLink ?? '',
                iconLink: f.iconLink ?? '',
            }),
        ),
    );
    return files.length;
}
