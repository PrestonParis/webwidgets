'use client';

import { useState, useRef, KeyboardEvent, RefObject } from 'react';
import {
    Folder,
    ChevronRight,
    ExternalLink,
    Edit2,
    Check,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { useNotificationStore } from '@/features/notifications/store/useNotificationStore';
import { StatusDot } from '@/features/notifications/components/StatusDot';

const WIDGET_LABELS: Partial<Record<string, string>> = {
    journal: 'Journal',
    email: 'Email',
    recovery: 'Recovery',
    'recovery-empty': 'Recovery',
    converter: 'Unit Converter',
    chess: 'Chess',
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

interface FolderHeaderProps {
    folderName: string;
    editing: boolean;
    draftName: string;
    inputRef: RefObject<HTMLInputElement | null>;
    hasUnread: boolean;
    onChange: (v: string) => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    onStartEdit: (e: React.MouseEvent) => void;
    onCommit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}

function FolderHeader({
    folderName,
    editing,
    draftName,
    inputRef,
    hasUnread,
    onChange,
    onKeyDown,
    onBlur,
    onStartEdit,
    onCommit,
    onDelete,
}: FolderHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0 w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Folder
                        size={16}
                        className="text-blue-500 dark:text-blue-400"
                    />
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
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                        <Check size={13} className="text-green-500" />
                    </button>
                ) : (
                    <button
                        onClick={onStartEdit}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                        <Edit2 size={13} className="text-zinc-400" />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
    const inputRef = useRef<HTMLInputElement>(null);

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

    function commitRename() {
        onRename(draftName.trim() || 'New Folder');
        setEditing(false);
    }

    return (
        <div className="group relative rounded-3xl border-2 border-transparent hover:border-blue-500/30 shadow-sm hover:shadow-xl hover:scale-[1.02] bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-300 flex flex-col h-full overflow-hidden p-6 min-h-40">
            <FolderHeader
                folderName={folder.props?.folderName ?? 'New Folder'}
                editing={editing}
                draftName={draftName}
                inputRef={inputRef}
                hasUnread={folderHasUnread}
                onChange={setDraftName}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditing(false);
                }}
                onBlur={commitRename}
                onStartEdit={(e) => {
                    e.stopPropagation();
                    setDraftName(folder.props?.folderName ?? 'New Folder');
                    setEditing(true);
                }}
                onCommit={(e) => {
                    e.stopPropagation();
                    commitRename();
                }}
                onDelete={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            />

            <div className="flex-1 space-y-1.5 cursor-pointer" onClick={onOpen}>
                {widgetsInFolder.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">
                        Drag widgets here
                    </p>
                ) : (
                    widgetsInFolder.slice(0, 5).map((w) => {
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
                                        className="shrink-0 text-blue-400 hover:text-blue-500 flex items-center gap-0.5 transition-colors"
                                        title={`Open ${label}`}
                                    >
                                        <ExternalLink size={10} />
                                    </Link>
                                )}
                            </div>
                        );
                    })
                )}
                {widgetsInFolder.length > 5 && (
                    <p className="text-xs text-zinc-400">
                        +{widgetsInFolder.length - 5} more
                    </p>
                )}
            </div>

            <button
                onClick={onOpen}
                className="mt-4 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-500 transition-colors"
            >
                Open folder <ChevronRight size={12} />
            </button>
        </div>
    );
}
