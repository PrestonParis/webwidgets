'use client';

import { useMemo, useState } from 'react';
import { HeartPulse, History } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetImportExportControls } from '@/features/import-export/components/WidgetImportExportControls';
import { useTrackingEntries } from '@/features/tracking/hooks/useTrackingEntries';
import { useTrackingActions } from '@/features/tracking/hooks/useTrackingActions';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import HealthLogForm from '@/features/tracking/health/components/HealthLogForm';
import AnatomicalBodyMap from '@/features/tracking/health/components/AnatomicalBodyMap';
import BiometricChart from '@/features/ui/visualizations/components/BiometricChart';
import { BodyIssuePanel } from '@/features/tracking/health/components/BodyIssuePanel';
import {
    computeHealthAnalytics,
    getBiometricSeries,
    normalizeHealthEntries,
} from '@/features/tracking/health/lib/analytics';
import {
    computeWeightAnalytics,
    fmtWeight,
    normalizeWeightEntries,
} from '@/features/tracking/health/lib/weightDomain';
import { WeightLogForm } from '@/features/tracking/health/components/WeightLogForm';
import { useInjuryLogs } from '@/features/tracking/health/hooks/useInjuryLogs';
import { useBodyIssues } from '@/features/tracking/health/hooks/useBodyIssues';
import type { BodyIssueDraft } from '@/features/tracking/health/lib/bodyIssues';
import type { BiometricWindow } from '@/features/tracking/health/types/health';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { MiniHistoryChart } from '@/features/tracking/components/MiniHistoryChart';

type Tab = 'add' | 'history' | 'insights' | 'body';

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2">
            <p className="text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                {value}
            </p>
        </div>
    );
}

function deltaLabel(delta: number | null, unit: string): string {
    if (delta === null) return 'N/A';
    const rounded = Math.round(delta);
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded}${unit}`;
}

export default function HealthWidget() {
    const [tab, setTab] = useState<Tab>('add');
    const [bioWindow, setBioWindow] = useState<BiometricWindow>('7d');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [panelRegionName, setPanelRegionName] = useState<
        string | undefined
    >();
    const [panelInitialDraft, setPanelInitialDraft] = useState<
        Partial<BodyIssueDraft> | undefined
    >();

    const { entries, refetch } = useTrackingEntries({
        category: 'health',
        limit: 50,
    });
    const { handleAdd, handleUpdate } = useTrackingActions(refetch);
    useTrackingGoals('health');

    const logs = useMemo(() => normalizeHealthEntries(entries), [entries]);
    const analytics = useMemo(() => computeHealthAnalytics(logs), [logs]);
    const bioSeries = useMemo(
        () => getBiometricSeries(logs, bioWindow),
        [logs, bioWindow],
    );
    const weightEntries = useMemo(
        () => normalizeWeightEntries(entries),
        [entries],
    );
    const weightAnalytics = useMemo(
        () => computeWeightAnalytics(weightEntries),
        [weightEntries],
    );

    const { injuryLogs, analytics: bodyMapAnalytics } = useInjuryLogs({
        entries,
        onAdd: handleAdd,
        onUpdate: handleUpdate,
    });
    const {
        issues,
        history: issueHistory,
        createIssue,
        updateIssue,
        resolveAllForRegion,
        deleteIssue,
    } = useBodyIssues();

    const today = new Date().toISOString().slice(0, 10);
    const activeIssueCount = issues.filter(
        (issue) => issue.status !== 'resolved',
    ).length;
    const panelIssues = selectedRegion
        ? issues.filter((issue) => issue.regionId === selectedRegion)
        : [];

    function handleRegionClick(regionId: string) {
        setPanelRegionName(undefined);
        setPanelInitialDraft(
            regionId.startsWith('tooth-')
                ? {
                      regionType: 'tooth',
                      toothNumber: Number(regionId.replace('tooth-', '')),
                  }
                : undefined,
        );
        setSelectedRegion(regionId);
    }

    function handleSurfaceClick(view: 'front' | 'back', x: number, y: number) {
        const regionId = `skin-${view}-${Math.round(x)}-${Math.round(y)}`;
        setSelectedRegion(regionId);
        setPanelRegionName(
            `${view === 'front' ? 'Front' : 'Back'} skin marker (${Math.round(x)}%, ${Math.round(y)}%)`,
        );
        setPanelInitialDraft({
            regionId,
            regionType: 'surface',
            issueType: 'rash',
            severity: 3,
            status: 'active',
            durationType: 'acute',
            onsetDate: new Date().toISOString().slice(0, 10),
            triggers: [],
            skinX: x,
            skinY: y,
        });
    }

    function handleSurfaceDrawing(
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) {
        const regionId = `skin-${view}-drawing-${Date.now()}`;
        setSelectedRegion(regionId);
        setPanelRegionName(
            `${view === 'front' ? 'Front' : 'Back'} skin drawing`,
        );
        setPanelInitialDraft({
            regionId,
            regionType: 'surface',
            issueType: 'rash',
            severity: 3,
            status: 'active',
            durationType: 'acute',
            onsetDate: new Date().toISOString().slice(0, 10),
            triggers: [],
            skinX: x,
            skinY: y,
            skinDrawing: path,
        });
    }

    return (
        <WidgetShell
            icon={<HeartPulse className="h-4 w-4 text-rose-500" />}
            title="Health Tracker"
            footerHref="/tracking"
            footerLabel="Open health dashboard"
            widgetId="health-widget"
            widgetType="tracking-health"
            headerActionsSlot={
                <WidgetImportExportControls
                    sourceType="tracking_entries"
                    displayName="Health"
                />
            }
        >
            <div className="space-y-3">
                {/* Tab bar */}
                <div className="flex gap-0 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
                    {(['add', 'history', 'insights', 'body'] as const).map(
                        (t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                                    tab === t
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                                }`}
                            >
                                {t === 'body'
                                    ? 'Body'
                                    : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ),
                    )}
                </div>

                {tab === 'add' && (
                    <div className="space-y-3">
                        <HealthLogForm
                            mode="full"
                            onSubmit={async (entry) => {
                                await handleAdd(entry);
                                setTab('history');
                            }}
                            onCancel={() => setTab('history')}
                        />
                        <WeightLogForm
                            onSubmit={async (entry) => {
                                await handleAdd(entry);
                            }}
                            {...(() => {
                                const h = weightEntries.find(
                                    (e) => e.heightCm != null,
                                )?.heightCm;
                                return h !== undefined
                                    ? { lastHeightCm: h }
                                    : {};
                            })()}
                        />
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-3">
                        <MiniHistoryChart
                            dates={logs.map((l: { date: string }) => l.date)}
                            accentColor="rose"
                        />
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {logs.length === 0 ? (
                                <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                    No health logs yet.
                                </p>
                            ) : (
                                logs
                                    .slice(0, 8)
                                    .map(
                                        (log: {
                                            id: string;
                                            date: string;
                                            energyLevel?: number;
                                            sleepQuality?: number;
                                            sickness?: { type: string };
                                            bodyMap?: Record<string, unknown>;
                                        }) => (
                                            <div
                                                key={log.id}
                                                className={`flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 ${log.date === today ? 'ring-1 ring-rose-400' : ''}`}
                                            >
                                                <History className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium text-gray-800 dark:text-zinc-100">
                                                        {formatDate(log.date)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                                        energy{' '}
                                                        {log.energyLevel ??
                                                            'N/A'}{' '}
                                                        · sleep{' '}
                                                        {log.sleepQuality ??
                                                            'N/A'}
                                                        {log.sickness
                                                            ? ` · ${log.sickness.type}`
                                                            : ''}
                                                        {log.bodyMap
                                                            ? ` · ${Object.keys(log.bodyMap).length} zones`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        ),
                                    )
                            )}
                        </div>
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                            <Stat
                                label="Active inj."
                                value={String(
                                    activeIssueCount ||
                                        bodyMapAnalytics.totalActive,
                                )}
                            />
                            <Stat
                                label="Weight"
                                value={
                                    weightAnalytics.latest
                                        ? fmtWeight(
                                              weightAnalytics.latest.weightKg,
                                              'lbs',
                                          )
                                        : 'N/A'
                                }
                            />
                            <Stat
                                label="BMI"
                                value={
                                    weightAnalytics.currentBMI !== null
                                        ? weightAnalytics.currentBMI.toFixed(1)
                                        : 'N/A'
                                }
                            />
                            <Stat
                                label="HRV Δ"
                                value={deltaLabel(analytics.hrvDelta, 'ms')}
                            />
                        </div>
                        <BiometricChart
                            data={bioSeries}
                            window={bioWindow}
                            onWindowChange={setBioWindow}
                            height={180}
                        />
                        {analytics.recentSickness && (
                            <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                                Recent sickness: {analytics.recentSickness.type}
                            </p>
                        )}
                    </div>
                )}

                {tab === 'body' && (
                    <div className="relative">
                        <AnatomicalBodyMap
                            injuryLogs={injuryLogs}
                            issues={issues}
                            selectedRegionId={selectedRegion}
                            onRegionClick={handleRegionClick}
                            showLabels
                            showSearch
                            showLayerPanel
                            showZoomControls
                            onSurfaceClick={handleSurfaceClick}
                            onSurfaceDrawing={handleSurfaceDrawing}
                        />
                        {selectedRegion !== null && (
                            <BodyIssuePanel
                                key={selectedRegion}
                                regionId={selectedRegion}
                                issues={panelIssues}
                                history={issueHistory}
                                onUpdateIssue={(id, updates) =>
                                    updateIssue(id, updates)
                                }
                                onDeleteIssue={deleteIssue}
                                onResolveAll={() =>
                                    resolveAllForRegion(selectedRegion)
                                }
                                onAddIssue={createIssue}
                                onClose={() => {
                                    setSelectedRegion(null);
                                    setPanelRegionName(undefined);
                                    setPanelInitialDraft(undefined);
                                }}
                                {...(panelRegionName !== undefined
                                    ? { regionName: panelRegionName }
                                    : {})}
                                {...(panelInitialDraft !== undefined
                                    ? { initialDraft: panelInitialDraft }
                                    : {})}
                            />
                        )}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
