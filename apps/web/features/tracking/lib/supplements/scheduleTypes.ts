import type { ScheduleFrequency } from './baseTypes';

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
