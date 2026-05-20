'use client';

import { useState, type KeyboardEvent } from 'react';
import { Folder, Pin, Layers, Eye, Trash2 } from 'lucide-react';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { colorMap, COLORS, PIN_LABELS } from '@/features/widgets/constants';
import {
    type WidgetSize,
    type PinMode,
    type WidgetSettings,
} from '@/features/widgets/types/widgets';
import { useFolderNameSection } from '@/features/dashboard/hooks/useFolderNameSection';
import { useFolderControlsBar } from '@/features/dashboard/hooks/useFolderControlsBar';
import { FolderLayersPanel } from './FolderLayersPanel';
import { FolderVisibilityPanel } from './FolderVisibilityPanel';

const SIZE_SHORT: Record<WidgetSize, string> = {
    compact: 'Sm',
    default: 'Md',
    wide: 'Wd',
    large: 'Lg',
};
const SIZE_CYCLE: WidgetSize[] = ['compact', 'default', 'wide', 'large'];

// ─── name + pin section ───────────────────────────────────────────────────────

interface FolderNameSectionProps {
    folder: WidgetConfig;
    settings: WidgetSettings;
    updateSettings: (patch: Partial<WidgetSettings>) => void;
    folderHasUnread: boolean;
    onRename: (name: string) => void;
}

function FolderNameSection({
    folder,
    settings,
    updateSettings,
    folderHasUnread,
    onRename,
}: FolderNameSectionProps) {
    const {
        editing,
        setEditing,
        draftName,
        setDraftName,
        pinOpen,
        setPinOpen,
        inputRef,
        pinRef,
    } = useFolderNameSection(folder);
    const c = colorMap[settings.color];
    const isPinned = settings.pinMode !== 'none';
    function commitRename() {
        onRename(draftName.trim() || 'New Folder');
        setEditing(false);
    }

    return (
        <div className="flex items-center gap-2 min-w-0">
            <div ref={pinRef} className="relative group/iconarea shrink-0">
                <div
                    className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center relative',
                        c.iconBg,
                    )}
                >
                    <Folder size={16} className={c.iconText} />
                    {folderHasUnread && (
                        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#4f6ef7] border border-white dark:border-zinc-900" />
                    )}
                </div>
                <button
                    onClick={() => setPinOpen((v) => !v)}
                    title="Pin mode"
                    className={cn(
                        'absolute -bottom-1 -right-1 rounded-full p-0.5 transition-all bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-sm',
                        isPinned
                            ? 'opacity-100 text-zinc-700 dark:text-zinc-200'
                            : 'opacity-0 group-hover/iconarea:opacity-100 text-zinc-400 dark:text-zinc-500',
                    )}
                >
                    <Pin size={9} className={isPinned ? 'fill-current' : ''} />
                </button>
                {pinOpen && (
                    <div className="absolute left-0 top-full mt-2 z-50 w-36 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl py-1.5 overflow-hidden">
                        {(
                            [
                                'none',
                                'viewport',
                                'canvas',
                                'anchor',
                            ] as PinMode[]
                        ).map((p) => (
                            <button
                                key={p}
                                onClick={() => {
                                    updateSettings({ pinMode: p });
                                    setPinOpen(false);
                                }}
                                className={cn(
                                    'flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors',
                                    settings.pinMode === p
                                        ? 'text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-50 dark:bg-zinc-800'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                                )}
                            >
                                <Pin
                                    size={10}
                                    className={
                                        settings.pinMode === p && p !== 'none'
                                            ? 'fill-current'
                                            : 'opacity-40'
                                    }
                                />
                                {PIN_LABELS[p]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {editing ? (
                <input
                    ref={inputRef}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditing(false);
                    }}
                    onBlur={commitRename}
                    className="bg-transparent border-b border-blue-400 text-sm font-semibold text-gray-900 dark:text-zinc-100 outline-none w-28"
                    autoFocus
                />
            ) : (
                <span
                    className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate cursor-text select-none"
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        setDraftName(folder.props?.folderName ?? 'New Folder');
                        setEditing(true);
                    }}
                >
                    {folder.props?.folderName ?? 'New Folder'}
                </span>
            )}
        </div>
    );
}

// ─── right controls bar ───────────────────────────────────────────────────────

interface FolderControlsBarProps {
    settings: WidgetSettings;
    updateSettings: (patch: Partial<WidgetSettings>) => void;
    onBucket: (() => void) | null;
    onUnpresent: (() => void) | null;
    onConfirmDelete: () => void;
}

function FolderControlsBar({
    settings,
    updateSettings,
    onBucket,
    onUnpresent,
    onConfirmDelete,
}: FolderControlsBarProps) {
    const {
        colorOpen,
        setColorOpen,
        bgOpen,
        setBgOpen,
        visOpen,
        setVisOpen,
        colorRef,
        bgRef,
        visRef,
        folderFileInputRef,
    } = useFolderControlsBar();
    const c = colorMap[settings.color];
    function cycleSize() {
        const idx = SIZE_CYCLE.indexOf(settings.size);
        updateSettings({
            size: SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length] as WidgetSize,
        });
    }

    return (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
                onClick={cycleSize}
                title={`Size: ${settings.size}`}
                className="h-7 px-2 rounded-xl text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
                {SIZE_SHORT[settings.size]}
            </button>
            <div ref={bgRef} className="relative">
                <button
                    onClick={() => {
                        setBgOpen((v) => !v);
                        setColorOpen(false);
                        setVisOpen(false);
                    }}
                    className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center transition-colors text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                        bgOpen &&
                            'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300',
                    )}
                >
                    <Layers className="w-3.5 h-3.5" />
                </button>
                {bgOpen && (
                    <FolderLayersPanel
                        settings={settings}
                        updateSettings={updateSettings}
                        folderFileInputRef={folderFileInputRef}
                        onUploadClick={() =>
                            folderFileInputRef.current?.click()
                        }
                    />
                )}
            </div>
            <div ref={colorRef} className="relative">
                <button
                    onClick={() => {
                        setColorOpen((v) => !v);
                        setBgOpen(false);
                        setVisOpen(false);
                    }}
                    className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800',
                        colorOpen && 'bg-gray-100 dark:bg-zinc-800',
                    )}
                >
                    <span className={cn('w-3 h-3 rounded-full', c.swatch)} />
                </button>
                {colorOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl">
                        <div className="grid grid-cols-3 gap-2">
                            {COLORS.map((col) => (
                                <button
                                    key={col}
                                    onClick={() => {
                                        updateSettings({ color: col });
                                        setColorOpen(false);
                                    }}
                                    className={cn(
                                        'w-5 h-5 rounded-full transition-transform hover:scale-110',
                                        colorMap[col].swatch,
                                        settings.color === col &&
                                            'ring-2 ring-offset-2 dark:ring-offset-zinc-900 scale-110',
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div ref={visRef} className="relative">
                <button
                    onClick={() => {
                        setVisOpen((v) => !v);
                        setColorOpen(false);
                        setBgOpen(false);
                    }}
                    className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center transition-colors text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                        visOpen &&
                            'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300',
                    )}
                >
                    <Eye className="w-3.5 h-3.5" />
                </button>
                {visOpen && (
                    <FolderVisibilityPanel
                        settings={settings}
                        updateSettings={updateSettings}
                        onBucket={onBucket}
                        onUnpresent={onUnpresent}
                        onClose={() => setVisOpen(false)}
                    />
                )}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onConfirmDelete();
                }}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
                <Trash2
                    size={13}
                    className="text-zinc-400 hover:text-red-400 transition-colors"
                />
            </button>
        </div>
    );
}

// ─── exported header ──────────────────────────────────────────────────────────

export interface FolderWidgetHeaderProps {
    folder: WidgetConfig;
    settings: WidgetSettings;
    updateSettings: (patch: Partial<WidgetSettings>) => void;
    onRename: (name: string) => void;
    onDelete: () => void;
    onBucket: (() => void) | null;
    onUnpresent: (() => void) | null;
    folderHasUnread: boolean;
}

export function FolderWidgetHeader({
    folder,
    settings,
    updateSettings,
    onRename,
    onDelete,
    onBucket,
    onUnpresent,
    folderHasUnread,
}: FolderWidgetHeaderProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <>
            <div className="relative z-10 flex items-start justify-between mb-3">
                <FolderNameSection
                    folder={folder}
                    settings={settings}
                    updateSettings={updateSettings}
                    folderHasUnread={folderHasUnread}
                    onRename={onRename}
                />
                <FolderControlsBar
                    settings={settings}
                    updateSettings={updateSettings}
                    onBucket={onBucket}
                    onUnpresent={onUnpresent}
                    onConfirmDelete={() => setConfirmDelete(true)}
                />
            </div>
            {confirmDelete && (
                <ConfirmModal
                    title="Delete folder?"
                    message="The folder will be removed. Widgets inside will move back to the main dashboard."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={onDelete}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}
        </>
    );
}
