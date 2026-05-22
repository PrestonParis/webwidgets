import { useState, useRef } from 'react';
import type {
    WidgetSettings,
    WidgetSize,
    VisibilitySchedule,
} from '../types/widgets';
import { DEFAULT_SCHEDULE } from '../types/widgetDefaults';
import { useBucketWidget } from '@/features/dashboard/lib/BucketWidgetContext';
import { useUnpresentWidget } from '@/features/dashboard/lib/UnpresentWidgetContext';
import { useClickOutside } from './useClickOutside';

const SIZE_CYCLE: WidgetSize[] = ['compact', 'default', 'wide', 'large'];

export function useWidgetHeader(
    settings: WidgetSettings,
    title: string,
    onSettingsChange?: (patch: Partial<WidgetSettings>) => void,
    onRename?: (name: string) => void,
) {
    const onBucket = useBucketWidget();
    const onUnpresent = useUnpresentWidget();

    const [colorOpen, setColorOpen] = useState(false);
    const [visOpen, setVisOpen] = useState(false);
    const [bgOpen, setBgOpen] = useState(false);
    const [pinFlash, setPinFlash] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [draftTitle, setDraftTitle] = useState('');

    const colorRef = useRef<HTMLDivElement>(null);
    const visRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useClickOutside(colorRef, () => setColorOpen(false), colorOpen);
    useClickOutside(visRef, () => setVisOpen(false), visOpen);
    useClickOutside(bgRef, () => setBgOpen(false), bgOpen);

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string')
                onSettingsChange?.({ backgroundImage: ev.target.result });
        };
        reader.readAsDataURL(file);
    }

    function startRename() {
        if (!onRename) return;
        setDraftTitle(title);
        setRenaming(true);
        setTimeout(() => titleInputRef.current?.select(), 0);
    }

    function commitRename() {
        onRename?.(draftTitle.trim() || title);
        setRenaming(false);
    }

    function togglePin() {
        if (settings.pinMode !== 'none') {
            onSettingsChange?.({ pinMode: 'none' });
        } else {
            onSettingsChange?.({ pinMode: 'viewport' });
            setPinFlash(true);
            setTimeout(() => setPinFlash(false), 1500);
        }
    }

    function cycleSize() {
        const idx = SIZE_CYCLE.indexOf(settings.size);
        onSettingsChange?.({
            size: SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length] as WidgetSize,
        });
    }

    function patchSchedule(patch: Partial<VisibilitySchedule>) {
        onSettingsChange?.({
            schedule: { ...(settings.schedule ?? DEFAULT_SCHEDULE), ...patch },
        });
    }

    function toggleScheduleEnabled() {
        const current = settings.schedule ?? DEFAULT_SCHEDULE;
        onSettingsChange?.({
            schedule: { ...current, enabled: !current.enabled },
        });
    }

    function toggleDay(d: number) {
        const days = settings.schedule?.days ?? [];
        patchSchedule({
            days: days.includes(d)
                ? days.filter((x) => x !== d)
                : [...days, d].sort(),
        });
    }

    return {
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
        isPinned: settings.pinMode !== 'none',
        scheduleEnabled: settings.schedule?.enabled ?? false,
    };
}
