import type { Supplement as StoredSupplement } from '@/features/tracking/types/supplement';
import type {
    SupplementForm,
    OutcomeTarget,
} from '@/features/tracking/types/supplementBase';
import type { SupplementSchedule } from '@/features/tracking/types/supplementSchedule';
import type {
    Ingredient,
    DietaryFlags,
} from '@/features/tracking/types/supplementIngredients';
import type { SupplementInventory } from '@/features/tracking/types/supplementInventory';

export interface SupplementDefinition {
    id: string;
    name: string;
    brand?: string;
    form?: SupplementForm;
    doseAmount?: number;
    doseUnit?: string;
    servingSize?: string;
    activeIngredients: Ingredient[];
    inactiveIngredients: Ingredient[];
    allergens: string[];
    dietaryFlags: DietaryFlags;
    barcode?: string;
    verified: boolean;
    sourceProvider: string;
    reason?: string;
    targetOutcome?: OutcomeTarget;
    baselineScore?: number;
    schedule: SupplementSchedule;
    inventory?: SupplementInventory;
    notes?: string;
    tags: string[];
    sourceSupplement?: StoredSupplement;
}

export interface AllergyProfile {
    allergens: string[];
    blockedIngredients: string[];
    sensitivities: string[];
    dietaryFlags: DietaryFlags;
    notes?: string;
}

export interface SafetyWarning {
    id: string;
    severity: 'info' | 'warning' | 'blocked';
    label: string;
    detail: string;
}

export interface SupplementSearchResult extends SupplementDefinition {
    duplicateOf?: string;
}
