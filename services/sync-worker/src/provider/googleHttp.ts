export class GoogleHttpError extends Error {
    constructor(readonly status: number) {
        super(`Google provider request failed with status ${status}`);
    }
}

export async function googleJson<T>(url: string, token: string): Promise<T> {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new GoogleHttpError(response.status);
    return (await response.json()) as T;
}

export function cleanGoogleValue(value: string | undefined, limit: number) {
    const text = value?.replace(/\s+/gu, ' ').trim();
    return text ? text.slice(0, limit) : null;
}
