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

/** Per-serving micronutrients. All optional; only stored when known. */
export interface MealMicronutrients {
    potassiumMg?: number;
    calciumMg?: number;
    ironMg?: number;
    vitaminDMcg?: number;
    vitaminCMg?: number;
    vitaminAMcg?: number;
    magnesiumMg?: number;
    cholesterolMg?: number;
    saturatedFatGrams?: number;
    transFatGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
}

/** A structured food item stored within a meal's metadata.items array. */
export interface MealFoodItem {
    id: string;
    name: string;
    brand?: string;
    quantity: number;
    servingSize: number;
    servingUnit: string;
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
    micronutrients?: MealMicronutrients;
    source?: string;
    sourceProvider?: string;
    externalFoodId?: string;
    barcode?: string;
}

export interface MealMetadata {
    time?: string; // HH:mm
    mealType?: MealType;
    description?: string;
    protein?: number; // grams
    calories?: number;
    // ── extended (all backward-compatible & optional) ──
    carbs?: number; // grams
    fat?: number; // grams
    fiber?: number; // grams
    servings?: number;
    servingQty?: number;
    servingUnit?: string;
    micronutrients?: MealMicronutrients;
    /** where this entry came from: manual | search | barcode | recipe | template | import */
    source?: string;
    sourceProvider?: string;
    externalFoodId?: string;
    barcode?: string;
    /** references when logged from a recipe/template */
    recipeId?: string;
    templateId?: string;
    /** structured breakdown of foods in this meal */
    items?: MealFoodItem[];
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
