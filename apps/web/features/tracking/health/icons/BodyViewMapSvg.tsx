import type { PointerEventHandler } from 'react';
import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';
import {
    severityColor,
    type BodyIssue,
} from '@/features/tracking/health/lib/bodyIssues';
import { pointsToSurfacePath } from '@/features/tracking/health/lib/bodyViewDrawing';
import RegionPath from '@/features/tracking/health/components/RegionPath';
import type {
    BodyViewProps,
    SurfacePoint,
} from '@/features/tracking/health/types/bodyView';

interface BodyViewMapSvgProps extends Omit<
    BodyViewProps,
    'issues' | 'onSurfaceClick' | 'onSurfaceDrawing'
> {
    surfacePath: string;
    imageLayer: { skeletonX: number; muscleX: number };
    skinPins: BodyIssue[];
    strokePoints: SurfacePoint[];
    onSurfacePointerDown: PointerEventHandler<SVGPathElement>;
    onSurfacePointerMove: PointerEventHandler<SVGPathElement>;
    onSurfacePointerUp: PointerEventHandler<SVGPathElement>;
    onSurfacePointerCancel: PointerEventHandler<SVGPathElement>;
}

const NEUTRAL_LIGHT = '#e5e7eb';

export function BodyViewMapSvg({
    view,
    label,
    geometry,
    activeView,
    visuals,
    surfaceMode,
    selectedRegionId,
    readonly,
    showLabels,
    showSkeleton,
    showMuscles,
    onActivate,
    onHover,
    surfacePath,
    imageLayer,
    skinPins,
    strokePoints,
    onSurfacePointerDown,
    onSurfacePointerMove,
    onSurfacePointerUp,
    onSurfacePointerCancel,
}: BodyViewMapSvgProps) {
    return (
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
                    onPointerDown={onSurfacePointerDown}
                    onPointerMove={onSurfacePointerMove}
                    onPointerUp={onSurfacePointerUp}
                    onPointerCancel={onSurfacePointerCancel}
                    className={readonly ? '' : 'cursor-crosshair outline-none'}
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
                    d={pointsToSurfacePath(strokePoints)}
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
    );
}
