'use client';

import { useMemo, useState } from 'react';
import InjuryLogDrawer from './InjuryLogDrawer';
import BiometricChart from './BiometricChart';
import { BodyIssuePanel } from './BodyIssuePanel';
import { IssueTimeline } from './IssueTimeline';
import { HealthBodyTab } from './HealthBodyTab';
import { HealthHistoryTab } from './HealthHistoryTab';
import {
    SurfaceTabs,
    TrackingHero,
    TrackingKpi,
    TrackingSection,
} from '@/features/tracking/components/TrackingSurface';
import {
    computeHealthAnalytics,
    getBiometricSeries,
    getActiveRegionSummaries,
    normalizeHealthEntries,
} from '@/features/tracking/health/lib/analytics';
import { useInjuryLogs } from '@/features/tracking/health/hooks/useInjuryLogs';
import { useBodyIssues } from '@/features/tracking/health/hooks/useBodyIssues';
import type { BodyIssueDraft } from '@/features/tracking/health/lib/bodyIssues';
import {
    getRegionLabel,
    type TissueType,
} from '@/features/tracking/health/lib/bodyRegions';
import {
    type BiometricWindow,
    type InjuryStatus,
} from '@/features/tracking/health/lib/types';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { WeightBMIPanel } from './WeightBMIPanel';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/trackingEntryTypes';

type HealthTab =
    | 'body'
    | 'biometrics'
    | 'weight'
    | 'history'
    | 'goals'
    | 'timeline';

const TABS: { id: HealthTab; label: string }[] = [
    { id: 'body', label: 'Body Map' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'biometrics', label: 'Biometrics' },
    { id: 'weight', label: 'Weight & BMI' },
    { id: 'history', label: 'History' },
    { id: 'goals', label: 'Goals' },
];

interface HealthCategoryViewProps {
    entries: TrackingEntry[];
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onUpdate: (
        id: string,
        updates: Partial<BaseTrackingEntry>,
    ) => Promise<void>;
    onEdit: (entry: TrackingEntry) => void;
    onDelete: (id: string) => void;
}

export function HealthCategoryView({
    entries,
    onAdd,
    onUpdate,
    onEdit,
    onDelete,
}: HealthCategoryViewProps) {
    const [activeTab, setActiveTab] = useState<HealthTab>('body');
    const [bioWindow, setBioWindow] = useState<BiometricWindow>('90d');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [tissueFilter, setTissueFilter] = useState<TissueType | null>(null);
    const [statusFilter, setStatusFilter] = useState<InjuryStatus | 'all'>(
        'all',
    );
    const [regionFilter, setRegionFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [heatmapMode, setHeatmapMode] = useState(false);
    const [panelRegionId, setPanelRegionId] = useState<string | null>(null);
    const [panelRegionName, setPanelRegionName] = useState<
        string | undefined
    >();
    const [panelInitialDraft, setPanelInitialDraft] = useState<
        Partial<BodyIssueDraft> | undefined
    >();

    void onEdit;

    const logs = useMemo(() => normalizeHealthEntries(entries), [entries]);
    const analytics = useMemo(() => computeHealthAnalytics(logs), [logs]);
    const bioSeries = useMemo(
        () => getBiometricSeries(logs, bioWindow),
        [logs, bioWindow],
    );
    const { goal } = useTrackingGoals('health');
    const {
        injuryLogs,
        analytics: bodyMapAnalytics,
        saveLog,
        updateStatus,
    } = useInjuryLogs({ entries, onAdd, onUpdate });
    const {
        issues,
        history: issueHistory,
        createIssue,
        updateIssue,
        resolveAllForRegion,
        deleteIssue,
    } = useBodyIssues();
    const regionSummaries = useMemo(
        () => getActiveRegionSummaries(injuryLogs),
        [injuryLogs],
    );
    const activeIssueCount = useMemo(
        () => issues.filter((i) => i.status === 'active').length,
        [issues],
    );

    const entryIdByLogId = useMemo(() => {
        const map = new Map<string, string>();
        for (const entry of entries) {
            if (entry.category !== 'health') continue;
            const rawLogs = entry.metadata?.['injuryLogs'];
            if (!Array.isArray(rawLogs)) continue;
            for (const raw of rawLogs) {
                if (raw && typeof raw === 'object') {
                    const id = (raw as Record<string, unknown>)['id'];
                    if (typeof id === 'string') map.set(id, entry.id);
                }
            }
        }
        return map;
    }, [entries]);

    function openPanel(
        regionId: string,
        name?: string,
        draft?: Partial<BodyIssueDraft>,
    ) {
        setPanelRegionId(regionId);
        setPanelRegionName(name);
        setPanelInitialDraft(draft);
    }

    function handleRegionClick(regionId: string) {
        setSelectedRegion(null);
        openPanel(
            regionId,
            undefined,
            regionId.startsWith('tooth-')
                ? {
                      regionType: 'tooth',
                      toothNumber: Number(regionId.replace('tooth-', '')),
                  }
                : undefined,
        );
    }

    function handleSurfaceClick(view: 'front' | 'back', x: number, y: number) {
        const regionId = `skin-${view}-${Math.round(x)}-${Math.round(y)}`;
        setSelectedRegion(null);
        openPanel(
            regionId,
            `${view === 'front' ? 'Front' : 'Back'} skin marker (${Math.round(x)}%, ${Math.round(y)}%)`,
            {
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
            },
        );
    }

    function handleSurfaceDrawing(
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) {
        const regionId = `skin-${view}-drawing-${Date.now()}`;
        setSelectedRegion(null);
        openPanel(
            regionId,
            `${view === 'front' ? 'Front' : 'Back'} skin drawing`,
            {
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
            },
        );
    }

    const mostSevereLabel = bodyMapAnalytics.mostSevereRegion
        ? getRegionLabel(bodyMapAnalytics.mostSevereRegion.regionId)
        : null;

    return (
        <div className="space-y-4">
            <TrackingHero
                eyebrow="Health Tracker"
                title={
                    activeIssueCount > 0
                        ? `${activeIssueCount} active issue${activeIssueCount === 1 ? '' : 's'}`
                        : bodyMapAnalytics.totalActive > 0
                          ? `${bodyMapAnalytics.totalActive} active injur${bodyMapAnalytics.totalActive === 1 ? 'y' : 'ies'}`
                          : 'Recovery dashboard'
                }
                subtitle={
                    mostSevereLabel
                        ? `Most severe: ${mostSevereLabel}`
                        : analytics.recentSickness
                          ? `Recent sickness: ${analytics.recentSickness.type}`
                          : 'Log injuries on the body map, plus biometrics and recovery.'
                }
                tone="pink"
                kpis={
                    <>
                        <TrackingKpi
                            label="Active issues"
                            value={String(
                                activeIssueCount ||
                                    bodyMapAnalytics.totalActive,
                            )}
                        />
                        <TrackingKpi
                            label="L / R"
                            value={`${bodyMapAnalytics.leftRightImbalance.leftCount} / ${bodyMapAnalytics.leftRightImbalance.rightCount}`}
                        />
                        <TrackingKpi
                            label="Energy 7d"
                            value={
                                analytics.avgEnergy7d !== null
                                    ? analytics.avgEnergy7d.toFixed(1)
                                    : '—'
                            }
                        />
                        <TrackingKpi
                            label="HRV Δ"
                            value={
                                analytics.hrvDelta !== null
                                    ? `${analytics.hrvDelta > 0 ? '+' : ''}${Math.round(analytics.hrvDelta)}ms`
                                    : '—'
                            }
                        />
                        <TrackingKpi
                            label="RHR Δ"
                            value={
                                analytics.rhrDelta !== null
                                    ? `${analytics.rhrDelta > 0 ? '+' : ''}${Math.round(analytics.rhrDelta)}bpm`
                                    : '—'
                            }
                        />
                    </>
                }
            />

            <SurfaceTabs
                items={TABS}
                active={activeTab}
                onChange={setActiveTab}
                tone="pink"
            />

            {activeTab === 'body' && (
                <HealthBodyTab
                    injuryLogs={injuryLogs}
                    issues={issues}
                    selectedRegionId={selectedRegion}
                    panelRegionId={panelRegionId}
                    regionSummaries={regionSummaries}
                    tissueFilter={tissueFilter}
                    heatmapMode={heatmapMode}
                    onHeatmapToggle={() => setHeatmapMode((h) => !h)}
                    onRegionClick={handleRegionClick}
                    onSurfaceClick={handleSurfaceClick}
                    onSurfaceDrawing={handleSurfaceDrawing}
                    onPanelOpen={(id) => openPanel(id)}
                    onAdd={onAdd}
                    onTabChange={(t) => setActiveTab(t as HealthTab)}
                />
            )}

            {activeTab === 'timeline' && (
                <TrackingSection>
                    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        Issue timeline
                    </p>
                    <IssueTimeline
                        issues={issues}
                        history={issueHistory}
                        onUpdateStatus={(id, status) =>
                            updateIssue(id, { status })
                        }
                    />
                </TrackingSection>
            )}

            {activeTab === 'biometrics' && (
                <TrackingSection>
                    <BiometricChart
                        data={bioSeries}
                        window={bioWindow}
                        onWindowChange={setBioWindow}
                        height={260}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/70">
                            <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                                HRV vs 7d avg
                            </p>
                            <p className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-300">
                                {analytics.hrvDelta !== null
                                    ? `${analytics.hrvDelta > 0 ? '+' : ''}${Math.round(analytics.hrvDelta)} ms`
                                    : '—'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/70">
                            <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">
                                RHR vs 7d avg
                            </p>
                            <p className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-300">
                                {analytics.rhrDelta !== null
                                    ? `${analytics.rhrDelta > 0 ? '+' : ''}${Math.round(analytics.rhrDelta)} bpm`
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </TrackingSection>
            )}

            {activeTab === 'weight' && (
                <WeightBMIPanel
                    entries={entries}
                    onAdd={onAdd}
                    onDelete={onDelete}
                />
            )}

            {activeTab === 'history' && (
                <HealthHistoryTab
                    injuryLogs={injuryLogs}
                    regionFilter={regionFilter}
                    tissueFilter={tissueFilter}
                    statusFilter={statusFilter}
                    page={page}
                    entryIdByLogId={entryIdByLogId}
                    onRegionFilterChange={setRegionFilter}
                    onTissueFilterChange={setTissueFilter}
                    onStatusFilterChange={setStatusFilter}
                    onPageChange={setPage}
                    onSelectLog={setSelectedRegion}
                    onUpdateStatus={updateStatus}
                    onDelete={onDelete}
                />
            )}

            {activeTab === 'goals' && (
                <TrackingSection>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        Energy & sleep goals
                    </p>
                    {goal ? (
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Current goal: {goal.targetType.replace('_', ' ')} ·
                            target {goal.targetValue}
                            {goal.metricKey ? ` (${goal.metricKey})` : ''}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                            No health goal set yet. Use the Goals tab in the
                            tracking sidebar to set an energy or sleep-quality
                            target.
                        </p>
                    )}
                </TrackingSection>
            )}

            <InjuryLogDrawer
                isOpen={selectedRegion !== null}
                regionId={selectedRegion}
                existingLogs={injuryLogs}
                onSave={saveLog}
                onUpdateStatus={updateStatus}
                onClose={() => setSelectedRegion(null)}
                onSwitchRegion={(id) => setSelectedRegion(id)}
            />

            {panelRegionId !== null && (
                <BodyIssuePanel
                    key={panelRegionId}
                    regionId={panelRegionId}
                    regionName={panelRegionName}
                    issues={issues.filter((i) => i.regionId === panelRegionId)}
                    history={issueHistory}
                    onUpdateIssue={(id, updates) => updateIssue(id, updates)}
                    onDeleteIssue={deleteIssue}
                    onResolveAll={() => resolveAllForRegion(panelRegionId)}
                    onAddIssue={createIssue}
                    initialDraft={panelInitialDraft}
                    onClose={() => {
                        setPanelRegionId(null);
                        setPanelRegionName(undefined);
                        setPanelInitialDraft(undefined);
                    }}
                />
            )}
        </div>
    );
}
