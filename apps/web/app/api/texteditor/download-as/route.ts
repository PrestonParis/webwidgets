import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getConversionApiUrl } from '@/features/convert/api/convertRouteHelpers';
import type {
    ConversionExtension,
    ConversionJob,
    CreateConversionJobResponse,
    DownloadUrlResponse,
} from '@/features/convert/types/conversion';
import {
    convertTextFile,
    getOutputMimeType,
} from '@/features/files/lib/conversionService';
import type { FileConversionFormat } from '@/features/files/types/conversion';
import { sanitizeRichText } from '@/features/view/security/contentSecurity';

const MAX_TEXT_EDITOR_EXPORT_BYTES = 2 * 1024 * 1024;
const CONVERSION_POLL_INTERVAL_MS = 1_000;
const CONVERSION_POLL_ATTEMPTS = 60;

const backendFormats = ['docx', 'rtf', 'odt', 'epub', 'pdf'] as const;
const directFormats = ['html', 'md', 'txt'] as const;
const downloadFormats = [...backendFormats, ...directFormats] as const;

type BackendFormat = (typeof backendFormats)[number];
type DirectFormat = (typeof directFormats)[number];
type DownloadFormat = (typeof downloadFormats)[number];

const requestSchema = z.object({
    title: z.string().trim().max(180).default('Untitled'),
    html: z.string().max(MAX_TEXT_EDITOR_EXPORT_BYTES),
    format: z.enum(downloadFormats),
});

export async function POST(request: Request) {
    try {
        const body = requestSchema.parse(await request.json());
        const title = body.title || 'Untitled';
        const htmlDocument = buildHtmlDocument(title, body.html);
        const filename = `${safeFilename(title)}.${body.format}`;

        if (isDirectFormat(body.format)) {
            const content = await convertDirect(htmlDocument, body.format);
            return new Response(content, {
                status: 200,
                headers: {
                    'Content-Type': getOutputMimeType(body.format),
                    'Content-Disposition': attachmentHeader(filename),
                },
            });
        }

        const converted = await convertHtmlWithBackend({
            html: htmlDocument,
            title,
            targetExtension: body.format,
        });

        return new Response(converted.bytes, {
            status: 200,
            headers: {
                'Content-Type': getOutputMimeType(body.format),
                'Content-Disposition': attachmentHeader(filename),
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Choose a valid download format.' },
                { status: 400 },
            );
        }

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Download export failed.',
            },
            { status: 500 },
        );
    }
}

async function convertDirect(html: string, format: DirectFormat) {
    if (format === 'html') return html;
    return convertTextFile({
        input: html,
        from: 'html',
        to: format as FileConversionFormat,
    });
}

async function convertHtmlWithBackend({
    html,
    title,
    targetExtension,
}: {
    html: string;
    title: string;
    targetExtension: BackendFormat;
}) {
    const bytes = new TextEncoder().encode(html);
    const created = await conversionJson<CreateConversionJobResponse>(
        '/v1/jobs',
        {
            method: 'POST',
            body: JSON.stringify({
                originalFileName: `${safeFilename(title)}.html`,
                sourceMime: 'text/html',
                sourceExtension: 'html' satisfies ConversionExtension,
                targetExtension,
                fileSizeBytes: bytes.byteLength,
            }),
        },
    );

    if (!created.uploadUrl) {
        throw new Error('The conversion service did not return an upload URL.');
    }

    const uploadResponse = await fetch(created.uploadUrl, {
        method: 'PUT',
        body: bytes,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    if (!uploadResponse.ok) {
        throw new Error(
            `Failed to upload editor content: ${uploadResponse.status}`,
        );
    }

    await conversionJson<ConversionJob>(`/v1/jobs/${created.jobId}/start`, {
        method: 'POST',
    });

    const job = await waitForConversion(created.jobId);
    if (job.status !== 'completed') {
        throw new Error(job.errorMessage ?? 'The conversion did not complete.');
    }

    const { downloadUrl } = await conversionJson<DownloadUrlResponse>(
        `/v1/jobs/${created.jobId}/download`,
    );
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
        throw new Error(
            `Failed to download converted file: ${downloadResponse.status}`,
        );
    }

    return { bytes: await downloadResponse.arrayBuffer() };
}

async function waitForConversion(jobId: string): Promise<ConversionJob> {
    for (let attempt = 0; attempt < CONVERSION_POLL_ATTEMPTS; attempt += 1) {
        const job = await conversionJson<ConversionJob>(`/v1/jobs/${jobId}`);
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
            return job;
        }
        await new Promise((resolve) =>
            setTimeout(resolve, CONVERSION_POLL_INTERVAL_MS),
        );
    }

    throw new Error('The conversion timed out before the download was ready.');
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
        headers: {
            ...headers,
            ...init?.headers,
        },
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

function buildHtmlDocument(title: string, html: string) {
    const cleanHtml = sanitizeRichText(html || '<p></p>');
    return [
        '<!doctype html>',
        '<html>',
        '<head>',
        '<meta charset="utf-8">',
        `<title>${escapeHtml(title)}</title>`,
        '</head>',
        '<body>',
        `<h1>${escapeHtml(title)}</h1>`,
        cleanHtml,
        '</body>',
        '</html>',
    ].join('\n');
}

function isDirectFormat(format: DownloadFormat): format is DirectFormat {
    return directFormats.includes(format as DirectFormat);
}

function safeFilename(value: string) {
    return (
        value
            .trim()
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'texteditor-document'
    );
}

function attachmentHeader(filename: string) {
    return `attachment; filename="${filename.replace(/"/g, '')}"`;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
