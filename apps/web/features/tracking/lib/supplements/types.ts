import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type { Supplement as StoredSupplement } from '@/features/tracking/types/supplement';

export type SupplementForm =
    | 'capsule'
    | 'tablet'
    | 'powder'
    | 'liquid'
    | 'gummy'
    | 'softgel'
    | 'food'
    | 'other';

export type DoseStatus = 'planned' | 'taken' | 'skipped' | 'missed';
export type ScheduleFrequency = 'daily' | 'weekly' | 'custom';
export type TimeOfDayGroup = 'morning' | 'afternoon' | 'evening' | 'night';
export type OutcomeTarget =
    | 'sleep'
    | 'energy'
    | 'focus'
    | 'recovery'
    | 'digestion'
    | 'mood'
    | 'immunity'
    | 'other';

export interface Ingredient {
    name: string;
    amount?: number;
    unit?: string;
    active: boolean;
}

export interface DietaryFlags {
    vegan?: boolean;
    vegetarian?: boolean;
    glutenFree?: boolean;
    dairyFree?: boolean;
    soyFree?: boolean;
    nutFree?: boolean;
    shellfishFree?: boolean;
}

export interface SupplementSchedule {
    frequency: ScheduleFrequency;
    times: string[];
    daysOfWeek: number[];
    startDate?: string;
    endDate?: string;
    takeWithFood?: boolean;
    takeOnEmptyStomach?: boolean;
    timezone?: string;
    paused?: boolean;
    archived?: boolean;
}

export interface SupplementDefinition {
    id: string;
    name: string;
    brand?: string;
    form?: SupplementForm;
    doseAmount?: number;
    doseUnit?: string;
    servingSize?: string;
    activeIngredients: Ingredient[];
    inactiveIngredients: Ingredient[];
    allergens: string[];
    dietaryFlags: DietaryFlags;
    barcode?: string;
    verified: boolean;
    sourceProvider: string;
    reason?: string;
    targetOutcome?: OutcomeTarget;
    baselineScore?: number;
    schedule: SupplementSchedule;
    inventory?: SupplementInventory;
    notes?: string;
    tags: string[];
    sourceSupplement?: StoredSupplement;
}

export interface SupplementLog {
    id: string;
    supplementId?: string;
    name: string;
    brand?: string;
    date: string;
    time?: string;
    status: DoseStatus;
    doseAmount?: number;
    doseUnit?: string;
    servingSize?: string;
    skipReason?: string;
    notes?: string;
    tags: string[];
    source: string;
    sourceProvider?: string;
    sideEffects: SideEffectLog[];
    effectiveness?: EffectivenessCheckIn;
    rawEntry?: TrackingEntry;
}

export interface DueDose {
    id: string;
    supplement: SupplementDefinition;
    date: string;
    time: string;
    group: TimeOfDayGroup;
    status: DoseStatus;
    overdue: boolean;
    log?: SupplementLog;
}

export interface AllergyProfile {
    allergens: string[];
    blockedIngredients: string[];
    sensitivities: string[];
    dietaryFlags: DietaryFlags;
    notes?: string;
}

export interface SafetyWarning {
    id: string;
    severity: 'info' | 'warning' | 'blocked';
    label: string;
    detail: string;
}

export interface EffectivenessCheckIn {
    date: string;
    targetOutcome: OutcomeTarget;
    outcomeRating: number;
    perceivedEffectiveness: number;
    notes?: string;
}

export interface SideEffectLog {
    name: string;
    severity: number;
    timingMinutesAfterDose?: number;
    notes?: string;
}

export interface SupplementInventory {
    quantityRemaining: number;
    dosesRemaining: number;
    doseSize?: number;
    reorderThreshold: number;
    expirationDate?: string;
    storageLocation?: string;
    supplier?: string;
    cost?: number;
    adjustmentHistory: Array<{
        date: string;
        delta: number;
        reason: string;
    }>;
}

export interface SupplementAnalytics {
    definitions: SupplementDefinition[];
    logs: SupplementLog[];
    history: SupplementLog[];
    dueToday: DueDose[];
    takenToday: number;
    overdueCount: number;
    nextDose: DueDose | null;
    todayAdherence: number;
    adherence7d: number;
    adherence30d: number;
    adherenceBySupplement: Record<string, number>;
    missedCount: number;
    skippedCount: number;
    skippedReasonBreakdown: Record<string, number>;
    mostMissedTimeOfDay: TimeOfDayGroup | null;
    sideEffectFrequency: Record<string, number>;
    effectivenessTrend: number[];
    adherenceEffectivenessCorrelation: number | null;
    lowInventory: SupplementDefinition[];
    expiringSoon: SupplementDefinition[];
    costPerDay: number;
    costPerMonth: number;
    insights: string[];
}

export interface SupplementSearchResult extends SupplementDefinition {
    duplicateOf?: string;
}
