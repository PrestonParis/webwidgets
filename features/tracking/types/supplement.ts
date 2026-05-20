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
    dose?: string;
    scheduleType: SupplementScheduleType;
    scheduleStart: string; // HH:MM 24-hour
    scheduleEnd?: string; // HH:MM 24-hour, window only
    active: boolean;
    createdAt: string;
}

export interface DbSupplementRow {
    id: string;
    user_id: string;
    name: string;
    dose: string | null;
    schedule_type: string;
    schedule_start: string;
    schedule_end: string | null;
    active: boolean;
    created_at: string;
}

export interface CreateSupplementPayload {
    name: string;
    dose?: string;
    scheduleType: SupplementScheduleType;
    scheduleStart: string;
    scheduleEnd?: string;
}
