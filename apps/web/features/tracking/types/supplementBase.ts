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
