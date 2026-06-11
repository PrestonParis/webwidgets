'use client';

import React, { useMemo, useRef, useState } from 'react';
import { BodyViewMapSvg } from '@/features/tracking/health/icons/BodyViewMapSvg';
import { pointsToSurfacePath } from '@/features/tracking/health/lib/bodyViewDrawing';
import {
    VIEW_SURFACE,
    IMAGE_LAYER,
} from '@/features/tracking/health/lib/visuals/svgFrontPaths';
import type { BodyViewProps } from '@/features/tracking/health/types/bodyView';

export function BodyView({
    view,
    label,
    geometry,
    activeView,
    visuals,
    issues,
    surfaceMode,
    selectedRegionId,
    readonly,
    showLabels,
    showSkeleton,
    showMuscles,
    onActivate,
    onSurfaceClick,
    onSurfaceDrawing,
    onHover,
}: BodyViewProps) {
    const [strokePoints, setStrokePoints] = useState<
        Array<{ x: number; y: number }>
    >([]);
    const drawingRef = useRef(false);
    const surfacePath = VIEW_SURFACE[view];
    const imageLayer = IMAGE_LAYER[view];
    const skinPins = useMemo(
        () =>
            (issues ?? []).filter(
                (issue) =>
                    issue.regionType === 'surface' &&
                    issue.skinX !== undefined &&
                    issue.skinY !== undefined &&
                    issue.regionId.includes(`skin-${view}-`),
            ),
        [issues, view],
    );

    function pointerToPercent(event: React.PointerEvent<SVGPathElement>) {
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        };
    }

    function handleSurfacePointerDown(
        event: React.PointerEvent<SVGPathElement>,
    ) {
        if (readonly || !surfaceMode) return;
        const point = pointerToPercent(event);
        if (!point) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drawingRef.current = true;
        setStrokePoints([point]);
    }

    function handleSurfacePointerMove(
        event: React.PointerEvent<SVGPathElement>,
    ) {
        if (!drawingRef.current) return;
        const point = pointerToPercent(event);
        if (!point) return;
        event.preventDefault();
        setStrokePoints((prev) => [...prev, point]);
    }

    function handleSurfacePointerUp(event: React.PointerEvent<SVGPathElement>) {
        if (!drawingRef.current) return;
        const points = strokePoints;
        drawingRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        if (points.length <= 2) {
            const point = points[0] ?? pointerToPercent(event);
            if (point && onSurfaceClick) onSurfaceClick(view, point.x, point.y);
            setStrokePoints([]);
            return;
        }
        const path = pointsToSurfacePath(points);
        const center = points[Math.floor(points.length / 2)] ?? points[0];
        if (!center) return;
        onSurfaceDrawing?.(view, path, center.x, center.y);
        setStrokePoints([]);
    }

    return (
        <figure className="min-w-0 flex-1">
            <BodyViewMapSvg
                view={view}
                label={label}
                geometry={geometry}
                activeView={activeView}
                visuals={visuals}
                surfaceMode={surfaceMode}
                selectedRegionId={selectedRegionId}
                readonly={readonly}
                showLabels={showLabels}
                showSkeleton={showSkeleton}
                showMuscles={showMuscles}
                onActivate={onActivate}
                onHover={onHover}
                surfacePath={surfacePath}
                imageLayer={imageLayer}
                skinPins={skinPins}
                strokePoints={strokePoints}
                onSurfacePointerDown={handleSurfacePointerDown}
                onSurfacePointerMove={handleSurfacePointerMove}
                onSurfacePointerUp={handleSurfacePointerUp}
                onSurfacePointerCancel={() => {
                    drawingRef.current = false;
                    setStrokePoints([]);
                }}
            />
            <figcaption className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                {label}
            </figcaption>
        </figure>
    );
}
