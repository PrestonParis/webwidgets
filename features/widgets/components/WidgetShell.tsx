'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/utils';
import { WidgetShellProps } from '@/features/widgets/types/widgets';
import {
    colorMap,
    bgStyles,
    bgHoverStyles,
} from '@/features/widgets/constants';
import { useWidgetSettings } from '../hooks/useWidgetSettings';
import { useBackground } from '@/features/settings/hooks/useBackground';
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
    const { isDefault: bgIsDefault } = useBackground();

    const c = colorMap[settings.color];

    // When a custom dashboard background is active, use translucent glass so the background shows through.
    const shellBg = bgIsDefault
        ? cn(bgStyles[settings.background], bgHoverStyles[settings.background])
        : 'bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md hover:bg-white/85 dark:hover:bg-zinc-950/85';

    return (
        <div
            className={cn(
                'group relative rounded-3xl border-2 border-transparent',
                c.hoverBorder,
                'shadow-sm hover:shadow-xl hover:scale-[1.02]',
                shellBg,
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
                {...(showSettings
                    ? { onToggleSettings: () => setSettingsOpen((v) => !v) }
                    : {})}
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
