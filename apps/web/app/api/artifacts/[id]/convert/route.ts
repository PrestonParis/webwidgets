import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getArtifact } from '@/features/artifacts/services/artifactService';
import { getConversionApiUrl } from '@/features/convert/api/convertRouteHelpers';
import type {
    ConversionExtension,
    CreateConversionJobResponse,
} from '@/features/convert/types/conversion';

type RouteContext = { params: Promise<{ id: string }> };

const requestSchema = z.object({
    targetExtension: z.string().min(1).max(16),
});

export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await ctx.params;
        const parsed = requestSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'INVALID_PAYLOAD' },
                { status: 400 },
            );
        }

        const artifact = await getArtifact(supabase, userId, id);
        if (!artifact) {
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }

        const sourceExtension = artifactSourceExtension(artifact.contentFormat);
        const targetExtension = parsed.data
            .targetExtension as ConversionExtension;
        const filename = `${safeName(artifact.title)}.${sourceExtension}`;
        const body = Buffer.from(artifact.content, 'utf8');

        const jobResponse = await conversionFetch<CreateConversionJobResponse>(
            '/v1/jobs',
            {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    originalFileName: filename,
                    sourceMime: mimeForExtension(sourceExtension),
                    sourceExtension,
                    targetExtension,
                    fileSizeBytes: body.byteLength,
                    userId,
                }),
            },
        );

        if (!jobResponse.uploadUrl) {
            return NextResponse.json(
                { error: 'UPLOAD_URL_MISSING' },
                { status: 502 },
            );
        }

        const uploadResponse = await fetch(jobResponse.uploadUrl, {
            method: jobResponse.uploadMethod,
            body,
            headers: { 'content-type': mimeForExtension(sourceExtension) },
        });
        if (!uploadResponse.ok) {
            return NextResponse.json(
                { error: 'CONVERSION_UPLOAD_FAILED' },
                { status: 502 },
            );
        }

        const job = await conversionFetch(
            `/v1/jobs/${jobResponse.jobId}/start`,
            {
                method: 'POST',
            },
        );

        return NextResponse.json({
            job,
            jobId: jobResponse.jobId,
            statusUrl: jobResponse.statusUrl,
            downloadUrl: `/api/conversion/v1/jobs/${jobResponse.jobId}/download`,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'CONVERSION_FAILED',
            },
            { status: 500 },
        );
    }
}

async function conversionFetch<T = unknown>(
    path: string,
    init?: RequestInit,
): Promise<T> {
    const headers: Record<string, string> = {
        ...(init?.headers as Record<string, string> | undefined),
    };
    const apiKey = process.env.CONVERSION_API_KEY;
    if (apiKey) headers['x-conversion-api-key'] = apiKey;

    const response = await fetch(getConversionApiUrl(path), {
        ...init,
        headers,
        cache: 'no-store',
    });
    const json = (await response.json().catch(() => null)) as T | null;
    if (!response.ok) {
        const message =
            json && typeof json === 'object' && 'error' in json
                ? String((json as { error: unknown }).error)
                : `Conversion service returned ${response.status}`;
        throw new Error(message);
    }
    return json as T;
}

function artifactSourceExtension(
    format: 'markdown' | 'json' | 'plain_text',
): ConversionExtension {
    if (format === 'plain_text') return 'txt';
    if (format === 'json') return 'json';
    return 'md';
}

function mimeForExtension(extension: ConversionExtension): string {
    if (extension === 'json') return 'application/json';
    if (extension === 'html') return 'text/html';
    if (extension === 'md') return 'text/markdown';
    return 'text/plain';
}

function safeName(value: string): string {
    return (
        value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') ||
        'artifact'
    );
}
