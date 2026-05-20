'use client';

import Image from 'next/image';
import {
    Settings,
    X,
    Eye,
    Archive,
    Layers,
    XCircle,
    Pin,
    Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type {
    WidgetSettings,
    VisibilitySchedule,
    WidgetColor,
} from '@/features/widgets/types/widgets';
import type { WidgetHeaderProps } from '@/features/widgets/types/widgetProps';
import { DEFAULT_SCHEDULE } from '@/features/widgets/types/widgetDefaults';
import { colorMap, COLORS } from '@/features/widgets/constants';
import { useWidgetHeader } from '@/features/widgets/hooks/useWidgetHeader';

const SIZE_SHORT: Record<string, string> = {
    compact: 'Sm',
    default: 'Md',
    wide: 'Wd',
    large: 'Lg',
};
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const PRIVACY_TOGGLES = [
    {
        key: 'lowProfile' as const,
        label: 'Low profile',
        patch: (v: boolean) => ({
            lowProfile: v,
            blur: false as const,
            redact: false as const,
        }),
    },
    {
        key: 'blur' as const,
        label: 'Blur content',
        patch: (v: boolean) => ({
            blur: v,
            redact: false as const,
            lowProfile: false as const,
        }),
    },
    {
        key: 'redact' as const,
        label: 'Redact content',
        patch: (v: boolean) => ({
            redact: v,
            blur: false as const,
            lowProfile: false as const,
        }),
    },
    {
        key: 'autoHide' as const,
        label: 'Auto-hide',
        patch: (v: boolean) => ({ autoHide: v }),
    },
];

// ─── sub-panels ───────────────────────────────────────────────────────────────

interface BackgroundPanelProps {
    settings: WidgetSettings;
    onSettingsChange: (p: Partial<WidgetSettings>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onUploadClick: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
function BackgroundPanel({
    settings,
    onSettingsChange,
    fileInputRef,
    onUploadClick,
    onFileUpload,
}: BackgroundPanelProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3 space-y-3">
            <div>
                <div className="flex justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Opacity
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">
                        {settings.opacity}%
                    </span>
                </div>
                <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={settings.opacity}
                    onChange={(e) =>
                        onSettingsChange({ opacity: Number(e.target.value) })
                    }
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Image
                </p>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={onFileUpload}
                />
                {settings.backgroundImage ? (
                    <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden h-20 bg-zinc-100 dark:bg-zinc-800">
                            <Image
                                src={settings.backgroundImage}
                                alt=""
                                fill
                                sizes="240px"
                                unoptimized
                                className="object-cover"
                            />
                            <button
                                onClick={() =>
                                    onSettingsChange({ backgroundImage: '' })
                                }
                                className="absolute top-1 right-1 text-white bg-black/50 rounded-full p-0.5 hover:bg-black/70 transition-colors"
                            >
                                <XCircle size={14} />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    Brightness
                                </p>
                                <span className="text-[10px] font-mono text-zinc-400">
                                    {settings.backgroundBrightness ?? 100}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={settings.backgroundBrightness ?? 100}
                                onChange={(e) =>
                                    onSettingsChange({
                                        backgroundBrightness: Number(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                            />
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onUploadClick}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Upload size={11} /> Upload image
                    </button>
                )}
            </div>
        </div>
    );
}

interface ColorPickerProps {
    currentColor: WidgetColor;
    onColorChange: (c: WidgetColor) => void;
}
function ColorPicker({ currentColor, onColorChange }: ColorPickerProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl">
            <div className="grid grid-cols-3 gap-2">
                {COLORS.map((col) => (
                    <button
                        key={col}
                        onClick={() => onColorChange(col)}
                        className={cn(
                            'w-5 h-5 rounded-full transition-transform hover:scale-110',
                            colorMap[col].swatch,
                            currentColor === col &&
                                'ring-2 ring-offset-2 dark:ring-offset-zinc-900 scale-110',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── visibility panel ─────────────────────────────────────────────────────────

interface ScheduleSectionProps {
    settings: WidgetSettings;
    scheduleEnabled: boolean;
    patchSchedule: (p: Partial<VisibilitySchedule>) => void;
    toggleScheduleEnabled: () => void;
    toggleDay: (d: number) => void;
}
function ScheduleSection({
    settings,
    scheduleEnabled,
    patchSchedule,
    toggleScheduleEnabled,
    toggleDay,
}: ScheduleSectionProps) {
    return (
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-2.5 space-y-2">
            <button
                onClick={toggleScheduleEnabled}
                className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
                <span>Schedule</span>
                <span
                    className={cn(
                        'w-7 h-4 rounded-full transition-colors shrink-0',
                        scheduleEnabled
                            ? 'bg-zinc-900 dark:bg-zinc-100'
                            : 'bg-zinc-200 dark:bg-zinc-700',
                    )}
                >
                    <span
                        className={cn(
                            'block w-3 h-3 rounded-full mt-0.5 transition-all',
                            scheduleEnabled
                                ? 'ml-3.5 bg-white dark:bg-zinc-900'
                                : 'ml-0.5 bg-white dark:bg-zinc-400',
                        )}
                    />
                </span>
            </button>
            {scheduleEnabled && (
                <div className="space-y-2 pl-0.5">
                    <div className="flex gap-1.5">
                        {(['startTime', 'endTime'] as const).map((field, i) => (
                            <div key={field} className="flex-1">
                                <p className="text-[9px] font-semibold text-zinc-400 mb-1">
                                    {i === 0 ? 'From' : 'To'}
                                </p>
                                <input
                                    type="time"
                                    value={
                                        settings.schedule?.[field] ??
                                        DEFAULT_SCHEDULE[field]
                                    }
                                    onChange={(e) =>
                                        patchSchedule({
                                            [field]: e.target.value,
                                        })
                                    }
                                    className="w-full text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-0.5">
                        {DAYS.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => toggleDay(i)}
                                className={cn(
                                    'flex-1 h-6 rounded-md text-[9px] font-bold transition-all',
                                    (settings.schedule?.days ?? []).includes(i)
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                                )}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface VisibilityPanelProps extends ScheduleSectionProps {
    onSettingsChange: (p: Partial<WidgetSettings>) => void;
    onBucket: (() => void) | null;
    onUnpresent: (() => void) | null;
    onClose: () => void;
}
function VisibilityPanel({
    settings,
    onSettingsChange,
    scheduleEnabled,
    patchSchedule,
    toggleScheduleEnabled,
    toggleDay,
    onBucket,
    onUnpresent,
    onClose,
}: VisibilityPanelProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3 space-y-2.5">
            {PRIVACY_TOGGLES.map(({ key, label, patch }) => (
                <button
                    key={key}
                    onClick={() => onSettingsChange(patch(!settings[key]))}
                    className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <span>{label}</span>
                    <span
                        className={cn(
                            'w-7 h-4 rounded-full transition-colors shrink-0',
                            settings[key]
                                ? 'bg-zinc-900 dark:bg-zinc-100'
                                : 'bg-zinc-200 dark:bg-zinc-700',
                        )}
                    >
                        <span
                            className={cn(
                                'block w-3 h-3 rounded-full mt-0.5 transition-all',
                                settings[key]
                                    ? 'ml-3.5 bg-white dark:bg-zinc-900'
                                    : 'ml-0.5 bg-white dark:bg-zinc-400',
                            )}
                        />
                    </span>
                </button>
            ))}
            <ScheduleSection
                settings={settings}
                scheduleEnabled={scheduleEnabled}
                patchSchedule={patchSchedule}
                toggleScheduleEnabled={toggleScheduleEnabled}
                toggleDay={toggleDay}
            />
            {(onBucket || onUnpresent) && (
                <>
                    <div className="border-t border-gray-100 dark:border-zinc-800" />
                    {onBucket && (
                        <button
                            onClick={() => {
                                onBucket();
                                onClose();
                            }}
                            className="flex items-center gap-1.5 w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <Archive size={11} />
                            Move to bucket
                        </button>
                    )}
                    {onUnpresent && (
                        <button
                            onClick={() => {
                                onUnpresent();
                                onClose();
                            }}
                            className="flex items-center gap-1.5 w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                        >
                            <Archive size={11} className="opacity-60" />
                            Archive to library
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

// ─── main header ──────────────────────────────────────────────────────────────

export function WidgetHeader({
    icon,
    title,
    badge,
    settings,
    settingsOpen,
    onToggleSettings,
    onColorChange,
    onSettingsChange,
    onRename,
    showSettings,
}: WidgetHeaderProps) {
    const {
        onBucket,
        onUnpresent,
        colorOpen,
        setColorOpen,
        visOpen,
        setVisOpen,
        bgOpen,
        setBgOpen,
        pinFlash,
        renaming,
        setRenaming,
        draftTitle,
        setDraftTitle,
        colorRef,
        visRef,
        bgRef,
        fileInputRef,
        titleInputRef,
        handleFileUpload,
        startRename,
        commitRename,
        togglePin,
        cycleSize,
        patchSchedule,
        toggleScheduleEnabled,
        toggleDay,
        isPinned,
        scheduleEnabled,
    } = useWidgetHeader(settings, title, onSettingsChange, onRename);
    const c = colorMap[settings.color];
    const isCompact = settings.size === 'compact';
    return (
        <div
            className={cn(
                'flex justify-between items-start',
                isCompact ? 'mb-3' : 'mb-6',
            )}
        >
            <div className="flex items-center gap-3">
                <div className="relative group/iconarea shrink-0">
                    <div
                        className={cn(
                            'rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform',
                            c.iconBg,
                            c.iconText,
                            isCompact ? 'w-7 h-7' : 'w-8 h-8',
                        )}
                    >
                        <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                            {pinFlash ? (
                                <Pin size={16} className="fill-current" />
                            ) : (
                                icon
                            )}
                        </span>
                    </div>
                    {onSettingsChange && (
                        <button
                            onClick={togglePin}
                            title={isPinned ? 'Unpin widget' : 'Pin widget'}
                            className={cn(
                                'absolute -bottom-1 -right-1 rounded-full p-0.5 transition-all bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-sm',
                                isPinned
                                    ? 'opacity-100 text-zinc-700 dark:text-zinc-200'
                                    : 'opacity-0 group-hover/iconarea:opacity-100 text-zinc-400 dark:text-zinc-500',
                            )}
                        >
                            <Pin
                                size={9}
                                className={isPinned ? 'fill-current' : ''}
                            />
                        </button>
                    )}
                </div>
                {renaming ? (
                    <input
                        ref={titleInputRef}
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setRenaming(false);
                        }}
                        className={cn(
                            'bg-transparent border-b border-blue-400 outline-none font-bold text-gray-800 dark:text-zinc-100 min-w-0 w-32',
                            isCompact ? 'text-base' : 'text-lg',
                        )}
                        autoFocus
                    />
                ) : (
                    <h3
                        className={cn(
                            'font-bold text-gray-800 dark:text-zinc-100',
                            isCompact ? 'text-base' : 'text-lg',
                            onRename && 'cursor-text select-none',
                        )}
                        onDoubleClick={startRename}
                    >
                        {title}
                    </h3>
                )}
            </div>
            <div className="flex items-center gap-1">
                {badge && (
                    <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        {badge}
                    </div>
                )}
                {onSettingsChange && (
                    <button
                        onClick={cycleSize}
                        title={`Size: ${settings.size}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 rounded-xl text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                        {SIZE_SHORT[settings.size]}
                    </button>
                )}
                {onSettingsChange && (
                    <div ref={bgRef} className="relative">
                        <button
                            onClick={() => {
                                setBgOpen((v) => !v);
                                setColorOpen(false);
                                setVisOpen(false);
                            }}
                            title="Background & opacity"
                            className={cn(
                                'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                                bgOpen
                                    ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'
                                    : 'opacity-0 group-hover:opacity-100',
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                        </button>
                        {bgOpen && (
                            <BackgroundPanel
                                settings={settings}
                                onSettingsChange={onSettingsChange}
                                fileInputRef={fileInputRef}
                                onUploadClick={() =>
                                    fileInputRef.current?.click()
                                }
                                onFileUpload={handleFileUpload}
                            />
                        )}
                    </div>
                )}
                {onColorChange && (
                    <div ref={colorRef} className="relative">
                        <button
                            onClick={() => {
                                setColorOpen((v) => !v);
                                setBgOpen(false);
                                setVisOpen(false);
                            }}
                            title="Change color"
                            className={cn(
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                colorOpen && 'opacity-100',
                                'w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800',
                            )}
                        >
                            <span
                                className={cn(
                                    'w-3 h-3 rounded-full',
                                    colorMap[settings.color].swatch,
                                )}
                            />
                        </button>
                        {colorOpen && (
                            <ColorPicker
                                currentColor={settings.color}
                                onColorChange={(col) => {
                                    onColorChange(col);
                                    setColorOpen(false);
                                }}
                            />
                        )}
                    </div>
                )}
                {onSettingsChange && (
                    <div ref={visRef} className="relative">
                        <button
                            onClick={() => {
                                setVisOpen((v) => !v);
                                setColorOpen(false);
                                setBgOpen(false);
                            }}
                            title="Visibility settings"
                            className={cn(
                                'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                                visOpen
                                    ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'
                                    : 'opacity-0 group-hover:opacity-100',
                            )}
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                        {visOpen && (
                            <VisibilityPanel
                                settings={settings}
                                onSettingsChange={onSettingsChange}
                                scheduleEnabled={scheduleEnabled}
                                patchSchedule={patchSchedule}
                                toggleScheduleEnabled={toggleScheduleEnabled}
                                toggleDay={toggleDay}
                                onBucket={onBucket}
                                onUnpresent={onUnpresent}
                                onClose={() => setVisOpen(false)}
                            />
                        )}
                    </div>
                )}
                {showSettings && onToggleSettings && (
                    <button
                        onClick={onToggleSettings}
                        className={cn(
                            'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                            settingsOpen
                                ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'
                                : 'opacity-0 group-hover:opacity-100',
                        )}
                    >
                        {settingsOpen ? (
                            <X className="w-3.5 h-3.5" />
                        ) : (
                            <Settings className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
