'use client';

import { create } from 'zustand';
import type {
    NormalizedViewDocument,
    ViewAnnotation,
    ViewFileRef,
    ViewLayer,
} from '@/features/view/schemas/objectSchemas';
import {
    createBaseLayers,
    toggleLayerVisibility,
} from '@/features/view/layers/layerModel';

interface ViewStore {
    activeFile: ViewFileRef | null;
    document: NormalizedViewDocument | null;
    annotations: ViewAnnotation[];
    layers: ViewLayer[];
    zoom: number;
    pan: { x: number; y: number };
    selectedLayerId: string | null;
    setActiveFile: (file: ViewFileRef | null) => void;
    setDocument: (document: NormalizedViewDocument | null) => void;
    addAnnotation: (annotation: ViewAnnotation) => void;
    updateAnnotation: (
        annotationId: string,
        patch: Partial<ViewAnnotation>,
    ) => void;
    removeAnnotation: (annotationId: string) => void;
    toggleLayer: (layerId: string) => void;
    setZoom: (zoom: number) => void;
    setSelectedLayer: (layerId: string | null) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
    activeFile: null,
    document: null,
    annotations: [],
    layers: createBaseLayers(),
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedLayerId: null,
    setActiveFile: (activeFile) => set({ activeFile }),
    setDocument: (document) => set({ document }),
    addAnnotation: (annotation) =>
        set((state) => ({ annotations: [...state.annotations, annotation] })),
    updateAnnotation: (annotationId, patch) =>
        set((state) => ({
            annotations: state.annotations.map((annotation) =>
                annotation.id === annotationId
                    ? { ...annotation, ...patch }
                    : annotation,
            ),
        })),
    removeAnnotation: (annotationId) =>
        set((state) => ({
            annotations: state.annotations.filter(
                (annotation) => annotation.id !== annotationId,
            ),
        })),
    toggleLayer: (layerId) =>
        set((state) => ({
            layers: toggleLayerVisibility(state.layers, layerId),
        })),
    setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(4, zoom)) }),
    setSelectedLayer: (selectedLayerId) => set({ selectedLayerId }),
}));
