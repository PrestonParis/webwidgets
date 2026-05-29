import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getUpload } from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, hasS3Config } from '@/lib/aws/s3Client';
import { getParserForMime } from '@/features/view/registry/parserRegistry';
import { validateViewFile } from '@/features/view/security/contentSecurity';
import { viewFileRefSchema } from '@/features/view/schemas/objectSchemas';
import { getLogger } from '@/lib/observability/logger';

const bodySchema = z.object({ file: viewFileRefSchema });
const TEXT_MIME_PREFIXES = [
    'text/',
    'application/json',
    'application/javascript',
    'application/yaml',
];

async function fetchUploadText(url: string, mimeType: string) {
    if (!TEXT_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)))
        return undefined;
    const response = await fetch(url);
    if (!response.ok) return undefined;
    return response.text();
}

export async function POST(request: Request) {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const safety = validateViewFile(parsed.data.file);
    if (safety.isErr())
        return NextResponse.json(
            { error: 'Unsafe file', issues: safety.error },
            { status: 422 },
        );

    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const upload =
            parsed.data.file.source === 'upload'
                ? await getUpload(supabase, userId, parsed.data.file.id)
                : null;
        const file = { ...parsed.data.file };

        if (upload) {
            if (!hasS3Config()) {
                return NextResponse.json(
                    { error: 'S3 storage is not configured' },
                    { status: 503 },
                );
            }
            const command = new GetObjectCommand({
                Bucket: S3_BUCKET,
                Key: upload.s3Key,
            });
            file.url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        }

        const parser = getParserForMime(file.mimeType);
        if (!parser)
            return NextResponse.json(
                { error: 'Unsupported file type' },
                { status: 415 },
            );
        const text = file.url
            ? await fetchUploadText(file.url, file.mimeType)
            : undefined;
        const document = await parser.parse({
            file,
            ...(text !== undefined && { text }),
        });
        getLogger({
            component: 'view-parse',
            fileId: file.id,
            mimeType: file.mimeType,
        }).info('file parsed for view widget');
        return NextResponse.json(document);
    } catch (error) {
        getLogger({ component: 'view-parse' }).error(
            { err: error },
            'view parse failed',
        );
        return NextResponse.json(
            { error: 'Failed to parse file' },
            { status: 500 },
        );
    }
}
