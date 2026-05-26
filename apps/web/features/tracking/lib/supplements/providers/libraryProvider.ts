import type { SupplementDefinition, SupplementSearchResult } from '../types';
import { defaultSchedule } from '../normalize';

const LOCAL_LIBRARY: SupplementDefinition[] = [
    {
        id: 'vitamin-d3',
        name: 'Vitamin D3',
        brand: 'Generic',
        form: 'softgel',
        doseAmount: 2000,
        doseUnit: 'IU',
        servingSize: '1 softgel',
        activeIngredients: [
            { name: 'Cholecalciferol', amount: 2000, unit: 'IU', active: true },
        ],
        inactiveIngredients: [{ name: 'Gelatin', active: false }],
        allergens: [],
        dietaryFlags: { glutenFree: true, dairyFree: true, soyFree: true },
        verified: false,
        sourceProvider: 'local',
        targetOutcome: 'immunity',
        schedule: defaultSchedule('08:00'),
        tags: [],
    },
    {
        id: 'magnesium-glycinate',
        name: 'Magnesium Glycinate',
        brand: 'Generic',
        form: 'capsule',
        doseAmount: 200,
        doseUnit: 'mg',
        servingSize: '2 capsules',
        activeIngredients: [
            {
                name: 'Magnesium glycinate',
                amount: 200,
                unit: 'mg',
                active: true,
            },
        ],
        inactiveIngredients: [],
        allergens: [],
        dietaryFlags: { glutenFree: true, dairyFree: true },
        verified: false,
        sourceProvider: 'local',
        targetOutcome: 'sleep',
        schedule: defaultSchedule('21:00'),
        tags: [],
    },
    {
        id: 'caffeine',
        name: 'Caffeine',
        brand: 'Generic',
        form: 'tablet',
        doseAmount: 100,
        doseUnit: 'mg',
        servingSize: '1 tablet',
        activeIngredients: [
            { name: 'Caffeine', amount: 100, unit: 'mg', active: true },
        ],
        inactiveIngredients: [],
        allergens: [],
        dietaryFlags: {},
        verified: false,
        sourceProvider: 'local',
        targetOutcome: 'energy',
        schedule: defaultSchedule('09:00'),
        tags: ['stimulant'],
    },
];

export async function searchSupplementLibrary(
    query: string,
    existing: SupplementDefinition[] = [],
): Promise<SupplementSearchResult[]> {
    const q = query.trim().toLowerCase();
    const result = LOCAL_LIBRARY.filter((item) => {
        if (!q) return true;
        return [
            item.name,
            item.brand ?? '',
            item.barcode ?? '',
            ...item.activeIngredients.map((ingredient) => ingredient.name),
        ]
            .join(' ')
            .toLowerCase()
            .includes(q);
    }).map((item) => {
        const duplicate = existing.find(
            (definition) =>
                definition.name.toLowerCase() === item.name.toLowerCase(),
        );
        return duplicate ? { ...item, duplicateOf: duplicate.id } : item;
    });
    return result.slice(0, 10);
}

export async function lookupSupplementBarcode(
    barcode: string,
): Promise<SupplementSearchResult | null> {
    const code = barcode.trim();
    if (!/^\d{6,14}$/.test(code)) return null;
    return LOCAL_LIBRARY.find((item) => item.barcode === code) ?? null;
}
