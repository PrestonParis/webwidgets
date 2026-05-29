'use client';

import { useCallback, useState } from 'react';
import {
    type CalendarCategory,
    type CalendarSettings,
    loadSettings,
    saveSettings,
} from '../lib/calendarSettings';

export function useCalendarSettings() {
    const [settings, setSettings] = useState<CalendarSettings>(() =>
        loadSettings(),
    );

    const updateSettings = useCallback((next: CalendarSettings) => {
        setSettings(next);
        saveSettings(next);
    }, []);

    const upsertCategory = useCallback((cat: CalendarCategory) => {
        setSettings((prev) => {
            const exists = prev.categories.some((c) => c.id === cat.id);
            const categories = exists
                ? prev.categories.map((c) => (c.id === cat.id ? cat : c))
                : [...prev.categories, cat];
            const next = { ...prev, categories };
            saveSettings(next);
            return next;
        });
    }, []);

    const deleteCategory = useCallback((id: string) => {
        setSettings((prev) => {
            const next = {
                ...prev,
                categories: prev.categories.filter((c) => c.id !== id),
            };
            saveSettings(next);
            return next;
        });
    }, []);

    const setDefaultDuration = useCallback((minutes: number) => {
        setSettings((prev) => {
            const next = { ...prev, defaultDurationMinutes: minutes };
            saveSettings(next);
            return next;
        });
    }, []);

    const getCategoryById = useCallback(
        (id: string) => settings.categories.find((c) => c.id === id),
        [settings.categories],
    );

    return {
        settings,
        updateSettings,
        upsertCategory,
        deleteCategory,
        setDefaultDuration,
        getCategoryById,
    };
}
