import type { TrackingEntry } from '@/features/tracking/types/trackingEntryTypes';
import type { DoseStatus, OutcomeTarget, TimeOfDayGroup } from './baseTypes';
import type { SupplementDefinition } from './definitionTypes';

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
