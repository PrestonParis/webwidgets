import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    confirmUpload,
    markUploadDeleted,
    getUpload,
} from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET } from '@/lib/aws/s3Client';

interface RouteContext {
    params: Promise<{ fileId: string }>;
}

export async function PATCH(req: Request, ctx: RouteContext) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { fileId } = await ctx.params;
        const updated = await confirmUpload(supabase, userId, fileId);
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
        const { fileId } = await ctx.params;

        const upload = await getUpload(supabase, userId, fileId);
        if (!upload) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await s3.send(
            new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: upload.s3Key }),
        );
        await markUploadDeleted(supabase, userId, fileId);

        return NextResponse.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
