/**
 * Optional micronutrient profile. No field is required — providers and entries
 * may supply any subset. All values are per the associated serving.
 */
export interface MicronutrientProfile {
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

/** Display metadata for a single micronutrient. */
export interface MicronutrientFieldMeta {
    key: keyof MicronutrientProfile;
    label: string;
    unit: string;
}
