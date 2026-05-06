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
