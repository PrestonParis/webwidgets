'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type {
    WidgetSettings,
    WidgetState,
    VisibilitySchedule,
} from '@/features/widgets/types/widgets';
import type { WidgetShellProps } from '@/features/widgets/types/widgetProps';
import {
    colorMap,
    bgStyles,
    bgHoverStyles,
} from '@/features/widgets/constants';
import { useWidgetShell } from '../hooks/useWidgetShell';
import { WidgetHeader } from './WidgetHeader';
import { WidgetSettingsPanel } from './WidgetSettingsPanel';
import { WidgetFooter } from './WidgetFooter';
import { WidgetSizeContext } from '@/features/widgets/context/WidgetSizeContext';
import { useAccessibility } from '@/features/accessibility/context/AccessibilityContext';
const WIDGET_INFO: [string, string][] = [
    ['Rename', 'Double-click the title'],
    ['Style', 'Gear icon → color, state, opacity'],
    ['Image', 'Layers icon → background'],
    ['Pin', 'Lock widget position in place'],
    ['Resize', 'Drag right or bottom edge (free canvas)'],
    ['Glue', 'Top-left button → move as a group'],
    ['Weave', 'Bottom-left button → tabbed card'],
];

const STATE_BAR: Partial<Record<WidgetState, string>> = {
    passive: 'bg-blue-400',
    dormant: 'bg-amber-400',
    suspended: 'bg-red-400',
    archived: 'bg-zinc-400',
};

function ScheduledOffCard({ schedule }: { schedule: VisibilitySchedule }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-400 dark:text-zinc-600">
            <p className="text-xs font-semibold">Scheduled off</p>
            <p className="text-[10px]">Next window: {schedule.startTime}</p>
        </div>
    );
}

// ─── privacy overlays ─────────────────────────────────────────────────────────

interface PrivacyOverlaysProps {
    settings: WidgetSettings;
    privacyActive: boolean;
    autoHideActive: boolean;
    onReveal: () => void;
}
function PrivacyOverlays({
    settings,
    privacyActive,
    autoHideActive,
    onReveal,
}: PrivacyOverlaysProps) {
    const revealOrNoop = () => !autoHideActive && onReveal();
    const overlayClass = cn(
        'absolute inset-0 z-20 rounded-xl transition-all duration-200',
        privacyActive || autoHideActive
            ? 'opacity-100 pointer-events-auto cursor-pointer'
            : 'opacity-0 pointer-events-none',
    );
    const awayOrReveal = autoHideActive ? 'Away…' : 'Click to reveal';
    return (
        <>
            {settings.blur && !settings.lowProfile && !settings.redact && (
                <div className={overlayClass} onClick={revealOrNoop}>
                    <div className="absolute inset-0 backdrop-blur-md rounded-xl" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl shadow-sm">
                            {awayOrReveal}
                        </span>
                    </div>
                </div>
            )}
            {settings.redact && !settings.lowProfile && (
                <div className={overlayClass} onClick={revealOrNoop}>
                    <div className="absolute inset-0 bg-zinc-950/92 dark:bg-zinc-900/95 rounded-xl" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-1">
                            {([0, 1, 2] as const).map((i) => (
                                <div
                                    key={i}
                                    className="h-2 rounded bg-zinc-700"
                                    style={{ width: `${28 + i * 12}px` }}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">
                            {awayOrReveal}
                        </span>
                    </div>
                </div>
            )}
            {settings.autoHide &&
                !settings.blur &&
                !settings.redact &&
                !settings.lowProfile && (
                    <div
                        className={cn(
                            'absolute inset-0 z-20 rounded-xl transition-all duration-200 pointer-events-none',
                            autoHideActive ? 'opacity-100' : 'opacity-0',
                        )}
                    >
                        <div className="absolute inset-0 backdrop-blur-sm rounded-xl bg-white/40 dark:bg-zinc-950/50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                                Away…
                            </span>
                        </div>
                    </div>
                )}
            {settings.lowProfile && (privacyActive || autoHideActive) && (
                <button
                    onClick={revealOrNoop}
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

// ─── info button ──────────────────────────────────────────────────────────────

interface InfoButtonProps {
    infoRef: React.RefObject<HTMLDivElement | null>;
    infoOpen: boolean;
    onToggle: () => void;
}
function InfoButton({ infoRef, infoOpen, onToggle }: InfoButtonProps) {
    return (
        <div
            ref={infoRef}
            className="absolute bottom-3 right-3 z-40"
            data-no-drag
        >
            <button
                onClick={onToggle}
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
                        {WIDGET_INFO.map(([key, desc]) => (
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
    );
}

// ─── shell ────────────────────────────────────────────────────────────────────

export default function WidgetShell({
    icon,
    title,
    badge,
    children,
    footerHref,
    footerLabel,
    footerSlot,
    settingsSlot,
    widgetId,
    widgetType,
    showSettings = true,
}: WidgetShellProps & { showSettings?: boolean }) {
    const {
        settings,
        updateSettings,
        settingsOpen,
        setSettingsOpen,
        revealed,
        setRevealed,
        infoOpen,
        setInfoOpen,
        infoRef,
        bgIsDefault,
        scheduleActive,
        isIdle,
    } = useWidgetShell(widgetId, widgetType);
    const { oneDimensionalMode } = useAccessibility();
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
    const stateBar = STATE_BAR[settings.state];
    const isDimmed =
        settings.state === 'dormant' ||
        settings.state === 'suspended' ||
        settings.state === 'archived';
    const autoHideActive = settings.autoHide && isIdle;
    const privacyActive =
        (settings.blur || settings.redact || settings.lowProfile) && !revealed;
    const crop = settings.crop;
    const cropStyle =
        crop &&
        (crop.top > 0 || crop.right > 0 || crop.bottom > 0 || crop.left > 0)
            ? {
                  marginTop: -crop.top,
                  marginRight: -crop.right,
                  marginBottom: -crop.bottom,
                  marginLeft: -crop.left,
                  paddingTop: crop.top,
                  paddingRight: crop.right,
                  paddingBottom: crop.bottom,
                  paddingLeft: crop.left,
              }
            : undefined;
    const padClass = oneDimensionalMode ? 'p-8' : settings.size === 'compact' ? 'p-4' : 'p-6';

    return (
        <div
            className={cn(
                'group relative rounded-3xl border-2 border-transparent',
                !oneDimensionalMode && c.hoverBorder,
                !oneDimensionalMode && 'hover:shadow-xl hover:scale-[1.02]',
                'shadow-sm',
                shellBg,
                'transition-all duration-300 flex flex-col',
                padClass,
                oneDimensionalMode && 'widget-1d',
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
            {stateBar && (
                <span
                    className={cn(
                        'absolute bottom-0 left-6 right-6 h-0.5 rounded-full',
                        stateBar,
                    )}
                />
            )}
            <div className="relative">
                <WidgetHeader
                    icon={icon}
                    title={settings.customTitle ?? title}
                    badge={badge}
                    settings={settings}
                    settingsOpen={settingsOpen}
                    showSettings={showSettings}
                    {...(showSettings
                        ? { onToggleSettings: () => setSettingsOpen((v) => !v) }
                        : {})}
                    {...(showSettings
                        ? {
                              onColorChange: (color) =>
                                  updateSettings({ color }),
                          }
                        : {})}
                    {...(showSettings
                        ? { onSettingsChange: (patch) => updateSettings(patch) }
                        : {})}
                    {...(showSettings
                        ? {
                              onRename: (name: string) =>
                                  updateSettings({ customTitle: name }),
                          }
                        : {})}
                />
                {showSettings && (
                    <div className="absolute left-0 right-0 top-full z-50 pt-1">
                        <WidgetSettingsPanel
                            open={settingsOpen}
                            settings={settings}
                            onUpdate={updateSettings}
                            settingsSlot={settingsSlot}
                        />
                    </div>
                )}
            </div>
            <div className="grow relative overflow-hidden" style={cropStyle}>
                {!scheduleActive ? (
                    <ScheduledOffCard schedule={settings.schedule!} />
                ) : (
                    <>
                        {settings.state === 'passive' && (
                            <div className="absolute inset-0 z-10 cursor-not-allowed" />
                        )}
                        {isDimmed && (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-zinc-950/60 rounded-xl flex items-center justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                    {settings.state}
                                </span>
                            </div>
                        )}
                        <PrivacyOverlays
                            settings={settings}
                            privacyActive={privacyActive}
                            autoHideActive={!!autoHideActive}
                            onReveal={() => setRevealed(true)}
                        />
                        <WidgetSizeContext.Provider value={settings.size}>
                            <div
                                className={cn(
                                    settings.lowProfile && !revealed
                                        ? 'invisible'
                                        : undefined,
                                    (settings.blur || settings.redact) &&
                                        !revealed
                                        ? 'select-none'
                                        : undefined,
                                )}
                            >
                                {children}
                            </div>
                        </WidgetSizeContext.Provider>
                    </>
                )}
            </div>
            {scheduleActive &&
                (footerSlot ??
                    (footerHref && footerLabel && (
                        <WidgetFooter
                            href={footerHref}
                            label={footerLabel}
                            settings={settings}
                        />
                    )))}
            {!oneDimensionalMode && (
                <InfoButton
                    infoRef={infoRef}
                    infoOpen={infoOpen}
                    onToggle={() => setInfoOpen((v) => !v)}
                />
            )}
        </div>
    );
}
