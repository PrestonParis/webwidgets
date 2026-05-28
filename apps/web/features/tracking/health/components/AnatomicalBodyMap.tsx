'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';
import type { TissueType } from '@/features/tracking/health/lib/bodyRegions';
import type {
    InjuryLog,
    InjuryStatus,
} from '@/features/tracking/health/types/health';
import type { BodyIssue } from '@/features/tracking/health/lib/bodyIssues';
import { resolveRegionVisual } from '@/features/tracking/health/lib/visuals/regionVisual';
import { BodyView } from './BodyView';
import { SearchBar } from './SearchBar';
import {
    LayerTogglePanel,
    LAYER_OPTIONS,
    BODY_MAP_LAYERS_KEY,
} from './LayerTogglePanel';
import { PanZoomCanvas } from './PanZoomCanvas';
import {
    FRONT_GEOMETRY,
    DENTAL_GEOMETRY,
    type RegionGeometry,
} from '@/features/tracking/health/lib/visuals/svgFrontPaths';
import {
    BACK_GEOMETRY,
    BONE_FRONT_GEOMETRY,
    BONE_BACK_GEOMETRY,
    TENDON_FRONT_GEOMETRY,
    TENDON_BACK_GEOMETRY,
    NERVE_FRONT_GEOMETRY,
    NERVE_BACK_GEOMETRY,
} from '@/features/tracking/health/lib/visuals/svgBackPaths';

type AnatomyView =
    | 'surface'
    | 'muscle'
    | 'bone'
    | 'nerve'
    | 'tendon'
    | 'tooth'
    | 'general';

export interface AnatomicalBodyMapProps {
    injuryLogs: InjuryLog[];
    selectedRegionId?: string | null;
    onRegionClick: (regionId: string) => void;
    readonly?: boolean;
    showLabels?: boolean;
    filterTissueType?: TissueType | null;
    filterStatus?: InjuryStatus | null;
    className?: string;
    issues?: BodyIssue[];
    heatmapMode?: boolean;
    activeLayers?: Set<string>;
    onLayersChange?: (layers: Set<string>) => void;
    showSearch?: boolean;
    showLayerPanel?: boolean;
    showZoomControls?: boolean;
    onSurfaceClick?: (view: 'front' | 'back', x: number, y: number) => void;
    onSurfaceDrawing?: (
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) => void;
}

const DEFAULT_LAYERS = new Set(['muscle']);

function activeViewFromLayers(layers: Set<string>): AnatomyView {
    const first = Array.from(layers).find((l) =>
        LAYER_OPTIONS.some((o) => o.id === l),
    );
    return (first as AnatomyView | undefined) ?? 'muscle';
}

function geometryForView(
    view: 'front' | 'back',
    activeView: AnatomyView,
): RegionGeometry[] {
    if (activeView === 'surface') return [];
    if (activeView === 'tooth') return view === 'front' ? DENTAL_GEOMETRY : [];
    if (activeView === 'bone')
        return view === 'front' ? BONE_FRONT_GEOMETRY : BONE_BACK_GEOMETRY;
    if (activeView === 'nerve')
        return view === 'front' ? NERVE_FRONT_GEOMETRY : NERVE_BACK_GEOMETRY;
    if (activeView === 'tendon')
        return view === 'front' ? TENDON_FRONT_GEOMETRY : TENDON_BACK_GEOMETRY;
    const base = view === 'front' ? FRONT_GEOMETRY : BACK_GEOMETRY;
    return base.filter((geo) =>
        BODY_REGION_MAP[geo.id]?.supportedTissueTypes.includes(activeView),
    );
}

function passesFilters(
    log: InjuryLog,
    tissue: TissueType | null | undefined,
    status: InjuryStatus | null | undefined,
): boolean {
    if (tissue && log.tissueType !== tissue) return false;
    if (status && log.status !== status) return false;
    return true;
}

function AnatomicalBodyMapBase({
    injuryLogs,
    selectedRegionId,
    onRegionClick,
    readonly = false,
    showLabels = false,
    filterTissueType = null,
    filterStatus = null,
    className,
    issues,
    heatmapMode = false,
    activeLayers: externalLayers,
    onLayersChange,
    showSearch = false,
    showLayerPanel = false,
    showZoomControls = false,
    onSurfaceClick,
    onSurfaceDrawing,
}: AnatomicalBodyMapProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [internalLayers, setInternalLayers] =
        useState<Set<string>>(DEFAULT_LAYERS);

    useEffect(() => {
        if (externalLayers) return;
        const id = window.setTimeout(() => {
            try {
                const raw = localStorage.getItem(BODY_MAP_LAYERS_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw) as string[];
                if (Array.isArray(parsed)) setInternalLayers(new Set(parsed));
            } catch {
                /* ignore */
            }
        }, 0);
        return () => window.clearTimeout(id);
    }, [externalLayers]);

    const activeLayers = externalLayers ?? internalLayers;
    const activeView = activeViewFromLayers(activeLayers);

    const handleLayersChange = useCallback(
        (layers: Set<string>) => {
            if (onLayersChange) {
                onLayersChange(layers);
            } else {
                setInternalLayers(layers);
            }
            try {
                localStorage.setItem(
                    BODY_MAP_LAYERS_KEY,
                    JSON.stringify(Array.from(layers)),
                );
            } catch {
                /* ignore */
            }
        },
        [onLayersChange],
    );

    const filteredLogs = useMemo(
        () =>
            injuryLogs.filter((log) =>
                passesFilters(log, filterTissueType, filterStatus),
            ),
        [injuryLogs, filterTissueType, filterStatus],
    );

    const visuals = useMemo(() => {
        const result: Record<
            string,
            ReturnType<typeof resolveRegionVisual>
        > = {};
        const layersForCalc = new Set<string>([activeView]);
        for (const region of Object.values(BODY_REGION_MAP)) {
            result[region.id] = resolveRegionVisual(
                region.id,
                filteredLogs,
                issues,
                heatmapMode,
                layersForCalc,
            );
        }
        return result;
    }, [filteredLogs, issues, heatmapMode, activeView]);

    const surfaceMode = activeView === 'surface';
    const sharedProps = {
        activeView,
        visuals,
        issues,
        surfaceMode,
        selectedRegionId,
        readonly,
        showLabels,
        showSkeleton: activeView === 'bone',
        showMuscles: activeView === 'muscle',
        onActivate: onRegionClick,
        onSurfaceClick,
        onSurfaceDrawing,
        onHover: setHovered,
    };

    const mapContent = (
        <div className="flex items-start gap-3">
            <BodyView
                view="front"
                label={activeView === 'tooth' ? 'Teeth' : 'Front'}
                geometry={geometryForView('front', activeView)}
                {...sharedProps}
            />
            {activeView !== 'tooth' && (
                <BodyView
                    view="back"
                    label="Back"
                    geometry={geometryForView('back', activeView)}
                    {...sharedProps}
                />
            )}
        </div>
    );

    const hoveredRegion = hovered ? BODY_REGION_MAP[hovered] : undefined;

    return (
        <div className={className}>
            {showSearch && (
                <SearchBar activeView={activeView} onSelect={onRegionClick} />
            )}
            {showZoomControls ? (
                <PanZoomCanvas showZoomControls>{mapContent}</PanZoomCanvas>
            ) : (
                mapContent
            )}
            {(hoveredRegion || showLabels) && (
                <p
                    className="mt-1 min-h-4 text-center text-[11px] font-medium text-gray-600 dark:text-zinc-300"
                    aria-live="polite"
                >
                    {hoveredRegion?.displayName ??
                        (showLabels
                            ? activeView === 'surface'
                                ? 'Draw or tap the skin surface to log a rash, bruise, cut, or irritation'
                                : `Hover or tap a ${activeView} region to log`
                            : '')}
                </p>
            )}
            {showLayerPanel && (
                <LayerTogglePanel
                    activeLayers={new Set([activeView])}
                    onChange={handleLayersChange}
                />
            )}
        </div>
    );
}

const AnatomicalBodyMap = React.memo(AnatomicalBodyMapBase);
export default AnatomicalBodyMap;
