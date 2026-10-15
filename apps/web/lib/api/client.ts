export function apiRouteFetch(
    input: `/api/${string}`,
    init?: RequestInit,
): Promise<Response> {
    return fetch(input, init);
}

/**
 * Shared shape for internal `/api/*` JSON responses: an `{ ok, message, ... }`
 * envelope. Known payload keys are read with a cast at the call site.
 */
export interface ApiJsonEnvelope {
    ok?: boolean;
    message?: string;
    [key: string]: unknown;
}

/** `res.json()` typed as {@link ApiJsonEnvelope} instead of `any`. */
export async function readApiJson(res: Response): Promise<ApiJsonEnvelope> {
    return (await res.json()) as ApiJsonEnvelope;
}

export async function chessGameFetch<T>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }

    const json: unknown = await res.json();
    return json as T;
}
