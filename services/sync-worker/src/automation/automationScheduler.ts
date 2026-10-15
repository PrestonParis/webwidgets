import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import { enqueueCanonicalJob } from '../v1/producer.js';

type TemplateId =
    | 'v1.commitment-capture'
    | 'v1.daily-briefing'
    | 'v1.calendar-preparation'
    | 'v1.stale-task-review';

interface TemplateConfig {
    id: string;
    user_id: string;
    definition_id: TemplateId;
    next_run_at: string | null;
    config: Record<string, unknown>;
}

interface ScheduleConfig {
    localTime: string;
    timezone: string;
    frequency: 'daily' | 'weekly';
}

export interface AutomationScheduler {
    close(): Promise<void>;
}

function localParts(instant: Date, timezone: string) {
    const entries = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(instant);
    return Object.fromEntries(
        entries.map((entry) => [entry.type, entry.value]),
    );
}

export function localScheduleKey(instant: Date, timezone: string) {
    const part = localParts(instant, timezone);
    return `${part['year']}-${part['month']}-${part['day']}`;
}

export function nextLocalSchedule(
    after: Date,
    schedule: ScheduleConfig,
    lastLocalKey?: string,
) {
    const [targetHour, targetMinute] = schedule.localTime
        .split(':')
        .map(Number);
    const start = Math.floor(after.getTime() / 60_000) * 60_000 + 60_000;
    for (let offset = 0; offset <= 8 * 24 * 60; offset += 1) {
        const candidate = new Date(start + offset * 60_000);
        const part = localParts(candidate, schedule.timezone);
        const key = `${part['year']}-${part['month']}-${part['day']}`;
        const weekdayAllowed =
            schedule.frequency === 'daily' || part['weekday'] === 'Mon';
        if (
            Number(part['hour']) === targetHour &&
            Number(part['minute']) === targetMinute &&
            weekdayAllowed &&
            key !== lastLocalKey
        )
            return candidate;
    }
    throw new Error('automation_schedule_unresolvable');
}

function scheduleOf(config: TemplateConfig): ScheduleConfig {
    const raw = config.config['schedule'];
    const schedule =
        raw && typeof raw === 'object' && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
    return {
        localTime:
            typeof schedule['localTime'] === 'string'
                ? schedule['localTime']
                : '09:00',
        timezone:
            typeof schedule['timezone'] === 'string'
                ? schedule['timezone']
                : 'UTC',
        frequency: schedule['frequency'] === 'weekly' ? 'weekly' : 'daily',
    };
}

async function triggerScheduled(
    client: SupabaseClient,
    env: WorkerEnv,
    config: TemplateConfig,
    now: Date,
) {
    const schedule = scheduleOf(config);
    if (!config.next_run_at) {
        const initialized = await client
            .from('automation_configs')
            .update({
                next_run_at: nextLocalSchedule(now, schedule).toISOString(),
            })
            .eq('id', config.id)
            .eq('user_id', config.user_id)
            .is('next_run_at', null);
        if (initialized.error) throw initialized.error;
        return;
    }
    if (Date.parse(config.next_run_at) > now.getTime()) return;
    const localKey = localScheduleKey(
        new Date(config.next_run_at),
        schedule.timezone,
    );
    const coveredTo = now.toISOString();
    const coveredFrom = new Date(now.getTime() - 86_400_000).toISOString();
    const triggerKey = `schedule:${config.definition_id}:${localKey}`;
    const result = await client.rpc('trigger_v1_automation_template', {
        p_config_id: config.id,
        p_trigger_key: triggerKey,
        p_trigger_payload: { coveredFrom, coveredTo, localKey },
        p_dry_run: false,
        p_service_user_id: config.user_id,
    });
    if (result.error) throw result.error;
    const run = result.data as { id: string; status: string };
    if (
        config.definition_id === 'v1.daily-briefing' &&
        run.status === 'queued'
    ) {
        const jobId = await enqueueCanonicalJob(client, env, {
            userId: config.user_id,
            idempotencyKey: `automation-briefing:${config.id}:${localKey}`,
            queue: 'analysis',
            task: {
                kind: 'briefing.generate',
                trigger: 'daily',
                coveredFrom,
                coveredTo,
            },
            maxAttempts: 3,
        });
        const linked = await client
            .from('automation_runs')
            .update({ job_id: jobId })
            .eq('id', run.id)
            .eq('user_id', config.user_id);
        if (linked.error) throw linked.error;
    }
    const next = nextLocalSchedule(now, schedule, localKey);
    const updated = await client
        .from('automation_configs')
        .update({ next_run_at: next.toISOString() })
        .eq('id', config.id)
        .eq('user_id', config.user_id)
        .eq('next_run_at', config.next_run_at);
    if (updated.error) throw updated.error;
}

async function eligibleCandidates(
    client: SupabaseClient,
    config: TemplateConfig,
) {
    const calendar = config.definition_id === 'v1.calendar-preparation';
    const result = await client
        .from('candidate_actions')
        .select('id')
        .eq('user_id', config.user_id)
        .eq('candidate_kind', calendar ? 'calendar' : 'task')
        .eq('action_id', calendar ? 'calendar.create_event' : 'tasks.create')
        .in('state', calendar ? ['approved'] : ['proposed', 'edited'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at')
        .limit(20);
    if (result.error) throw result.error;
    return (result.data ?? []) as { id: string }[];
}

async function triggerEventCandidates(
    client: SupabaseClient,
    config: TemplateConfig,
) {
    for (const candidate of await eligibleCandidates(client, config)) {
        const result = await client.rpc('trigger_v1_automation_template', {
            p_config_id: config.id,
            p_trigger_key: `candidate:${candidate.id}`,
            p_trigger_payload: { candidateId: candidate.id },
            p_dry_run: false,
            p_service_user_id: config.user_id,
        });
        if (result.error) throw result.error;
    }
}

async function scanTemplates(env: WorkerEnv, client: SupabaseClient) {
    const result = await client
        .from('automation_configs')
        .select('id,user_id,definition_id,next_run_at,config')
        .in('definition_id', [
            'v1.commitment-capture',
            'v1.daily-briefing',
            'v1.calendar-preparation',
            'v1.stale-task-review',
        ])
        .eq('state', 'enabled')
        .is('archived_at', null)
        .limit(env.AUTOMATION_SCHEDULE_BATCH_SIZE);
    if (result.error) throw result.error;
    const now = new Date();
    for (const config of (result.data ?? []) as TemplateConfig[]) {
        if (
            config.definition_id === 'v1.daily-briefing' ||
            config.definition_id === 'v1.stale-task-review'
        )
            await triggerScheduled(client, env, config, now);
        else await triggerEventCandidates(client, config);
    }
}

export function startAutomationScheduler(
    env: WorkerEnv,
    client: SupabaseClient,
    logger: RuntimeLogger,
): AutomationScheduler {
    let stopped = false;
    let running = false;
    const scan = async () => {
        if (stopped || running) return;
        running = true;
        try {
            await scanTemplates(env, client);
        } catch {
            logger.error('automation schedule scan failed');
        } finally {
            running = false;
        }
    };
    const timer = setInterval(
        () => void scan(),
        env.AUTOMATION_SCHEDULE_INTERVAL_MS,
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
