'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useCallback, useMemo, useState } from 'react';
import {
    accessibilityAudits,
    accessibilityModes,
    accessibilityPreferences,
} from '../constants';
import type {
    AccessibilityFilters,
    AccessibilityMode,
    AccessibilityPreference,
} from '../types/accessibility';
import {
    useAccessibility,
    type Density,
} from '../components/AccessibilityContext';

const defaultFilters: AccessibilityFilters = {
    query: '',
    category: 'all',
    status: 'all',
};

function sliderToDensity(value: number): Density {
    if (value <= 33) return 'comfortable';
    if (value <= 66) return 'standard';
    return 'compact';
}

function densityToSlider(density: Density): number {
    if (density === 'comfortable') return 16;
    if (density === 'compact') return 84;
    return 50;
}

export function useAccessibilityCenter() {
    const a11y = useAccessibility();
    const [filters, setFilters] =
        useState<AccessibilityFilters>(defaultFilters);
    // Local state for modes not yet wired to global context
    const [localModes, setLocalModes] = useState<AccessibilityMode[]>(
        accessibilityModes.filter((m) => m.id !== 'mode-1d'),
    );
    const [saving, setSaving] = useState(false);

    const preferences: AccessibilityPreference[] = accessibilityPreferences.map(
        (pref) => {
            switch (pref.id) {
                case 'pref-contrast':
                    return { ...pref, enabled: a11y.contrast };
                case 'pref-motion':
                    return { ...pref, enabled: a11y.reducedMotion };
                case 'pref-focus':
                    return { ...pref, enabled: a11y.focusOutlines };
                case 'pref-density':
                    return {
                        ...pref,
                        enabled: true,
                        value: densityToSlider(a11y.density),
                    };
                case 'pref-captions':
                    return { ...pref, enabled: a11y.transcriptionFirst };
                default:
                    return pref;
            }
        },
    );

    const modes: AccessibilityMode[] = [
        {
            ...accessibilityModes.find((m) => m.id === 'mode-1d')!,
            enabled: a11y.oneDimensionalMode,
        },
        ...localModes,
    ];

    const visibleAudits = useMemo(
        () =>
            accessibilityAudits.filter((audit) => {
                const query = filters.query.trim().toLowerCase();
                const haystack = [
                    audit.title,
                    audit.surface,
                    audit.category,
                    audit.recommendation,
                    audit.status,
                ]
                    .join(' ')
                    .toLowerCase();
                return (
                    (!query || haystack.includes(query)) &&
                    (filters.category === 'all' ||
                        audit.category === filters.category) &&
                    (filters.status === 'all' ||
                        audit.status === filters.status)
                );
            }),
        [filters],
    );

    const updateFilter = <Key extends keyof AccessibilityFilters>(
        key: Key,
        value: AccessibilityFilters[Key],
    ) => setFilters((current) => ({ ...current, [key]: value }));

    const resetFilters = () => setFilters(defaultFilters);

    const resetPreferences = () => {
        a11y.update({
            contrast: false,
            reducedMotion: false,
            focusOutlines: true,
            density: 'standard',
            transcriptionFirst: false,
            oneDimensionalMode: false,
        });
    };

    const togglePreference = (id: string) => {
        switch (id) {
            case 'pref-contrast':
                a11y.setContrast(!a11y.contrast);
                break;
            case 'pref-motion':
                a11y.setReducedMotion(!a11y.reducedMotion);
                break;
            case 'pref-focus':
                a11y.setFocusOutlines(!a11y.focusOutlines);
                break;
            case 'pref-captions':
                a11y.setTranscriptionFirst(!a11y.transcriptionFirst);
                break;
        }
    };

    const updatePreference = (id: string, value: boolean | number) => {
        if (typeof value === 'boolean') {
            togglePreference(id);
        } else {
            setPreferenceValue(id, value);
        }
    };

    const setPreferenceValue = (id: string, value: number | string) => {
        if (id === 'pref-density') {
            a11y.setDensity(sliderToDensity(Number(value)));
        }
    };

    const toggleMode = (id: string) => {
        if (id === 'mode-1d') {
            a11y.setOneDimensionalMode(!a11y.oneDimensionalMode);
        } else {
            setLocalModes((prev) =>
                prev.map((m) =>
                    m.id === id ? { ...m, enabled: !m.enabled } : m,
                ),
            );
        }
    };

    const saveSettings = useCallback(async () => {
        // Settings are auto-persisted to localStorage via the context on every change.
        // Best-effort API sync for future server-side persistence.
        setSaving(true);
        try {
            await apiRouteFetch('/api/accessibility/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    high_contrast: a11y.contrast,
                    reduce_motion: a11y.reducedMotion,
                    persistent_focus: a11y.focusOutlines,
                    density: densityToSlider(a11y.density),
                    transcription_first: a11y.transcriptionFirst,
                    one_dimensional_mode: a11y.oneDimensionalMode,
                }),
            });
        } catch {
            // silent — localStorage is source of truth
        } finally {
            setSaving(false);
        }
    }, [a11y]);

    const passingCount = accessibilityAudits.filter(
        (a) => a.status === 'passing',
    ).length;
    const passingPercent = Math.round(
        (passingCount / accessibilityAudits.length) * 100,
    );

    return {
        preferences,
        modes,
        density: a11y.density,
        setDensity: a11y.setDensity,
        audits: accessibilityAudits,
        visibleAudits,
        filters,
        updateFilter,
        resetFilters,
        resetPreferences,
        togglePreference,
        setPreferenceValue,
        updatePreference,
        toggleMode,
        passingPercent,
        loading: false,
        saving,
        saveSettings,
    };
}
