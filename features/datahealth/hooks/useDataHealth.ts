'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { z } from 'zod';

export type ServiceStatus = 'ok' | 'error' | 'unknown' | 'checking';

export interface ServiceCheck {
    status: ServiceStatus;
    latencyMs?: number;
    label: string;
    note?: string;
}

export interface DataHealth {
    database: ServiceCheck;
    ml_service: ServiceCheck;
    gmail: ServiceCheck;
    calendar: ServiceCheck;
}

const checkSchema = z.object({
    status: z.enum(['ok', 'error']),
    latencyMs: z.number().optional(),
});

const healthResponseSchema = z.object({
    status: z.enum(['ok', 'degraded']),
    checks: z.record(z.string(), checkSchema),
});
const HEALTH_API = '/api/health';

export function useDataHealth() {
    const { user } = useAuth();

    const hasGoogleSync =
        user?.identities?.some((id) => id.provider === 'google') ?? false;

    const [systemHealth, setSystemHealth] = useState<
        Pick<DataHealth, 'database' | 'ml_service'>
    >({
        database: { status: 'unknown', label: 'Supabase' },
        ml_service: { status: 'unknown', label: 'ML Service' },
    });

    const [checking, setChecking] = useState(false);

    const check = useCallback(async () => {
        setChecking(true);
        setSystemHealth((h) => ({
            ...h,
            database: { ...h.database, status: 'checking' },
            ml_service: { ...h.ml_service, status: 'checking' },
        }));

        try {
            const res = await fetch(HEALTH_API, {
                signal: AbortSignal.timeout(8000),
            });
            const json: unknown = await res.json();
            const parsed = healthResponseSchema.safeParse(json);

            if (parsed.success) {
                const { checks } = parsed.data;
                const db = checks['database'];
                const ml = checks['ml_service'];
                setSystemHealth((prev) => ({
                    ...prev,
                    database: {
                        label: 'Supabase',
                        status: db?.status ?? 'unknown',
                        ...(db?.latencyMs !== undefined
                            ? { latencyMs: db.latencyMs }
                            : {}),
                    },
                    ml_service: {
                        label: 'ML Service',
                        status: ml?.status ?? 'unknown',
                        ...(ml?.latencyMs !== undefined
                            ? { latencyMs: ml.latencyMs }
                            : {}),
                        ...(ml === undefined ? { note: 'Not configured' } : {}),
                    },
                }));
            }
        } catch {
            setSystemHealth((prev) => ({
                ...prev,
                database: { label: 'Supabase', status: 'error' },
                ml_service: { label: 'ML Service', status: 'error' },
            }));
        } finally {
            setChecking(false);
        }
    }, []);

    const googleHealth = useMemo(() => {
        if (!user) {
            return {
                gmail: {
                    label: 'Gmail',
                    status: 'unknown',
                    note: 'Not signed in',
                },
                calendar: {
                    label: 'Calendar',
                    status: 'unknown',
                    note: 'Not signed in',
                },
            } satisfies Pick<DataHealth, 'gmail' | 'calendar'>;
        }
        if (!hasGoogleSync) {
            return {
                gmail: {
                    label: 'Gmail',
                    status: 'error',
                    note: 'Not connected',
                },
                calendar: {
                    label: 'Calendar',
                    status: 'error',
                    note: 'Not connected',
                },
            } satisfies Pick<DataHealth, 'gmail' | 'calendar'>;
        }
        return {
            gmail: { label: 'Gmail', status: 'ok' },
            calendar: { label: 'Calendar', status: 'ok' },
        } satisfies Pick<DataHealth, 'gmail' | 'calendar'>;
    }, [user, hasGoogleSync]);

    const health = useMemo<DataHealth>(
        () => ({
            ...systemHealth,
            ...googleHealth,
        }),
        [systemHealth, googleHealth],
    );

    useEffect(() => {
        queueMicrotask(() => void check());
    }, [check]);

    return { health, checking, refresh: check };
}
