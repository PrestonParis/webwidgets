'use client';

import Image from 'next/image';
import { Upload, XCircle, Archive } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetSettings, VisibilitySchedule, WidgetColor } from '@/features/widgets/types/widgets';
import { DEFAULT_SCHEDULE } from '@/features/widgets/types/widgetDefaults';
import { colorMap, COLORS } from '@/features/widgets/constants';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const PRIVACY_TOGGLES = [
    {
        key: 'lowProfile' as const,
        label: 'Low profile',
        patch: (v: boolean) => ({ lowProfile: v, blur: false as const, redact: false as const }),
    },
    {
        key: 'blur' as const,
        label: 'Blur content',
        patch: (v: boolean) => ({ blur: v, redact: false as const, lowProfile: false as const }),
    },
    {
        key: 'redact' as const,
        label: 'Redact content',
        patch: (v: boolean) => ({ redact: v, blur: false as const, lowProfile: false as const }),
    },
    {
        key: 'autoHide' as const,
        label: 'Auto-hide',
        patch: (v: boolean) => ({ autoHide: v }),
    },
];

const TOGGLE_TRACK = 'w-7 h-4 rounded-full transition-colors shrink-0';
const TOGGLE_THUMB = 'block w-3 h-3 rounded-full mt-0.5 transition-all';

// ─── Background Panel ─────────────────────────────────────────────────────────

interface BackgroundPanelProps {
    settings: WidgetSettings;
    onSettingsChange: (p: Partial<WidgetSettings>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onUploadClick: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BackgroundPanel({
    settings,
    onSettingsChange,
    fileInputRef,
    onUploadClick,
    onFileUpload,
}: BackgroundPanelProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3 space-y-3">
            <div>
                <div className="flex justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Opacity</p>
                    <span className="text-[10px] font-mono text-zinc-400">{settings.opacity}%</span>
                </div>
                <input
                    type="range" min={10} max={100} step={5} value={settings.opacity}
                    onChange={(e) => onSettingsChange({ opacity: Number(e.target.value) })}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Image</p>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onFileUpload} />
                {settings.backgroundImage ? (
                    <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden h-20 bg-zinc-100 dark:bg-zinc-800">
                            <Image src={settings.backgroundImage} alt="" fill sizes="240px" unoptimized className="object-cover" />
                            <button
                                onClick={() => onSettingsChange({ backgroundImage: '' })}
                                className="absolute top-1 right-1 text-white bg-black/50 rounded-full p-0.5 hover:bg-black/70 transition-colors"
                            >
                                <XCircle size={14} />
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Brightness</p>
                                <span className="text-[10px] font-mono text-zinc-400">{settings.backgroundBrightness ?? 100}%</span>
                            </div>
                            <input
                                type="range" min={10} max={100} step={5} value={settings.backgroundBrightness ?? 100}
                                onChange={(e) => onSettingsChange({ backgroundBrightness: Number(e.target.value) })}
                                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                            />
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onUploadClick}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Upload size={11} /> Upload image
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

interface ColorPickerProps {
    currentColor: WidgetColor;
    onColorChange: (c: WidgetColor) => void;
}

export function ColorPicker({ currentColor, onColorChange }: ColorPickerProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl">
            <div className="grid grid-cols-3 gap-2">
                {COLORS.map((col) => (
                    <button
                        key={col}
                        onClick={() => onColorChange(col)}
                        className={cn(
                            'w-5 h-5 rounded-full transition-transform hover:scale-110',
                            colorMap[col].swatch,
                            currentColor === col && 'ring-2 ring-offset-2 dark:ring-offset-zinc-900 scale-110',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Schedule Section ─────────────────────────────────────────────────────────

interface ScheduleSectionProps {
    settings: WidgetSettings;
    scheduleEnabled: boolean;
    patchSchedule: (p: Partial<VisibilitySchedule>) => void;
    toggleScheduleEnabled: () => void;
    toggleDay: (d: number) => void;
}

export function ScheduleSection({
    settings,
    scheduleEnabled,
    patchSchedule,
    toggleScheduleEnabled,
    toggleDay,
}: ScheduleSectionProps) {
    return (
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-2.5 space-y-2">
            <button
                onClick={toggleScheduleEnabled}
                className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
                <span>Schedule</span>
                <span className={cn(TOGGLE_TRACK, scheduleEnabled ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700')}>
                    <span className={cn(TOGGLE_THUMB, scheduleEnabled ? 'ml-3.5 bg-white dark:bg-zinc-900' : 'ml-0.5 bg-white dark:bg-zinc-400')} />
                </span>
            </button>
            {scheduleEnabled && (
                <div className="space-y-2 pl-0.5">
                    <div className="flex gap-1.5">
                        {(['startTime', 'endTime'] as const).map((field, i) => (
                            <div key={field} className="flex-1">
                                <p className="text-[9px] font-semibold text-zinc-400 mb-1">{i === 0 ? 'From' : 'To'}</p>
                                <input
                                    type="time"
                                    value={settings.schedule?.[field] ?? DEFAULT_SCHEDULE[field]}
                                    onChange={(e) => patchSchedule({ [field]: e.target.value })}
                                    className="w-full text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 border-0 px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-0.5">
                        {DAYS.map((day, i) => (
                            <button
                                key={i}
                                onClick={() => toggleDay(i)}
                                className={cn(
                                    'flex-1 h-6 rounded-md text-[9px] font-bold transition-all',
                                    (settings.schedule?.days ?? []).includes(i)
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                                )}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Visibility Panel ─────────────────────────────────────────────────────────

interface VisibilityPanelProps extends ScheduleSectionProps {
    onSettingsChange: (p: Partial<WidgetSettings>) => void;
    onBucket: (() => void) | null;
    onUnpresent: (() => void) | null;
    onClose: () => void;
}

export function VisibilityPanel({
    settings,
    onSettingsChange,
    scheduleEnabled,
    patchSchedule,
    toggleScheduleEnabled,
    toggleDay,
    onBucket,
    onUnpresent,
    onClose,
}: VisibilityPanelProps) {
    return (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl p-3 space-y-2.5">
            {PRIVACY_TOGGLES.map(({ key, label, patch }) => (
                <button
                    key={key}
                    onClick={() => onSettingsChange(patch(!settings[key]))}
                    className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    <span>{label}</span>
                    <span className={cn(TOGGLE_TRACK, settings[key] ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700')}>
                        <span className={cn(TOGGLE_THUMB, settings[key] ? 'ml-3.5 bg-white dark:bg-zinc-900' : 'ml-0.5 bg-white dark:bg-zinc-400')} />
                    </span>
                </button>
            ))}
            <ScheduleSection
                settings={settings}
                scheduleEnabled={scheduleEnabled}
                patchSchedule={patchSchedule}
                toggleScheduleEnabled={toggleScheduleEnabled}
                toggleDay={toggleDay}
            />
            {(onBucket ?? onUnpresent) && (
                <>
                    <div className="border-t border-gray-100 dark:border-zinc-800" />
                    {onBucket && (
                        <button
                            onClick={() => { onBucket(); onClose(); }}
                            className="flex items-center gap-1.5 w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <Archive size={11} /> Move to bucket
                        </button>
                    )}
                    {onUnpresent && (
                        <button
                            onClick={() => { onUnpresent(); onClose(); }}
                            className="flex items-center gap-1.5 w-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                        >
                            <Archive size={11} className="opacity-60" /> Archive to library
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
