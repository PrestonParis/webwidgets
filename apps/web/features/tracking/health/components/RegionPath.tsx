'use client';

import React, { useCallback } from 'react';
import type { BodyRegion } from '@/features/tracking/health/lib/bodyRegions';
import type { RegionGeometry } from '@/features/tracking/health/lib/visuals/svgFrontPaths';
import type { RegionVisual } from '@/features/tracking/health/lib/visuals/regionVisual';

interface RegionPathProps {
    region: BodyRegion;
    geometry: RegionGeometry;
    visual: RegionVisual;
    selected: boolean;
    readonly: boolean;
    showLabels: boolean;
    onActivate: (id: string) => void;
    onHover: (id: string | null) => void;
}

const RegionPath = React.memo(function RegionPath({
    region,
    geometry,
    visual,
    selected,
    readonly,
    showLabels,
    onActivate,
    onHover,
}: RegionPathProps) {
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<SVGPathElement>) => {
            if (readonly) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onActivate(region.id);
            }
        },
        [readonly, onActivate, region.id],
    );

    const glowColor =
        visual.glow === 'injury'
            ? '#dc2626'
            : visual.glow === 'soreness'
              ? '#ea580c'
              : visual.glow === 'issue'
                ? '#6366f1'
                : undefined;

    const stroke = selected
        ? '#4f46e5'
        : (glowColor ?? 'rgba(255,255,255,0.7)');
    const strokeWidth = selected ? 1.6 : visual.glow !== 'none' ? 1 : 0.5;
    const isMarked = visual.glow !== 'none' || visual.resolvedOnly || selected;
    const isLineRegion =
        region.supportedTissueTypes.includes('nerve') ||
        region.supportedTissueTypes.includes('tendon');

    return (
        <g>
            <path
                id={geometry.id}
                data-region-id={region.id}
                d={geometry.d}
                fill={visual.fill}
                fillOpacity={isLineRegion ? 0 : isMarked ? 0.58 : 0.001}
                stroke={stroke}
                strokeOpacity={
                    isLineRegion ? (isMarked ? 1 : 0.001) : isMarked ? 1 : 0
                }
                strokeWidth={isLineRegion ? 8 : strokeWidth}
                pointerEvents={isLineRegion ? 'stroke' : 'auto'}
                role="button"
                tabIndex={readonly ? -1 : 0}
                aria-label={region.displayName}
                aria-pressed={selected}
                onClick={readonly ? undefined : () => onActivate(region.id)}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => onHover(region.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(region.id)}
                onBlur={() => onHover(null)}
                className={
                    readonly
                        ? 'outline-none'
                        : 'cursor-pointer outline-none transition-[filter,opacity] duration-150 hover:brightness-110 hover:opacity-90 focus-visible:brightness-110'
                }
                style={
                    glowColor && visual.glow !== 'none'
                        ? { filter: `drop-shadow(0 0 1.5px ${glowColor})` }
                        : undefined
                }
            >
                {!showLabels && <title>{region.displayName}</title>}
            </path>
            {visual.badge > 0 && (
                <g aria-hidden pointerEvents="none">
                    <circle
                        cx={geometry.badge.x}
                        cy={geometry.badge.y}
                        r={3.4}
                        fill={
                            visual.glow === 'injury'
                                ? '#b91c1c'
                                : visual.glow === 'issue'
                                  ? '#4f46e5'
                                  : '#c2410c'
                        }
                        stroke="#fff"
                        strokeWidth={0.6}
                    />
                    <text
                        x={geometry.badge.x}
                        y={geometry.badge.y + 1.5}
                        textAnchor="middle"
                        fontSize={4}
                        fontWeight={700}
                        fill="#fff"
                    >
                        {visual.badge}
                    </text>
                </g>
            )}
        </g>
    );
});

export default RegionPath;
