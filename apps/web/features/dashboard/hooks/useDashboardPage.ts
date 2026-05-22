import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDashboardLayout } from './useDashboardLayout';
import { useDashboardMode } from './useDashboardMode';
import { useGreeting } from './useGreeting';
import { useTrackers } from './useTrackers';
import { useFolderActions } from './useFolderActions';
import { useBackground } from '@/features/settings/hooks/useBackground';
import { useScenes } from './useScenes';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

export interface DashboardPageState {
    firstName: string | null;
    trackers: import('@/features/recovery/types/recovery').Tracker[] | null;
    layout: WidgetConfig[];
    updateLayout: (next: WidgetConfig[]) => void;
    toggleVisibility: (id: string) => void;
    ready: boolean;
    handleReset: (id: string, newStart: string) => Promise<void>;
    greeting: string | null;
    mode: 'grid' | 'free';
    setMode: (m: 'grid' | 'free') => void;
    snapRule: import('@/features/dashboard/types/dashboard').SnapRule;
    setSnapRule: (
        r: import('@/features/dashboard/types/dashboard').SnapRule,
    ) => void;
    activeFolderId: string | null;
    setActiveFolderId: (id: string | null) => void;
    addFolder: () => void;
    renameFolder: (id: string, name: string) => void;
    deleteFolder: (id: string) => void;
    removeFromFolder: (id: string) => void;
    moveToBucket: (id: string) => void;
    restoreFromBucket: (id: string) => void;
    unpresentWidget: (id: string) => void;
    restoreUnpresented: (id: string) => void;
    folderStack: string[];
    setFolderStack: Dispatch<SetStateAction<string[]>>;
    bgStyle: React.CSSProperties;
    bgIsDefault: boolean;
    widgetEntries: { id: string; type: string }[];
    scenes: ReturnType<typeof useScenes>['scenes'];
    saveScene: ReturnType<typeof useScenes>['saveScene'];
    loadScene: ReturnType<typeof useScenes>['loadScene'];
    deleteScene: ReturnType<typeof useScenes>['deleteScene'];
    renameScene: ReturnType<typeof useScenes>['renameScene'];
}

export function useDashboardPage(): DashboardPageState {
    const { firstName } = useAuth();
    const { trackers, handleReset } = useTrackers();
    const { layout, updateLayout, toggleVisibility, ready } =
        useDashboardLayout(trackers);
    const greeting = useGreeting(firstName);
    const { mode, setMode, snapRule, setSnapRule } = useDashboardMode();
    const folderActions = useFolderActions(layout, updateLayout);
    const [folderStack, setFolderStack] = useState<string[]>([]);
    const { style: bgStyle, isDefault: bgIsDefault } = useBackground();

    // Stable widget entries — only changes when widget IDs or types actually change.
    // Prevents WidgetSettingsContext from re-fetching on every position update.
    const widgetKey = layout.map((w) => `${w.id}:${w.type}`).join(',');
    const [stableWidgetEntries, setStableWidgetEntries] = useState(() =>
        layout.map((w) => ({ id: w.id, type: w.type })),
    );
    const [prevWidgetKey, setPrevWidgetKey] = useState(widgetKey);
    if (widgetKey !== prevWidgetKey) {
        setPrevWidgetKey(widgetKey);
        setStableWidgetEntries(layout.map((w) => ({ id: w.id, type: w.type })));
    }

    const { scenes, saveScene, loadScene, deleteScene, renameScene } =
        useScenes(layout, updateLayout);

    return {
        firstName,
        trackers,
        layout,
        updateLayout,
        toggleVisibility,
        ready,
        handleReset,
        greeting,
        mode,
        setMode,
        snapRule,
        setSnapRule,
        ...folderActions,
        folderStack,
        setFolderStack,
        bgStyle,
        bgIsDefault,
        widgetEntries: stableWidgetEntries,
        scenes,
        saveScene,
        loadScene,
        deleteScene,
        renameScene,
    };
}
