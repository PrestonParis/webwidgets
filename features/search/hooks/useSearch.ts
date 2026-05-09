'use client';

import { useState, useEffect, useRef } from 'react';
import { searchWidgets, type WidgetEntry } from '../lib/widgetCatalog';
import {
    useFolderRegistry,
    type FolderEntry,
} from '../store/useFolderRegistry';

export interface NlpSuggestion {
    widget: string;
    confidence: number;
}

export interface SearchResults {
    widgetMatches: WidgetEntry[];
    folderMatches: FolderEntry[];
    nlpSuggestions: NlpSuggestion[];
    suggestAi: boolean;
    nlpLoading: boolean;
}

export function useSearch(query: string, taskQuery: string): SearchResults {
    const folders = useFolderRegistry((s) => s.folders);
    const [nlpSuggestions, setNlpSuggestions] = useState<NlpSuggestion[]>([]);
    const [suggestAi, setSuggestAi] = useState(false);
    const [nlpLoading, setNlpLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const widgetMatches = searchWidgets(query);

    const q = query.toLowerCase().trim();
    const folderMatches = folders.filter((f) =>
        f.name.toLowerCase().includes(q),
    );

    useEffect(() => {
        const task = taskQuery.trim();
        if (!task) {
            setNlpSuggestions([]);
            setSuggestAi(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setNlpLoading(true);

            async function fetchSuggestions() {
                try {
                    const res = await fetch('/api/search/suggest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: task, top_k: 3 }),
                    });
                    if (res.ok) {
                        const data = (await res.json()) as {
                            suggestions: NlpSuggestion[];
                            suggest_ai: boolean;
                        };
                        setNlpSuggestions(data.suggestions);
                        setSuggestAi(data.suggest_ai);
                    } else {
                        setSuggestAi(true);
                    }
                } catch {
                    setSuggestAi(true);
                } finally {
                    setNlpLoading(false);
                }
            }

            void fetchSuggestions();
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [taskQuery]);

    return {
        widgetMatches,
        folderMatches,
        nlpSuggestions,
        suggestAi,
        nlpLoading,
    };
}
