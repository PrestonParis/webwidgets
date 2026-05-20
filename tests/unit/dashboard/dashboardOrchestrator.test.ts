import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/widgets/server/resolveWidgetData', () => ({
    resolveWidgetData: vi.fn(async () => ({
        'finance.summary': {
            key: 'finance.summary',
            status: 'fulfilled',
            data: {
                overview: {
                    netWorth: 100,
                    cashTotal: 100,
                    netMonthlyCashflow: 10,
                },
                action: null,
                monthlyTotal: 0,
                topAccounts: [],
                accountCount: 1,
            },
            durationMs: 2,
        },
        'datahealth.system': {
            key: 'datahealth.system',
            status: 'rejected',
            error: {
                code: 'RESOLVER_FAILED',
                message: 'Datahealth data is temporarily unavailable.',
            },
            durationMs: 1,
        },
    })),
}));

const triggerN8nWorkflow = vi.fn();

vi.mock('@/lib/n8n/n8nClient', () => ({
    triggerN8nWorkflow: (...args: unknown[]) => triggerN8nWorkflow(...args),
}));

describe('dashboardOrchestrator', () => {
    it('returns a normalized screen snapshot with per-widget status', async () => {
        const { buildDashboardSnapshot } =
            await import('@/features/dashboard/server/dashboardOrchestrator');
        const snapshot = await buildDashboardSnapshot({
            userId: 'user-1',
            activeWidgets: [
                {
                    id: 'widget-finance',
                    type: 'finance',
                    visible: true,
                    containerId: 'main',
                },
                {
                    id: 'widget-datahealth',
                    type: 'datahealth',
                    visible: true,
                    containerId: 'main',
                },
            ],
        });

        expect(snapshot.screen).toBe('dashboard');
        expect(snapshot.widgets['widget-finance']?.status).toBe('ready');
        expect(snapshot.widgets['widget-datahealth']).toMatchObject({
            status: 'error',
            error: { code: 'RESOLVER_FAILED' },
        });
        expect(snapshot.shared?.['finance.summary']).toBeDefined();
        expect(snapshot.shared?.['datahealth.system']).toBeUndefined();
        expect(triggerN8nWorkflow).not.toHaveBeenCalled();
    });
});
