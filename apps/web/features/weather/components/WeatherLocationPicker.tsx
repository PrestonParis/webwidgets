'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import {
    searchLocation,
    type LocationResult,
} from '@/features/weather/lib/geocoding';

interface WeatherLocationPickerProps {
    locationName: string | undefined;
    onSelect: (name: string, lat: number, lon: number) => void;
    onClear: () => void;
    hasCustom: boolean;
}

export function WeatherLocationPicker({
    locationName,
    onSelect,
    onClear,
    hasCustom,
}: WeatherLocationPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocationResult[]>([]);
    const [searching, setSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const found = await searchLocation(q);
        setResults(found);
        setSearching(false);
    }, []);

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        const q = e.target.value;
        setQuery(q);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => void doSearch(q), 400);
    }

    function handleSelect(r: LocationResult) {
        onSelect(r.name, r.lat, r.lon);
        setOpen(false);
        setQuery('');
        setResults([]);
    }

    if (!open) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <MapPin size={9} />
                    {locationName ?? 'Set location'}
                </button>
                {hasCustom && (
                    <button
                        onClick={onClear}
                        className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors"
                    >
                        <X size={9} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 focus-within:border-indigo-400">
                <MapPin size={10} className="text-zinc-400 shrink-0" />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={handleInput}
                    placeholder="Search city…"
                    className="flex-1 text-[11px] bg-transparent outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 min-w-0 w-32"
                />
                <button
                    onClick={() => {
                        setOpen(false);
                        setQuery('');
                        setResults([]);
                    }}
                    className="text-zinc-400 hover:text-zinc-600"
                >
                    <X size={10} />
                </button>
            </div>
            {(results.length > 0 || searching) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                    {searching && (
                        <p className="text-[11px] text-zinc-400 px-3 py-2">
                            Searching…
                        </p>
                    )}
                    {results.map((r, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelect(r)}
                            className="w-full text-left px-3 py-2 text-[11px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-t border-zinc-100 dark:border-zinc-800 first:border-t-0"
                        >
                            {r.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
