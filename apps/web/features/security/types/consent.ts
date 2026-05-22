export type ConsentCategory =
    | 'data_category'
    | 'ai_analysis'
    | 'cross_category_insight'
    | 'external_import'
    | 'automation'
    | 'sensitive_tracking'
    | 'finance_data'
    | 'integration_scope';
export type ConsentState = 'granted' | 'denied' | 'revoked' | 'required';

export interface ConsentRecord {
    id: string;
    userId: string;
    category: ConsentCategory;
    state: ConsentState;
    scope: string;
    grantedAt?: string;
    revokedAt?: string;
}
