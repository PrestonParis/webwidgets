'use client';

import { GlueConnectorLines } from '@/icons/GlueConnectorLines';

export interface GlueConnector {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface GlueConnectorsProps {
    connectors: GlueConnector[];
    height: number;
}

export function GlueConnectors({ connectors, height }: GlueConnectorsProps) {
    if (connectors.length === 0) return null;
    return <GlueConnectorLines connectors={connectors} height={height} />;
}
