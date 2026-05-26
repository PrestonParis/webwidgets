'use client';

import { useMemo, useState } from 'react';
import AnatomicalBodyMap from './AnatomicalBodyMap';
import InjuryLogDrawer from './InjuryLogDrawer';
import BiometricChart from './BiometricChart';
import HealthLogForm from './HealthLogForm';
import { BodyIssuePanel } from './BodyIssuePanel';
import { IssueTimeline } from './IssueTimeline';
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
} from '@/features/tracking/lib/health/analytics';
import { useInjuryLogs } from '@/features/tracking/hooks/useInjuryLogs';
import { useBodyIssues } from '@/features/tracking/hooks/useBodyIssues';
import type { BodyIssueDraft } from '@/features/tracking/lib/health/bodyIssues';
import {
    BODY_REGIONS,
    getRegionLabel,
    type TissueType,
} from '@/features/tracking/lib/health/bodyRegions';
import {
    TISSUE_TYPE_CONFIGS,
    type BiometricWindow,
    type InjuryLog,
    type InjuryStatus,
} from '@/features/tracking/lib/health/types';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import { useTrackingGoals } from '@/features/tracking/hooks/useTrackingGoals';
import { WeightBMIPanel } from './WeightBMIPanel';
import type {
    BaseTrackingEntry,
    TrackingEntry,
} from '@/features/tracking/types/tracking';

type HealthTab =
    | 'body'
    | 'biometrics'
    | 'weight'
    | 'history'
    | 'goals'
    | 'timeline';

const HISTORY_PAGE_SIZE = 20;

const TABS: { id: HealthTab; label: string }[] = [
    { id: 'body', label: 'Body Map' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'biometrics', label: 'Biometrics' },
    { id: 'weight', label: 'Weight & BMI' },
    { id: 'history', label: 'History' },
    { id: 'goals', label: 'Goals' },
];

const STATUS_TONE: Record<InjuryStatus, string> = {
    active: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    improving:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    resolved:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    chronic:
        'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
};

const STATUS_FILTERS: { id: InjuryStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'improving', label: 'Improving' },
    { id: 'chronic', label: 'Chronic' },
    { id: 'resolved', label: 'Resolved' },
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

    // New body issues system
    const {
        issues,
        history: issueHistory,
        createIssue,
        updateIssue,
        resolveIssue,
        resolveAllForRegion,
        deleteIssue,
    } = useBodyIssues();

    const regionSummaries = useMemo(
        () => getActiveRegionSummaries(injuryLogs),
        [injuryLogs],
    );

    const filteredInjuryLogs = useMemo(() => {
        return injuryLogs.filter((log) => {
            if (tissueFilter && log.tissueType !== tissueFilter) return false;
            if (statusFilter !== 'all' && log.status !== statusFilter)
                return false;
            if (regionFilter !== 'all' && log.bodyRegionId !== regionFilter)
                return false;
            return true;
        });
    }, [injuryLogs, tissueFilter, statusFilter, regionFilter]);

    const mostSevereLabel = bodyMapAnalytics.mostSevereRegion
        ? getRegionLabel(bodyMapAnalytics.mostSevereRegion.regionId)
        : null;

    const injuryPageCount = Math.max(
        1,
        Math.ceil(filteredInjuryLogs.length / HISTORY_PAGE_SIZE),
    );
    const safePage = Math.min(page, injuryPageCount - 1);
    const pageItems = filteredInjuryLogs.slice(
        safePage * HISTORY_PAGE_SIZE,
        (safePage + 1) * HISTORY_PAGE_SIZE,
    );

    const loggedRegionIds = useMemo(() => {
        const ids = new Set(injuryLogs.map((log) => log.bodyRegionId));
        return BODY_REGIONS.filter((region) => ids.has(region.id));
    }, [injuryLogs]);

    // Maps each injury-log id to the TrackingEntry that owns it (for deletion).
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

    void onEdit;

    function handleRegionClick(regionId: string) {
        setSelectedRegion(null);
        setPanelRegionName(undefined);
        setPanelInitialDraft(
            regionId.startsWith('tooth-')
                ? {
                      regionType: 'tooth',
                      toothNumber: Number(regionId.replace('tooth-', '')),
                  }
                : undefined,
        );
        setPanelRegionId(regionId);
    }

    function handleSurfaceClick(view: 'front' | 'back', x: number, y: number) {
        const regionId = `skin-${view}-${Math.round(x)}-${Math.round(y)}`;
        setSelectedRegion(null);
        setPanelRegionId(regionId);
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
        setSelectedRegion(null);
        setPanelRegionId(regionId);
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

    // Active panel region's issues
    const panelIssues = useMemo(
        () =>
            panelRegionId
                ? issues.filter((i) => i.regionId === panelRegionId)
                : [],
        [issues, panelRegionId],
    );

    // Active issue count (new system)
    const activeIssueCount = useMemo(
        () => issues.filter((i) => i.status === 'active').length,
        [issues],
    );

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
                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                    <TrackingSection>
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                    Body map
                                </p>
                                <p className="text-xs text-gray-400 dark:text-zinc-500">
                                    Click a region to log soreness or an injury.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHeatmapMode((h) => !h)}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    heatmapMode
                                        ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300'
                                        : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'
                                }`}
                            >
                                {heatmapMode ? 'Heatmap on' : 'Heatmap'}
                            </button>
                        </div>
                        <div className="mx-auto max-w-lg">
                            <AnatomicalBodyMap
                                injuryLogs={injuryLogs}
                                issues={issues}
                                selectedRegionId={
                                    selectedRegion ?? panelRegionId
                                }
                                onRegionClick={handleRegionClick}
                                filterTissueType={tissueFilter}
                                heatmapMode={heatmapMode}
                                showLabels
                                showSearch
                                showLayerPanel
                                showZoomControls
                                onSurfaceClick={handleSurfaceClick}
                                onSurfaceDrawing={handleSurfaceDrawing}
                            />
                        </div>
                    </TrackingSection>

                    <TrackingSection>
                        <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                            Active regions
                        </p>
                        {regionSummaries.length === 0 &&
                        issues.filter((i) => i.status !== 'resolved').length ===
                            0 ? (
                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                                No active injuries. Click a region on the body
                                map to log one.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {/* New-system active issues by region */}
                                {Array.from(
                                    issues
                                        .filter((i) => i.status !== 'resolved')
                                        .reduce((acc, issue) => {
                                            const existing = acc.get(
                                                issue.regionId,
                                            );
                                            if (
                                                !existing ||
                                                issue.severity >
                                                    existing.severity
                                            ) {
                                                acc.set(issue.regionId, issue);
                                            }
                                            return acc;
                                        }, new Map<string, (typeof issues)[number]>())
                                        .entries(),
                                ).map(([regionId, topIssue]) => (
                                    <button
                                        key={regionId}
                                        type="button"
                                        onClick={() => {
                                            setPanelRegionId(regionId);
                                            setPanelRegionName(undefined);
                                            setPanelInitialDraft(undefined);
                                        }}
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-left transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                                {getRegionLabel(regionId)}
                                            </span>
                                            <span className="shrink-0 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                                {topIssue.severity}/10
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500 capitalize">
                                            {topIssue.issueType} ·{' '}
                                            {topIssue.status}
                                        </p>
                                    </button>
                                ))}
                                {/* Legacy summaries */}
                                {regionSummaries.map((summary) => (
                                    <button
                                        key={summary.regionId}
                                        type="button"
                                        onClick={() =>
                                            setSelectedRegion(summary.regionId)
                                        }
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-left transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                                {getRegionLabel(
                                                    summary.regionId,
                                                )}
                                            </span>
                                            <span className="shrink-0 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                                {summary.maxSeverity}/10
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500">
                                            {summary.activeLogCount} log
                                            {summary.activeLogCount === 1
                                                ? ''
                                                : 's'}
                                            {summary.hasRedFlags
                                                ? ' · ⚠ flagged'
                                                : ''}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </TrackingSection>

                    <div className="lg:col-span-2">
                        <TrackingSection>
                            <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                Quick log (energy &amp; sleep)
                            </p>
                            <HealthLogForm
                                mode="full"
                                initialDate={new Date()
                                    .toISOString()
                                    .slice(0, 10)}
                                onSubmit={onAdd}
                                onCancel={() => setActiveTab('body')}
                            />
                        </TrackingSection>
                    </div>
                </div>
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
                <TrackingSection>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <select
                            value={regionFilter}
                            onChange={(e) => {
                                setRegionFilter(e.target.value);
                                setPage(0);
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            aria-label="Filter by region"
                        >
                            <option value="all">All regions</option>
                            {loggedRegionIds.map((region) => (
                                <option key={region.id} value={region.id}>
                                    {region.displayName}
                                </option>
                            ))}
                        </select>
                        <select
                            value={tissueFilter ?? 'all'}
                            onChange={(e) => {
                                setTissueFilter(
                                    e.target.value === 'all'
                                        ? null
                                        : (e.target.value as TissueType),
                                );
                                setPage(0);
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            aria-label="Filter by tissue type"
                        >
                            <option value="all">All tissue</option>
                            {TISSUE_TYPE_CONFIGS.map((config) => (
                                <option key={config.id} value={config.id}>
                                    {config.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex flex-wrap gap-1">
                            {STATUS_FILTERS.map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(filter.id);
                                        setPage(0);
                                    }}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${statusFilter === filter.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredInjuryLogs.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                            No injury logs match these filters.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {pageItems.map((log) => (
                                <InjuryHistoryCard
                                    key={log.id}
                                    log={log}
                                    entryId={entryIdByLogId.get(log.id) ?? null}
                                    onSelect={() =>
                                        setSelectedRegion(log.bodyRegionId)
                                    }
                                    onUpdateStatus={updateStatus}
                                    onDelete={onDelete}
                                />
                            ))}

                            {injuryPageCount > 1 && (
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPage((p) => Math.max(0, p - 1))
                                        }
                                        disabled={safePage === 0}
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-40 dark:border-zinc-700"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-400 dark:text-zinc-500">
                                        Page {safePage + 1} of {injuryPageCount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(
                                                    injuryPageCount - 1,
                                                    p + 1,
                                                ),
                                            )
                                        }
                                        disabled={
                                            safePage >= injuryPageCount - 1
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-40 dark:border-zinc-700"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </TrackingSection>
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

            {/* Legacy InjuryLogDrawer (for regions without new-system issues) */}
            <InjuryLogDrawer
                isOpen={selectedRegion !== null}
                regionId={selectedRegion}
                existingLogs={injuryLogs}
                onSave={saveLog}
                onUpdateStatus={updateStatus}
                onClose={() => setSelectedRegion(null)}
                onSwitchRegion={(id) => setSelectedRegion(id)}
            />

            {/* New BodyIssuePanel */}
            {panelRegionId !== null && (
                <BodyIssuePanel
                    key={panelRegionId}
                    regionId={panelRegionId}
                    regionName={panelRegionName}
                    issues={panelIssues}
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

interface InjuryHistoryCardProps {
    log: InjuryLog;
    entryId: string | null;
    onSelect: () => void;
    onUpdateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
    onDelete: (id: string) => void;
}

function InjuryHistoryCard({
    log,
    entryId,
    onSelect,
    onUpdateStatus,
    onDelete,
}: InjuryHistoryCardProps) {
    return (
        <div className="group rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50">
            <div className="flex items-start justify-between gap-2">
                <button
                    type="button"
                    onClick={onSelect}
                    className="min-w-0 flex-1 text-left"
                >
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                            {getRegionLabel(log.bodyRegionId)}
                        </span>
                        <span className="text-xs capitalize text-gray-500 dark:text-zinc-400">
                            {log.injuryType}
                        </span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {log.severity}/10
                        </span>
                        {log.redFlags.length > 0 && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠ flagged
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-zinc-500">
                        {formatDate(log.createdAt.slice(0, 10))}
                        {log.symptoms ? ` · ${log.symptoms}` : ''}
                    </p>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[log.status]}`}
                    >
                        {log.status}
                    </span>
                    {entryId && (
                        <button
                            type="button"
                            onClick={() => onDelete(entryId)}
                            className="text-[11px] text-red-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                            aria-label={`Delete ${getRegionLabel(log.bodyRegionId)} log`}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                {(
                    [
                        'active',
                        'improving',
                        'resolved',
                        'chronic',
                    ] as InjuryStatus[]
                ).map((status) => (
                    <button
                        key={status}
                        type="button"
                        disabled={status === log.status}
                        onClick={() => void onUpdateStatus(log.id, status)}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                            status === log.status
                                ? 'cursor-default opacity-40'
                                : 'border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>
    );
}
