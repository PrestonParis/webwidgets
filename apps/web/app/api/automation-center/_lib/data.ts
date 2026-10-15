import type { SupabaseClient } from '@supabase/supabase-js';
import { loadBriefingDiagnostics } from './briefingDiagnostics';
import {
    mapApprovals,
    mapDeliverables,
    mapHistory,
    mapInstances,
    mapSuggestions,
    type ConfigRow,
    type DeliverableRow,
    type RequestRow,
    type RunRow,
} from './centerMappers';

async function loadCenterRows(db: SupabaseClient, userId: string) {
    const [
        configsResult,
        runsResult,
        requestsResult,
        controlResult,
        dismissalsResult,
        deliverablesResult,
    ] = await Promise.all([
        db
            .from('automation_configs')
            .select('*')
            .eq('user_id', userId)
            .is('archived_at', null)
            .order('created_at', { ascending: false }),
        db
            .from('automation_runs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100),
        db
            .from('action_requests')
            .select('*')
            .eq('user_id', userId)
            .eq('approval_state', 'required')
            .eq('status', 'pending')
            .not('automation_run_id', 'is', null)
            .order('requested_at'),
        db
            .from('automation_user_controls')
            .select('pause_all')
            .eq('user_id', userId)
            .maybeSingle(),
        db
            .from('automation_suggestion_dismissals')
            .select('suggestion_id')
            .eq('user_id', userId),
        db
            .from('automation_deliverables')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
    ]);
    const results = [
        configsResult,
        runsResult,
        requestsResult,
        controlResult,
        dismissalsResult,
        deliverablesResult,
    ];
    const error = results.find((result) => result.error)?.error;
    if (error) throw error;
    return {
        configs: (configsResult.data ?? []) as ConfigRow[],
        runs: (runsResult.data ?? []) as RunRow[],
        requests: (requestsResult.data ?? []) as RequestRow[],
        pauseAll: controlResult.data?.pause_all === true,
        dismissedIds: (dismissalsResult.data ?? []).map((row) =>
            String(row.suggestion_id),
        ),
        deliverables: (deliverablesResult.data ?? []) as DeliverableRow[],
    };
}

export async function loadAutomationCenter(db: SupabaseClient, userId: string) {
    const [rows, briefingDiagnostics] = await Promise.all([
        loadCenterRows(db, userId),
        loadBriefingDiagnostics(db, userId),
    ]);
    const names = new Map(
        rows.configs.map((config) => [config.id, config.name]),
    );
    const runMap = new Map(rows.runs.map((run) => [run.id, run]));
    return {
        globalEnabled: !rows.pauseAll,
        instances: mapInstances(rows.configs),
        runs: mapHistory(rows.runs, names, briefingDiagnostics),
        approvals: mapApprovals(rows.requests, runMap, names),
        deliverables: mapDeliverables(rows.deliverables),
        suggestions: mapSuggestions(rows.configs, rows.dismissedIds),
    };
}
