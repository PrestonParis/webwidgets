'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/utils';
import { WidgetShellProps } from '@/types/widgets';
import {
    colorMap,
    bgStyles,
    bgHoverStyles,
} from '@/lib/constants/widget-styles';
import { useWidgetSettings } from '../hooks/useWidgetSettings'; // ← your existing hook
import { WidgetHeader } from './WidgetHeader';
import { WidgetSettingsPanel } from './WidgetSettingsPanel';
import { WidgetFooter } from './WidgetFooter';

export default function WidgetShell({
    icon,
    title,
    badge,
    children,
    footerHref,
    footerLabel,
    footerSlot,
    settingsSlot,
    widgetId, // ← new required prop
    widgetType, // ← new required prop
    showSettings = true,
}: WidgetShellProps & { showSettings?: boolean }) {
    const { settings, updateSettings } = useWidgetSettings(
        widgetId,
        widgetType,
    );
    const [settingsOpen, setSettingsOpen] = useState(false);

    const c = colorMap[settings.color];

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
            <WidgetHeader
                icon={icon}
                title={title}
                badge={badge}
                settings={settings}
                settingsOpen={settingsOpen}
                onToggleSettings={
                    showSettings ? () => setSettingsOpen((v) => !v) : undefined
                }
                showSettings={showSettings}
            />

            {showSettings && (
                <WidgetSettingsPanel
                    open={settingsOpen}
                    settings={settings}
                    onUpdate={updateSettings}
                    settingsSlot={settingsSlot}
                />
            )}

            <div className="grow">{children}</div>

            {footerSlot ??
                (footerHref && footerLabel && (
                    <WidgetFooter
                        href={footerHref}
                        label={footerLabel}
                        settings={settings}
                    />
                ))}
        </div>
    );
}
