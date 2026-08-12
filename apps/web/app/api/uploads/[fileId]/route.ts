import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    confirmUpload,
    markUploadDeleted,
    getUpload,
} from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, hasS3Config } from '@/lib/aws/s3Client';
import {
    ingestFileUploadContext,
    markFileUploadContextDeleted,
} from '@/features/context/services/contextProducerService';

interface RouteContext {
    params: Promise<{ fileId: string }>;
}

export async function PATCH(req: Request, ctx: RouteContext) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { fileId } = await ctx.params;
        const updated = await confirmUpload(supabase, userId, fileId);
        await ingestFileUploadContext(supabase, updated).catch((error) => {
            console.error('file-context-ingest-failed', {
                fileId,
                userId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
        return NextResponse.json(updated);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
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
        if (!upload) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await s3.send(
            new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: upload.s3Key }),
        );
        await markUploadDeleted(supabase, userId, fileId);
        await markFileUploadContextDeleted(supabase, userId, fileId).catch(
            (error) => {
                console.error('file-context-delete-failed', {
                    fileId,
                    userId,
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            },
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
