'use client';

import {
    AudioLines,
    Brain,
    Check,
    Eye,
    Keyboard,
    MousePointer2,
    RotateCcw,
    Save,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { useAccessibilityCenter } from '../hooks/useAccessibilityCenter';
import { useAccessibility } from './AccessibilityContext';
import type { Density } from './AccessibilityContext';
import type {
    AccessibilityPreference,
    AccessibilityMode,
} from '../types/accessibility';

// ─── plain-language display config ────────────────────────────────────────────

interface PrefDisplay {
    label: string;
    detail: string;
    icon: LucideIcon;
}

const PREF_DISPLAY: Record<string, PrefDisplay> = {
    'pref-contrast': {
        label: 'High contrast',
        detail: 'Make text and controls easier to see.',
        icon: Eye,
    },
    'pref-motion': {
        label: 'Reduce motion',
        detail: 'Fewer animations and transitions.',
        icon: MousePointer2,
    },
    'pref-focus': {
        label: 'Focus outlines',
        detail: 'Always show keyboard focus rings.',
        icon: Keyboard,
    },
    'pref-density': {
        label: 'Spacing',
        detail: 'How much room the interface uses.',
        icon: Brain,
    },
    'pref-captions': {
        label: 'Show transcriptions',
        detail: 'Prefer text for audio and video content.',
        icon: AudioLines,
    },
};

const MODE_DISPLAY: Record<string, { label: string; detail: string }> = {
    'mode-reader': {
        label: 'Reader comfort',
        detail: 'Larger text and calmer contrast for reading.',
    },
    'mode-keyboard': {
        label: 'Keyboard navigation',
        detail: 'Navigate with keyboard commands and shortcuts.',
    },
    'mode-low-load': {
        label: 'Low cognitive load',
        detail: 'Simpler views and fewer distractions.',
    },
};

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'standard', label: 'Standard' },
    { value: 'compact', label: 'Compact' },
];

// ─── toggle ───────────────────────────────────────────────────────────────────

function Toggle({
    enabled,
    onToggle,
    label,
    large,
}: {
    enabled: boolean;
    onToggle: () => void;
    label: string;
    large?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            onClick={onToggle}
            className={cn(
                'relative shrink-0 rounded-full transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2',
                large ? 'h-8 w-14' : 'h-6 w-11',
                enabled
                    ? 'bg-zinc-900 dark:bg-zinc-100'
                    : 'bg-zinc-200 dark:bg-zinc-700',
            )}
        >
            <span
                className={cn(
                    'absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-zinc-950',
                    large ? 'h-6 w-6' : 'h-4.5 w-4.5',
                    enabled
                        ? large
                            ? 'left-[calc(100%-1.75rem)]'
                            : 'left-[calc(100%-1.25rem)]'
                        : large
                          ? 'left-1'
                          : 'left-1',
                )}
            />
        </button>
    );
}

// ─── preference row ───────────────────────────────────────────────────────────

function PrefRow({
    pref,
    density,
    onToggle,
    onDensity,
}: {
    pref: AccessibilityPreference;
    density: Density;
    onToggle: () => void;
    onDensity: (v: Density) => void;
}) {
    const display = PREF_DISPLAY[pref.id];
    if (!display) return null;
    const Icon = display.icon;

    return (
        <div className="flex items-start gap-4 py-5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {display.label}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {display.detail}
                </p>
                {pref.control === 'slider' && (
                    <div className="mt-3 flex gap-1.5">
                        {DENSITY_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onDensity(value)}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                    density === value
                                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {pref.control === 'toggle' && (
                <Toggle
                    enabled={pref.enabled}
                    onToggle={onToggle}
                    label={display.label}
                />
            )}
        </div>
    );
}

// ─── 1D mode hero ─────────────────────────────────────────────────────────────

function OneDModeHero({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border-2 p-6 transition-colors duration-200',
                enabled
                    ? 'border-zinc-900 bg-zinc-950 dark:border-zinc-100 dark:bg-zinc-900'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p
                        className={cn(
                            'text-lg font-semibold',
                            enabled
                                ? 'text-white dark:text-zinc-50'
                                : 'text-zinc-900 dark:text-zinc-50',
                        )}
                    >
                        Simplified workspace
                    </p>
                    <p
                        className={cn(
                            'mt-1 text-sm',
                            enabled
                                ? 'text-zinc-400'
                                : 'text-zinc-500 dark:text-zinc-400',
                        )}
                    >
                        Focus on one thing at a time.
                    </p>
                </div>
                <Toggle
                    enabled={enabled}
                    onToggle={onToggle}
                    label="Simplified workspace mode"
                    large
                />
            </div>
            <ul className="mt-5 space-y-2.5">
                {[
                    'Single-column layout — no drag-and-drop complexity',
                    'Advanced controls are hidden by default',
                    'Text and spacing are enlarged throughout',
                ].map((benefit) => (
                    <li
                        key={benefit}
                        className="flex items-center gap-2.5 text-sm"
                    >
                        <span
                            className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                                enabled
                                    ? 'bg-emerald-500'
                                    : 'bg-zinc-100 dark:bg-zinc-800',
                            )}
                        >
                            <Check
                                size={11}
                                className={
                                    enabled
                                        ? 'text-white'
                                        : 'text-zinc-400 dark:text-zinc-500'
                                }
                            />
                        </span>
                        <span
                            className={
                                enabled
                                    ? 'text-zinc-300'
                                    : 'text-zinc-600 dark:text-zinc-400'
                            }
                        >
                            {benefit}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── mode row ─────────────────────────────────────────────────────────────────

function ModeRow({
    mode,
    onToggle,
}: {
    mode: AccessibilityMode;
    onToggle: () => void;
}) {
    const display = MODE_DISPLAY[mode.id];
    const label = display?.label ?? mode.name;
    const detail = display?.detail ?? mode.description;

    return (
        <div className="flex items-center gap-4 py-5">
            <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                    {label}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {detail}
                </p>
            </div>
            <Toggle enabled={mode.enabled} onToggle={onToggle} label={label} />
        </div>
    );
}

// ─── section header ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {children}
        </p>
    );
}

function Divider() {
    return <div className="border-t border-zinc-100 dark:border-zinc-800" />;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function AccessibilityCenterPage() {
    const {
        preferences,
        modes,
        density,
        setDensity,
        togglePreference,
        toggleMode,
        resetPreferences,
        saving,
        saveSettings,
    } = useAccessibilityCenter();
    const { oneDimensionalMode } = useAccessibility();
    const toast = useToastContext();

    const mode1d = modes.find((m) => m.id === 'mode-1d');
    const otherModes = modes.filter((m) => m.id !== 'mode-1d');

    async function handleSave() {
        await saveSettings();
        toast.success('Saved.');
    }

    return (
        <main
            id="main-content"
            className={cn(
                'min-h-screen bg-zinc-50 dark:bg-zinc-950',
                oneDimensionalMode ? 'px-4 py-10' : 'px-6 py-10 lg:px-12',
            )}
        >
            <div className="mx-auto max-w-xl">
                {/* ── header ── */}
                <div className="mb-10">
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        Accessibility
                    </h1>
                    <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
                        Make WebWidgets work the way you need it to.
                    </p>
                </div>

                {/* ── preferences ── */}
                <section className="mb-10">
                    <SectionLabel>Preferences</SectionLabel>
                    <div className="rounded-2xl border border-zinc-200 bg-white px-5 dark:border-zinc-800 dark:bg-zinc-900">
                        {preferences.map((pref, i) => (
                            <div key={pref.id}>
                                {i > 0 && <Divider />}
                                <PrefRow
                                    pref={pref}
                                    density={density}
                                    onToggle={() => togglePreference(pref.id)}
                                    onDensity={setDensity}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 1D mode hero ── */}
                {mode1d && (
                    <section className="mb-10">
                        <SectionLabel>Simplified mode</SectionLabel>
                        <OneDModeHero
                            enabled={mode1d.enabled}
                            onToggle={() => toggleMode('mode-1d')}
                        />
                    </section>
                )}

                {/* ── other modes ── */}
                {otherModes.length > 0 && (
                    <section className="mb-10">
                        <SectionLabel>Other modes</SectionLabel>
                        <div className="rounded-2xl border border-zinc-200 bg-white px-5 dark:border-zinc-800 dark:bg-zinc-900">
                            {otherModes.map((mode, i) => (
                                <div key={mode.id}>
                                    {i > 0 && <Divider />}
                                    <ModeRow
                                        mode={mode}
                                        onToggle={() => toggleMode(mode.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── footer actions ── */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <button
                        type="button"
                        onClick={resetPreferences}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
                    >
                        <RotateCcw size={14} />
                        Reset to defaults
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
                    >
                        <Save size={14} />
                        {saving ? 'Saving…' : 'Save preferences'}
                    </button>
                </div>
            </div>
        </main>
    );
}
