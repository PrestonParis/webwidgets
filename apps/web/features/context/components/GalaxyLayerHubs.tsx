'use client';

import {
    CANVAS_CX,
    CANVAS_CY,
    galaxyHubPosition,
} from '@/features/context/lib/graphBuilder';
import { LAYER_ORDER, LAYER_META } from '@/features/context/lib/contextLayers';

interface GalaxyLayerHubsProps {
    onSelectLayer: (layer: string) => void;
}

export function GalaxyLayerHubs({ onSelectLayer }: GalaxyLayerHubsProps) {
    return (
        <svg
            className="absolute inset-0"
            style={{ width: 1400, height: 1000 }}
            aria-hidden
        >
            {LAYER_ORDER.map((layer, index) => {
                const { x, y } = galaxyHubPosition(index);
                return (
                    <line
                        key={`spoke-${layer}`}
                        x1={CANVAS_CX}
                        y1={CANVAS_CY}
                        x2={x}
                        y2={y}
                        stroke={LAYER_META[layer].color}
                        strokeWidth={1.5}
                        strokeDasharray="3 4"
                        opacity={0.35}
                    />
                );
            })}
            {LAYER_ORDER.map((layer, index) => {
                const { x, y } = galaxyHubPosition(index);
                const meta = LAYER_META[layer];
                return (
                    <g
                        key={layer}
                        transform={`translate(${x}, ${y})`}
                        className="pointer-events-auto cursor-pointer"
                        onClick={(event) => {
                            event.stopPropagation();
                            onSelectLayer(layer);
                        }}
                    >
                        <circle
                            r={28}
                            fill={meta.color}
                            opacity={0.16}
                            stroke={meta.color}
                            strokeWidth={1.5}
                        />
                        <text
                            textAnchor="middle"
                            dy={4}
                            className="fill-zinc-700 text-[11px] font-semibold dark:fill-zinc-200"
                        >
                            {meta.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
