'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { getExactTimeParts } from '@/lib/utils/time';
import { SoberWidgetProps } from '@/features/recovery/types/recovery';
import { RecoveryView } from '@/features/widgets/types/widgets';
import TimeUnit from '@/features/recovery/components/TimeUnit';
import RecoveryHeatmap from '@/features/recovery/components/RecoveryHeatmap';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { HeartIcon } from '@/icons/HeartIcon';
import { useUrgeForm } from '@/features/recovery/hooks/useUrgeForm';
import SoberWidgetFooter from '@/features/recovery/components/SoberWidgetFooter';
import ViewToggle from '@/features/recovery/components/ViewToggle';
import { useSecondsClean } from '@/features/recovery/hooks/useSecondsClean';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';

function EmptyRecoveryWidget({
    settings,
    settingsSlot,
    updateSettings,
    trackerId,
}: {
    settings: ReturnType<typeof useWidgetSettings>['settings'];
    settingsSlot: ReactNode;
    updateSettings: ReturnType<typeof useWidgetSettings>['updateSettings'];
    trackerId: string;
}) {
    return (
        <WidgetShell
            icon={<HeartIcon />}
            title="Recovery Tracker"
            settings={settings}
            onSettingsChange={updateSettings}
            settingsSlot={settingsSlot}
            footerHref="/recovery"
            footerLabel="View full page →"
            widgetId={trackerId}
            widgetType="recovery"
        >
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                No streak started. Visit the recovery page to begin.
            </p>
        </WidgetShell>
    );
}

function TimerView({
    secondsClean,
    startTime,
}: {
    secondsClean: number;
    startTime: string;
}) {
    const time = getExactTimeParts(startTime);
    return (
        <div className="flex flex-wrap gap-3 items-end">
            {time.years > 0 && <TimeUnit value={time.years} label="y" />}
            {time.months > 0 && <TimeUnit value={time.months} label="mo" />}
            <TimeUnit value={time.days} label="d" />
            <TimeUnit value={time.hours} label="h" />
            <TimeUnit value={time.minutes} label="m" />
            <TimeUnit value={secondsClean % 60} label="s" />
        </div>
    );
}

function RecoveryContent({
    secondsClean,
    startTime,
    trackerId,
    view,
}: {
    secondsClean: number;
    startTime: string;
    trackerId: string;
    view: RecoveryView;
}) {
    return view === 'timer' ? (
        <TimerView secondsClean={secondsClean} startTime={startTime} />
    ) : (
        <RecoveryHeatmap trackerId={trackerId} startTime={startTime} />
    );
}

export default function SoberWidget({ tracker, onReset }: SoberWidgetProps) {
    const [startTime, setStartTime] = useState(tracker.start_time);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { settings, updateSettings } = useWidgetSettings(
        tracker.id,
        'recovery',
    );
    const view = (settings.view as RecoveryView) ?? 'timer';
    const urgeForm = useUrgeForm(tracker.id);
    const secondsClean = useSecondsClean(startTime);

    const settingsSlot = (
        <ViewToggle
            view={view}
            onViewChange={(v) => updateSettings({ view: v })}
        />
    );

    const handleConfirmReset = () => {
        const now = new Date().toISOString();
        setStartTime(now);
        onReset(tracker.id, now);
        setConfirmOpen(false);
    };

    const footerSlot = (
        <SoberWidgetFooter
            showUrgeForm={urgeForm.showUrgeForm}
            trigger={urgeForm.trigger}
            replacement={urgeForm.replacement}
            selectedTags={urgeForm.selectedTags}
            intensity={urgeForm.intensity}
            isSaving={urgeForm.isSaving}
            canSave={urgeForm.canSave}
            linkHref={`/recovery#${tracker.id}`}
            onTriggerChange={urgeForm.setTrigger}
            onReplacementChange={urgeForm.setReplacement}
            onToggleTag={urgeForm.toggleTag}
            onIntensityChange={urgeForm.setIntensity}
            onLogUrge={() => {
                void urgeForm.handleLogUrge();
            }}
            onCancelUrge={urgeForm.handleCancel}
            onShowUrgeForm={() => urgeForm.setShowUrgeForm(true)}
            onReset={() => setConfirmOpen(true)}
        />
    );

    if (!startTime) {
        return (
            <EmptyRecoveryWidget
                settings={settings}
                settingsSlot={settingsSlot}
                trackerId={tracker.id}
                updateSettings={updateSettings}
            />
        );
    }

    return (
        <>
            <WidgetShell
                icon={<HeartIcon />}
                title="Recovery Tracker"
                badge={tracker.addiction || undefined}
                settings={settings}
                onSettingsChange={updateSettings}
                settingsSlot={settingsSlot}
                footerSlot={footerSlot}
                widgetId={tracker.id}
                widgetType="recovery"
            >
                <RecoveryContent
                    secondsClean={secondsClean}
                    startTime={startTime}
                    trackerId={tracker.id}
                    view={view}
                />
            </WidgetShell>
            {confirmOpen && (
                <ConfirmModal
                    title="Reset streak?"
                    message="This will set your start time to right now. Your logged urges will remain."
                    confirmLabel="Reset"
                    destructive
                    onConfirm={handleConfirmReset}
                    onCancel={() => setConfirmOpen(false)}
                />
            )}
        </>
    );
}
