'use client';

import {
    ImageIcon,
    Grid3X3,
    Move,
    Plus,
    MoreHorizontal,
    Clapperboard,
    RotateCcw,
    Maximize2,
    Minimize2,
    Undo2,
    Redo2,
    Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { BackgroundPickerPanel } from '@/features/settings/components/BackgroundPickerPanel';
import { AddWidgetPanel } from './AddWidgetPanel';
import { RemoveWidgetsPanel } from './RemoveWidgetsPanel';
import { SceneSwitcher } from './SceneSwitcher';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';
import type { Scene } from '@/features/dashboard/hooks/useScenes';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { useMoreOptionsDropdown } from '@/features/dashboard/hooks/useMoreOptionsDropdown';

// ─── layout mode toggle ───────────────────────────────────────────────────────

function LayoutModeToggle({
    mode,
    onChange,
}: {
    mode: 'grid' | 'free';
    onChange: (m: 'grid' | 'free') => void;
}) {
    return (
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5">
            <button
                onClick={() => onChange('grid')}
                title="Grid layout"
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    mode === 'grid'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                )}
            >
                <Grid3X3 size={13} /> Grid
            </button>
            <button
                onClick={() => onChange('free')}
                title="Free canvas"
                className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    mode === 'free'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                )}
            >
                <Move size={13} /> Free
            </button>
        </div>
    );
}

// ─── more options dropdown ────────────────────────────────────────────────────

interface MoreOptionsMenuProps {
    scenesOpen: boolean;
    setScenesOpen: React.Dispatch<React.SetStateAction<boolean>>;
    bgOpen: boolean;
    setBgOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setResetConfirming: (v: boolean) => void;
    scenes: Scene[];
    onSaveScene: (name: string) => void;
    onLoadScene: (id: string) => void;
    onDeleteScene: (id: string) => void;
    onRenameScene: (id: string, name: string) => void;
    onClose: () => void;
}

function MoreOptionsMenu({
    scenesOpen,
    setScenesOpen,
    bgOpen,
    setBgOpen,
    setResetConfirming,
    scenes,
    onSaveScene,
    onLoadScene,
    onDeleteScene,
    onRenameScene,
    onClose,
}: MoreOptionsMenuProps) {
    return (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden py-1.5">
            <button
                onClick={() => {
                    setScenesOpen((v) => !v);
                    setBgOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <Clapperboard size={14} className="text-zinc-400" />
                <span>Scenes</span>
                {scenes.length > 0 && (
                    <span className="ml-auto text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-full">
                        {scenes.length}
                    </span>
                )}
            </button>
            {scenesOpen && (
                <div className="px-3 pb-2">
                    <SceneSwitcher
                        scenes={scenes}
                        onSave={onSaveScene}
                        onLoad={(id) => {
                            onLoadScene(id);
                            onClose();
                        }}
                        onDelete={onDeleteScene}
                        onRename={onRenameScene}
                        inline
                    />
                </div>
            )}
            <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
            <button
                onClick={() => {
                    setBgOpen((v) => !v);
                    setScenesOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <ImageIcon size={14} className="text-zinc-400" />{' '}
                <span>Background</span>
            </button>
            {bgOpen && (
                <div className="px-3 pb-3">
                    <BackgroundPickerPanel compact />
                </div>
            )}
            <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
            <button
                onClick={() => setResetConfirming(true)}
                className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
                <RotateCcw size={14} /> <span>Reset Layout</span>
            </button>
        </div>
    );
}

interface MoreOptionsDropdownProps {
    scenes: Scene[];
    onSaveScene: (name: string) => void;
    onLoadScene: (id: string) => void;
    onDeleteScene: (id: string) => void;
    onRenameScene: (id: string, name: string) => void;
    onResetLayout: () => void;
}

function MoreOptionsDropdown({
    scenes,
    onSaveScene,
    onLoadScene,
    onDeleteScene,
    onRenameScene,
    onResetLayout,
}: MoreOptionsDropdownProps) {
    const {
        open,
        setOpen,
        bgOpen,
        setBgOpen,
        scenesOpen,
        setScenesOpen,
        resetConfirming,
        setResetConfirming,
        ref,
        closeAll,
    } = useMoreOptionsDropdown();

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                title="More options"
                className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors',
                    open
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                )}
            >
                <MoreHorizontal size={16} />
            </button>
            {open && (
                <MoreOptionsMenu
                    scenesOpen={scenesOpen}
                    setScenesOpen={setScenesOpen}
                    bgOpen={bgOpen}
                    setBgOpen={setBgOpen}
                    setResetConfirming={setResetConfirming}
                    scenes={scenes}
                    onSaveScene={onSaveScene}
                    onLoadScene={onLoadScene}
                    onDeleteScene={onDeleteScene}
                    onRenameScene={onRenameScene}
                    onClose={closeAll}
                />
            )}
            {resetConfirming && (
                <ConfirmModal
                    title="Reset Layout"
                    message="Reset your dashboard to the default layout? All widget positions and customizations will be lost."
                    confirmLabel="Reset"
                    onConfirm={() => {
                        setResetConfirming(false);
                        closeAll();
                        onResetLayout();
                    }}
                    onCancel={() => setResetConfirming(false)}
                    destructive
                />
            )}
        </div>
    );
}

// ─── dashboard header bar ─────────────────────────────────────────────────────

export interface DashboardHeaderBarProps {
    greeting: string | null;
    firstName: string | null;
    onAddFolder: () => void;
    mode: 'grid' | 'free';
    onModeChange: (m: 'grid' | 'free') => void;
    layout: WidgetConfig[];
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
    fullscreen: boolean;
    onToggleFullscreen: () => void;
    simplified?: boolean;
}

export function DashboardHeaderBar({
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
    fullscreen,
    onToggleFullscreen,
    simplified = false,
}: DashboardHeaderBarProps) {
    const [widgetPanelOpen, setWidgetPanelOpen] = useState(false);
    const [removePanelOpen, setRemovePanelOpen] = useState(false);
    const widgetBtnRef = useRef<HTMLDivElement>(null);
    const removeBtnRef = useRef<HTMLDivElement>(null);

    const undoActive = cn(
        'flex items-center justify-center w-8 h-8 rounded-xl text-sm transition-all',
        canUndo
            ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_16px_rgba(255,255,255,0.08)] hover:bg-zinc-50 dark:hover:bg-zinc-800'
            : 'opacity-30 cursor-not-allowed text-zinc-400 dark:text-zinc-600',
    );

    return (
        <>
            {/* Title — scrolls with page */}
            <div className="pt-2 pb-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
                    Command Center
                </h1>
                {!fullscreen && (
                    <p className="text-gray-500 dark:text-zinc-400">
                        {greeting || `Welcome back, ${firstName}.`}
                    </p>
                )}
            </div>
            {/* Sticky action bar — sibling of grid content so it can stick the full page height */}
            <div className={`sticky z-20 py-2 mb-6 -mx-6 px-6 lg:-mx-12 lg:px-12 flex justify-end items-center gap-3 ${fullscreen ? 'top-0' : 'top-14'}`}>
            <div className="flex items-center gap-3">
                {!simplified && <LayoutModeToggle mode={mode} onChange={onModeChange} />}
                {!simplified && (
                    <MoreOptionsDropdown
                        scenes={scenes}
                        onSaveScene={onSaveScene}
                        onLoadScene={onLoadScene}
                        onDeleteScene={onDeleteScene}
                        onRenameScene={onRenameScene}
                        onResetLayout={onResetLayout}
                    />
                )}
                <button
                    onClick={onToggleFullscreen}
                    title={
                        fullscreen ? 'Exit full screen (Esc)' : 'Full screen'
                    }
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    {fullscreen ? (
                        <Minimize2 size={16} />
                    ) : (
                        <Maximize2 size={16} />
                    )}
                </button>

                {/* Add widget */}
                <div ref={widgetBtnRef} className="relative">
                    <button
                        onClick={() => setWidgetPanelOpen((v) => !v)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                            widgetPanelOpen
                                ? 'bg-blue-600 text-white dark:bg-blue-500'
                                : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300',
                        )}
                    >
                        <Plus size={16} /> Add
                    </button>
                    {widgetPanelOpen && (
                        <AddWidgetPanel
                            layout={layout}
                            onAdd={(type) => {
                                onAddWidget(type);
                            }}
                            onRestore={(id) => {
                                onRestoreUnpresented(id);
                            }}
                            onAddFolder={() => {
                                onAddFolder();
                            }}
                            onClose={() => setWidgetPanelOpen(false)}
                        />
                    )}
                </div>

                {/* Undo / Redo — hidden in simplified (1D) mode */}
                {!simplified && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            title="Undo"
                            className={undoActive}
                        >
                            <Undo2 size={14} />
                        </button>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            title="Redo"
                            className={cn(
                                'flex items-center justify-center w-8 h-8 rounded-xl text-sm transition-all',
                                canRedo
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_16px_rgba(255,255,255,0.08)] hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                    : 'opacity-30 cursor-not-allowed text-zinc-400 dark:text-zinc-600',
                            )}
                        >
                            <Redo2 size={14} />
                        </button>
                    </div>
                )}

                {/* Remove widgets */}
                <div ref={removeBtnRef} className="relative">
                    <button
                        onClick={() => setRemovePanelOpen((v) => !v)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                            removePanelOpen
                                ? 'bg-red-600 text-white dark:bg-red-500'
                                : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-950/50',
                        )}
                    >
                        <Trash2 size={14} /> Remove Widgets
                    </button>
                    {removePanelOpen && (
                        <RemoveWidgetsPanel
                            layout={layout}
                            onArchive={(ids) => {
                                onArchiveWidgets(ids);
                            }}
                            onRemove={(ids) => {
                                onRemoveWidgets(ids);
                            }}
                            onClose={() => setRemovePanelOpen(false)}
                        />
                    )}
                </div>
            </div>
            </div>
        </>
    );
}
