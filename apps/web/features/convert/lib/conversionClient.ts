import type {
    ConversionJob,
    CreateConversionJobRequest,
    CreateConversionJobResponse,
    DownloadUrlResponse,
    SupportedConversion,
} from '@/features/convert/lib/conversionTypes';

function getConversionApiBaseUrl() {
    // Defaults to the Next.js proxy (/api/conversion) so the upstream URL stays server-only.
    // Set NEXT_PUBLIC_CONVERSION_API_URL to bypass the proxy (e.g. http://localhost:4010 for direct local access).
    return (process.env.NEXT_PUBLIC_CONVERSION_API_URL ?? '/api/conversion').replace(/\/$/, '');
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${getConversionApiBaseUrl()}${path}`, {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...init?.headers,
        },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.error ?? `Conversion request failed: ${response.status}`);
    }
    return body as T;
}

export async function listSupportedConversions() {
    const body = await requestJson<{ conversions: SupportedConversion[] }>(
        '/v1/conversions',
    );
    return body.conversions;
}

export function createConversionJob(request: CreateConversionJobRequest) {
    return requestJson<CreateConversionJobResponse>('/v1/jobs', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

export function startConversionJob(jobId: string) {
    return requestJson<ConversionJob>(`/v1/jobs/${jobId}/start`, {
        method: 'POST',
    });
}

export function getConversionJob(jobId: string) {
    return requestJson<ConversionJob>(`/v1/jobs/${jobId}`);
}

export async function getDownloadUrl(jobId: string) {
    const body = await requestJson<DownloadUrlResponse>(
        `/v1/jobs/${jobId}/download`,
    );
    return body.downloadUrl;
}

export async function uploadConversionInput(file: File, uploadUrl: string) {
    const init: RequestInit = {
        method: 'PUT',
        body: file,
    };
    if (file.type) {
        init.headers = { 'content-type': file.type };
    }

    const response = await fetch(uploadUrl, init);
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }
}
