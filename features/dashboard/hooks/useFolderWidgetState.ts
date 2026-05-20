import { useState, useRef } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useBackground } from '@/features/settings/hooks/useBackground';
import { useBucketWidget } from '@/features/dashboard/lib/BucketWidgetContext';
import { useUnpresentWidget } from '@/features/dashboard/lib/UnpresentWidgetContext';
import { useInactivityTimer } from '@/features/widgets/hooks/useInactivityTimer';
import { useClickOutside } from '@/features/widgets/hooks/useClickOutside';
import { useNotificationStore } from '@/features/notifications/hooks/useNotificationStore';

export function useFolderWidgetState(folder: WidgetConfig) {
    const { settings, updateSettings } = useWidgetSettings(folder.id, 'folder');
    const { isDefault: bgIsDefault } = useBackground();
    const onBucket = useBucketWidget();
    const onUnpresent = useUnpresentWidget();
    const isIdle = useInactivityTimer(
        settings.autoHideDuration * 1000,
        settings.autoHide,
    );
    const [revealed, setRevealed] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const infoRef = useRef<HTMLDivElement>(null);
    useClickOutside(infoRef, () => setInfoOpen(false), infoOpen);
    const notifications = useNotificationStore((s) => s.notifications);
    return {
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
    };
}
