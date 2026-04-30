'use client';

import { useState } from 'react';
import { getExactTimeParts } from '@/lib/utils/time';
import { SoberWidgetProps } from '@/types/recovery';
import { RecoveryView } from '@/types/widgets';
import TimeUnit from '@/features/recovery/components/TimeUnit';
import RecoveryHeatmap from '@/features/recovery/components/RecoveryHeatmap';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { HeartIcon } from '@/icons/HeartIcon';
import { useUrgeForm } from '@/features/recovery/hooks/useUrgeForm';
import SoberWidgetFooter from '@/features/recovery/components/SoberWidgetFooter';
import ViewToggle from '@/features/recovery/components/ViewToggle';
import { useSecondsClean } from '@/features/recovery/hooks/useSecondsClean';

export default function SoberWidget({ tracker, onReset }: SoberWidgetProps) {
    const [startTime, setStartTime] = useState(tracker.start_time);

    const { settings, updateSettings } = useWidgetSettings(
        tracker.id,
        'recovery',
    );
    const view = (settings.view as RecoveryView) ?? 'timer';
    const urgeForm = useUrgeForm(tracker.id);
    const secondsClean = useSecondsClean(startTime);
    const time = startTime ? getExactTimeParts(startTime) : null;

    const settingsSlot = (
        <ViewToggle
            view={view}
            onViewChange={(v) => updateSettings({ view: v })}
        />
    );

    const handleResetClick = () => {
        const now = new Date().toISOString();
        setStartTime(now);
        onReset(tracker.id, now);
    };

    const footerSlot = (
        <SoberWidgetFooter
            showUrgeForm={urgeForm.showUrgeForm}
            trigger={urgeForm.trigger}
            isSaving={urgeForm.isSaving}
            onTriggerChange={urgeForm.setTrigger}
            onLogUrge={urgeForm.handleLogUrge}
            onCancelUrge={urgeForm.handleCancel}
            onShowUrgeForm={() => urgeForm.setShowUrgeForm(true)}
            onReset={handleResetClick}
        />
    );

    if (!startTime) {
        return (
            <WidgetShell
                icon={<HeartIcon />}
                title="Sober Time"
                settings={settings}
                onSettingsChange={updateSettings}
                settingsSlot={settingsSlot}
                footerHref="/recovery"
                footerLabel="View full page →"
                widgetId={tracker.id}
                widgetType="recovery"
            >
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                    No streak started. Visit the recovery page to begin.
                </p>
            </WidgetShell>
        );
    }

    return (
        <WidgetShell
            icon={<HeartIcon />}
            title="Sober Time"
            badge={tracker.addiction || undefined}
            settings={settings}
            onSettingsChange={updateSettings}
            settingsSlot={settingsSlot}
            footerSlot={footerSlot}
            widgetId={tracker.id}
            widgetType="recovery"
        >
            {view === 'timer' && time ? (
                <div className="flex flex-wrap gap-3 items-end">
                    {time.years > 0 && (
                        <TimeUnit value={time.years} label="y" />
                    )}
                    {time.months > 0 && (
                        <TimeUnit value={time.months} label="mo" />
                    )}
                    <TimeUnit value={time.days} label="d" />
                    <TimeUnit value={time.hours} label="h" />
                    <TimeUnit value={time.minutes} label="m" />
                    <TimeUnit value={secondsClean % 60} label="s" />
                </div>
            ) : (
                <RecoveryHeatmap trackerId={tracker.id} startTime={startTime} />
            )}
        </WidgetShell>
    );
}
