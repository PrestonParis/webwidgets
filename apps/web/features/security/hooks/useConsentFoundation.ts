import type { ConsentCategory } from '@/features/security/types/consent';

const CONSENT_CATEGORIES: ConsentCategory[] = [
    'data_category',
    'ai_analysis',
    'cross_category_insight',
    'external_import',
    'automation',
    'sensitive_tracking',
    'finance_data',
    'integration_scope',
];

export function useConsentFoundation() {
    return { categories: CONSENT_CATEGORIES };
}
