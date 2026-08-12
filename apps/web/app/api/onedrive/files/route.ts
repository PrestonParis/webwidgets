import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getMicrosoftTokens } from '@/lib/supabase/getMicrosoftTokens';
import { resolveMicrosoftAccessToken } from '@/lib/connectors/microsoft/graphConnector';

export interface OneDriveFile {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    modifiedTime: string;
    webUrl: string;
}

interface GraphDriveItem {
    id?: string;
    name?: string;
    size?: number;
    lastModifiedDateTime?: string;
    webUrl?: string;
    file?: { mimeType?: string };
}

function mapFile(item: GraphDriveItem): OneDriveFile {
    return {
        id: item.id ?? '',
        name: item.name ?? '',
        mimeType: item.file?.mimeType ?? 'application/octet-stream',
        size: item.size ?? 0,
        modifiedTime: item.lastModifiedDateTime ?? '',
        webUrl: item.webUrl ?? '',
    };
}

export async function GET(request: Request) {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const user = await getUserOrThrow(supabase);
        const tokens = await getMicrosoftTokens(supabaseAdmin, user.id);
        const accessToken = await resolveMicrosoftAccessToken(tokens);
        const query = new URL(request.url).searchParams.get('q')?.trim();
        const path = query
            ? `/me/drive/root/search(q='${encodeURIComponent(query.replace(/'/g, "''"))}')`
            : '/me/drive/recent';
        const params = new URLSearchParams({
            $top: '50',
            $select: 'id,name,size,lastModifiedDateTime,webUrl,file,folder',
        });
        const response = await fetch(
            `https://graph.microsoft.com/v1.0${path}?${params}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: 'no-store',
            },
        );

        if (response.status === 401 || response.status === 403) {
            return NextResponse.json({ connected: false, files: [] });
        }
        if (!response.ok) {
            throw new Error(`Microsoft Graph returned ${response.status}`);
        }
        const body = (await response.json()) as { value?: GraphDriveItem[] };
        const files = (body.value ?? [])
            .filter((item) => item.file && item.id)
            .map(mapFile);
        return NextResponse.json({ connected: true, files });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to load OneDrive';
        if (message.includes('not connected')) {
            return NextResponse.json({ connected: false, files: [] });
        }
        return NextResponse.json(
            { connected: false, files: [], error: message },
            { status: 500 },
        );
    }
}
