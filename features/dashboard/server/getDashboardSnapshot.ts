import {
    buildDashboardSnapshot,
    type DashboardOrchestratorContext,
} from '@/features/dashboard/server/dashboardOrchestrator';

export async function getDashboardSnapshot(ctx: DashboardOrchestratorContext) {
    return buildDashboardSnapshot(ctx);
}
