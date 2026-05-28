'use client';

import React, { useMemo, useRef, useState } from 'react';
import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';
import {
    severityColor,
    type BodyIssue,
} from '@/features/tracking/health/lib/bodyIssues';
import RegionPath from './RegionPath';
import type { RegionGeometry } from '@/features/tracking/health/lib/visuals/svgFrontPaths';
import {
    VIEW_SURFACE,
    IMAGE_LAYER,
} from '@/features/tracking/health/lib/visuals/svgFrontPaths';
import type { RegionVisual } from '@/features/tracking/health/lib/visuals/regionVisual';

type AnatomyView =
    | 'surface'
    | 'muscle'
    | 'bone'
    | 'nerve'
    | 'tendon'
    | 'tooth'
    | 'general';

const NEUTRAL_LIGHT = '#e5e7eb';

interface BodyViewProps {
    view: 'front' | 'back';
    label: string;
    geometry: RegionGeometry[];
    activeView: AnatomyView;
    visuals: Record<string, RegionVisual>;
    issues?: BodyIssue[];
    surfaceMode: boolean;
    selectedRegionId: string | null | undefined;
    readonly: boolean;
    showLabels: boolean;
    showSkeleton: boolean;
    showMuscles: boolean;
    onActivate: (id: string) => void;
    onSurfaceClick?: (view: 'front' | 'back', x: number, y: number) => void;
    onSurfaceDrawing?: (
        view: 'front' | 'back',
        path: string,
        x: number,
        y: number,
    ) => void;
    onHover: (id: string | null) => void;
}

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
        const path = points
            .map(
                (p, i) =>
                    `${i === 0 ? 'M' : 'L'}${(p.x * 1.2).toFixed(2)} ${(p.y * 2.6).toFixed(2)}`,
            )
            .join(' ');
        const center = points[Math.floor(points.length / 2)] ?? points[0];
        onSurfaceDrawing?.(view, path, center.x, center.y);
        setStrokePoints([]);
    }

    return (
        <figure className="min-w-0 flex-1">
            <svg
                viewBox="0 0 120 260"
                className="h-auto w-full"
                role="group"
                aria-label={`${label} body map`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <clipPath id={`anatomy-surface-${view}`}>
                        <path d={surfacePath} />
                    </clipPath>
                </defs>
                {showSkeleton && (
                    <image
                        href={
                            view === 'front'
                                ? '/assets/anatomy/skeleton-front.svg'
                                : '/assets/anatomy/skeleton-back.svg'
                        }
                        x={imageLayer.skeletonX}
                        y={4}
                        width={84}
                        height={252}
                        opacity={showMuscles ? 0.34 : 0.78}
                        preserveAspectRatio="xMidYMid meet"
                        pointerEvents="none"
                        aria-hidden
                        clipPath={`url(#anatomy-surface-${view})`}
                    />
                )}
                {showMuscles && (
                    <image
                        href="/assets/anatomy/muscles-front-back.svg"
                        x={imageLayer.muscleX}
                        y={8}
                        width={352}
                        height={250}
                        opacity={0.92}
                        preserveAspectRatio="xMinYMid meet"
                        pointerEvents="none"
                        aria-hidden
                        clipPath={`url(#anatomy-surface-${view})`}
                    />
                )}
                {activeView === 'tooth' && (
                    <g aria-hidden pointerEvents="none">
                        <path
                            d="M18 74 C30 54 90 54 102 74 C94 96 74 105 60 105 C46 105 26 96 18 74 Z"
                            fill="#f8c7bf"
                            stroke="#ef9a91"
                            strokeWidth={1.4}
                        />
                        <path
                            d="M18 134 C30 154 90 154 102 134 C94 112 74 103 60 103 C46 103 26 112 18 134 Z"
                            fill="#f8c7bf"
                            stroke="#ef9a91"
                            strokeWidth={1.4}
                        />
                        <path
                            d="M22 82 C36 69 84 69 98 82"
                            fill="none"
                            stroke="#d97167"
                            strokeWidth={1.1}
                        />
                        <path
                            d="M22 126 C36 139 84 139 98 126"
                            fill="none"
                            stroke="#d97167"
                            strokeWidth={1.1}
                        />
                        {geometry.map((geo) => (
                            <path
                                key={`${geo.id}-tooth-visible`}
                                d={geo.d}
                                fill="#fffaf0"
                                stroke="#9ca3af"
                                strokeWidth={0.8}
                                strokeLinejoin="round"
                            />
                        ))}
                        <text
                            x={60}
                            y={63}
                            textAnchor="middle"
                            fontSize={6}
                            fontWeight={700}
                            fill="#7f1d1d"
                        >
                            Upper teeth
                        </text>
                        <text
                            x={60}
                            y={153}
                            textAnchor="middle"
                            fontSize={6}
                            fontWeight={700}
                            fill="#7f1d1d"
                        >
                            Lower teeth
                        </text>
                    </g>
                )}
                <path
                    d={surfacePath}
                    fill="none"
                    className="stroke-transparent"
                    strokeWidth={0}
                    strokeLinejoin="round"
                    aria-hidden
                />
                {geometry.map((geo) => {
                    const region = BODY_REGION_MAP[geo.id];
                    if (!region) return null;
                    const visual = visuals[geo.id] ?? {
                        fill: NEUTRAL_LIGHT,
                        glow: 'none' as const,
                        badge: 0,
                        resolvedOnly: false,
                    };
                    return (
                        <RegionPath
                            key={`${view}-${geo.id}`}
                            region={region}
                            geometry={geo}
                            visual={visual}
                            selected={selectedRegionId === geo.id}
                            readonly={readonly}
                            showLabels={showLabels}
                            onActivate={onActivate}
                            onHover={onHover}
                        />
                    );
                })}
                {surfaceMode && (
                    <path
                        d={surfacePath}
                        fill="transparent"
                        stroke="#14b8a6"
                        strokeDasharray="2 2"
                        strokeWidth={0.8}
                        role="button"
                        tabIndex={readonly ? -1 : 0}
                        aria-label={`Place surface marker on ${label.toLowerCase()} view`}
                        onPointerDown={handleSurfacePointerDown}
                        onPointerMove={handleSurfacePointerMove}
                        onPointerUp={handleSurfacePointerUp}
                        onPointerCancel={() => {
                            drawingRef.current = false;
                            setStrokePoints([]);
                        }}
                        className={
                            readonly ? '' : 'cursor-crosshair outline-none'
                        }
                    >
                        <title>
                            Draw or click anywhere on the skin surface to log a
                            rash, bruise, cut, or irritation
                        </title>
                    </path>
                )}
                {activeView === 'nerve' && (
                    <g pointerEvents="none" aria-hidden>
                        {geometry.map((geo) => (
                            <path
                                key={`${geo.id}-visible`}
                                d={geo.d}
                                fill="none"
                                stroke="#38bdf8"
                                strokeDasharray="2 1.5"
                                strokeWidth={0.9}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.9}
                            />
                        ))}
                    </g>
                )}
                {activeView === 'tendon' && (
                    <g pointerEvents="none" aria-hidden>
                        {geometry.map((geo) => (
                            <path
                                key={`${geo.id}-visible`}
                                d={geo.d}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={1.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.95}
                            />
                        ))}
                    </g>
                )}
                {strokePoints.length > 1 && (
                    <path
                        d={strokePoints
                            .map(
                                (p, i) =>
                                    `${i === 0 ? 'M' : 'L'}${(p.x * 1.2).toFixed(2)} ${(p.y * 2.6).toFixed(2)}`,
                            )
                            .join(' ')}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        pointerEvents="none"
                    />
                )}
                {skinPins.map((issue) =>
                    issue.skinDrawing ? (
                        <path
                            key={`${issue.id}-drawing`}
                            d={issue.skinDrawing}
                            fill="none"
                            stroke={severityColor(issue.severity)}
                            strokeWidth={2.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity={0.9}
                            pointerEvents="none"
                        />
                    ) : null,
                )}
                {skinPins.map((issue) => (
                    <g key={issue.id} pointerEvents="none" aria-hidden>
                        <circle
                            cx={(issue.skinX ?? 0) * 1.2}
                            cy={(issue.skinY ?? 0) * 2.6}
                            r={2.6}
                            fill={severityColor(issue.severity)}
                            stroke="#fff"
                            strokeWidth={0.7}
                        />
                        <circle
                            cx={(issue.skinX ?? 0) * 1.2}
                            cy={(issue.skinY ?? 0) * 2.6}
                            r={4.6}
                            fill="none"
                            stroke={severityColor(issue.severity)}
                            strokeOpacity={0.35}
                            strokeWidth={1}
                        />
                    </g>
                ))}
            </svg>
            <figcaption className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                {label}
            </figcaption>
        </figure>
    );
}
