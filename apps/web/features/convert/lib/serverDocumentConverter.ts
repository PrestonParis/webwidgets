import { getConversionApiUrl } from '@/features/convert/api/convertRouteHelpers';
import type {
    ConversionExtension,
    ConversionJob,
    CreateConversionJobResponse,
    DownloadUrlResponse,
} from '@/features/convert/types/conversion';

export type DocumentConvertFormat = 'docx' | 'pdf' | 'rtf' | 'odt' | 'epub';

const POLL_INTERVAL_MS = 1_000;
const POLL_ATTEMPTS = 60;

export async function convertHtmlToDocument({
    html,
    title,
    targetExtension,
}: {
    html: string;
    title: string;
    targetExtension: DocumentConvertFormat;
}): Promise<ArrayBuffer> {
    const bytes = new TextEncoder().encode(html);
    const safeTitle =
        title
            .trim()
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'document';

    const created = await conversionJson<CreateConversionJobResponse>(
        '/v1/jobs',
        {
            method: 'POST',
            body: JSON.stringify({
                originalFileName: `${safeTitle}.html`,
                sourceMime: 'text/html',
                sourceExtension: 'html' satisfies ConversionExtension,
                targetExtension,
                fileSizeBytes: bytes.byteLength,
            }),
        },
    );

    if (!created.uploadUrl) {
        throw new Error('Conversion service did not return an upload URL.');
    }

    const uploadResponse = await fetch(created.uploadUrl, {
        method: 'PUT',
        body: bytes,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    if (!uploadResponse.ok) {
        throw new Error(
            `Failed to upload content for conversion: ${uploadResponse.status}`,
        );
    }

    await conversionJson<ConversionJob>(`/v1/jobs/${created.jobId}/start`, {
        method: 'POST',
    });

    const job = await waitForConversion(created.jobId);
    if (job.status !== 'completed') {
        throw new Error(
            job.errorMessage ?? 'Document conversion did not complete.',
        );
    }

    const { downloadUrl } = await conversionJson<DownloadUrlResponse>(
        `/v1/jobs/${created.jobId}/download`,
    );
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
        throw new Error(
            `Failed to download converted document: ${downloadResponse.status}`,
        );
    }

    return downloadResponse.arrayBuffer();
}

async function waitForConversion(jobId: string): Promise<ConversionJob> {
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        const job = await conversionJson<ConversionJob>(`/v1/jobs/${jobId}`);
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
            return job;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error('Document conversion timed out.');
}

async function conversionJson<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const apiKey = process.env.CONVERSION_API_KEY;
    if (apiKey) headers['x-conversion-api-key'] = apiKey;

    const response = await fetch(getConversionApiUrl(path), {
        ...init,
        cache: 'no-store',
        headers: { ...headers, ...init?.headers },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(
            (body as { error?: string } | null)?.error ??
                `Conversion request failed: ${response.status}`,
        );
    }
    return body as T;
}
