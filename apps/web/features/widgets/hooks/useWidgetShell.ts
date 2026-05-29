import { useState, useRef } from 'react';
import { useWidgetSettings } from './useWidgetSettings';
import { useBackground } from '@/features/settings/hooks/useBackground';
import { useScheduledVisibility } from '@/features/dashboard/hooks/useScheduledVisibility';
import { useInactivityTimer } from './useInactivityTimer';
import { useClickOutside } from './useClickOutside';

export function useWidgetShell(widgetId: string, widgetType: string) {
    const { settings, updateSettings } = useWidgetSettings(
        widgetId,
        widgetType,
    );
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const infoRef = useRef<HTMLDivElement>(null);
    useClickOutside(infoRef, () => setInfoOpen(false), infoOpen);
    const { isDefault: bgIsDefault } = useBackground();
    const scheduleActive = useScheduledVisibility(settings.schedule);
    const isIdle = useInactivityTimer(
        settings.autoHideDuration * 1000,
        settings.autoHide,
    );

    return {
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
    };
}
