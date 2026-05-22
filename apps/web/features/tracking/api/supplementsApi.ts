import type {
    Supplement,
    DbSupplementRow,
    CreateSupplementPayload,
} from '@/features/tracking/types/supplement';

function toSupplement(row: DbSupplementRow): Supplement {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        ...(row.dose != null && { dose: row.dose }),
        scheduleType: row.schedule_type as Supplement['scheduleType'],
        scheduleStart: row.schedule_start,
        ...(row.schedule_end != null && { scheduleEnd: row.schedule_end }),
        active: row.active,
        createdAt: row.created_at,
    };
}

export async function fetchSupplements(): Promise<Supplement[]> {
    const res = await fetch('/api/supplements');
    if (!res.ok) return [];
    const data = (await res.json()) as { supplements: DbSupplementRow[] };
    return (data.supplements ?? []).map(toSupplement);
}

export async function createSupplement(
    payload: CreateSupplementPayload,
): Promise<Supplement | null> {
    const res = await fetch('/api/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { supplement: DbSupplementRow };
    return toSupplement(data.supplement);
}

export async function removeSupplement(id: string): Promise<boolean> {
    const res = await fetch(`/api/supplements?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
    return res.ok;
}
