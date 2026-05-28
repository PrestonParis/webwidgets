import type { SupplementDefinition } from '@/features/tracking/types/supplementDefinitions';
import type {
    DueDose,
    SupplementLog,
} from '@/features/tracking/types/supplementLogs';
import type { TimeOfDayGroup } from '@/features/tracking/types/supplementBase';

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
