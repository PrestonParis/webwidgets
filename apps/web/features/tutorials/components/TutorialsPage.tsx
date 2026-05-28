'use client';

import {
    ArrowRight,
    Check,
    CirclePlay,
    Compass,
    Filter,
    GraduationCap,
    ListChecks,
    Map,
    Play,
    RefreshCcw,
    Search,
    Sparkles,
    Timer,
} from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { useTutorials } from '../hooks/useTutorials';
import type {
    TutorialDifficulty,
    TutorialLesson,
    TutorialStatus,
} from '../types/tutorials';

const difficultyStyles: Record<TutorialDifficulty, string> = {
    starter:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
    intermediate:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
    advanced:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
};

const statusStyles: Record<TutorialStatus, string> = {
    'not-started':
        'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300',
    'in-progress':
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
    complete:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
};

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function Pill({
    children,
    className,
}: {
    children: React.ReactNode;
    className: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium',
                className,
            )}
        >
            {children}
        </span>
    );
}

function LessonCard({
    lesson,
    onAdvance,
}: {
    lesson: TutorialLesson;
    onAdvance: (id: string) => void;
}) {
    return (
        <article className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {lesson.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {lesson.description}
                    </p>
                </div>
                <Pill className={statusStyles[lesson.status]}>
                    {lesson.status.replace('-', ' ')}
                </Pill>
            </div>
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                    Outcome
                </p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {lesson.outcome}
                </p>
            </div>
            <div className="mt-4 grid gap-2">
                {lesson.checklist.map((item) => (
                    <div
                        key={item}
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                    >
                        <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                            <Check size={12} />
                        </span>
                        {item}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <Timer size={13} />
                    {lesson.minutes} min
                </span>
                <Button
                    size="sm"
                    variant={
                        lesson.status === 'complete' ? 'secondary' : 'primary'
                    }
                    icon={lesson.status === 'complete' ? Check : Play}
                    onClick={() => onAdvance(lesson.id)}
                >
                    {lesson.status === 'not-started'
                        ? 'Start'
                        : lesson.status === 'in-progress'
                          ? 'Complete'
                          : 'Done'}
                </Button>
            </div>
        </article>
    );
}

export function TutorialsPage() {
    const {
        tracks,
        activeTrack,
        activeTrackId,
        setActiveTrackId,
        visibleLessons,
        playbooks,
        filters,
        updateFilter,
        resetFilters,
        advanceLesson,
        togglePlaybook,
        completion,
    } = useTutorials();
    const toast = useToastContext();

    return (
        <main
            id="main-content"
            className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 lg:px-12"
        >
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                <GraduationCap size={13} />
                                Tutorials
                            </span>
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                <Compass size={13} />
                                Guided product mastery
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 dark:text-zinc-50 md:text-4xl">
                            Learn the personal operating layer one workflow at a
                            time.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            Persistent guided paths for dashboard setup, widget
                            composition, automations, privacy, integrations, and
                            research workflows.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            icon={RefreshCcw}
                            onClick={resetFilters}
                        >
                            Reset
                        </Button>
                        <Button
                            icon={Sparkles}
                            onClick={() =>
                                toast.success(
                                    'Personalized learning path generated from workspace usage.',
                                )
                            }
                        >
                            Generate path
                        </Button>
                    </div>
                </div>

                <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                            <label className="min-w-0 flex-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Search lessons
                                <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                                    <Search
                                        size={15}
                                        className="text-zinc-400"
                                    />
                                    <input
                                        value={filters.query}
                                        onChange={(event) =>
                                            updateFilter(
                                                'query',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Scenes, privacy, automations, integrations"
                                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                                    />
                                </span>
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Track
                                <select
                                    value={filters.track}
                                    onChange={(event) =>
                                        updateFilter(
                                            'track',
                                            event.target
                                                .value as typeof filters.track,
                                        )
                                    }
                                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="all">All tracks</option>
                                    {tracks.map((track) => (
                                        <option key={track.id} value={track.id}>
                                            {track.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Difficulty
                                <select
                                    value={filters.difficulty}
                                    onChange={(event) =>
                                        updateFilter(
                                            'difficulty',
                                            event.target
                                                .value as typeof filters.difficulty,
                                        )
                                    }
                                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="all">All levels</option>
                                    <option value="starter">Starter</option>
                                    <option value="intermediate">
                                        Intermediate
                                    </option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </label>
                            <Button
                                variant="secondary"
                                icon={Filter}
                                onClick={() =>
                                    updateFilter('status', 'in-progress')
                                }
                            >
                                In progress
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                                    Overall progress
                                </p>
                                <strong className="mt-2 block text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                                    {completion}%
                                </strong>
                            </div>
                            <ListChecks size={22} className="text-zinc-400" />
                        </div>
                        <div className="mt-4">
                            <ProgressBar value={completion} />
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
                    <aside className="space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                Learning tracks
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Pick the product surface you want to master.
                            </p>
                        </div>
                        {tracks.map((track) => {
                            const Icon = track.icon;
                            return (
                                <button
                                    key={track.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTrackId(track.id);
                                        updateFilter('track', track.id);
                                    }}
                                    className={cn(
                                        'w-full rounded-lg border p-4 text-left transition',
                                        activeTrackId === track.id
                                            ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                                            : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                            <Icon size={18} />
                                        </span>
                                        <Pill
                                            className={
                                                difficultyStyles[
                                                    track.difficulty
                                                ]
                                            }
                                        >
                                            {track.difficulty}
                                        </Pill>
                                    </div>
                                    <h3 className="mt-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        {track.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                        {track.description}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
                                        <span>{track.lessons} lessons</span>
                                        <span>{track.minutes} min</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        <ProgressBar value={track.completion} />
                                        <span className="w-10 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                                            {track.completion}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </aside>

                    <section className="space-y-4">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                                        Featured track
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                                        {activeTrack.title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                        {activeTrack.description}
                                    </p>
                                </div>
                                <CirclePlay
                                    size={24}
                                    className="shrink-0 text-blue-500"
                                />
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                    <p className="text-xs text-zinc-500">
                                        Lessons
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        {activeTrack.lessons}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                    <p className="text-xs text-zinc-500">
                                        Duration
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        {activeTrack.minutes} min
                                    </p>
                                </div>
                                <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                    <p className="text-xs text-zinc-500">
                                        Completion
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        {activeTrack.completion}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            {visibleLessons.map((lesson) => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onAdvance={advanceLesson}
                                />
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-4 flex items-center gap-2">
                                <Map size={17} className="text-blue-500" />
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Playbooks
                                </h2>
                            </div>
                            <div className="grid gap-3">
                                {playbooks.map((playbook) => (
                                    <button
                                        key={playbook.id}
                                        type="button"
                                        onClick={() =>
                                            togglePlaybook(playbook.id)
                                        }
                                        className="rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                                {playbook.title}
                                            </h3>
                                            <span
                                                className={cn(
                                                    'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase',
                                                    playbook.enabled
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-950',
                                                )}
                                            >
                                                {playbook.enabled
                                                    ? 'on'
                                                    : 'off'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                            {playbook.description}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                                            <span>
                                                {playbook.recommendedFor}
                                            </span>
                                            <span>{playbook.steps} steps</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-4 flex items-center gap-2">
                                <ArrowRight
                                    size={17}
                                    className="text-emerald-500"
                                />
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Next unlocked skills
                                </h2>
                            </div>
                            <div className="grid gap-2">
                                {[
                                    'Turn a widget into an action source',
                                    'Create a low-profile privacy scene',
                                    'Route a document into Reading and Knowledge',
                                    'Review automation approvals safely',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>
                </section>
            </section>
        </main>
    );
}
