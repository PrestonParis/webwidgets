'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
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
} from '@/lib/constants/widget-styles';
import { WidgetShellProps } from '@/types/widgets';

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
    showSettings = true,
}: WidgetShellProps & { showSettings?: boolean }) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const settings: WidgetSettings = {
        ...DEFAULT_WIDGET_SETTINGS,
        ...settingsProp,
    };

    const update = (partial: Partial<WidgetSettings>) => {
        if (!onSettingsChange) return;
        onSettingsChange({ ...settings, ...partial });
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

                    {showSettings && onSettingsChange && (
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

            {/* ── Settings ── */}
            {showSettings && (
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-200',
                        settingsOpen
                            ? 'max-h-125 mb-4 opacity-100'
                            : 'max-h-0 opacity-0',
                    )}
                >
                    <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 space-y-4">
                        {/* Color */}
                        <div>
                            <p className="text-xs font-bold mb-2">Color</p>
                            <div className="flex gap-2">
                                {COLORS.map((col) => (
                                    <button
                                        key={col}
                                        onClick={() => update({ color: col })}
                                        className={cn(
                                            'w-6 h-6 rounded-full',
                                            colorMap[col].swatch,
                                            settings.color === col &&
                                                'ring-2 scale-110',
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div>
                            <p className="text-xs font-bold mb-2">Size</p>
                            <div className="flex gap-2">
                                {(
                                    [
                                        'compact',
                                        'default',
                                        'large',
                                    ] as WidgetSize[]
                                ).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => update({ size: s })}
                                        className={cn(
                                            'flex-1 py-1 rounded-xl text-xs font-bold',
                                            settings.size === s
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : 'bg-zinc-100 dark:bg-zinc-800',
                                        )}
                                    >
                                        {SIZE_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Background */}
                        <div>
                            <p className="text-xs font-bold mb-2">Background</p>
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
                                            update({ background: bg })
                                        }
                                        className={cn(
                                            'flex-1 py-1 rounded-xl text-xs font-bold',
                                            settings.background === bg
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : 'bg-zinc-100 dark:bg-zinc-800',
                                        )}
                                    >
                                        {BG_LABELS[bg]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {settingsSlot && (
                            <div className="pt-3 border-t">{settingsSlot}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="grow">{children}</div>

            {/* Footer */}
            {footerSlot ??
                (footerHref && footerLabel && (
                    <Link
                        href={footerHref}
                        className={cn(
                            'mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold',
                            'bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-zinc-400',
                            c.footerHover,
                        )}
                    >
                        {footerLabel}
                    </Link>
                ))}
        </div>
    );
}
