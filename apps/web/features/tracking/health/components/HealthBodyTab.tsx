'use client';

import { useMemo } from 'react';
import AnatomicalBodyMap from './AnatomicalBodyMap';
import HealthLogForm from './HealthLogForm';
import { TrackingSection } from '@/features/tracking/components/TrackingSurface';
import { getRegionLabel } from '@/features/tracking/health/lib/bodyRegions';
import type { BodyIssue } from '@/features/tracking/health/lib/bodyIssues';
import type { InjuryLog } from '@/features/tracking/health/lib/types';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntryTypes';

interface RegionSummary {
    regionId: string;
    activeLogCount: number;
    maxSeverity: number;
    hasRedFlags: boolean;
}

interface HealthBodyTabProps {
    injuryLogs: InjuryLog[];
    issues: BodyIssue[];
    selectedRegionId: string | null;
    panelRegionId: string | null;
    regionSummaries: RegionSummary[];
    tissueFilter: string | null;
    heatmapMode: boolean;
    onHeatmapToggle: () => void;
    onRegionClick: (id: string) => void;
    onSurfaceClick: (view: 'front' | 'back', x: number, y: number) => void;
    onSurfaceDrawing: (
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) => void;
    onPanelOpen: (regionId: string) => void;
    onAdd: (entry: BaseTrackingEntry) => Promise<void>;
    onTabChange: (tab: string) => void;
}

export function HealthBodyTab({
    injuryLogs,
    issues,
    selectedRegionId,
    panelRegionId,
    regionSummaries,
    tissueFilter,
    heatmapMode,
    onHeatmapToggle,
    onRegionClick,
    onSurfaceClick,
    onSurfaceDrawing,
    onPanelOpen,
    onAdd,
    onTabChange,
}: HealthBodyTabProps) {
    const activeIssuesByRegion = useMemo(
        () =>
            Array.from(
                issues
                    .filter((i) => i.status !== 'resolved')
                    .reduce((acc, issue) => {
                        const existing = acc.get(issue.regionId);
                        if (!existing || issue.severity > existing.severity)
                            acc.set(issue.regionId, issue);
                        return acc;
                    }, new Map<string, (typeof issues)[number]>())
                    .entries(),
            ),
        [issues],
    );

    return (
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
                        onClick={onHeatmapToggle}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${heatmapMode ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300' : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'}`}
                    >
                        {heatmapMode ? 'Heatmap on' : 'Heatmap'}
                    </button>
                </div>
                <div className="mx-auto max-w-lg">
                    <AnatomicalBodyMap
                        injuryLogs={injuryLogs}
                        issues={issues}
                        selectedRegionId={selectedRegionId ?? panelRegionId}
                        onRegionClick={onRegionClick}
                        filterTissueType={tissueFilter as never}
                        heatmapMode={heatmapMode}
                        showLabels
                        showSearch
                        showLayerPanel
                        showZoomControls
                        onSurfaceClick={onSurfaceClick}
                        onSurfaceDrawing={onSurfaceDrawing}
                    />
                </div>
            </TrackingSection>

            <TrackingSection>
                <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                    Active regions
                </p>
                {activeIssuesByRegion.length === 0 &&
                regionSummaries.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                        No active injuries. Click a region on the body map to
                        log one.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {activeIssuesByRegion.map(([regionId, topIssue]) => (
                            <button
                                key={regionId}
                                type="button"
                                onClick={() => onPanelOpen(regionId)}
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
                                    {topIssue.issueType} · {topIssue.status}
                                </p>
                            </button>
                        ))}
                        {regionSummaries.map((summary) => (
                            <button
                                key={summary.regionId}
                                type="button"
                                onClick={() => onRegionClick(summary.regionId)}
                                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-left transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-semibold text-gray-800 dark:text-zinc-200">
                                        {getRegionLabel(summary.regionId)}
                                    </span>
                                    <span className="shrink-0 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                        {summary.maxSeverity}/10
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500">
                                    {summary.activeLogCount} log
                                    {summary.activeLogCount === 1 ? '' : 's'}
                                    {summary.hasRedFlags ? ' · ⚠ flagged' : ''}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </TrackingSection>

            <div className="lg:col-span-2">
                <TrackingSection>
                    <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">
                        Quick log (energy & sleep)
                    </p>
                    <HealthLogForm
                        mode="full"
                        initialDate={new Date().toISOString().slice(0, 10)}
                        onSubmit={onAdd}
                        onCancel={() => onTabChange('body')}
                    />
                </TrackingSection>
            </div>
        </div>
    );
}
