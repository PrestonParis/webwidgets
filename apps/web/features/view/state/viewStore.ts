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

const AUTOSAVE_KEY = 'webwidgets.view.pdf.annotations.v1';

interface ViewStore {
    activeFile: ViewFileRef | null;
    document: NormalizedViewDocument | null;
    annotations: ViewAnnotation[];
    layers: ViewLayer[];
    zoom: number;
    pan: { x: number; y: number };
    selectedLayerId: string | null;
    lastSavedAt: string | null;
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

function loadSavedAnnotations(): ViewAnnotation[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(AUTOSAVE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as ViewAnnotation[]) : [];
    } catch {
        return [];
    }
}

function saveAnnotations(annotations: ViewAnnotation[]) {
    const savedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(annotations));
    }
    return savedAt;
}

export const useViewStore = create<ViewStore>((set) => ({
    activeFile: null,
    document: null,
    annotations: loadSavedAnnotations(),
    layers: createBaseLayers(),
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedLayerId: null,
    lastSavedAt: null,
    setActiveFile: (activeFile) => set({ activeFile }),
    setDocument: (document) => set({ document }),
    addAnnotation: (annotation) =>
        set((state) => {
            const annotations = [...state.annotations, annotation];
            return { annotations, lastSavedAt: saveAnnotations(annotations) };
        }),
    updateAnnotation: (annotationId, patch) =>
        set((state) => {
            const annotations = state.annotations.map((annotation) =>
                annotation.id === annotationId
                    ? { ...annotation, ...patch }
                    : annotation,
            );
            return { annotations, lastSavedAt: saveAnnotations(annotations) };
        }),
    removeAnnotation: (annotationId) =>
        set((state) => {
            const annotations = state.annotations.filter(
                (annotation) => annotation.id !== annotationId,
            );
            return { annotations, lastSavedAt: saveAnnotations(annotations) };
        }),
    toggleLayer: (layerId) =>
        set((state) => ({
            layers: toggleLayerVisibility(state.layers, layerId),
        })),
    setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(4, zoom)) }),
    setSelectedLayer: (selectedLayerId) => set({ selectedLayerId }),
}));
