import type { Json } from '@/types/supabase';

export type AuditSource =
    | 'onboarding'
    | 'widgets'
    | 'actions'
    | 'automations'
    | 'integrations'
    | 'tracking'
    | 'finance'
    | 'knowledge'
    | 'jobs'
    | 'system'
    | 'security';

export interface AuditEventInput {
    userId: string;
    type: string;
    source: AuditSource;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description?: string;
    metadata?: Json;
    relatedEntityIds?: string[];
}
