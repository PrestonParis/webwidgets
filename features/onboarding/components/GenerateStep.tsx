import {
    CheckCircle2,
    LayoutDashboard,
    ListChecks,
    WandSparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
    GeneratedWorkspace,
    OnboardingPreferences,
} from '@/features/onboarding/types/profile';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';

interface GenerateStepProps {
    selectedCount: number;
    bucketCount: number;
    recommendation: WorkspaceRecommendation;
    preferences: OnboardingPreferences;
    generatedWorkspace: GeneratedWorkspace | null;
}

export function GenerateStep({
    selectedCount,
    bucketCount,
    recommendation,
    preferences,
    generatedWorkspace,
}: GenerateStepProps) {
    const scenes = generatedWorkspace?.scenes ?? [
        'Command center',
        'Tracking review',
    ];
    return (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <WandSparkles className="h-6 w-6 text-[#4f6ef7]" />
                <h3 className="mt-5 text-2xl font-semibold">
                    Ready to generate
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Your first dashboard will use the selected widgets, save
                    your layout preference, and keep recommendation data
                    available for future setup passes.
                </p>

                <div className="mt-6 grid gap-3">
                    <Metric
                        label="Starter widgets"
                        value={String(selectedCount)}
                    />
                    <Metric
                        label="Bucket suggestions"
                        value={String(bucketCount)}
                    />
                    <Metric
                        label="Layout mode"
                        value={preferences.layoutMode}
                    />
                    <Metric label="Density" value={preferences.density} />
                    <Metric
                        label="AI assistance"
                        value={preferences.aiAssistance}
                    />
                </div>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryBlock
                        icon={LayoutDashboard}
                        title="Scenes"
                        items={scenes}
                    />
                    <SummaryBlock
                        icon={ListChecks}
                        title="Tracking"
                        items={recommendation.trackingSystems}
                    />
                    <SummaryBlock
                        icon={CheckCircle2}
                        title="Automations"
                        items={recommendation.automations.map(formatId)}
                    />
                </div>
                <div className="mt-6 rounded-lg bg-zinc-950 p-5 text-white dark:bg-white dark:text-zinc-950">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                        Personalized workspace
                    </p>
                    <p className="mt-3 text-sm leading-6 opacity-90">
                        The setup profile remains editable, so later
                        AI-generated recommendations, teams, roles, and
                        multi-device setup can reuse the same onboarding
                        structure.
                    </p>
                </div>
            </section>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-950">
            <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
            <span className="font-semibold capitalize">{value}</span>
        </div>
    );
}

function SummaryBlock({
    icon: Icon,
    title,
    items,
}: {
    icon: LucideIcon;
    title: string;
    items: string[];
}) {
    return (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <Icon className="h-5 w-5 text-[#4f6ef7]" />
            <h4 className="mt-4 text-sm font-semibold">{title}</h4>
            <div className="mt-3 space-y-2">
                {items.slice(0, 4).map((item) => (
                    <p
                        key={item}
                        className="text-sm leading-5 text-zinc-600 dark:text-zinc-300"
                    >
                        {item}
                    </p>
                ))}
            </div>
        </div>
    );
}

function formatId(id: string) {
    return id
        .split('-')
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ');
}
