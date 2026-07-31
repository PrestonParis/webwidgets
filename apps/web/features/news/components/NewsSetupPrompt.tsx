'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/utils';
import type { NewsMode, NewsCategory } from '@/features/news/types/news';

const TOPIC_OPTIONS: NewsCategory[] = [
    'politics',
    'government',
    'economy',
    'ai',
    'world',
    'religion',
    'markets',
    'local',
    'courts',
    'technology',
    'culture',
    'war',
];

const SOURCE_OPTIONS = [
    'AP',
    'Reuters',
    'WSJ',
    'NYT',
    'Fox News',
    'BBC',
    'The Hill',
    'Politico',
];

const MODE_OPTIONS: { id: NewsMode; label: string; description: string }[] = [
    {
        id: 'briefing',
        label: 'Balanced briefing',
        description: 'Curated top stories across categories',
    },
    {
        id: 'comparison',
        label: 'Ideological comparison',
        description: 'How different outlets frame the same event',
    },
    {
        id: 'market',
        label: 'Market-moving news',
        description: 'Economic and financial impact stories',
    },
    {
        id: 'civic',
        label: 'Local civic intelligence',
        description: 'Government, courts, and local issues',
    },
    {
        id: 'research',
        label: 'Research mode',
        description: 'Deep dives and background explainers',
    },
];

export function NewsSetupPrompt() {
    const [selectedTopics, setSelectedTopics] = useState<NewsCategory[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [selectedMode, setSelectedMode] = useState<NewsMode>('briefing');

    function toggleTopic(topic: NewsCategory) {
        setSelectedTopics((prev) =>
            prev.includes(topic)
                ? prev.filter((t) => t !== topic)
                : [...prev, topic],
        );
    }

    function toggleSource(source: string) {
        setSelectedSources((prev) =>
            prev.includes(source)
                ? prev.filter((s) => s !== source)
                : [...prev, source],
        );
    }

    return (
        <div className="mx-auto max-w-2xl py-12">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                    Build your news intelligence
                </h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Choose what matters to you and how you want it delivered.
                </p>
            </div>

            <div className="space-y-8">
                <section>
                    <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {TOPIC_OPTIONS.map((topic) => (
                            <button
                                key={topic}
                                onClick={() => toggleTopic(topic)}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition',
                                    selectedTopics.includes(topic)
                                        ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
                                )}
                            >
                                {topic === 'ai'
                                    ? 'AI'
                                    : topic === 'war'
                                      ? 'War & Security'
                                      : topic}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Sources
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {SOURCE_OPTIONS.map((source) => (
                            <button
                                key={source}
                                onClick={() => toggleSource(source)}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                                    selectedSources.includes(source)
                                        ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
                                )}
                            >
                                {source}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        Mode
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {MODE_OPTIONS.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={cn(
                                    'rounded-lg border p-3 text-left transition',
                                    selectedMode === mode.id
                                        ? 'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                                        : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900',
                                )}
                            >
                                <p
                                    className={cn(
                                        'text-sm font-semibold',
                                        selectedMode === mode.id
                                            ? 'text-white dark:text-zinc-950'
                                            : 'text-zinc-900 dark:text-zinc-100',
                                    )}
                                >
                                    {mode.label}
                                </p>
                                <p
                                    className={cn(
                                        'mt-0.5 text-[12px]',
                                        selectedMode === mode.id
                                            ? 'text-zinc-300 dark:text-zinc-600'
                                            : 'text-zinc-500',
                                    )}
                                >
                                    {mode.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                <button
                    disabled={selectedTopics.length === 0}
                    className="w-full rounded-lg bg-zinc-950 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                    {selectedTopics.length === 0
                        ? 'Select at least one topic'
                        : 'Start my briefing'}
                </button>
            </div>
        </div>
    );
}
