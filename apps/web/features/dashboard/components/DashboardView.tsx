'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/features/ui/components/Header';
import DashboardGrid from './DashboardGrid';
import FreeCanvas from './FreeCanvas';
import FolderSubScreen from './FolderSubScreen';
import RecoverySubScreen from '@/features/recovery/components/RecoverySubScreen';
import { SnapRuleBar } from './SnapRuleBar';
import Footer from '@/features/ui/components/Footer';
import { FloatingBucket } from './FloatingBucket';
import { WidgetSettingsProvider } from '@/features/widgets/context/WidgetSettingsContext';
import type {
    WidgetConfig,
    WidgetType,
    DashboardGridProps,
} from '@/features/dashboard/types/dashboard';
import type { Tracker } from '@/features/recovery/types/recovery';
import type { SnapRule } from '@/features/dashboard/types/dashboard';
import { buildDefaultLayout } from '@/features/dashboard/lib/dashboardLayout';
import { DashboardHeaderBar } from './DashboardHeaderBar';
import { SimplifiedDashboard } from './SimplifiedDashboard';
import type { Scene } from '@/features/dashboard/hooks/useScenes';
import { useDashboardPage } from '@/features/dashboard/hooks/useDashboardPage';
import { useAccessibility } from '@/features/accessibility/components/AccessibilityContext';
import { useDashboardSnapshot } from '@/features/dashboard/hooks/useDashboardSnapshot';
import { DashboardSnapshotProvider } from '@/features/dashboard/lib/DashboardSnapshotContext';
import { DashboardRuntimeProvider } from '@/features/dashboard/runtime/DashboardRuntimeProvider';
import type { Dispatch, SetStateAction } from 'react';

// ─── sub-views ────────────────────────────────────────────────────────────────

interface FolderViewProps {
    activeFolder: WidgetConfig;
    folderStack: string[];
    setFolderStack: Dispatch<SetStateAction<string[]>>;
    setActiveFolderId: (id: string | null) => void;
    layout: WidgetConfig[];
    updateLayout: (next: WidgetConfig[]) => void;
    removeFromFolder: (id: string) => void;
    renameFolder: (id: string, name: string) => void;
    deleteFolder: (id: string) => void;
    toggleVisibility: (id: string) => void;
    handleReset: (id: string, newStart: string) => Promise<void>;
    pushHistory: () => void;
}

function FolderView({
    activeFolder,
    folderStack,
    setFolderStack,
    setActiveFolderId,
    layout,
    updateLayout,
    removeFromFolder,
    renameFolder,
    deleteFolder,
    toggleVisibility,
    handleReset,
    pushHistory,
}: FolderViewProps) {
    function addAllToMain() {
        const widgetsInFolder = layout.filter(
            (w) => w.containerId === activeFolder.id,
        );
        if (widgetsInFolder.length === 0) return;
        pushHistory();
        const maxOrder = layout
            .filter((w) => w.containerId === 'main')
            .reduce((m, w) => Math.max(m, w.order), -1);
        updateLayout(
            layout.map((w, i) => {
                if (w.containerId !== activeFolder.id) return w;
                return {
                    ...w,
                    containerId: 'main',
                    order: maxOrder + 1 + i,
                };
            }),
        );
    }

    return (
        <FolderSubScreen
            folder={activeFolder}
            layout={layout}
            onBack={() => {
                if (folderStack.length > 0) {
                    setFolderStack((s) => s.slice(0, -1));
                    if (folderStack.length === 1) setActiveFolderId(null);
                } else setActiveFolderId(null);
            }}
            onOpenFolder={(id) => {
                setActiveFolderId(id);
                setFolderStack((s) => [...s, id]);
            }}
            onLayoutChange={updateLayout}
            onRemoveFromFolder={removeFromFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onToggleVisible={toggleVisibility}
            onReset={(id, newStart) => {
                void handleReset(id, newStart);
            }}
            onAddAllToMain={addAllToMain}
        />
    );
}

interface GridViewProps extends DashboardGridProps {
    greeting: string | null;
    firstName: string | null;
    onAddFolder: () => void;
    mode: 'grid' | 'free';
    onModeChange: (m: 'grid' | 'free') => void;
    onAddWidget: (type: string) => void;
    onRestoreUnpresented: (id: string) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onArchiveWidgets: (ids: string[]) => void;
    onRemoveWidgets: (ids: string[]) => void;
    scenes: Scene[];
    onSaveScene: (name: string) => void;
    onLoadScene: (id: string) => void;
    onDeleteScene: (id: string) => void;
    onRenameScene: (id: string, name: string) => void;
    onResetLayout: () => void;
    snapRule: SnapRule;
    onSnapRuleChange: (r: SnapRule) => void;
    ready: boolean;
    fullscreen: boolean;
    onToggleFullscreen: () => void;
    simplified?: boolean;
    onAddTracker?: (tracker: Tracker) => void;
    onAddAllTrackers?: (trackers: Tracker[]) => void;
}

function GridView({
    greeting,
    firstName,
    onAddFolder,
    mode,
    onModeChange,
    layout,
    onAddWidget,
    onRestoreUnpresented,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onArchiveWidgets,
    onRemoveWidgets,
    scenes,
    onSaveScene,
    onLoadScene,
    onDeleteScene,
    onRenameScene,
    onResetLayout,
    snapRule,
    onSnapRuleChange,
    ready,
    fullscreen,
    onToggleFullscreen,
    simplified = false,
    onAddTracker,
    onAddAllTrackers,
    ...gridProps
}: GridViewProps) {
    // 1D mode forces grid layout — free canvas is not compatible
    const effectiveMode = simplified ? 'grid' : mode;

    return (
        <>
            <DashboardHeaderBar
                greeting={greeting}
                firstName={firstName}
                onAddFolder={onAddFolder}
                mode={effectiveMode}
                onModeChange={onModeChange}
                layout={layout}
                onAddWidget={onAddWidget}
                onRestoreUnpresented={onRestoreUnpresented}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={onUndo}
                onRedo={onRedo}
                onArchiveWidgets={onArchiveWidgets}
                onRemoveWidgets={onRemoveWidgets}
                scenes={scenes}
                onSaveScene={onSaveScene}
                onLoadScene={onLoadScene}
                onDeleteScene={onDeleteScene}
                onRenameScene={onRenameScene}
                onResetLayout={onResetLayout}
                fullscreen={fullscreen}
                onToggleFullscreen={onToggleFullscreen}
                simplified={simplified}
                {...(onAddTracker !== undefined ? { onAddTracker } : {})}
                {...(onAddAllTrackers !== undefined
                    ? { onAddAllTrackers }
                    : {})}
            />
            {!simplified && effectiveMode === 'free' && ready && (
                <div className="mb-4">
                    <SnapRuleBar
                        snapRule={snapRule}
                        onChange={onSnapRuleChange}
                    />
                </div>
            )}
            {ready ? (
                simplified ? (
                    <SimplifiedDashboard
                        layout={layout}
                        onLayoutChange={gridProps.onLayoutChange}
                        onToggleVisible={gridProps.onToggleVisible}
                        onReset={gridProps.onReset}
                    />
                ) : effectiveMode === 'free' ? (
                    <FreeCanvas
                        layout={layout}
                        {...gridProps}
                        snapRule={snapRule}
                    />
                ) : (
                    <DashboardGrid layout={layout} {...gridProps} />
                )
            ) : (
                <div className="flex justify-center py-24">
                    <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const { oneDimensionalMode } = useAccessibility();
    const {
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
        activeFolderId,
        setActiveFolderId,
        addFolder,
        renameFolder,
        deleteFolder,
        removeFromFolder,
        moveToBucket,
        restoreFromBucket,
        unpresentWidget,
        restoreUnpresented,
        folderStack,
        setFolderStack,
        bgStyle,
        bgIsDefault,
        widgetEntries,
        scenes,
        saveScene,
        loadScene,
        deleteScene,
        renameScene,
    } = useDashboardPage();
    const { snapshot } = useDashboardSnapshot(layout, ready);
    const [fullscreen, setFullscreen] = useState(false);
    const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
    const [history, setHistory] = useState<WidgetConfig[][]>([]);
    const [future, setFuture] = useState<WidgetConfig[][]>([]);

    const pushHistory = useCallback(() => {
        setHistory((prev) => [...prev.slice(-49), layout]);
        setFuture([]);
    }, [layout]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const prev = history[history.length - 1]!;
        setFuture((f) => [layout, ...f.slice(0, 49)]);
        setHistory((h) => h.slice(0, -1));
        updateLayout(prev);
    }, [history, layout, updateLayout]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0]!;
        setHistory((h) => [...h.slice(-49), layout]);
        setFuture((f) => f.slice(1));
        updateLayout(next);
    }, [future, layout, updateLayout]);

    useEffect(() => {
        const handler = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            void document.documentElement.requestFullscreen();
        } else {
            void document.exitFullscreen();
        }
    }, []);

    const currentFolderId = folderStack.at(-1) ?? activeFolderId;
    const activeFolder = currentFolderId
        ? (layout.find((w) => w.id === currentFolderId) ?? null)
        : null;

    const sharedGridProps = {
        layout,
        onLayoutChange: updateLayout,
        onDragComplete: pushHistory,
        onToggleVisible: toggleVisibility,
        onReset: (id: string, newStart: string) => {
            void handleReset(id, newStart);
        },
        onOpenFolder: (id: string) => {
            setActiveFolderId(id);
            setFolderStack([]);
        },
        onOpenRecovery: () => setIsRecoveryOpen(true),
        onRenameFolder: renameFolder,
        onDeleteFolder: deleteFolder,
        onMoveToBucket: moveToBucket,
        onUnpresent: unpresentWidget,
    };

    const mainCls = fullscreen
        ? 'w-full px-6 py-6 lg:px-10'
        : 'max-w-7xl mx-auto p-6 lg:p-12';

    return (
        <DashboardSnapshotProvider snapshot={snapshot}>
            <WidgetSettingsProvider widgets={widgetEntries}>
                <DashboardRuntimeProvider>
                    {!fullscreen && <Header />}
                    <FloatingBucket
                        layout={layout}
                        onRestore={restoreFromBucket}
                        onRemove={(id) =>
                            updateLayout(layout.filter((w) => w.id !== id))
                        }
                    />
                    <div
                        className={`min-h-screen transition-colors duration-300 ${bgIsDefault ? 'bg-gray-50 dark:bg-zinc-950' : ''}`}
                        style={bgIsDefault ? undefined : bgStyle}
                    >
                        <main className={mainCls}>
                            {isRecoveryOpen ? (
                                ready && (
                                    <RecoverySubScreen
                                        onBack={() => setIsRecoveryOpen(false)}
                                        layout={layout}
                                        onAddAllToLayout={(newWidgets) => {
                                            pushHistory();
                                            updateLayout([
                                                ...layout,
                                                ...newWidgets,
                                            ]);
                                        }}
                                    />
                                )
                            ) : activeFolder ? (
                                ready && (
                                    <FolderView
                                        activeFolder={activeFolder}
                                        folderStack={folderStack}
                                        setFolderStack={setFolderStack}
                                        setActiveFolderId={setActiveFolderId}
                                        layout={layout}
                                        updateLayout={updateLayout}
                                        removeFromFolder={removeFromFolder}
                                        renameFolder={renameFolder}
                                        deleteFolder={deleteFolder}
                                        toggleVisibility={toggleVisibility}
                                        handleReset={handleReset}
                                        pushHistory={pushHistory}
                                    />
                                )
                            ) : (
                                <GridView
                                    {...sharedGridProps}
                                    greeting={greeting}
                                    firstName={firstName}
                                    onAddFolder={addFolder}
                                    mode={mode}
                                    onModeChange={setMode}
                                    simplified={oneDimensionalMode}
                                    onAddTracker={(tracker) => {
                                        pushHistory();
                                        const alreadyPresent = layout.some(
                                            (w) =>
                                                w.id ===
                                                `widget-recovery-${tracker.id}`,
                                        );
                                        if (alreadyPresent) return;
                                        const maxOrder = layout.reduce(
                                            (m, w) => Math.max(m, w.order),
                                            -1,
                                        );
                                        updateLayout([
                                            ...layout,
                                            {
                                                id: `widget-recovery-${tracker.id}`,
                                                type: 'recovery' as WidgetType,
                                                visible: true,
                                                columnSpan: 1,
                                                containerId: 'main',
                                                order: maxOrder + 1,
                                                props: { tracker },
                                            },
                                        ]);
                                    }}
                                    onAddAllTrackers={(newTrackers) => {
                                        pushHistory();
                                        const existingIds = new Set(
                                            layout.map((w) => w.id),
                                        );
                                        let maxOrder = layout.reduce(
                                            (m, w) => Math.max(m, w.order),
                                            -1,
                                        );
                                        const additions = newTrackers
                                            .filter(
                                                (t) =>
                                                    !existingIds.has(
                                                        `widget-recovery-${t.id}`,
                                                    ),
                                            )
                                            .map((t) => ({
                                                id: `widget-recovery-${t.id}`,
                                                type: 'recovery' as WidgetType,
                                                visible: true,
                                                columnSpan: 1,
                                                containerId: 'main',
                                                order: ++maxOrder,
                                                props: { tracker: t },
                                            }));
                                        if (additions.length > 0) {
                                            updateLayout([
                                                ...layout,
                                                ...additions,
                                            ]);
                                        }
                                    }}
                                    onAddWidget={(type) => {
                                        pushHistory();
                                        const maxOrder = layout.reduce(
                                            (m, w) => Math.max(m, w.order),
                                            -1,
                                        );
                                        updateLayout([
                                            ...layout,
                                            {
                                                id: `widget-${type}-${Date.now()}`,
                                                type: type as WidgetType,
                                                visible: true,
                                                columnSpan: 1,
                                                containerId: 'main',
                                                order: maxOrder + 1,
                                            },
                                        ]);
                                    }}
                                    onRestoreUnpresented={(id) => {
                                        pushHistory();
                                        restoreUnpresented(id);
                                    }}
                                    canUndo={history.length > 0}
                                    canRedo={future.length > 0}
                                    onUndo={undo}
                                    onRedo={redo}
                                    onArchiveWidgets={(ids) => {
                                        pushHistory();
                                        updateLayout(
                                            layout.map((w) =>
                                                ids.includes(w.id)
                                                    ? {
                                                          ...w,
                                                          containerId: 'bucket',
                                                      }
                                                    : w,
                                            ),
                                        );
                                    }}
                                    onRemoveWidgets={(ids) => {
                                        pushHistory();
                                        updateLayout(
                                            layout.filter(
                                                (w) => !ids.includes(w.id),
                                            ),
                                        );
                                    }}
                                    scenes={scenes}
                                    onSaveScene={saveScene}
                                    onLoadScene={loadScene}
                                    onDeleteScene={deleteScene}
                                    onRenameScene={renameScene}
                                    onResetLayout={() =>
                                        updateLayout(
                                            buildDefaultLayout(trackers ?? []),
                                        )
                                    }
                                    snapRule={snapRule}
                                    onSnapRuleChange={setSnapRule}
                                    ready={ready}
                                    fullscreen={fullscreen}
                                    onToggleFullscreen={toggleFullscreen}
                                />
                            )}
                        </main>
                    </div>
                    {!fullscreen && <Footer />}
                </DashboardRuntimeProvider>
            </WidgetSettingsProvider>
        </DashboardSnapshotProvider>
    );
}
