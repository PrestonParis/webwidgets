/**
 * Expanded nutrition goal configuration. All fields optional/null so partial
 * goals work. calorieMin/calorieMax express a range; calorieTarget is the
 * single-value form kept for backward compatibility with the existing widget.
 */
export interface NutritionGoalConfig {
    calorieTarget: number | null;
    calorieMin: number | null;
    calorieMax: number | null;
    proteinMin: number | null;
    carbsTarget: number | null;
    fatTarget: number | null;
    fiberMin: number | null;
    sodiumMax: number | null;
    mealsPerDay: number | null;
}

export interface GoalProgressItem {
    key: keyof NutritionGoalConfig;
    label: string;
    /** current value today */
    value: number;
    /** target value */
    target: number;
    unit: string;
    /** comparison direction */
    mode: 'min' | 'max' | 'target' | 'range';
    /** 0-100 clamped progress for display */
    pct: number;
    met: boolean;
    rangeMax?: number;
}

export interface GoalPreset {
    id: string;
    label: string;
    description: string;
    config: Partial<NutritionGoalConfig>;
}
