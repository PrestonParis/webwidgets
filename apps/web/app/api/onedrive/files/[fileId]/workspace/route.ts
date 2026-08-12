import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getMicrosoftTokens } from '@/lib/supabase/getMicrosoftTokens';
import { resolveMicrosoftAccessToken } from '@/lib/connectors/microsoft/graphConnector';

interface PreviewResponse {
    getUrl?: string;
}

async function requestPreview(
    accessToken: string,
    fileId: string,
    editable: boolean,
): Promise<string | null> {
    const version = editable ? 'beta' : 'v1.0';
    const response = await fetch(
        `https://graph.microsoft.com/${version}/me/drive/items/${encodeURIComponent(fileId)}/preview`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                editable
                    ? { viewer: 'office', chromeless: false, allowEdit: true }
                    : {},
            ),
            cache: 'no-store',
        },
    );
    if (!response.ok) return null;
    const result = (await response.json()) as PreviewResponse;
    return result.getUrl ?? null;
}

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ fileId: string }> },
) {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const user = await getUserOrThrow(supabase);
        const tokens = await getMicrosoftTokens(supabaseAdmin, user.id);
        const accessToken = await resolveMicrosoftAccessToken(tokens);
        const { fileId } = await params;

        const editUrl = await requestPreview(accessToken, fileId, true);
        if (editUrl) {
            return NextResponse.json({ url: editUrl, mode: 'edit' });
        }

        const previewUrl = await requestPreview(accessToken, fileId, false);
        if (previewUrl) {
            return NextResponse.json({ url: previewUrl, mode: 'preview' });
        }

        return NextResponse.json(
            {
                error: 'Embedded Office view is unavailable for this account.',
            },
            { status: 422 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to open OneDrive file',
            },
            { status: 500 },
        );
    }
}
