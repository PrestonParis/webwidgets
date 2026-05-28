'use client';

import { useCallback, useEffect, useState } from 'react';
import { creativeExports, creativeTools } from '../constants';
import type { CreativeTool } from '../types/creative';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

export interface ProjectRecord {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    format: string;
    created_at: string;
}

export interface LayerRecord {
    id: string;
    user_id: string;
    project_id: string;
    name: string;
    layer_type: string;
    visible: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string | null;
    layer_order: number;
    created_at: string;
}

export function useCreativeStudio() {
    const [projects, setProjects] = useState<ProjectRecord[]>([]);
    const [layers, setLayers] = useState<LayerRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedLayerId, setSelectedLayerId] = useState('');
    const [activeTool, setActiveTool] = useState<CreativeTool>('select');
    const [zoom, setZoom] = useState(84);
    const [snapToGrid, setSnapToGrid] = useState(true);

    const fetchProjects = useCallback(async () => {
        try {
            const data = await cachedJson<ProjectRecord[]>(
                '/api/creative/projects',
                { ttlMs: 10_000 },
            );
            setProjects(data);
            setSelectedProjectId((prev) => prev ?? data[0]?.id ?? '');
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLayers = useCallback(async (projectId: string) => {
        if (!projectId) return;
        try {
            const res = await fetch(
                `/api/creative/projects/${projectId}/layers`,
            );
            if (res.ok) {
                const data = (await res.json()) as LayerRecord[];
                setLayers(data);
                if (data.length > 0) setSelectedLayerId(data[0]!.id);
            } else {
                setLayers([]);
            }
        } catch {
            setLayers([]);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchProjects();
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [fetchProjects]);

    useEffect(() => {
        if (!selectedProjectId) return;
        const timeoutId = window.setTimeout(() => {
            void fetchLayers(selectedProjectId);
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [selectedProjectId, fetchLayers]);

    const createProject = useCallback(
        async (data: {
            title: string;
            description?: string;
            format?: string;
        }) => {
            const res = await fetch('/api/creative/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create project');
            clearCachedJson('/api/creative/projects');
            const project = (await res.json()) as ProjectRecord;
            setProjects((prev) => [project, ...prev]);
            setSelectedProjectId(project.id);
            setLayers([]);
            return project;
        },
        [],
    );

    const deleteProject = useCallback(
        async (id: string) => {
            await fetch(`/api/creative/projects/${id}`, { method: 'DELETE' });
            clearCachedJson('/api/creative/projects');
            setProjects((prev) => prev.filter((p) => p.id !== id));
            if (selectedProjectId === id) {
                setSelectedProjectId('');
                setLayers([]);
            }
        },
        [selectedProjectId],
    );

    const createLayer = useCallback(
        async (data: {
            name: string;
            layer_type?: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
            color?: string;
        }) => {
            if (!selectedProjectId) throw new Error('No project selected');
            const res = await fetch(
                `/api/creative/projects/${selectedProjectId}/layers`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        layer_order: layers.length,
                    }),
                },
            );
            if (!res.ok) throw new Error('Failed to create layer');
            const layer = (await res.json()) as LayerRecord;
            setLayers((prev) => [...prev, layer]);
            setSelectedLayerId(layer.id);
            return layer;
        },
        [selectedProjectId, layers.length],
    );

    const toggleLayerVisible = useCallback(
        async (id: string) => {
            const layer = layers.find((l) => l.id === id);
            if (!layer || !selectedProjectId) return;
            const res = await fetch(
                `/api/creative/projects/${selectedProjectId}/layers/${id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visible: !layer.visible }),
                },
            );
            if (!res.ok) return;
            const updated = (await res.json()) as LayerRecord;
            setLayers((prev) => prev.map((l) => (l.id === id ? updated : l)));
        },
        [layers, selectedProjectId],
    );

    const toggleLayerLocked = useCallback(
        async (id: string) => {
            const layer = layers.find((l) => l.id === id);
            if (!layer || !selectedProjectId) return;
            const res = await fetch(
                `/api/creative/projects/${selectedProjectId}/layers/${id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locked: !layer.locked }),
                },
            );
            if (!res.ok) return;
            const updated = (await res.json()) as LayerRecord;
            setLayers((prev) => prev.map((l) => (l.id === id ? updated : l)));
        },
        [layers, selectedProjectId],
    );

    const deleteLayer = useCallback(
        async (id: string) => {
            if (!selectedProjectId) return;
            await fetch(
                `/api/creative/projects/${selectedProjectId}/layers/${id}`,
                { method: 'DELETE' },
            );
            setLayers((prev) => prev.filter((l) => l.id !== id));
        },
        [selectedProjectId],
    );

    const selectedLayer =
        layers.find((l) => l.id === selectedLayerId) ?? layers[0] ?? null;
    const selectedProject =
        projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null;

    return {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        layers,
        selectedLayer,
        selectedLayerId,
        setSelectedLayerId,
        loading,
        createProject,
        deleteProject,
        createLayer,
        toggleLayerVisible,
        toggleLayerLocked,
        deleteLayer,
        tools: creativeTools,
        activeTool,
        setActiveTool,
        exports: creativeExports,
        zoom,
        setZoom,
        snapToGrid,
        setSnapToGrid,
    };
}
