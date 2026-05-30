'use client';

import { useMemo, useState } from 'react';
import {
    Activity,
    HeartPulse,
    History,
    Import,
    PersonStanding,
    Plus,
    Scale,
    Thermometer,
} from 'lucide-react';
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
import { QuickActionButton } from '@/features/tracking/components/TrackingSurface';
import { useInjuryLogs } from '@/features/tracking/health/hooks/useInjuryLogs';
import { useBodyIssues } from '@/features/tracking/health/hooks/useBodyIssues';
import type { BodyIssueDraft } from '@/features/tracking/health/lib/bodyIssues';
import { getRegionLabel } from '@/features/tracking/health/lib/bodyRegions';
import type { BiometricWindow } from '@/features/tracking/health/types/health';
import { formatDate } from '@/features/tracking/lib/trackingUtils';

type ViewMode =
    | 'log'
    | 'body'
    | 'weight'
    | 'biometrics'
    | 'sickness'
    | 'import'
    | 'history'
    | 'summary';

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
    const [mode, setMode] = useState<ViewMode>('log');
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
    const mostSevereLabel = bodyMapAnalytics.mostSevereRegion
        ? getRegionLabel(bodyMapAnalytics.mostSevereRegion.regionId)
        : null;
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
                <div className="grid grid-cols-3 gap-1">
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'log'}
                        onClick={() => setMode('log')}
                    >
                        <Plus className="h-3 w-3" /> Log
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'body'}
                        onClick={() => setMode('body')}
                    >
                        <PersonStanding className="h-3 w-3" /> Body Map
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'weight'}
                        onClick={() => setMode('weight')}
                    >
                        <Scale className="h-3 w-3" /> Weight
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'biometrics'}
                        onClick={() => setMode('biometrics')}
                    >
                        <Activity className="h-3 w-3" /> Biometrics
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'sickness'}
                        onClick={() => setMode('sickness')}
                    >
                        <Thermometer className="h-3 w-3" /> Sickness
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'import'}
                        onClick={() => setMode('import')}
                    >
                        <Import className="h-3 w-3" /> Import
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'history'}
                        onClick={() => setMode('history')}
                    >
                        <History className="h-3 w-3" /> History
                    </QuickActionButton>
                    <QuickActionButton
                        tone="pink"
                        primary={mode === 'summary'}
                        onClick={() => setMode('summary')}
                    >
                        <HeartPulse className="h-3 w-3" /> Summary
                    </QuickActionButton>
                </div>

                {mode === 'log' && (
                    <HealthLogForm
                        mode="full"
                        onSubmit={async (entry) => {
                            await handleAdd(entry);
                            setMode('summary');
                        }}
                        onCancel={() => setMode('summary')}
                    />
                )}
                {mode === 'sickness' && (
                    <HealthLogForm
                        mode="full"
                        onSubmit={async (entry) => {
                            await handleAdd(entry);
                            setMode('summary');
                        }}
                        onCancel={() => setMode('summary')}
                    />
                )}
                {mode === 'import' && (
                    <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                        Health import is available from the full dashboard.
                    </p>
                )}

                {mode === 'summary' && (
                    <div className="space-y-3">
                        {analytics.todayEntry ||
                        bodyMapAnalytics.totalActive > 0 ? (
                            <div className="rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/20 p-3">
                                <p className="text-[10px] font-semibold uppercase text-rose-500 dark:text-rose-300">
                                    Recovery
                                </p>
                                <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {activeIssueCount > 0
                                        ? `${activeIssueCount} active issue${activeIssueCount === 1 ? '' : 's'}`
                                        : bodyMapAnalytics.totalActive > 0
                                          ? `${bodyMapAnalytics.totalActive} active injur${bodyMapAnalytics.totalActive === 1 ? 'y' : 'ies'}${mostSevereLabel ? ` · ${mostSevereLabel}` : ''}`
                                          : 'No active injuries'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {formatDate(today)} · energy{' '}
                                    {analytics.todayEntry?.energyLevel ?? 'N/A'}{' '}
                                    · sleep{' '}
                                    {analytics.todayEntry?.sleepQuality ??
                                        'N/A'}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-rose-200 dark:border-rose-900 p-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Log your recovery
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Track injuries on the body map, biometrics,
                                    allergies, and sickness in one place.
                                </p>
                            </div>
                        )}
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
                        <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                            <div className="rounded-lg bg-gray-50 p-2 dark:bg-zinc-800/70">
                                <AnatomicalBodyMap
                                    injuryLogs={injuryLogs}
                                    issues={issues}
                                    selectedRegionId={null}
                                    onRegionClick={() => setMode('body')}
                                    readonly
                                    className="mx-auto max-w-27.5"
                                />
                            </div>
                            <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-600 dark:text-zinc-300">
                                {activeIssueCount > 0
                                    ? `${activeIssueCount} active issue${activeIssueCount === 1 ? '' : 's'}. Open the body map for details.`
                                    : bodyMapAnalytics.totalActive > 0
                                      ? `${bodyMapAnalytics.totalActive} active injur${bodyMapAnalytics.totalActive === 1 ? 'y' : 'ies'}${mostSevereLabel ? `, most severe: ${mostSevereLabel}` : ''}.`
                                      : analytics.recentSickness
                                        ? `Recent sickness logged: ${analytics.recentSickness.type}.`
                                        : 'No active injuries. Open the body map to log soreness or injuries.'}
                            </p>
                        </div>
                    </div>
                )}
                {mode === 'body' && (
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
                {mode === 'biometrics' && (
                    <BiometricChart
                        data={bioSeries}
                        window={bioWindow}
                        onWindowChange={setBioWindow}
                        height={180}
                    />
                )}
                {mode === 'weight' && (
                    <div className="space-y-3">
                        {weightAnalytics.latest ? (
                            <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-3">
                                <p className="text-[10px] font-semibold uppercase text-indigo-500 dark:text-indigo-300">
                                    Current weight
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    {fmtWeight(
                                        weightAnalytics.latest.weightKg,
                                        'lbs',
                                    )}
                                    {weightAnalytics.currentBMI !== null && (
                                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-zinc-400">
                                            BMI{' '}
                                            {weightAnalytics.currentBMI.toFixed(
                                                1,
                                            )}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    {weightAnalytics.latest.date}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900 p-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                    Log your weight
                                </p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                    Track weight over time and calculate BMI.
                                </p>
                            </div>
                        )}
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
                {mode === 'history' && (
                    <div className="space-y-1">
                        {logs.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2 text-xs text-gray-500 dark:text-zinc-400">
                                No health logs yet.
                            </p>
                        ) : (
                            logs.slice(0, 5).map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-zinc-800/70 p-2"
                                >
                                    <History className="h-3.5 w-3.5 text-gray-400" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-gray-800 dark:text-zinc-100">
                                            {formatDate(log.date)}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-zinc-400">
                                            {log.bodyMap
                                                ? `${Object.keys(log.bodyMap).length} zones · `
                                                : ''}
                                            energy {log.energyLevel ?? 'N/A'} ·
                                            sleep {log.sleepQuality ?? 'N/A'}
                                            {log.sickness
                                                ? ` · ${log.sickness.type}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </WidgetShell>
    );
}
