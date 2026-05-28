import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    confirmUpload,
    getUpload,
} from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, hasS3Config } from '@/lib/aws/s3Client';

export const runtime = 'nodejs';

interface RouteContext {
    params: Promise<{ fileId: string }>;
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
        return NextResponse.json(confirmed);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
