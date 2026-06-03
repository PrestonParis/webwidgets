// Journal write operations route through /api/journals so activity events are
// published server-side. Autosave (useAutosave.ts) writes only to localStorage
// and is unaffected by this change.

async function apiFetch(path: string, options: RequestInit) {
    const res = await fetch(path, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const json = (await res
        .json()
        .catch(() => ({ error: 'parse_error' }))) as Record<string, unknown>;
    return {
        data: json,
        error: res.ok ? null : (json.error ?? 'request_failed'),
    };
}

export const journalService = {
    async createEntry(
        _userId: string,
        title: string,
        content: string,
        type: 'journal' | 'document' | 'note' = 'journal',
        metadata?: Record<string, unknown>,
    ) {
        return apiFetch('/api/journals', {
            method: 'POST',
            body: JSON.stringify({ title, content, type, metadata }),
        });
    },

    async updateEntry(
        _userId: string,
        entryId: string,
        title: string,
        content: string,
    ) {
        return apiFetch(`/api/journals/${entryId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title, content }),
        });
    },

    async deleteEntry(_userId: string, entryId: string) {
        return apiFetch(`/api/journals/${entryId}`, { method: 'DELETE' });
    },

    async updateEntryMetadata(
        _userId: string,
        entryId: string,
        metadata: Record<string, unknown>,
    ) {
        return apiFetch(`/api/journals/${entryId}`, {
            method: 'PATCH',
            body: JSON.stringify({ metadata }),
        });
    },
};
