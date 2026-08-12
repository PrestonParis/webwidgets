import { NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    confirmUpload,
    getUpload,
} from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, hasS3Config } from '@/lib/aws/s3Client';
import { ingestFileUploadContext } from '@/features/context/services/contextProducerService';

export const runtime = 'nodejs';

interface RouteContext {
    params: Promise<{ fileId: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        if (!hasS3Config()) {
            return NextResponse.json(
                { error: 'S3 storage is not configured' },
                { status: 503 },
            );
        }

        const { fileId } = await ctx.params;
        const upload = await getUpload(supabase, userId, fileId);
        if (!upload || upload.status === 'deleted') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const object = await s3.send(
            new GetObjectCommand({ Bucket: S3_BUCKET, Key: upload.s3Key }),
        );
        if (!object.Body) {
            return NextResponse.json(
                { error: 'Stored file has no content' },
                { status: 404 },
            );
        }

        const bytes = await object.Body.transformToByteArray();
        return new Response(Buffer.from(bytes), {
            headers: {
                'Content-Type': upload.mimeType,
                'Content-Length': String(bytes.byteLength),
                'Content-Disposition': `inline; filename="${encodeURIComponent(upload.originalName)}"`,
                'Cache-Control': 'private, max-age=300',
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PUT(req: Request, ctx: RouteContext) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        if (!hasS3Config()) {
            return NextResponse.json(
                { error: 'S3 storage is not configured' },
                { status: 503 },
            );
        }

        const { fileId } = await ctx.params;
        const upload = await getUpload(supabase, userId, fileId);
        if (!upload || upload.status === 'deleted') {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const bytes = Buffer.from(await req.arrayBuffer());
        if (bytes.byteLength !== upload.sizeBytes) {
            return NextResponse.json(
                { error: 'Uploaded file size does not match presigned record' },
                { status: 400 },
            );
        }

        await s3.send(
            new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: upload.s3Key,
                Body: bytes,
                ContentType: upload.mimeType,
                ContentLength: bytes.byteLength,
            }),
        );

        const confirmed = await confirmUpload(supabase, userId, fileId);
        await ingestFileUploadContext(supabase, confirmed).catch((error) => {
            console.error('file-context-ingest-failed', {
                fileId,
                userId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
        return NextResponse.json(confirmed);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
