import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { s3, CONVERSION_S3_BUCKET } from '@/lib/aws/s3Client';
import {
    getExtraction,
    upsertExtraction,
    markExtractionFailed,
    markExtractionProcessing,
} from '@/features/extraction/services/extractionService';
import { logEvent } from '@/features/events/lib/eventLogger';

async function fetchTextFromS3(objectKey: string): Promise<string> {
    const cmd = new GetObjectCommand({
        Bucket: CONVERSION_S3_BUCKET,
        Key: objectKey,
    });
    const resp = await s3.send(cmd);
    const chunks: Uint8Array[] = [];
    for await (const chunk of resp.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ fileId: string }> },
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { fileId } = await params;

        const extraction = await getExtraction(supabase, userId, fileId);
        if (!extraction) {
            return NextResponse.json({
                available: false,
                reason: 'No extraction found. POST to this endpoint to start extraction.',
            });
        }

        return NextResponse.json({ data: extraction });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({
                available: false,
                reason: 'Table not yet created.',
            });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ fileId: string }> },
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { fileId } = await params;

        // Load file record
        const fileResult = await supabase
            .from('file_uploads')
            .select('id, original_name, s3_key, status')
            .eq('id', fileId)
            .eq('user_id', userId)
            .maybeSingle();

        if (fileResult.error) throw fileResult.error;
        if (!fileResult.data) {
            return NextResponse.json(
                { error: 'FILE_NOT_FOUND' },
                { status: 404 },
            );
        }

        const file = fileResult.data as unknown as {
            id: string;
            original_name: string;
            s3_key: string;
            status: string;
        };

        // Look for completed conversion job for this file
        const convResult = await supabase
            .from('conversion_jobs')
            .select('id, output_object_key, status')
            .eq('user_id', userId)
            .eq('original_file_name', file.original_name)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (convResult.error) throw convResult.error;

        const conv = convResult.data as unknown as {
            id: string;
            output_object_key: string | null;
            status: string;
        } | null;

        if (!conv || !conv.output_object_key) {
            return NextResponse.json({
                available: false,
                reason: 'No conversion output yet. Convert the file first.',
            });
        }

        // Mark as processing
        await markExtractionProcessing(
            supabase,
            userId,
            fileId,
            conv.output_object_key,
        );

        try {
            // Fetch text from S3
            const text = await fetchTextFromS3(conv.output_object_key);

            // Save extraction
            const extraction = await upsertExtraction(supabase, userId, {
                fileId,
                sourcePath: conv.output_object_key,
                extractedText: text,
                textFormat: 'plain_text',
                conversionId: conv.id,
            });

            // Log event
            await logEvent(supabase, userId, 'file_text_extracted', {
                entityType: 'file',
                entityId: fileId,
                title: `Text extracted: ${file.original_name}`,
                metadata: {
                    charCount: extraction.characterCount,
                    conversionId: conv.id,
                },
            });

            return NextResponse.json({ extraction });
        } catch (s3Err) {
            const errMsg =
                s3Err instanceof Error ? s3Err.message : 'S3 fetch failed';
            await markExtractionFailed(supabase, userId, fileId, errMsg).catch(
                () => void 0,
            );
            return NextResponse.json(
                { error: 'EXTRACTION_FAILED', reason: errMsg },
                { status: 500 },
            );
        }
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({
                available: false,
                reason: 'Table not yet created.',
            });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
