'use client';

import { ContextEdgeLayerSvg } from '@/features/context/icons/ContextEdgeLayerSvg';
import type { ContextEdgeLayerProps } from '@/features/context/types/context';

export function ContextEdgeLayer(props: ContextEdgeLayerProps) {
    return <ContextEdgeLayerSvg {...props} />;
}
