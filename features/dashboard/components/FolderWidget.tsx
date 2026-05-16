'use client';

import { useState, useRef, KeyboardEvent, RefObject } from 'react';
import {
    Folder,
    ChevronRight,
    ExternalLink,
    Edit2,
    Check,
    Trash2,
    Settings,
    X,
} from 'lucide-react';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';
import Link from 'next/link';
import { cn } from '@/lib/utils/utils';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';
import { StatusDot } from '@/features/notifications/components/StatusDot';
import { useBackground } from '@/features/settings/hooks/useBackground';
import { useFolderSettings } from '@/features/dashboard/hooks/useFolderSettings';
import { FolderSettingsPanel } from '@/features/dashboard/components/FolderSettingsPanel';
import { colorMap } from '@/features/widgets/constants';

const WIDGET_LABELS: Partial<Record<string, string>> = {
    journal: 'Journal',
    email: 'Email',
    recovery: 'Recovery',
    'recovery-empty': 'Recovery',
    converter: 'Unit Converter',
    chess: 'Chess',
    calendar: 'Calendar',
    'form-filler': 'Form Filler',
    pomodoro: 'Pomodoro',
    todo: 'Todo',
    weather: 'Weather',
    worldclock: 'World Clock',
    currency: 'Currency',
    mood: 'Mood',
    habit: 'Habit',
    scratchpad: 'Scratchpad',
    countdown: 'Countdown',
};

const WIDGET_ROUTES: Partial<Record<string, string>> = {
    journal: '/journal',
    chess: '/chess',
    email: '/inbox',
    recovery: '/recovery',
};

// ─── sub-components ───────────────────────────────────────────────────────────

interface FolderHeaderProps {
    folderName: string;
    editing: boolean;
    draftName: string;
    inputRef: RefObject<HTMLInputElement | null>;
    hasUnread: boolean;
    settingsOpen: boolean;
    iconBg: string;
    iconText: string;
    onChange: (v: string) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onStartEdit: (e: React.MouseEvent) => void;
    onCommit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onToggleSettings: (e: React.MouseEvent) => void;
}

function FolderHeader({
    folderName,
    editing,
    draftName,
    inputRef,
    hasUnread,
    settingsOpen,
    iconBg,
    iconText,
    onChange,
    onKeyDown,
    onBlur,
    onStartEdit,
    onCommit,
    onDelete,
    onToggleSettings,
}: FolderHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
                <div
                    className={cn(
                        'relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                        iconBg,
                    )}
                >
                    <Folder size={16} className={iconText} />
                    {hasUnread && (
                        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#4f6ef7] border border-white dark:border-zinc-900" />
                    )}
                </div>
                {editing ? (
                    <input
                        ref={inputRef}
                        value={draftName}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        onBlur={onBlur}
                        className="bg-transparent border-b border-blue-400 text-sm font-semibold text-gray-900 dark:text-zinc-100 outline-none w-28"
                        autoFocus
                    />
                ) : (
                    <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                        {folderName}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {editing ? (
                    <button
                        onClick={onCommit}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        <Check size={13} className="text-green-500" />
                    </button>
                ) : (
                    <button
                        onClick={onStartEdit}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        <Edit2 size={13} className="text-zinc-400" />
                    </button>
                )}
                <button
                    onClick={onToggleSettings}
                    className={cn(
                        'p-1 rounded transition-colors',
                        settingsOpen
                            ? 'bg-black/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-200'
                            : 'hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400',
                    )}
                >
                    {settingsOpen ? <X size={13} /> : <Settings size={13} />}
                </button>
                <button
                    onClick={onDelete}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                >
                    <Trash2
                        size={13}
                        className="text-zinc-400 hover:text-red-400 transition-colors"
                    />
                </button>
            </div>
        </div>
    );
}

function WidgetList({
    widgetsInFolder,
    linkText,
}: {
    widgetsInFolder: WidgetConfig[];
    linkText: string;
}) {
    if (widgetsInFolder.length === 0) {
        return (
            <p className="text-xs text-zinc-400 italic">Drag widgets here</p>
        );
    }
    return (
        <>
            {widgetsInFolder.slice(0, 5).map((w) => {
                const route = WIDGET_ROUTES[w.type];
                const label =
                    w.type === 'recovery' && w.props?.tracker?.addiction
                        ? w.props.tracker.addiction
                        : (WIDGET_LABELS[w.type] ?? w.type);
                return (
                    <div
                        key={w.id}
                        className="flex items-center justify-between gap-2 text-xs"
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            <StatusDot widgetId={w.id} reserveSpace />
                            <span className="text-zinc-600 dark:text-zinc-300 truncate">
                                {label}
                            </span>
                        </div>
                        {route && (
                            <Link
                                href={route}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                    'shrink-0 flex items-center gap-0.5 transition-colors',
                                    linkText,
                                )}
                                title={`Open ${label}`}
                            >
                                <ExternalLink size={10} />
                            </Link>
                        )}
                    </div>
                );
            })}
            {widgetsInFolder.length > 5 && (
                <p className="text-xs text-zinc-400">
                    +{widgetsInFolder.length - 5} more
                </p>
            )}
        </>
    );
}

// ─── background helpers ───────────────────────────────────────────────────────

/**
 * opacity: 0 = fully opaque (solid), 100 = fully transparent.
 * alpha = 1 - opacity/100
 */
function bgLayerProps(
    background: string,
    bgIsDefault: boolean,
    opacity: number,
    dark: boolean,
): { style: React.CSSProperties; className: string } {
    const alpha = 1 - opacity / 100;

    if (!bgIsDefault) {
        const rgb = dark ? '9,9,11' : '255,255,255';
        const blur =
            background === 'glass' ? 'backdrop-blur-xl' : 'backdrop-blur-md';
        return {
            className: blur,
            style: { backgroundColor: `rgba(${rgb},${alpha})` },
        };
    }

    switch (background) {
        case 'glass': {
            const rgb = dark ? '9,9,11' : '255,255,255';
            return {
                className: 'backdrop-blur-md',
                style: { backgroundColor: `rgba(${rgb},${alpha})` },
            };
        }
        case 'solid': {
            const rgb = dark ? '24,24,27' : '249,250,251';
            return {
                className: '',
                style: { backgroundColor: `rgba(${rgb},${alpha})` },
            };
        }
        default: {
            const rgb = dark ? '9,9,11' : '255,255,255';
            return {
                className: '',
                style: { backgroundColor: `rgba(${rgb},${alpha})` },
            };
        }
    }
}

// ─── main component ───────────────────────────────────────────────────────────

interface FolderWidgetProps {
    folder: WidgetConfig;
    layout: WidgetConfig[];
    onOpen: () => void;
    onRename: (name: string) => void;
    onDelete: () => void;
}

export default function FolderWidget({
    folder,
    layout,
    onOpen,
    onRename,
    onDelete,
}: FolderWidgetProps) {
    const [editing, setEditing] = useState(false);
    const [draftName, setDraftName] = useState(
        folder.props?.folderName ?? 'New Folder',
    );
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { settings, updateSettings } = useFolderSettings(folder.id);
    const { isDefault: bgIsDefault } = useBackground();

    const widgetsInFolder = layout
        .filter(
            (w) =>
                w.containerId === folder.id && w.visible && w.type !== 'folder',
        )
        .sort((a, b) => a.order - b.order);

    const notifications = useNotificationStore((s) => s.notifications);
    const childIds = widgetsInFolder.map((w) => w.id);
    const folderHasUnread = notifications.some(
        (n) => !n.read && childIds.includes(n.widgetId),
    );

    const c = colorMap[settings.color];

    function commitRename() {
        onRename(draftName.trim() || 'New Folder');
        setEditing(false);
    }

    const lightBg = bgLayerProps(
        settings.background,
        bgIsDefault,
        settings.opacity,
        false,
    );
    const darkBg = bgLayerProps(
        settings.background,
        bgIsDefault,
        settings.opacity,
        true,
    );
    const brightnessFilter =
        settings.brightness !== 100
            ? { filter: `brightness(${settings.brightness}%)` }
            : undefined;

    return (
        <>
            <div
                className={cn(
                    'group relative rounded-3xl border-2 border-transparent overflow-hidden',
                    c.hoverBorder,
                    'shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
                    'flex flex-col h-full min-h-40',
                )}
            >
                {/* Background layers — separate from content so transparency/brightness only affects the fill */}
                <div
                    className={cn(
                        'absolute inset-0 dark:hidden',
                        lightBg.className,
                    )}
                    style={{ ...lightBg.style, ...brightnessFilter }}
                />
                <div
                    className={cn(
                        'absolute inset-0 hidden dark:block',
                        darkBg.className,
                    )}
                    style={{ ...darkBg.style, ...brightnessFilter }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-6">
                    <FolderHeader
                        folderName={folder.props?.folderName ?? 'New Folder'}
                        editing={editing}
                        draftName={draftName}
                        inputRef={inputRef}
                        hasUnread={folderHasUnread}
                        settingsOpen={settingsOpen}
                        iconBg={c.iconBg}
                        iconText={c.iconText}
                        onChange={setDraftName}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setEditing(false);
                        }}
                        onBlur={commitRename}
                        onStartEdit={(e) => {
                            e.stopPropagation();
                            setDraftName(
                                folder.props?.folderName ?? 'New Folder',
                            );
                            setEditing(true);
                        }}
                        onCommit={(e) => {
                            e.stopPropagation();
                            commitRename();
                        }}
                        onDelete={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(true);
                        }}
                        onToggleSettings={(e) => {
                            e.stopPropagation();
                            setSettingsOpen((v) => !v);
                        }}
                    />

                    <FolderSettingsPanel
                        open={settingsOpen}
                        settings={settings}
                        onUpdate={updateSettings}
                    />

                    <div
                        className="flex-1 space-y-1.5 cursor-pointer"
                        onClick={onOpen}
                    >
                        <WidgetList
                            widgetsInFolder={widgetsInFolder}
                            linkText={c.linkText}
                        />
                    </div>
                    <button
                        onClick={onOpen}
                        className={cn(
                            'mt-4 flex items-center gap-1 text-xs transition-colors',
                            c.linkText,
                        )}
                    >
                        Open folder <ChevronRight size={12} />
                    </button>
                </div>
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
