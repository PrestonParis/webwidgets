import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getUpload } from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, hasS3Config } from '@/lib/aws/s3Client';

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
        if (!upload) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const expiresIn = 300; // 5 minutes
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: upload.s3Key,
            ResponseContentDisposition: `attachment; filename="${encodeURIComponent(upload.originalName)}"`,
        });

        const downloadUrl = await getSignedUrl(s3, command, { expiresIn });

        return NextResponse.json({
            downloadUrl,
            filename: upload.originalName,
            expiresIn,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
