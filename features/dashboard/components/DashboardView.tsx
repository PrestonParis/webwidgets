'use client';

import { useState, useEffect } from 'react';
import Header from '@/features/ui/components/Header';
import DashboardGrid from './DashboardGrid';
import FreeCanvas from './FreeCanvas';
import FolderSubScreen from './FolderSubScreen';
import { SnapRuleBar } from './SnapRuleBar';
import Footer from '@/features/ui/components/Footer';
import { FloatingBucket } from './FloatingBucket';
import { WidgetSettingsProvider } from '@/features/widgets/context/WidgetSettingsContext';
import type {
    WidgetConfig,
    WidgetType,
    DashboardGridProps,
} from '@/features/dashboard/types/dashboard';
import type { SnapRule } from '@/features/dashboard/types/dashboard';
import { buildDefaultLayout } from '@/features/dashboard/lib/dashboardLayout';
import { DashboardHeaderBar } from './DashboardHeaderBar';
import type { Scene } from '@/features/dashboard/hooks/useScenes';
import { useDashboardPage } from '@/features/dashboard/hooks/useDashboardPage';
import { useDashboardSnapshot } from '@/features/dashboard/hooks/useDashboardSnapshot';
import { DashboardSnapshotProvider } from '@/features/dashboard/lib/DashboardSnapshotContext';
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
}: FolderViewProps) {
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
    ...gridProps
}: GridViewProps) {
    return (
        <>
            <DashboardHeaderBar
                greeting={greeting}
                firstName={firstName}
                onAddFolder={onAddFolder}
                mode={mode}
                onModeChange={onModeChange}
                layout={layout}
                onAddWidget={onAddWidget}
                onRestoreUnpresented={onRestoreUnpresented}
                scenes={scenes}
                onSaveScene={onSaveScene}
                onLoadScene={onLoadScene}
                onDeleteScene={onDeleteScene}
                onRenameScene={onRenameScene}
                onResetLayout={onResetLayout}
                fullscreen={fullscreen}
                onToggleFullscreen={onToggleFullscreen}
            />
            {mode === 'free' && ready && (
                <div className="mb-4">
                    <SnapRuleBar
                        snapRule={snapRule}
                        onChange={onSnapRuleChange}
                    />
                </div>
            )}
            {ready ? (
                mode === 'free' ? (
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

    useEffect(() => {
        if (!fullscreen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setFullscreen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [fullscreen]);

    const currentFolderId = folderStack.at(-1) ?? activeFolderId;
    const activeFolder = currentFolderId
        ? (layout.find((w) => w.id === currentFolderId) ?? null)
        : null;

    const sharedGridProps = {
        layout,
        onLayoutChange: updateLayout,
        onToggleVisible: toggleVisibility,
        onReset: (id: string, newStart: string) => {
            void handleReset(id, newStart);
        },
        onOpenFolder: (id: string) => {
            setActiveFolderId(id);
            setFolderStack([]);
        },
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
                        {activeFolder ? (
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
                                onAddWidget={(type) => {
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
                                onRestoreUnpresented={restoreUnpresented}
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
                                onToggleFullscreen={() =>
                                    setFullscreen((v) => !v)
                                }
                            />
                        )}
                    </main>
                </div>
                {!fullscreen && <Footer />}
            </WidgetSettingsProvider>
        </DashboardSnapshotProvider>
    );
}
