import type { SupplementDefinition } from './definitionTypes';
import type { DueDose, SupplementLog } from './logTypes';
import type { TimeOfDayGroup } from './baseTypes';

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
