export interface SleepMetadata {
    bedtime?: string; // HH:mm
    wakeTime?: string; // HH:mm
    quality?: number; // 1-10
    durationHours?: number;
}

export interface WorkoutMetadata {
    workoutType?: string;
    duration?: number; // minutes
    intensity?: number; // 1-10
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealMetadata {
    time?: string; // HH:mm
    mealType?: MealType;
    description?: string;
    protein?: number; // grams
    calories?: number;
}

export interface MoodMetadata {
    score: number; // 1-5
    energy?: number; // 1-5
}

export interface SupplementMetadata {
    name: string;
    dose?: string;
    taken: boolean;
}

export interface SymptomMetadata {
    name: string;
    severity?: number; // 1-10
}

export interface InjuryMetadata {
    location: string;
    severity?: number; // 1-10
}
