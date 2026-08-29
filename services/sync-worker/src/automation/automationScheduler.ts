import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import type { RuntimeLogger } from '../logger.js';

interface DueAutomation {
    id: string;
    user_id: string;
    next_run_at: string;
}

export interface AutomationScheduler {
    close(): Promise<void>;
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
            const now = new Date().toISOString();
            const result = await client
                .from('automation_configs')
                .select('id,user_id,next_run_at')
                .eq('definition_id', 'v1.create-task')
                .eq('state', 'enabled')
                .is('archived_at', null)
                .lte('next_run_at', now)
                .order('next_run_at')
                .limit(env.AUTOMATION_SCHEDULE_BATCH_SIZE);
            if (result.error) throw result.error;
            for (const row of (result.data ?? []) as DueAutomation[]) {
                const triggerKey = `schedule:${row.next_run_at}`;
                const triggered = await client.rpc(
                    'trigger_v1_task_automation',
                    {
                        p_config_id: row.id,
                        p_trigger_key: triggerKey,
                        p_dry_run: false,
                        p_service_user_id: row.user_id,
                    },
                );
                if (triggered.error) throw triggered.error;
                await client
                    .from('automation_configs')
                    .update({
                        next_run_at: new Date(
                            Date.parse(row.next_run_at) + 86_400_000,
                        ).toISOString(),
                    })
                    .eq('id', row.id)
                    .eq('user_id', row.user_id)
                    .eq('next_run_at', row.next_run_at);
            }
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
