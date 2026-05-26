import type {
    AllergyProfile,
    SafetyWarning,
    SupplementDefinition,
} from './types';

const STIMULANTS = [
    'caffeine',
    'guarana',
    'yohimbine',
    'synephrine',
    'green tea extract',
];
const CAPSULE_SOURCES = ['gelatin', 'bovine gelatin', 'porcine gelatin'];

function allIngredientNames(supplement: SupplementDefinition): string[] {
    return [
        ...supplement.activeIngredients.map((item) => item.name),
        ...supplement.inactiveIngredients.map((item) => item.name),
        ...supplement.allergens,
    ].map((item) => item.toLowerCase());
}

function hasMatch(values: string[], targets: string[]): string | null {
    for (const target of targets) {
        const lower = target.toLowerCase();
        const found = values.find(
            (value) => value.includes(lower) || lower.includes(value),
        );
        if (found) return target;
    }
    return null;
}

export function detectSupplementWarnings(
    supplement: SupplementDefinition,
    profile: AllergyProfile,
): SafetyWarning[] {
    const warnings: SafetyWarning[] = [];
    const ingredients = allIngredientNames(supplement);
    const allergen = hasMatch(ingredients, profile.allergens);
    if (allergen) {
        warnings.push({
            id: `${supplement.id}-allergen-${allergen}`,
            severity: 'warning',
            label: 'Allergen warning',
            detail: `${supplement.name} may contain ${allergen}. Verify with the label and a clinician/pharmacist before taking.`,
        });
    }
    const blocked = hasMatch(ingredients, profile.blockedIngredients);
    if (blocked) {
        warnings.push({
            id: `${supplement.id}-blocked-${blocked}`,
            severity: 'blocked',
            label: 'Avoid ingredient',
            detail: `${blocked} is on your blocked ingredients list.`,
        });
    }
    if (profile.dietaryFlags.vegan && !supplement.dietaryFlags.vegan) {
        const gelatin = hasMatch(ingredients, CAPSULE_SOURCES);
        warnings.push({
            id: `${supplement.id}-vegan`,
            severity: gelatin ? 'warning' : 'info',
            label: 'Vegan source check',
            detail: gelatin
                ? `${supplement.name} lists ${gelatin}; capsule source may not fit your vegan preference.`
                : 'Vegan status is unverified for this supplement.',
        });
    }
    const stimulant = hasMatch(ingredients, STIMULANTS);
    if (stimulant) {
        warnings.push({
            id: `${supplement.id}-stimulant`,
            severity: 'info',
            label: 'Stimulant check',
            detail: `${supplement.name} includes ${stimulant}. Consider timing, tolerance, and medication interactions.`,
        });
    }
    return warnings;
}

export function defaultAllergyProfile(): AllergyProfile {
    return {
        allergens: [],
        blockedIngredients: [],
        sensitivities: [],
        dietaryFlags: {},
    };
}
