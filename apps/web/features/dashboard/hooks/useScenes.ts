'use client';

import { useCallback, useState } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

export interface Scene {
    id: string;
    name: string;
    createdAt: number;
    layout: WidgetConfig[];
    /** Raw settings map snapshot: widgetId → settings object */
    settingsSnapshot: Record<string, Record<string, unknown>>;
}

const STORAGE_KEY = 'dashboard-scenes';

function loadScenes(): Scene[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Scene[]) : [];
    } catch {
        return [];
    }
}

function saveScenes(scenes: Scene[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
    } catch {}
}

export function useScenes(
    layout: WidgetConfig[],
    onRestoreLayout: (layout: WidgetConfig[]) => void,
) {
    const [scenes, setScenes] = useState<Scene[]>(loadScenes);

    const saveScene = useCallback(
        (name: string) => {
            const scene: Scene = {
                id: `scene-${Date.now()}`,
                name,
                createdAt: Date.now(),
                layout: JSON.parse(JSON.stringify(layout)) as WidgetConfig[],
                settingsSnapshot: {},
            };
            setScenes((prev) => {
                const next = [scene, ...prev];
                saveScenes(next);
                return next;
            });
        },
        [layout],
    );

    const loadScene = useCallback(
        (id: string) => {
            const scene = scenes.find((s) => s.id === id);
            if (!scene) return;
            onRestoreLayout(scene.layout);
        },
        [scenes, onRestoreLayout],
    );

    const deleteScene = useCallback((id: string) => {
        setScenes((prev) => {
            const next = prev.filter((s) => s.id !== id);
            saveScenes(next);
            return next;
        });
    }, []);

    const renameScene = useCallback((id: string, name: string) => {
        setScenes((prev) => {
            const next = prev.map((s) => (s.id === id ? { ...s, name } : s));
            saveScenes(next);
            return next;
        });
    }, []);

    return { scenes, saveScene, loadScene, deleteScene, renameScene };
}
