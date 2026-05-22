'use client';

import { useMemo, useState } from 'react';
import {
    tutorialLessons,
    tutorialPlaybooks,
    tutorialTracks,
} from '../data';
import type {
    TutorialFilters,
    TutorialLesson,
    TutorialPlaybook,
    TutorialTrack,
} from '../types';

const defaultFilters: TutorialFilters = {
    query: '',
    track: 'all',
    difficulty: 'all',
    status: 'all',
};

function matchesLesson(
    lesson: TutorialLesson,
    track: TutorialTrack | undefined,
    filters: TutorialFilters,
) {
    const query = filters.query.trim().toLowerCase();
    const haystack = [
        lesson.title,
        lesson.description,
        lesson.outcome,
        track?.title,
        track?.description,
    ]
        .join(' ')
        .toLowerCase();
    return (
        (!query || haystack.includes(query)) &&
        (filters.track === 'all' || lesson.trackId === filters.track) &&
        (filters.status === 'all' || lesson.status === filters.status) &&
        (filters.difficulty === 'all' ||
            track?.difficulty === filters.difficulty)
    );
}

export function useTutorials() {
    const [filters, setFilters] = useState<TutorialFilters>(defaultFilters);
    const [lessons, setLessons] = useState<TutorialLesson[]>(tutorialLessons);
    const [playbooks, setPlaybooks] =
        useState<TutorialPlaybook[]>(tutorialPlaybooks);
    const [activeTrackId, setActiveTrackId] = useState(tutorialTracks[0]?.id ?? '');

    const activeTrack =
        tutorialTracks.find((track) => track.id === activeTrackId) ??
        tutorialTracks[0]!;

    const visibleLessons = useMemo(
        () =>
            lessons.filter((lesson) =>
                matchesLesson(
                    lesson,
                    tutorialTracks.find((track) => track.id === lesson.trackId),
                    filters,
                ),
            ),
        [filters, lessons],
    );

    const updateFilter = <Key extends keyof TutorialFilters>(
        key: Key,
        value: TutorialFilters[Key],
    ) => setFilters((current) => ({ ...current, [key]: value }));

    const resetFilters = () => setFilters(defaultFilters);

    const advanceLesson = (id: string) => {
        setLessons((current) =>
            current.map((lesson) => {
                if (lesson.id !== id) return lesson;
                if (lesson.status === 'complete') return lesson;
                return {
                    ...lesson,
                    status:
                        lesson.status === 'not-started'
                            ? 'in-progress'
                            : 'complete',
                };
            }),
        );
    };

    const togglePlaybook = (id: string) => {
        setPlaybooks((current) =>
            current.map((playbook) =>
                playbook.id === id
                    ? { ...playbook, enabled: !playbook.enabled }
                    : playbook,
            ),
        );
    };

    const completed = lessons.filter(
        (lesson) => lesson.status === 'complete',
    ).length;
    const completion = Math.round((completed / lessons.length) * 100);

    return {
        tracks: tutorialTracks,
        activeTrack,
        activeTrackId,
        setActiveTrackId,
        lessons,
        visibleLessons,
        playbooks,
        filters,
        updateFilter,
        resetFilters,
        advanceLesson,
        togglePlaybook,
        completion,
    };
}
