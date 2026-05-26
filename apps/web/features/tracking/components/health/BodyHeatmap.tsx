'use client';

import { useCallback, useMemo } from 'react';
import {
    BODY_ZONE_LABELS,
    type BodyMap,
    type BodyZoneId,
} from '@/features/tracking/lib/health/types';

// ─── color logic ────────────────────────────────────────────────────────────

const NEUTRAL_LIGHT = '#e5e7eb';

/** Linear interpolation between two hex colors. t in [0, 1]. */
function lerpHex(from: string, to: string, t: number): string {
    const clamp = Math.max(0, Math.min(1, t));
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const r = Math.round(a.r + (b.r - a.r) * clamp);
    const g = Math.round(a.g + (b.g - a.g) * clamp);
    const bl = Math.round(a.b + (b.b - a.b) * clamp);
    return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

// soreness: yellow (1) → orange (10); injury: pink (1) → crimson (10)
const SORENESS_LOW = '#fef9c3';
const SORENESS_HIGH = '#ea580c';
const INJURY_LOW = '#fce7f3';
const INJURY_HIGH = '#dc2626';

function zoneFill(map: BodyMap, zoneId: BodyZoneId): string {
    const entry = map[zoneId];
    if (!entry) return NEUTRAL_LIGHT;
    const t = (entry.intensity - 1) / 9;
    return entry.type === 'injury'
        ? lerpHex(INJURY_LOW, INJURY_HIGH, t)
        : lerpHex(SORENESS_LOW, SORENESS_HIGH, t);
}

// ─── zone geometry ──────────────────────────────────────────────────────────
// viewBox is 100 x 200 for each silhouette.

type Shape =
    | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
    | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number };

const ANTERIOR_ZONES: Array<{ id: BodyZoneId; shape: Shape }> = [
    { id: 'head', shape: { kind: 'ellipse', cx: 50, cy: 15, rx: 12, ry: 14 } },
    { id: 'neck', shape: { kind: 'rect', x: 44, y: 28, w: 12, h: 8, rx: 3 } },
    {
        id: 'left-shoulder',
        shape: { kind: 'ellipse', cx: 26, cy: 42, rx: 9, ry: 9 },
    },
    {
        id: 'right-shoulder',
        shape: { kind: 'ellipse', cx: 74, cy: 42, rx: 9, ry: 9 },
    },
    { id: 'chest', shape: { kind: 'rect', x: 33, y: 38, w: 34, h: 26, rx: 6 } },
    {
        id: 'left-upper-arm',
        shape: { kind: 'rect', x: 16, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'right-upper-arm',
        shape: { kind: 'rect', x: 73, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'abdomen',
        shape: { kind: 'rect', x: 35, y: 65, w: 30, h: 26, rx: 6 },
    },
    {
        id: 'left-forearm',
        shape: { kind: 'rect', x: 13, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'right-forearm',
        shape: { kind: 'rect', x: 77, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'left-hand',
        shape: { kind: 'ellipse', cx: 17, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'right-hand',
        shape: { kind: 'ellipse', cx: 83, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'left-hip',
        shape: { kind: 'ellipse', cx: 40, cy: 96, rx: 9, ry: 7 },
    },
    {
        id: 'right-hip',
        shape: { kind: 'ellipse', cx: 60, cy: 96, rx: 9, ry: 7 },
    },
    {
        id: 'left-quad',
        shape: { kind: 'rect', x: 32, y: 102, w: 15, h: 38, rx: 6 },
    },
    {
        id: 'right-quad',
        shape: { kind: 'rect', x: 53, y: 102, w: 15, h: 38, rx: 6 },
    },
    {
        id: 'left-knee',
        shape: { kind: 'ellipse', cx: 39, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'right-knee',
        shape: { kind: 'ellipse', cx: 61, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'left-shin',
        shape: { kind: 'rect', x: 33, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'right-shin',
        shape: { kind: 'rect', x: 54, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'left-ankle',
        shape: { kind: 'ellipse', cx: 39, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'right-ankle',
        shape: { kind: 'ellipse', cx: 61, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'left-foot',
        shape: { kind: 'ellipse', cx: 39, cy: 196, rx: 7, ry: 4 },
    },
    {
        id: 'right-foot',
        shape: { kind: 'ellipse', cx: 61, cy: 196, rx: 7, ry: 4 },
    },
];

const POSTERIOR_ZONES: Array<{ id: BodyZoneId; shape: Shape }> = [
    { id: 'head', shape: { kind: 'ellipse', cx: 50, cy: 15, rx: 12, ry: 14 } },
    { id: 'neck', shape: { kind: 'rect', x: 44, y: 28, w: 12, h: 8, rx: 3 } },
    // mirrored: anterior left-shoulder is on viewer's left; posterior right-shoulder is on viewer's left
    {
        id: 'right-shoulder',
        shape: { kind: 'ellipse', cx: 26, cy: 42, rx: 9, ry: 9 },
    },
    {
        id: 'left-shoulder',
        shape: { kind: 'ellipse', cx: 74, cy: 42, rx: 9, ry: 9 },
    },
    {
        id: 'upper-back',
        shape: { kind: 'rect', x: 33, y: 38, w: 34, h: 26, rx: 6 },
    },
    {
        id: 'right-upper-arm',
        shape: { kind: 'rect', x: 16, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'left-upper-arm',
        shape: { kind: 'rect', x: 73, y: 48, w: 11, h: 26, rx: 5 },
    },
    {
        id: 'lower-back',
        shape: { kind: 'rect', x: 35, y: 65, w: 30, h: 26, rx: 6 },
    },
    {
        id: 'right-forearm',
        shape: { kind: 'rect', x: 13, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'left-forearm',
        shape: { kind: 'rect', x: 77, y: 75, w: 10, h: 24, rx: 5 },
    },
    {
        id: 'right-hand',
        shape: { kind: 'ellipse', cx: 17, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'left-hand',
        shape: { kind: 'ellipse', cx: 83, cy: 105, rx: 6, ry: 7 },
    },
    {
        id: 'right-glute',
        shape: { kind: 'ellipse', cx: 40, cy: 98, rx: 10, ry: 8 },
    },
    {
        id: 'left-glute',
        shape: { kind: 'ellipse', cx: 60, cy: 98, rx: 10, ry: 8 },
    },
    {
        id: 'right-hamstring',
        shape: { kind: 'rect', x: 32, y: 106, w: 15, h: 36, rx: 6 },
    },
    {
        id: 'left-hamstring',
        shape: { kind: 'rect', x: 53, y: 106, w: 15, h: 36, rx: 6 },
    },
    {
        id: 'right-knee',
        shape: { kind: 'ellipse', cx: 39, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'left-knee',
        shape: { kind: 'ellipse', cx: 61, cy: 146, rx: 7, ry: 6 },
    },
    {
        id: 'right-calf',
        shape: { kind: 'rect', x: 33, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'left-calf',
        shape: { kind: 'rect', x: 54, y: 152, w: 13, h: 32, rx: 5 },
    },
    {
        id: 'right-ankle',
        shape: { kind: 'ellipse', cx: 39, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'left-ankle',
        shape: { kind: 'ellipse', cx: 61, cy: 188, rx: 6, ry: 5 },
    },
    {
        id: 'right-foot',
        shape: { kind: 'ellipse', cx: 39, cy: 196, rx: 7, ry: 4 },
    },
    {
        id: 'left-foot',
        shape: { kind: 'ellipse', cx: 61, cy: 196, rx: 7, ry: 4 },
    },
];

// ─── zone shape renderer ────────────────────────────────────────────────────

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

// ─── view ───────────────────────────────────────────────────────────────────

interface BodyViewProps {
    label: string;
    zones: Array<{ id: BodyZoneId; shape: Shape }>;
    fills: Record<string, string>;
    readonly: boolean;
    onZoneClick: (id: BodyZoneId) => void;
}

function BodyView({
    label,
    zones,
    fills,
    readonly,
    onZoneClick,
}: BodyViewProps) {
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

// ─── main ───────────────────────────────────────────────────────────────────

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
