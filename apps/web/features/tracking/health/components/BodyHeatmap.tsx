'use client';

import { useCallback, useMemo } from 'react';
import {
    BODY_ZONE_LABELS,
    type BodyMap,
    type BodyZoneId,
} from '@/features/tracking/health/lib/types';
import { ANTERIOR_ZONES, POSTERIOR_ZONES, type Shape } from './heatmapZones';

const NEUTRAL_LIGHT = '#e5e7eb';
const SORENESS_LOW = '#fef9c3';
const SORENESS_HIGH = '#ea580c';
const INJURY_LOW = '#fce7f3';
const INJURY_HIGH = '#dc2626';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

function lerpHex(from: string, to: string, t: number): string {
    const clamp = Math.max(0, Math.min(1, t));
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return `rgb(${Math.round(a.r + (b.r - a.r) * clamp)}, ${Math.round(a.g + (b.g - a.g) * clamp)}, ${Math.round(a.b + (b.b - a.b) * clamp)})`;
}

function zoneFill(map: BodyMap, zoneId: BodyZoneId): string {
    const entry = map[zoneId];
    if (!entry) return NEUTRAL_LIGHT;
    const t = (entry.intensity - 1) / 9;
    return entry.type === 'injury'
        ? lerpHex(INJURY_LOW, INJURY_HIGH, t)
        : lerpHex(SORENESS_LOW, SORENESS_HIGH, t);
}

interface ZoneShapeProps {
    id: BodyZoneId;
    shape: Shape;
    fill: string;
    readonly: boolean;
    onActivate: (id: BodyZoneId) => void;
}

function ZoneShape({ id, shape, fill, readonly, onActivate }: ZoneShapeProps) {
    const entryLabel = BODY_ZONE_LABELS[id];
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<SVGElement>) => {
            if (readonly) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onActivate(id);
            }
        },
        [id, onActivate, readonly],
    );

    const common = {
        'data-zone-id': id,
        fill,
        role: 'button' as const,
        'aria-label': entryLabel,
        tabIndex: readonly ? -1 : 0,
        onClick: readonly ? undefined : () => onActivate(id),
        onKeyDown: handleKeyDown,
        className: readonly
            ? 'stroke-white/70 dark:stroke-zinc-900/70'
            : 'cursor-pointer stroke-white/70 dark:stroke-zinc-900/70 outline-none transition-[filter] hover:brightness-95 focus-visible:brightness-90',
        strokeWidth: 0.6,
    };

    if (shape.kind === 'ellipse') {
        return (
            <ellipse
                cx={shape.cx}
                cy={shape.cy}
                rx={shape.rx}
                ry={shape.ry}
                {...common}
            />
        );
    }
    return (
        <rect
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={shape.rx ?? 4}
            {...common}
        />
    );
}

function BodyView({
    label,
    zones,
    fills,
    readonly,
    onZoneClick,
}: {
    label: string;
    zones: Array<{ id: BodyZoneId; shape: Shape }>;
    fills: Record<string, string>;
    readonly: boolean;
    onZoneClick: (id: BodyZoneId) => void;
}) {
    return (
        <figure className="flex-1 min-w-0">
            <svg
                viewBox="0 0 100 204"
                className="h-auto w-full"
                role="group"
                aria-label={`${label} body map`}
                preserveAspectRatio="xMidYMid meet"
            >
                {zones.map(({ id, shape }) => (
                    <ZoneShape
                        key={`${label}-${id}`}
                        id={id}
                        shape={shape}
                        fill={fills[id] ?? NEUTRAL_LIGHT}
                        readonly={readonly}
                        onActivate={onZoneClick}
                    />
                ))}
            </svg>
            <figcaption className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                {label}
            </figcaption>
        </figure>
    );
}

interface BodyHeatmapProps {
    bodyMap: BodyMap;
    onZoneClick: (id: BodyZoneId) => void;
    readonly?: boolean;
}

export default function BodyHeatmap({
    bodyMap,
    onZoneClick,
    readonly = false,
}: BodyHeatmapProps) {
    const anteriorFills = useMemo(() => {
        const result: Record<string, string> = {};
        for (const { id } of ANTERIOR_ZONES) result[id] = zoneFill(bodyMap, id);
        return result;
    }, [bodyMap]);

    const posteriorFills = useMemo(() => {
        const result: Record<string, string> = {};
        for (const { id } of POSTERIOR_ZONES)
            result[id] = zoneFill(bodyMap, id);
        return result;
    }, [bodyMap]);

    return (
        <div className="flex items-start gap-3">
            <BodyView
                label="Front"
                zones={ANTERIOR_ZONES}
                fills={anteriorFills}
                readonly={readonly}
                onZoneClick={onZoneClick}
            />
            <BodyView
                label="Back"
                zones={POSTERIOR_ZONES}
                fills={posteriorFills}
                readonly={readonly}
                onZoneClick={onZoneClick}
            />
        </div>
    );
}

export { zoneFill };
