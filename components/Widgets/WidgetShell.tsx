'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
    WidgetSize,
    WidgetBackground,
    WidgetSettings,
    DEFAULT_WIDGET_SETTINGS,
} from '@/types/widgets';
import {
    colorMap,
    bgStyles,
    bgHoverStyles,
    COLORS,
    SIZE_LABELS,
    BG_LABELS,
} from '@/app/lib/constants/widget-styles';
import { WidgetShellProps } from '@/types/widgets';

// The WidgetShell component provides a consistent layout and styling for all widgets, including header, settings panel, content area, and optional footer. It accepts props for customization and handles the display of the settings panel.
export default function WidgetShell({
    icon,
    title,
    badge,
    children,
    footerHref,
    footerLabel,
    footerSlot,
    settingsSlot,
    settings: settingsProp,
    onSettingsChange,
}: WidgetShellProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    // Merge with defaults so colorMap lookup is always safe, even before Supabase loads
    const settings: WidgetSettings = {
        ...DEFAULT_WIDGET_SETTINGS,
        ...settingsProp,
    };
    const c =
        colorMap[settings.color] ?? colorMap[DEFAULT_WIDGET_SETTINGS.color];

    return (
        <div
            className={cn(
                'group relative rounded-3xl border-2 border-transparent',
                c.hoverBorder,
                'shadow-sm hover:shadow-xl hover:scale-[1.02]',
                bgStyles[settings.background],
                bgHoverStyles[settings.background],
                'transition-all duration-300 flex flex-col h-full overflow-hidden',
                settings.size === 'compact' ? 'p-4' : 'p-6',
            )}
        >
            {/* ── Header ── */}
            <div
                className={cn(
                    'flex justify-between items-start',
                    settings.size === 'compact' ? 'mb-3' : 'mb-6',
                )}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'rounded-xl flex items-center justify-center shrink-0',
                            'group-hover:scale-110 transition-transform',
                            c.iconBg,
                            c.iconText,
                            settings.size === 'compact' ? 'w-7 h-7' : 'w-8 h-8',
                        )}
                    >
                        <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
                            {icon}
                        </span>
                    </div>
                    <h3
                        className={cn(
                            'font-bold text-gray-800 dark:text-zinc-100',
                            settings.size === 'compact'
                                ? 'text-base'
                                : 'text-lg',
                        )}
                    >
                        {title}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {badge && (
                        <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                            {badge}
                        </div>
                    )}

                    {/* Gear icon — visible on hover or when open */}
                    <button
                        onClick={() => setSettingsOpen((v) => !v)}
                        className={cn(
                            'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center',
                            'text-gray-400 dark:text-zinc-500',
                            'hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                            settingsOpen
                                ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'
                                : 'opacity-0 group-hover:opacity-100',
                        )}
                        aria-label="Widget settings"
                    >
                        {settingsOpen ? (
                            <X className="w-3.5 h-3.5" />
                        ) : (
                            <Settings className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* ── Settings panel (slide down) ── */}
            <div
                className={cn(
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    settingsOpen
                        ? 'max-h-112 mb-4 opacity-100'
                        : 'max-h-0 opacity-0',
                )}
            >
                <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 space-y-4">
                    {/* Color swatches */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                            Color
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((col) => (
                                <button
                                    key={col}
                                    onClick={() =>
                                        onSettingsChange?.({ color: col })
                                    }
                                    title={col}
                                    className={cn(
                                        'w-6 h-6 rounded-full transition-all',
                                        colorMap[col].swatch,
                                        settings.color === col
                                            ? 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-zinc-900 ring-gray-500 dark:ring-zinc-400 scale-110'
                                            : 'opacity-50 hover:opacity-100 hover:scale-105',
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                            Size
                        </p>
                        <div className="flex gap-2">
                            {(
                                ['compact', 'default', 'large'] as WidgetSize[]
                            ).map((s) => (
                                <button
                                    key={s}
                                    onClick={() =>
                                        onSettingsChange?.({ size: s })
                                    }
                                    className={cn(
                                        'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all',
                                        settings.size === s
                                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                            : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600',
                                    )}
                                >
                                    {SIZE_LABELS[s]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Background */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                            Background
                        </p>
                        <div className="flex gap-2">
                            {(
                                [
                                    'default',
                                    'glass',
                                    'solid',
                                ] as WidgetBackground[]
                            ).map((bg) => (
                                <button
                                    key={bg}
                                    onClick={() =>
                                        onSettingsChange?.({ background: bg })
                                    }
                                    className={cn(
                                        'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all',
                                        settings.background === bg
                                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                            : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600',
                                    )}
                                >
                                    {BG_LABELS[bg]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Widget-specific extras */}
                    {settingsSlot && (
                        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                            {settingsSlot}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="grow">{children}</div>

            {/* ── Footer ── */}
            {footerSlot ? (
                <div className="mt-6">{footerSlot}</div>
            ) : footerHref && footerLabel ? (
                <Link
                    href={footerHref}
                    className={cn(
                        'mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors',
                        'bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-zinc-400',
                        c.footerHover,
                    )}
                >
                    {footerLabel}
                </Link>
            ) : null}
        </div>
    );
}
