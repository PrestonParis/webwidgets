import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getArtifact } from '@/features/artifacts/services/artifactService';
import {
    convertTextFile,
    getOutputMimeType,
} from '@/features/files/lib/conversionService';

type RouteContext = { params: Promise<{ id: string }> };
type DownloadFormat = 'md' | 'txt' | 'html' | 'json';

export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await ctx.params;
        const { searchParams } = new URL(req.url);
        const format = normalizeFormat(searchParams.get('format'));
        const artifact = await getArtifact(supabase, userId, id);
        if (!artifact) {
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }

        const from = artifact.contentFormat === 'plain_text' ? 'txt' : 'md';
        const content =
            format === 'json'
                ? JSON.stringify(artifact, null, 2)
                : format === 'md' || format === from
                  ? artifact.content
                  : await convertTextFile({
                        input: artifact.content,
                        from,
                        to: format,
                    });
        const mimeType =
            format === 'json' ? 'application/json' : getOutputMimeType(format);
        return new Response(content, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${safeName(artifact.title)}.${format}"`,
            },
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Download failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function normalizeFormat(value: string | null): DownloadFormat {
    if (value === 'txt' || value === 'html' || value === 'json') return value;
    return 'md';
}

function safeName(value: string): string {
    return (
        value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') ||
        'artifact'
    );
}
