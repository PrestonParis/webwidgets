import type { ViewLayer } from '@/features/view/schemas/viewSchemas';

export function createBaseLayers(): ViewLayer[] {
    return [
        {
            id: 'base-render',
            type: 'base',
            name: 'Rendered content',
            visible: true,
            locked: true,
            opacity: 1,
            zIndex: 0,
            objects: [],
        },
        {
            id: 'annotations',
            type: 'annotation',
            name: 'Annotations',
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 10,
            objects: [],
        },
        {
            id: 'drawings',
            type: 'drawing',
            name: 'Drawing layer',
            visible: true,
            locked: false,
            opacity: 1,
            zIndex: 15,
            objects: [],
        },
        {
            id: 'analysis',
            type: 'analysis',
            name: 'Analysis overlays',
            visible: true,
            locked: false,
            opacity: 0.85,
            zIndex: 20,
            objects: [],
        },
    ];
}

export function toggleLayerVisibility(
    layers: ViewLayer[],
    layerId: string,
): ViewLayer[] {
    return layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
    );
}
