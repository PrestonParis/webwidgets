export type SupplementScheduleType = 'by_time' | 'after_time' | 'window';
export type ScheduleWarning =
    | 'taken_late'
    | 'taken_early'
    | 'taken_outside_window'
    | 'not_yet_time'
    | 'overdue';

export interface Supplement {
    id: string;
    userId: string;
    name: string;
    brand?: string;
    dose?: string;
    doseAmount?: number;
    doseUnit?: string;
    servingSize?: string;
    active: boolean;
    createdAt: string;
    scheduleStart: string;
    scheduleEnd?: string;
    scheduleType: SupplementScheduleType;
}

export interface CreateSupplementPayload {
    name: string;
    brand?: string;
    dose?: string;
    doseAmount?: number;
    doseUnit?: string;
    scheduleType: SupplementScheduleType;
    scheduleStart: string;
    scheduleEnd?: string;
}

export interface DbSupplementRow {
    id: string;
    user_id: string;
    name: string;
    dose: string | null;
    schedule_type: SupplementScheduleType;
    schedule_start: string;
    schedule_end: string | null;
    active: boolean;
    created_at: string;
}
