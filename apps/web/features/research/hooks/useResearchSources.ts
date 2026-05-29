'use client';

import { useMemo, useState } from 'react';
import type {
    ResearchSourceConfig,
    ResearchSourceKind,
} from '@/features/research/types/research';

const STORAGE_KEY = 'webwidgets.research.sources.v1';

type StoredSources = {
    activeSourceId?: string;
    sources: ResearchSourceConfig[];
};

function readSources(): StoredSources {
    if (typeof window === 'undefined') return { sources: [] };
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { sources: [] };
        const parsed = JSON.parse(raw) as StoredSources;
        return {
            ...(parsed.activeSourceId
                ? { activeSourceId: parsed.activeSourceId }
                : {}),
            sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        };
    } catch {
        return { sources: [] };
    }
}

function writeSources(value: StoredSources) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function useResearchSources() {
    const [stored, setStored] = useState<StoredSources>(() => readSources());
    const hasHydrated = true;

    const activeSource = useMemo(
        () =>
            stored.sources.find(
                (source) => source.id === stored.activeSourceId,
            ) ?? stored.sources[0],
        [stored.activeSourceId, stored.sources],
    );

    const saveLocalSource = (input: {
        name: string;
        rootPath: string;
        kind: ResearchSourceKind;
    }) => {
        const source: ResearchSourceConfig = {
            id: crypto.randomUUID(),
            name: input.name.trim() || 'Local research source',
            kind: input.kind,
            rootPath: input.rootPath.trim(),
            createdAt: new Date().toISOString(),
        };
        const next = {
            activeSourceId: source.id,
            sources: [
                source,
                ...stored.sources.filter(
                    (existing) => existing.rootPath !== source.rootPath,
                ),
            ],
        };
        setStored(next);
        writeSources(next);
    };

    const clearActiveSource = () => {
        const next = { sources: [] };
        setStored(next);
        writeSources(next);
    };

    return {
        activeSource,
        hasHydrated,
        saveLocalSource,
        clearActiveSource,
        sources: stored.sources,
    };
}
