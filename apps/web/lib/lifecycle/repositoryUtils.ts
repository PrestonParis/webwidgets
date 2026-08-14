import type { SupabaseClient } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

export class LifecycleConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LifecycleConflictError';
    }
}

function isUniqueViolation(error: { code?: string } | null): boolean {
    return error?.code === '23505';
}

export async function insertOrReadByKey(
    db: SupabaseClient,
    table: string,
    row: Row,
    userId: string,
    idempotencyKey: string,
): Promise<{ row: Row; duplicate: boolean }> {
    const inserted = await db.from(table).insert(row).select('*').single();
    if (!inserted.error) {
        return { row: inserted.data as Row, duplicate: false };
    }
    if (!isUniqueViolation(inserted.error)) throw inserted.error;
    const existing = await db
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) throw inserted.error;
    return { row: existing.data as Row, duplicate: true };
}

export function assertMatchingHash(
    row: Row,
    column: string,
    expected: string,
    label: string,
): void {
    if (row[column] !== expected) {
        throw new LifecycleConflictError(
            `${label} idempotency key was reused with different content`,
        );
    }
}
