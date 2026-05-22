'use client';

import { Info, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import {
    colorMap,
    bgStyles,
    bgHoverStyles,
} from '@/features/widgets/constants';
import type { WidgetSettings } from '@/features/widgets/types/widgets';
import { useFolderWidgetState } from '@/features/dashboard/hooks/useFolderWidgetState';
import { FolderWidgetHeader } from './FolderWidgetHeader';
import { StatusDot } from '@/features/notifications/components/StatusDot';

const FOLDER_INFO: [string, string][] = [
    ['Rename', 'Double-click the folder name'],
    ['Add', 'Drag a widget onto this card'],
    ['Open', 'Click card to browse contents'],
    ['Image', 'Layers icon → background, opacity'],
    ['Color', 'Color swatch → accent color'],
    ['Privacy', 'Eye icon → blur / schedule'],
    ['Pin', 'Lock folder position in place'],
];

const WIDGET_LABELS: Partial<Record<string, string>> = {
    texteditor: 'TextEditor',
    email: 'Email',
    recovery: 'Recovery',
    'recovery-empty': 'Recovery',
    converter: 'Unit Converter',
    chess: 'Chess',
    calendar: 'Calendar',
    'form-filler': 'Form Filler',
    timekeeping: 'Time',
    datahealth: 'System Health',
    todo: 'Todo',
    weather: 'Weather',
    worldclock: 'World Clock',
    mood: 'Mood',
};

const WIDGET_ROUTES: Partial<Record<string, string>> = {
    texteditor: '/texteditor',
    chess: '/chess',
    email: '/inbox',
    recovery: '/recovery',
};

// ─── privacy overlays ─────────────────────────────────────────────────────────

interface FolderPrivacyOverlayProps {
    settings: WidgetSettings;
    privacyActive: boolean;
    autoHideActive: boolean;
    onReveal: () => void;
}

function FolderPrivacyOverlay({
    settings,
    privacyActive,
    autoHideActive,
    onReveal,
}: FolderPrivacyOverlayProps) {
    return (
        <>
            {settings.blur && !settings.lowProfile && !settings.redact && (
                <div
                    className={cn(
                        'absolute inset-0 z-20 rounded-xl transition-all duration-200',
                        privacyActive || autoHideActive
                            ? 'opacity-100 pointer-events-auto cursor-pointer'
                            : 'opacity-0 pointer-events-none',
                    )}
                    onClick={() => !autoHideActive && onReveal()}
                >
                    <div className="absolute inset-0 backdrop-blur-md rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl shadow-sm">
                            {autoHideActive ? 'Away…' : 'Click to reveal'}
                        </span>
                    </div>
                </div>
            )}
            {settings.lowProfile && (privacyActive || autoHideActive) && (
                <button
                    onClick={() => !autoHideActive && onReveal()}
                    className={cn(
                        'absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-gray-50/90 dark:bg-zinc-900/90',
                        autoHideActive ? 'cursor-default' : 'cursor-pointer',
                    )}
                >
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                        {autoHideActive ? 'Away…' : 'Tap to view'}
                    </span>
                </button>
            )}
        </>
    );
}

// ─── folder contents list ──────────────────────────────────────────────────────

interface FolderContentsBodyProps {
    widgetsInFolder: WidgetConfig[];
    settings: WidgetSettings;
    revealed: boolean;
    onOpen: () => void;
    linkText: string;
}

function FolderContentsBody({
    widgetsInFolder,
    settings,
    revealed,
    onOpen,
    linkText,
}: FolderContentsBodyProps) {
    return (
        <>
            <div
                className={cn(
                    'space-y-1.5 cursor-pointer flex-1',
                    settings.lowProfile && !revealed ? 'invisible' : undefined,
                )}
                onClick={onOpen}
            >
                {widgetsInFolder.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic">
                        Drag widgets here
                    </p>
                ) : (
                    <>
                        {widgetsInFolder.slice(0, 5).map((w) => {
                            const route = WIDGET_ROUTES[w.type];
                            const label =
                                w.type === 'recovery' &&
                                w.props?.tracker?.addiction
                                    ? w.props.tracker.addiction
                                    : (WIDGET_LABELS[w.type] ?? w.type);
                            return (
                                <div
                                    key={w.id}
                                    className="flex items-center justify-between gap-2 text-xs"
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <StatusDot
                                            widgetId={w.id}
                                            reserveSpace
                                        />
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
                )}
            </div>
            <button
                onClick={onOpen}
                className={cn(
                    'mt-4 flex items-center gap-1 text-xs transition-colors',
                    linkText,
                )}
            >
                Open folder <ChevronRight size={12} />
            </button>
        </>
    );
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
    const {
        settings,
        updateSettings,
        bgIsDefault,
        onBucket,
        onUnpresent,
        isIdle,
        revealed,
        setRevealed,
        infoOpen,
        setInfoOpen,
        infoRef,
        notifications,
    } = useFolderWidgetState(folder);

    const widgetsInFolder = layout
        .filter((w) => w.containerId === folder.id && w.visible)
        .sort((a, b) => a.order - b.order);
    const folderHasUnread = notifications.some(
        (n) => !n.read && widgetsInFolder.some((w) => w.id === n.widgetId),
    );
    const c = colorMap[settings.color];
    const hasImage =
        !!settings.backgroundImage && settings.backgroundImage !== '';
    const shellBg = hasImage
        ? 'bg-transparent'
        : bgIsDefault
          ? cn(
                bgStyles[settings.background],
                bgHoverStyles[settings.background],
            )
          : 'bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md hover:bg-white/85 dark:hover:bg-zinc-950/85';
    const privacyActive =
        (settings.blur || settings.redact || settings.lowProfile) && !revealed;
    const autoHideActive = settings.autoHide && isIdle;

    return (
        <div
            className={cn(
                'group relative rounded-3xl border-2 border-transparent',
                c.hoverBorder,
                'shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
                'flex flex-col min-h-40 p-6',
                shellBg,
            )}
            style={{ opacity: Math.max(0.08, settings.opacity / 100) }}
        >
            {hasImage && (
                <div
                    className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none"
                    style={{
                        backgroundImage: `url(${settings.backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: `brightness(${(settings.backgroundBrightness ?? 100) / 100})`,
                    }}
                />
            )}
            <FolderWidgetHeader
                folder={folder}
                settings={settings}
                updateSettings={updateSettings}
                onRename={onRename}
                onDelete={onDelete}
                onBucket={onBucket}
                onUnpresent={onUnpresent}
                folderHasUnread={folderHasUnread}
            />
            <div className="relative z-10 flex-1 flex flex-col">
                <FolderPrivacyOverlay
                    settings={settings}
                    privacyActive={privacyActive}
                    autoHideActive={autoHideActive}
                    onReveal={() => setRevealed(true)}
                />
                <FolderContentsBody
                    widgetsInFolder={widgetsInFolder}
                    settings={settings}
                    revealed={revealed}
                    onOpen={onOpen}
                    linkText={c.linkText}
                />
            </div>
            <div
                ref={infoRef}
                className="absolute bottom-3 right-3 z-40"
                data-no-drag
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setInfoOpen((v) => !v);
                    }}
                    title="How to customize"
                    className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center transition-all',
                        infoOpen
                            ? 'opacity-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                            : 'opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300',
                    )}
                >
                    <Info size={11} />
                </button>
                {infoOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2.5">
                            How to customize
                        </p>
                        <div className="space-y-1.5">
                            {FOLDER_INFO.map(([key, desc]) => (
                                <div
                                    key={key}
                                    className="flex items-baseline gap-2 text-[11px]"
                                >
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-200 shrink-0 w-11 text-right">
                                        {key}
                                    </span>
                                    <span className="text-zinc-500 dark:text-zinc-400">
                                        {desc}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
