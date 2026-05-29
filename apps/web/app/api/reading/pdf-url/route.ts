import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getUpload } from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, hasS3Config } from '@/lib/aws/s3Client';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get('fileId');
        if (!hasS3Config()) {
            return NextResponse.json(
                { error: 'S3 storage is not configured' },
                { status: 503 },
            );
        }
        if (!fileId) {
            return NextResponse.json(
                { error: 'fileId required' },
                { status: 400 },
            );
        }

        const upload = await getUpload(supabase, userId, fileId);
        if (!upload) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: upload.s3Key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return NextResponse.json({ url });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
