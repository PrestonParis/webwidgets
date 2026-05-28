'use client';

import { useState, useCallback } from 'react';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { MealType } from '@/features/tracking/types/metadata';
import type { ExerciseEntry } from '@/features/tracking/types/fitness';
import { calculateWorkoutTotals } from '@/features/tracking/lib/fitness/normalize';

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
    workoutName?: string;
    workoutType?: string;
    duration?: number;
    distance?: number;
    caloriesBurned?: number;
    averageHeartRate?: number;
    intensity?: number;
    exercises?: ExerciseEntry[];
    // meal
    mealTime?: string;
    mealType?: string;
    description?: string;
    protein?: number;
    calories?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    servings?: number;
    // mood
    moodScore?: number;
    energy?: number;
    // supplement
    supplementName?: string;
    supplementBrand?: string;
    supplementForm?: string;
    supplementDoseAmount?: number;
    supplementDoseUnit?: string;
    supplementDose?: string;
    supplementServingSize?: string;
    supplementActiveIngredients?: string;
    supplementInactiveIngredients?: string;
    supplementStatus?: string;
    supplementSkipReason?: string;
    supplementTime?: string;
    supplementTargetOutcome?: string;
    supplementEffectiveness?: number;
    supplementOutcomeRating?: number;
    supplementSideEffect?: string;
    supplementSideEffectSeverity?: number;
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
    if (cat === 'workout') {
        const exercises = form.exercises ?? [];
        const totals = calculateWorkoutTotals(exercises);
        return {
            ...(form.workoutName !== undefined && {
                title: form.workoutName,
                workoutName: form.workoutName,
            }),
            ...(form.workoutType !== undefined && {
                workoutType: form.workoutType,
            }),
            ...(form.duration !== undefined && { duration: form.duration }),
            ...(form.duration !== undefined && {
                durationMinutes: form.duration,
            }),
            ...(form.distance !== undefined && { distance: form.distance }),
            ...(form.caloriesBurned !== undefined && {
                caloriesBurned: form.caloriesBurned,
            }),
            ...(form.averageHeartRate !== undefined && {
                averageHeartRate: form.averageHeartRate,
            }),
            ...(form.intensity !== undefined && { intensity: form.intensity }),
            ...(form.intensity !== undefined && {
                perceivedExertion: form.intensity,
            }),
            ...(exercises.length > 0 && { exercises }),
            totalVolume: totals.totalVolume,
            totalSets: totals.totalSets,
            totalReps: totals.totalReps,
        };
    }
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
            ...(form.carbs !== undefined && { carbs: form.carbs }),
            ...(form.fat !== undefined && { fat: form.fat }),
            ...(form.fiber !== undefined && { fiber: form.fiber }),
            ...(form.servings !== undefined && { servings: form.servings }),
        };
    if (cat === 'mood') {
        const base: Record<string, unknown> = { score: form.moodScore ?? 3 };
        if (form.energy !== undefined) base['energy'] = form.energy;
        return base;
    }
    if (cat === 'supplement')
        return {
            name: form.supplementName ?? '',
            ...(form.supplementBrand !== undefined && {
                brand: form.supplementBrand,
            }),
            ...(form.supplementForm !== undefined && {
                form: form.supplementForm,
            }),
            ...(form.supplementDoseAmount !== undefined && {
                doseAmount: form.supplementDoseAmount,
            }),
            ...(form.supplementDoseUnit !== undefined && {
                doseUnit: form.supplementDoseUnit,
            }),
            ...(form.supplementServingSize !== undefined && {
                servingSize: form.supplementServingSize,
            }),
            ...(form.supplementActiveIngredients !== undefined && {
                activeIngredients: form.supplementActiveIngredients,
            }),
            ...(form.supplementInactiveIngredients !== undefined && {
                inactiveIngredients: form.supplementInactiveIngredients,
            }),
            status:
                form.supplementStatus ??
                (form.supplementTaken === false ? 'skipped' : 'taken'),
            taken:
                (form.supplementStatus ?? 'taken') === 'taken'
                    ? true
                    : form.supplementTaken === true,
            ...(form.supplementSkipReason !== undefined && {
                skipReason: form.supplementSkipReason,
            }),
            ...(form.supplementTime !== undefined && {
                time: form.supplementTime,
            }),
            ...(form.supplementDose !== undefined && {
                dose: form.supplementDose,
            }),
            ...(form.supplementTargetOutcome !== undefined && {
                targetOutcome: form.supplementTargetOutcome,
            }),
            ...(form.supplementOutcomeRating !== undefined && {
                outcomeRating: form.supplementOutcomeRating,
            }),
            ...(form.supplementEffectiveness !== undefined && {
                perceivedEffectiveness: form.supplementEffectiveness,
            }),
            ...(form.supplementSideEffect !== undefined && {
                sideEffects: [
                    {
                        name: form.supplementSideEffect,
                        severity: form.supplementSideEffectSeverity ?? 1,
                    },
                ],
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
    if (typeof m['title'] === 'string') result.workoutName = m['title'];
    if (typeof m['workoutName'] === 'string')
        result.workoutName = m['workoutName'];
    if (typeof m['duration'] === 'number') result.duration = m['duration'];
    if (typeof m['durationMinutes'] === 'number')
        result.duration = m['durationMinutes'];
    if (typeof m['distance'] === 'number') result.distance = m['distance'];
    if (typeof m['caloriesBurned'] === 'number')
        result.caloriesBurned = m['caloriesBurned'];
    if (typeof m['averageHeartRate'] === 'number')
        result.averageHeartRate = m['averageHeartRate'];
    if (typeof m['intensity'] === 'number') result.intensity = m['intensity'];
    if (typeof m['perceivedExertion'] === 'number')
        result.intensity = m['perceivedExertion'];
    if (Array.isArray(m['exercises']))
        result.exercises = m['exercises'] as ExerciseEntry[];
    if (typeof m['time'] === 'string') result.mealTime = m['time'];
    if (typeof m['mealType'] === 'string') result.mealType = m['mealType'];
    if (typeof m['description'] === 'string')
        result.description = m['description'];
    if (typeof m['protein'] === 'number') result.protein = m['protein'];
    if (typeof m['calories'] === 'number') result.calories = m['calories'];
    if (typeof m['carbs'] === 'number') result.carbs = m['carbs'];
    if (typeof m['fat'] === 'number') result.fat = m['fat'];
    if (typeof m['fiber'] === 'number') result.fiber = m['fiber'];
    if (typeof m['servings'] === 'number') result.servings = m['servings'];
    if (typeof m['score'] === 'number') result.moodScore = m['score'];
    if (typeof m['energy'] === 'number') result.energy = m['energy'];
    if (typeof m['name'] === 'string') {
        result.supplementName = m['name'];
        result.symptomName = m['name'];
    }
    if (typeof m['dose'] === 'string') result.supplementDose = m['dose'];
    if (typeof m['brand'] === 'string') result.supplementBrand = m['brand'];
    if (typeof m['form'] === 'string') result.supplementForm = m['form'];
    if (typeof m['doseAmount'] === 'number')
        result.supplementDoseAmount = m['doseAmount'];
    if (typeof m['doseUnit'] === 'string')
        result.supplementDoseUnit = m['doseUnit'];
    if (typeof m['servingSize'] === 'string')
        result.supplementServingSize = m['servingSize'];
    if (typeof m['activeIngredients'] === 'string')
        result.supplementActiveIngredients = m['activeIngredients'];
    if (typeof m['inactiveIngredients'] === 'string')
        result.supplementInactiveIngredients = m['inactiveIngredients'];
    if (typeof m['status'] === 'string') result.supplementStatus = m['status'];
    if (typeof m['skipReason'] === 'string')
        result.supplementSkipReason = m['skipReason'];
    if (typeof m['time'] === 'string') result.supplementTime = m['time'];
    if (typeof m['targetOutcome'] === 'string')
        result.supplementTargetOutcome = m['targetOutcome'];
    if (typeof m['outcomeRating'] === 'number')
        result.supplementOutcomeRating = m['outcomeRating'];
    if (typeof m['perceivedEffectiveness'] === 'number')
        result.supplementEffectiveness = m['perceivedEffectiveness'];
    if (Array.isArray(m['sideEffects']) && m['sideEffects'][0]) {
        const first = m['sideEffects'][0] as Record<string, unknown>;
        if (typeof first['name'] === 'string')
            result.supplementSideEffect = first['name'];
        if (typeof first['severity'] === 'number')
            result.supplementSideEffectSeverity = first['severity'];
    }
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
