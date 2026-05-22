import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { insertUploadRecord } from '@/features/uploads/services/uploadService';
import { s3, S3_BUCKET, buildS3Key, hasS3Config } from '@/lib/aws/s3Client';

const bodySchema = z.object({
    originalName: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    sizeBytes: z
        .number()
        .int()
        .positive()
        .max(100 * 1024 * 1024), // 100 MB max
});

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        if (!hasS3Config()) {
            return NextResponse.json(
                { error: 'S3 storage is not configured' },
                { status: 503 },
            );
        }

        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 },
            );
        }

        const { originalName, mimeType, sizeBytes } = parsed.data;
        const fileId = crypto.randomUUID();
        const s3Key = buildS3Key(userId, fileId, originalName);

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            ContentType: mimeType,
            ContentLength: sizeBytes,
        });

        const presignedUrl = await getSignedUrl(s3, command, {
            expiresIn: 300,
        });

        await insertUploadRecord(supabase, {
            userId,
            fileId,
            originalName,
            mimeType,
            sizeBytes,
            s3Key,
        });

        return NextResponse.json({ fileId, presignedUrl, key: s3Key });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
