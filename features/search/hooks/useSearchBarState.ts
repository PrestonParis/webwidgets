'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearch } from './useSearch';

export function useSearchBarState() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [taskQuery, setTaskQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const results = useSearch(query, taskQuery);

    const hasResults =
        results.widgetMatches.length > 0 ||
        results.folderMatches.length > 0 ||
        results.nlpSuggestions.length > 0 ||
        results.suggestAi;

    const showDropdown =
        open && Boolean(query.trim() || taskQuery.trim()) && hasResults;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return {
        containerRef,
        inputRef,
        open,
        query,
        results,
        setOpen,
        setQuery,
        setTaskQuery,
        showDropdown,
        taskQuery,
    };
}
