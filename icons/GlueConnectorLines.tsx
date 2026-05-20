import type { GlueConnector } from '@/features/dashboard/components/GlueConnectors';

interface GlueConnectorLinesProps {
    connectors: GlueConnector[];
    height: number;
}

export function GlueConnectorLines({
    connectors,
    height,
}: GlueConnectorLinesProps) {
    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 5, width: '100%', height }}
            overflow="visible"
        >
            {connectors.map(({ key, x1, y1, x2, y2 }) => (
                <g key={key}>
                    <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(0,0,0,0.12)"
                        strokeWidth={12}
                        strokeLinecap="round"
                    />
                    <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(250,250,249,0.96)"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                    <circle
                        cx={(x1 + x2) / 2}
                        cy={(y1 + y2) / 2}
                        r={4}
                        fill="rgb(251,191,36)"
                        stroke="rgba(0,0,0,0.1)"
                        strokeWidth={1}
                    />
                </g>
            ))}
        </svg>
    );
}
