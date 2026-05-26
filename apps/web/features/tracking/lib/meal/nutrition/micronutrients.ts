/**
 * Micronutrient display metadata and helpers.
 * Display is purely optional — only fields with data are shown.
 */

import type { MicronutrientFieldMeta, MicronutrientProfile } from './types';

export const MICRONUTRIENT_FIELDS: MicronutrientFieldMeta[] = [
    { key: 'potassiumMg', label: 'Potassium', unit: 'mg' },
    { key: 'calciumMg', label: 'Calcium', unit: 'mg' },
    { key: 'ironMg', label: 'Iron', unit: 'mg' },
    { key: 'magnesiumMg', label: 'Magnesium', unit: 'mg' },
    { key: 'vitaminDMcg', label: 'Vitamin D', unit: 'mcg' },
    { key: 'vitaminCMg', label: 'Vitamin C', unit: 'mg' },
    { key: 'vitaminAMcg', label: 'Vitamin A', unit: 'mcg' },
    { key: 'cholesterolMg', label: 'Cholesterol', unit: 'mg' },
    { key: 'saturatedFatGrams', label: 'Saturated fat', unit: 'g' },
    { key: 'transFatGrams', label: 'Trans fat', unit: 'g' },
    { key: 'sugarGrams', label: 'Sugar', unit: 'g' },
    { key: 'sodiumMg', label: 'Sodium', unit: 'mg' },
];

/** Return only the micronutrient fields that have data, with formatted values. */
export function presentMicronutrients(
    profile: Partial<MicronutrientProfile> | undefined,
): { label: string; value: string }[] {
    if (!profile) return [];
    const out: { label: string; value: string }[] = [];
    for (const field of MICRONUTRIENT_FIELDS) {
        const v = profile[field.key];
        if (typeof v === 'number' && Number.isFinite(v)) {
            out.push({
                label: field.label,
                value: `${Math.round(v * 10) / 10}${field.unit}`,
            });
        }
    }
    return out;
}

/** Sum micronutrient profiles (e.g. across food items in a meal). */
export function sumMicronutrients(
    profiles: (Partial<MicronutrientProfile> | undefined)[],
): Partial<MicronutrientProfile> {
    const out: Partial<MicronutrientProfile> = {};
    for (const p of profiles) {
        if (!p) continue;
        for (const field of MICRONUTRIENT_FIELDS) {
            const v = p[field.key];
            if (typeof v === 'number' && Number.isFinite(v)) {
                out[field.key] = (out[field.key] ?? 0) + v;
            }
        }
    }
    return out;
}
