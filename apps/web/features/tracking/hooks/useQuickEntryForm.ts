'use client';

import { useState, useCallback } from 'react';
import type { BaseTrackingEntry } from '@/features/tracking/types/tracking';
import type { MealType } from '@/features/tracking/types/metadata';

export interface QuickEntryFormState {
    category: string;
    entryDate: string;
    tags: string[];
    notes?: string;
    metadata: Record<string, unknown>; // used by custom categories + pre-populated for edit
    // sleep
    bedtime?: string;
    wakeTime?: string;
    quality?: number;
    // workout
    workoutType?: string;
    duration?: number;
    intensity?: number;
    // meal
    mealTime?: string;
    mealType?: string;
    description?: string;
    protein?: number;
    calories?: number;
    // mood
    moodScore?: number;
    energy?: number;
    // supplement
    supplementName?: string;
    supplementDose?: string;
    supplementTaken?: boolean;
    // symptom
    symptomName?: string;
    symptomSeverity?: number;
    // injury
    injuryLocation?: string;
    injurySeverity?: number;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function buildMetadata(form: QuickEntryFormState): Record<string, unknown> {
    const cat = form.category;
    if (cat === 'sleep')
        return {
            ...(form.bedtime !== undefined && { bedtime: form.bedtime }),
            ...(form.wakeTime !== undefined && { wakeTime: form.wakeTime }),
            ...(form.quality !== undefined && { quality: form.quality }),
        };
    if (cat === 'workout')
        return {
            ...(form.workoutType !== undefined && {
                workoutType: form.workoutType,
            }),
            ...(form.duration !== undefined && { duration: form.duration }),
            ...(form.intensity !== undefined && { intensity: form.intensity }),
        };
    if (cat === 'meal')
        return {
            ...(form.mealTime !== undefined && { time: form.mealTime }),
            ...(form.mealType !== undefined && {
                mealType: form.mealType as MealType,
            }),
            ...(form.description !== undefined && {
                description: form.description,
            }),
            ...(form.protein !== undefined && { protein: form.protein }),
            ...(form.calories !== undefined && { calories: form.calories }),
        };
    if (cat === 'mood') {
        const base: Record<string, unknown> = { score: form.moodScore ?? 3 };
        if (form.energy !== undefined) base['energy'] = form.energy;
        return base;
    }
    if (cat === 'supplement')
        return {
            name: form.supplementName ?? '',
            taken: form.supplementTaken ?? false,
            ...(form.supplementDose !== undefined && {
                dose: form.supplementDose,
            }),
        };
    if (cat === 'symptom')
        return {
            name: form.symptomName ?? '',
            ...(form.symptomSeverity !== undefined && {
                severity: form.symptomSeverity,
            }),
        };
    if (cat === 'injury')
        return {
            location: form.injuryLocation ?? '',
            ...(form.injurySeverity !== undefined && {
                severity: form.injurySeverity,
            }),
        };
    // custom category: use metadata directly
    return form.metadata;
}

type EditPayload =
    | {
          id: string;
          metadata: Record<string, unknown>;
          notes?: string;
          entryDate: string;
      }
    | undefined;

function makeInitial(
    category: string,
    editEntry?: EditPayload,
): QuickEntryFormState {
    const result: QuickEntryFormState = {
        category,
        entryDate: editEntry?.entryDate ?? todayISO(),
        tags: [],
        metadata: editEntry?.metadata ?? {},
    };
    if (!editEntry) {
        if (category === 'sleep') {
            result.bedtime = '22:00';
            result.wakeTime = '06:00';
        }
        return result;
    }
    if (editEntry.notes !== undefined) result.notes = editEntry.notes;
    const m = editEntry.metadata;
    if (typeof m['bedtime'] === 'string') result.bedtime = m['bedtime'];
    if (typeof m['wakeTime'] === 'string') result.wakeTime = m['wakeTime'];
    if (typeof m['quality'] === 'number') result.quality = m['quality'];
    if (typeof m['workoutType'] === 'string')
        result.workoutType = m['workoutType'];
    if (typeof m['duration'] === 'number') result.duration = m['duration'];
    if (typeof m['intensity'] === 'number') result.intensity = m['intensity'];
    if (typeof m['time'] === 'string') result.mealTime = m['time'];
    if (typeof m['mealType'] === 'string') result.mealType = m['mealType'];
    if (typeof m['description'] === 'string')
        result.description = m['description'];
    if (typeof m['protein'] === 'number') result.protein = m['protein'];
    if (typeof m['calories'] === 'number') result.calories = m['calories'];
    if (typeof m['score'] === 'number') result.moodScore = m['score'];
    if (typeof m['energy'] === 'number') result.energy = m['energy'];
    if (typeof m['name'] === 'string') {
        result.supplementName = m['name'];
        result.symptomName = m['name'];
    }
    if (typeof m['dose'] === 'string') result.supplementDose = m['dose'];
    if (typeof m['taken'] === 'boolean') result.supplementTaken = m['taken'];
    if (typeof m['severity'] === 'number') {
        result.symptomSeverity = m['severity'];
        result.injurySeverity = m['severity'];
    }
    if (typeof m['location'] === 'string')
        result.injuryLocation = m['location'];
    return result;
}

export function useQuickEntryForm(
    initialCategory = 'sleep',
    editEntry?: EditPayload,
): {
    form: QuickEntryFormState;
    updateField: (field: keyof QuickEntryFormState, value: unknown) => void;
    reset: () => void;
    toBaseEntry: () => BaseTrackingEntry | null;
    isSaving: boolean;
    setIsSaving: (v: boolean) => void;
} {
    const [form, setForm] = useState<QuickEntryFormState>(() =>
        makeInitial(initialCategory, editEntry),
    );
    const [isSaving, setIsSaving] = useState(false);

    const updateField = useCallback(
        (field: keyof QuickEntryFormState, value: unknown) => {
            setForm((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    const reset = useCallback(() => {
        setForm(makeInitial(initialCategory));
    }, [initialCategory]);

    const toBaseEntry = useCallback((): BaseTrackingEntry | null => {
        if (!form.entryDate) return null;
        return {
            category: form.category,
            entryDate: form.entryDate,
            metadata: buildMetadata(form),
            tags: form.tags,
            source: 'manual',
            ...(form.notes !== undefined && { notes: form.notes }),
        };
    }, [form]);

    return { form, updateField, reset, toBaseEntry, isSaving, setIsSaving };
}
