import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import { enqueueCanonicalJob } from '../v1/producer.js';

interface BriefingPreferenceRow {
    user_id: string;
    local_time: string;
    timezone: string;
    window_hours: number;
    last_enqueued_window_end: string | null;
}

export interface BriefingScheduler {
    close(): Promise<void>;
}

function localParts(now: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function isDue(row: BriefingPreferenceRow, now: Date) {
    let local: Record<string, string>;
    try {
        local = localParts(now, row.timezone);
    } catch {
        return null;
    }
    const localDate = `${local['year']}-${local['month']}-${local['day']}`;
    const localTime = `${local['hour']}:${local['minute']}`;
    if (localTime < row.local_time.slice(0, 5)) return null;
    if (row.last_enqueued_window_end) {
        const previous = localParts(
            new Date(row.last_enqueued_window_end),
            row.timezone,
        );
        if (
            `${previous['year']}-${previous['month']}-${previous['day']}` ===
            localDate
        )
            return null;
    }
    return localDate;
}

export function startBriefingScheduler(
    env: WorkerEnv,
    client: SupabaseClient,
    logger: RuntimeLogger,
): BriefingScheduler {
    let stopped = false;
    let running = false;
    const scan = async () => {
        if (stopped || running) return;
        running = true;
        try {
            const result = await client
                .from('briefing_preferences')
                .select(
                    'user_id,local_time,timezone,window_hours,last_enqueued_window_end',
                )
                .eq('daily_enabled', true)
                .limit(env.BRIEFING_SCHEDULE_BATCH_SIZE);
            if (result.error) throw result.error;
            const now = new Date();
            for (const row of (result.data ?? []) as BriefingPreferenceRow[]) {
                const localDate = isDue(row, now);
                if (!localDate) continue;
                const coveredTo = now.toISOString();
                const coveredFrom = new Date(
                    now.getTime() - row.window_hours * 3_600_000,
                ).toISOString();
                await enqueueCanonicalJob(client, env, {
                    userId: row.user_id,
                    idempotencyKey: `briefing:daily:${row.user_id}:${localDate}`,
                    queue: 'analysis',
                    task: {
                        kind: 'briefing.generate',
                        trigger: 'daily',
                        coveredFrom,
                        coveredTo,
                    },
                    maxAttempts: 3,
                });
                await client
                    .from('briefing_preferences')
                    .update({ last_enqueued_window_end: coveredTo })
                    .eq('user_id', row.user_id);
            }
        } catch {
            logger.error('briefing schedule scan failed');
        } finally {
            running = false;
        }
    };
    const timer = setInterval(
        () => void scan(),
        env.BRIEFING_SCHEDULE_INTERVAL_MS,
    );
    timer.unref();
    void scan();
    return {
        close: async () => {
            stopped = true;
            clearInterval(timer);
            while (running)
                await new Promise((resolve) => setTimeout(resolve, 10));
        },
    };
}
