import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';
import {
    getRegionLogs,
    getSeverityColor,
} from '@/features/tracking/health/lib/analytics';
import type {
    InjuryLog,
    InjuryStatus,
} from '@/features/tracking/health/lib/types';
import {
    severityColor,
    type BodyIssue,
} from '@/features/tracking/health/lib/bodyIssues';
import { SORENESS_TYPES } from './svgFrontPaths';

export interface RegionVisual {
    fill: string;
    glow: 'none' | 'soreness' | 'injury' | 'issue';
    badge: number;
    resolvedOnly: boolean;
}

const NEUTRAL_LIGHT = '#e5e7eb';
const NEUTRAL_DARK = '#f3f4f6';
const RESOLVED_TINT = '#bbf7d0';
const UNRESOLVED: InjuryStatus[] = ['active', 'improving', 'chronic'];

function isSorenessLog(injuryType: string): boolean {
    return SORENESS_TYPES.has(injuryType.toLowerCase());
}

function resolveRegionVisualFromLogs(logs: InjuryLog[]): RegionVisual {
    if (logs.length === 0)
        return {
            fill: NEUTRAL_LIGHT,
            glow: 'none',
            badge: 0,
            resolvedOnly: false,
        };
    const active = logs.filter((log) => UNRESOLVED.includes(log.status));
    if (active.length === 0)
        return {
            fill: RESOLVED_TINT,
            glow: 'none',
            badge: 0,
            resolvedOnly: true,
        };
    let maxSeverity = 0;
    let anyInjury = false;
    for (const log of active) {
        if (log.severity > maxSeverity) maxSeverity = log.severity;
        if (!isSorenessLog(log.injuryType)) anyInjury = true;
    }
    const kind = anyInjury ? 'injury' : 'soreness';
    return {
        fill: getSeverityColor(kind, maxSeverity),
        glow: kind,
        badge: active.length,
        resolvedOnly: false,
    };
}

function resolveRegionVisualFromIssues(
    issues: BodyIssue[],
    heatmap: boolean,
): RegionVisual {
    if (issues.length === 0)
        return {
            fill: heatmap ? '#e5e7eb' : NEUTRAL_LIGHT,
            glow: 'none',
            badge: 0,
            resolvedOnly: false,
        };
    const active = issues.filter((i) => i.status !== 'resolved');
    if (active.length === 0)
        return {
            fill: RESOLVED_TINT,
            glow: 'none',
            badge: 0,
            resolvedOnly: true,
        };
    const maxSeverity = Math.max(...active.map((i) => i.severity));
    const baseColor = severityColor(maxSeverity);
    return {
        fill: heatmap ? `${baseColor}99` : baseColor,
        glow: 'issue',
        badge: active.length,
        resolvedOnly: false,
    };
}

export function resolveRegionVisual(
    regionId: string,
    injuryLogs: InjuryLog[],
    issues: BodyIssue[] | undefined,
    heatmapMode: boolean,
    activeLayers: Set<string> | undefined,
): RegionVisual {
    const region = BODY_REGION_MAP[regionId];
    if (activeLayers && activeLayers.size > 0 && region) {
        const regionTissues = region.supportedTissueTypes as string[];
        const hasActiveLayer = regionTissues.some((t) => activeLayers.has(t));
        if (!hasActiveLayer)
            return {
                fill: NEUTRAL_DARK,
                glow: 'none',
                badge: 0,
                resolvedOnly: false,
            };
    }
    if (issues !== undefined) {
        const regionIssues = issues.filter((i) => i.regionId === regionId);
        return resolveRegionVisualFromIssues(regionIssues, heatmapMode);
    }
    const logs = getRegionLogs(injuryLogs, regionId);
    return resolveRegionVisualFromLogs(logs);
}
