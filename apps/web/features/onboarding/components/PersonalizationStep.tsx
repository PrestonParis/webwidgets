'use client';

import type { ReactNode } from 'react';
import { Grid2X2, LayoutPanelLeft, Sparkles } from 'lucide-react';
import type {
    AiAssistanceLevel,
    OnboardingComplexity,
    OnboardingPreferences,
    WidgetDensity,
    WorkspaceStyle,
} from '@/features/onboarding/types/profile';

interface PersonalizationStepProps {
    preferences: OnboardingPreferences;
    onChange: (preferences: Partial<OnboardingPreferences>) => void;
}

const styles: { value: WorkspaceStyle; label: string; detail: string }[] = [
    {
        value: 'focused',
        label: 'Focused',
        detail: 'Quiet, direct, and action-first.',
    },
    {
        value: 'technical',
        label: 'Technical',
        detail: 'Dense controls for builder workflows.',
    },
    {
        value: 'calm',
        label: 'Calm',
        detail: 'Softer rhythm for tracking and reflection.',
    },
    {
        value: 'editorial',
        label: 'Editorial',
        detail: 'Writing and research surfaces get more space.',
    },
];

const densities: { value: WidgetDensity; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'expanded', label: 'Expanded' },
];

const complexities: { value: OnboardingComplexity; label: string }[] = [
    { value: 'guided', label: 'Guided' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'advanced', label: 'Advanced' },
];

const aiLevels: { value: AiAssistanceLevel; label: string }[] = [
    { value: 'minimal', label: 'Minimal' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'proactive', label: 'Proactive' },
];

export function PersonalizationStep({
    preferences,
    onChange,
}: PersonalizationStepProps) {
    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#4f6ef7]" />
                    <h3 className="text-lg font-semibold">Workspace style</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {styles.map((style) => (
                        <OptionButton
                            key={style.value}
                            active={preferences.workspaceStyle === style.value}
                            label={style.label}
                            detail={style.detail}
                            onClick={() =>
                                onChange({ workspaceStyle: style.value })
                            }
                        />
                    ))}
                </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <LayoutPanelLeft className="h-5 w-5 text-[#4f6ef7]" />
                    <h3 className="text-lg font-semibold">Layout defaults</h3>
                </div>
                <SegmentedControl
                    label="Mode"
                    icon={<Grid2X2 className="h-4 w-4" />}
                    value={preferences.layoutMode}
                    options={[
                        { value: 'grid', label: 'Grid' },
                        { value: 'free', label: 'Free' },
                    ]}
                    onChange={(layoutMode) => onChange({ layoutMode })}
                />
                <SegmentedControl
                    label="Density"
                    value={preferences.density}
                    options={densities}
                    onChange={(density) => onChange({ density })}
                />
                <SegmentedControl
                    label="Setup depth"
                    value={preferences.complexity}
                    options={complexities}
                    onChange={(complexity) => onChange({ complexity })}
                />
                <SegmentedControl
                    label="AI assistance"
                    value={preferences.aiAssistance}
                    options={aiLevels}
                    onChange={(aiAssistance) => onChange({ aiAssistance })}
                />
            </section>
        </div>
    );
}

function OptionButton({
    active,
    label,
    detail,
    onClick,
}: {
    active: boolean;
    label: string;
    detail: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg border p-4 text-left transition ${
                active
                    ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
            }`}
        >
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {detail}
            </p>
        </button>
    );
}

function SegmentedControl<T extends string>({
    label,
    value,
    options,
    icon,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    icon?: ReactNode;
    onChange: (value: T) => void;
}) {
    return (
        <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {icon}
                {label}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            value === option.value
                                ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-950'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
