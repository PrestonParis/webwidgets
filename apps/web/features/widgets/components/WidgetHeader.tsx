'use client';

import {
    Settings,
    X,
    Eye,
    Layers,
    Pin,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetSettings } from '@/features/widgets/types/widgets';
import type { WidgetHeaderProps } from '@/features/widgets/types/widgetProps';
import { colorMap } from '@/features/widgets/constants';
import { useWidgetHeader } from '@/features/widgets/hooks/useWidgetHeader';
import { useAccessibility } from '@/features/accessibility/context/AccessibilityContext';
import {
    BackgroundPanel,
    ColorPicker,
    VisibilityPanel,
} from './WidgetSettingsPanels';

const SIZE_SHORT: Record<string, string> = {
    compact: 'Sm',
    default: 'Md',
    wide: 'Wd',
    large: 'Lg',
};

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

    const { oneDimensionalMode } = useAccessibility();
    const c = colorMap[settings.color];
    const isCompact = settings.size === 'compact';

    return (
        <div className={cn('flex justify-between items-start', isCompact ? 'mb-3' : 'mb-6')}>
            {/* Title area */}
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
                            {pinFlash ? <Pin size={16} className="fill-current" /> : icon}
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
                            <Pin size={9} className={isPinned ? 'fill-current' : ''} />
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

            {/* Action buttons — power-user chrome is hidden in 1D mode */}
            <div className="flex items-center gap-1">
                {badge && (
                    <div className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        {badge}
                    </div>
                )}
                {!oneDimensionalMode && onSettingsChange && (
                    <button
                        onClick={cycleSize}
                        title={`Size: ${settings.size}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 rounded-xl text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                        {SIZE_SHORT[settings.size]}
                    </button>
                )}
                {!oneDimensionalMode && onSettingsChange && (
                    <div ref={bgRef} className="relative">
                        <button
                            onClick={() => { setBgOpen((v) => !v); setColorOpen(false); setVisOpen(false); }}
                            title="Background & opacity"
                            className={cn(
                                'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                                bgOpen ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300' : 'opacity-0 group-hover:opacity-100',
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                        </button>
                        {bgOpen && (
                            <BackgroundPanel
                                settings={settings}
                                onSettingsChange={onSettingsChange}
                                fileInputRef={fileInputRef}
                                onUploadClick={() => fileInputRef.current?.click()}
                                onFileUpload={handleFileUpload}
                            />
                        )}
                    </div>
                )}
                {!oneDimensionalMode && onColorChange && (
                    <div ref={colorRef} className="relative">
                        <button
                            onClick={() => { setColorOpen((v) => !v); setBgOpen(false); setVisOpen(false); }}
                            title="Change color"
                            className={cn(
                                'opacity-0 group-hover:opacity-100 transition-opacity',
                                colorOpen && 'opacity-100',
                                'w-7 h-7 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800',
                            )}
                        >
                            <span className={cn('w-3 h-3 rounded-full', colorMap[settings.color].swatch)} />
                        </button>
                        {colorOpen && (
                            <ColorPicker
                                currentColor={settings.color}
                                onColorChange={(col) => { onColorChange(col); setColorOpen(false); }}
                            />
                        )}
                    </div>
                )}
                {!oneDimensionalMode && onSettingsChange && (
                    <div ref={visRef} className="relative">
                        <button
                            onClick={() => { setVisOpen((v) => !v); setColorOpen(false); setBgOpen(false); }}
                            title="Visibility settings"
                            className={cn(
                                'transition-opacity w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300',
                                visOpen ? 'opacity-100 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300' : 'opacity-0 group-hover:opacity-100',
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
                                : oneDimensionalMode
                                    ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                                    : 'opacity-0 group-hover:opacity-100',
                        )}
                    >
                        {settingsOpen ? <X className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                    </button>
                )}
            </div>
        </div>
    );
}
