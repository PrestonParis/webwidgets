export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '14.5';
    };
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    public: {
        Tables: {
            accessibility_settings: {
                Row: {
                    density: number;
                    high_contrast: boolean;
                    keyboard_mode: boolean;
                    low_cognitive_load: boolean;
                    persistent_focus: boolean;
                    reader_comfort: boolean;
                    reduce_motion: boolean;
                    transcription_first: boolean;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    density?: number;
                    high_contrast?: boolean;
                    keyboard_mode?: boolean;
                    low_cognitive_load?: boolean;
                    persistent_focus?: boolean;
                    reader_comfort?: boolean;
                    reduce_motion?: boolean;
                    transcription_first?: boolean;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    density?: number;
                    high_contrast?: boolean;
                    keyboard_mode?: boolean;
                    low_cognitive_load?: boolean;
                    persistent_focus?: boolean;
                    reader_comfort?: boolean;
                    reduce_motion?: boolean;
                    transcription_first?: boolean;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            action_requests: {
                Row: {
                    action_id: string;
                    approval_state: string;
                    approved_at: string | null;
                    approved_payload: Json | null;
                    approved_payload_hash: string | null;
                    approved_payload_version: number | null;
                    automation_run_id: string | null;
                    candidate_action_id: string | null;
                    confidence: number | null;
                    created_at: string;
                    decided_at: string | null;
                    denied_at: string | null;
                    execution_completed_at: string | null;
                    execution_started_at: string | null;
                    expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string | null;
                    job_id: string | null;
                    payload: Json;
                    payload_hash: string | null;
                    payload_version: number;
                    permission_snapshot_hash: string | null;
                    policy_version: string | null;
                    requested_at: string;
                    source_widget_id: string | null;
                    state_version: number;
                    status: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    action_id: string;
                    approval_state?: string;
                    approved_at?: string | null;
                    approved_payload?: Json | null;
                    approved_payload_hash?: string | null;
                    approved_payload_version?: number | null;
                    automation_run_id?: string | null;
                    candidate_action_id?: string | null;
                    confidence?: number | null;
                    created_at?: string;
                    decided_at?: string | null;
                    denied_at?: string | null;
                    execution_completed_at?: string | null;
                    execution_started_at?: string | null;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    job_id?: string | null;
                    payload?: Json;
                    payload_hash?: string | null;
                    payload_version?: number;
                    permission_snapshot_hash?: string | null;
                    policy_version?: string | null;
                    requested_at?: string;
                    source_widget_id?: string | null;
                    state_version?: number;
                    status?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    action_id?: string;
                    approval_state?: string;
                    approved_at?: string | null;
                    approved_payload?: Json | null;
                    approved_payload_hash?: string | null;
                    approved_payload_version?: number | null;
                    automation_run_id?: string | null;
                    candidate_action_id?: string | null;
                    confidence?: number | null;
                    created_at?: string;
                    decided_at?: string | null;
                    denied_at?: string | null;
                    execution_completed_at?: string | null;
                    execution_started_at?: string | null;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    job_id?: string | null;
                    payload?: Json;
                    payload_hash?: string | null;
                    payload_version?: number;
                    permission_snapshot_hash?: string | null;
                    policy_version?: string | null;
                    requested_at?: string;
                    source_widget_id?: string | null;
                    state_version?: number;
                    status?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'action_requests_automation_owner_fk';
                        columns: ['automation_run_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'automation_runs';
                        referencedColumns: ['id', 'user_id'];
                    },
                    {
                        foreignKeyName: 'action_requests_candidate_owner_fk';
                        columns: ['candidate_action_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'candidate_actions';
                        referencedColumns: ['id', 'user_id'];
                    },
                    {
                        foreignKeyName: 'action_requests_job_owner_fk';
                        columns: ['job_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            action_results: {
                Row: {
                    action_request_id: string;
                    attempt: number;
                    compensation_metadata: Json;
                    completed_at: string | null;
                    created_at: string;
                    expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string | null;
                    job_id: string | null;
                    message: string;
                    metadata: Json;
                    ok: boolean;
                    output: Json | null;
                    provider_execution_id: string | null;
                    provider_id: string | null;
                    result_hash: string | null;
                    rollback_token: string | null;
                    started_at: string | null;
                    status: string;
                    undo_status: string | null;
                    updated_at: string;
                    user_id: string;
                    verification_status: string | null;
                    verified_at: string | null;
                };
                Insert: {
                    action_request_id: string;
                    attempt?: number;
                    compensation_metadata?: Json;
                    completed_at?: string | null;
                    created_at?: string;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    job_id?: string | null;
                    message: string;
                    metadata?: Json;
                    ok?: boolean;
                    output?: Json | null;
                    provider_execution_id?: string | null;
                    provider_id?: string | null;
                    result_hash?: string | null;
                    rollback_token?: string | null;
                    started_at?: string | null;
                    status: string;
                    undo_status?: string | null;
                    updated_at?: string;
                    user_id: string;
                    verification_status?: string | null;
                    verified_at?: string | null;
                };
                Update: {
                    action_request_id?: string;
                    attempt?: number;
                    compensation_metadata?: Json;
                    completed_at?: string | null;
                    created_at?: string;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    job_id?: string | null;
                    message?: string;
                    metadata?: Json;
                    ok?: boolean;
                    output?: Json | null;
                    provider_execution_id?: string | null;
                    provider_id?: string | null;
                    result_hash?: string | null;
                    rollback_token?: string | null;
                    started_at?: string | null;
                    status?: string;
                    undo_status?: string | null;
                    updated_at?: string;
                    user_id?: string;
                    verification_status?: string | null;
                    verified_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'action_results_action_request_id_fkey';
                        columns: ['action_request_id'];
                        isOneToOne: false;
                        referencedRelation: 'action_requests';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'action_results_job_owner_fk';
                        columns: ['job_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id', 'user_id'];
                    },
                    {
                        foreignKeyName: 'action_results_request_owner_fk';
                        columns: ['action_request_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'action_requests';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            activity_events: {
                Row: {
                    body: string | null;
                    created_at: string;
                    id: string;
                    metadata: Json;
                    read_at: string | null;
                    severity: string;
                    source: string;
                    title: string;
                    user_id: string;
                };
                Insert: {
                    body?: string | null;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    read_at?: string | null;
                    severity?: string;
                    source: string;
                    title: string;
                    user_id: string;
                };
                Update: {
                    body?: string | null;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    read_at?: string | null;
                    severity?: string;
                    source?: string;
                    title?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            admin_audit_logs: {
                Row: {
                    action: string;
                    actor_id: string;
                    after: Json | null;
                    before: Json | null;
                    created_at: string;
                    id: string;
                    ip: string | null;
                    resource_id: string | null;
                    resource_type: string;
                    user_agent: string | null;
                };
                Insert: {
                    action: string;
                    actor_id: string;
                    after?: Json | null;
                    before?: Json | null;
                    created_at?: string;
                    id?: string;
                    ip?: string | null;
                    resource_id?: string | null;
                    resource_type: string;
                    user_agent?: string | null;
                };
                Update: {
                    action?: string;
                    actor_id?: string;
                    after?: Json | null;
                    before?: Json | null;
                    created_at?: string;
                    id?: string;
                    ip?: string | null;
                    resource_id?: string | null;
                    resource_type?: string;
                    user_agent?: string | null;
                };
                Relationships: [];
            };
            admin_notes: {
                Row: {
                    author_id: string;
                    body: string;
                    created_at: string;
                    id: string;
                    resource_id: string;
                    resource_type: string;
                };
                Insert: {
                    author_id: string;
                    body: string;
                    created_at?: string;
                    id?: string;
                    resource_id: string;
                    resource_type: string;
                };
                Update: {
                    author_id?: string;
                    body?: string;
                    created_at?: string;
                    id?: string;
                    resource_id?: string;
                    resource_type?: string;
                };
                Relationships: [];
            };
            analytics_events: {
                Row: {
                    created_at: string;
                    id: string;
                    metadata: Json | null;
                    source: string | null;
                    type: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    metadata?: Json | null;
                    source?: string | null;
                    type: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    metadata?: Json | null;
                    source?: string | null;
                    type?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            artifacts: {
                Row: {
                    archived_at: string | null;
                    content: string;
                    content_format: string;
                    created_at: string;
                    deleted_at: string | null;
                    id: string;
                    metadata: Json;
                    parent_artifact_id: string | null;
                    source_document_id: string | null;
                    source_file_id: string | null;
                    source_job_id: string | null;
                    tags: string[];
                    title: string;
                    type: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    archived_at?: string | null;
                    content?: string;
                    content_format?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    metadata?: Json;
                    parent_artifact_id?: string | null;
                    source_document_id?: string | null;
                    source_file_id?: string | null;
                    source_job_id?: string | null;
                    tags?: string[];
                    title?: string;
                    type?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    archived_at?: string | null;
                    content?: string;
                    content_format?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    metadata?: Json;
                    parent_artifact_id?: string | null;
                    source_document_id?: string | null;
                    source_file_id?: string | null;
                    source_job_id?: string | null;
                    tags?: string[];
                    title?: string;
                    type?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'artifacts_parent_artifact_id_fkey';
                        columns: ['parent_artifact_id'];
                        isOneToOne: false;
                        referencedRelation: 'artifacts';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'artifacts_source_document_id_fkey';
                        columns: ['source_document_id'];
                        isOneToOne: false;
                        referencedRelation: 'documents';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'artifacts_source_file_id_fkey';
                        columns: ['source_file_id'];
                        isOneToOne: false;
                        referencedRelation: 'file_uploads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'artifacts_source_job_id_fkey';
                        columns: ['source_job_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            audit_events: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: string;
                    metadata: Json;
                    related_entity_ids: string[];
                    severity: string;
                    source: string;
                    title: string;
                    type: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    metadata?: Json;
                    related_entity_ids?: string[];
                    severity?: string;
                    source: string;
                    title: string;
                    type: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    metadata?: Json;
                    related_entity_ids?: string[];
                    severity?: string;
                    source?: string;
                    title?: string;
                    type?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            automation_configs: {
                Row: {
                    action_types: string[];
                    condition_types: string[];
                    config: Json;
                    consent_requirements: string[];
                    created_at: string;
                    id: string;
                    name: string;
                    requires_approval: boolean;
                    schedule: string | null;
                    service_requirements: string[];
                    state: string;
                    trigger_type: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    action_types?: string[];
                    condition_types?: string[];
                    config?: Json;
                    consent_requirements?: string[];
                    created_at?: string;
                    id?: string;
                    name: string;
                    requires_approval?: boolean;
                    schedule?: string | null;
                    service_requirements?: string[];
                    state?: string;
                    trigger_type: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    action_types?: string[];
                    condition_types?: string[];
                    config?: Json;
                    consent_requirements?: string[];
                    created_at?: string;
                    id?: string;
                    name?: string;
                    requires_approval?: boolean;
                    schedule?: string | null;
                    service_requirements?: string[];
                    state?: string;
                    trigger_type?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            automation_runs: {
                Row: {
                    automation_config_id: string | null;
                    completed_at: string | null;
                    created_at: string;
                    expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string | null;
                    job_id: string | null;
                    policy_version: string | null;
                    result: Json | null;
                    started_at: string | null;
                    status: string;
                    trigger_timeline_event_id: string | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    automation_config_id?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    job_id?: string | null;
                    policy_version?: string | null;
                    result?: Json | null;
                    started_at?: string | null;
                    status?: string;
                    trigger_timeline_event_id?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    automation_config_id?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    job_id?: string | null;
                    policy_version?: string | null;
                    result?: Json | null;
                    started_at?: string | null;
                    status?: string;
                    trigger_timeline_event_id?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'automation_runs_automation_config_id_fkey';
                        columns: ['automation_config_id'];
                        isOneToOne: false;
                        referencedRelation: 'automation_configs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'automation_runs_job_owner_fk';
                        columns: ['job_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id', 'user_id'];
                    },
                    {
                        foreignKeyName: 'automation_runs_trigger_event_owner_fk';
                        columns: ['trigger_timeline_event_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'timeline_events';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            billing_customers: {
                Row: {
                    created_at: string;
                    id: string;
                    stripe_customer_id: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    stripe_customer_id: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    stripe_customer_id?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            billing_subscriptions: {
                Row: {
                    cancel_at_period_end: boolean;
                    created_at: string;
                    current_period_end: string | null;
                    current_period_start: string | null;
                    id: string;
                    plan_id: string;
                    status: string;
                    stripe_customer_id: string;
                    stripe_subscription_id: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    cancel_at_period_end?: boolean;
                    created_at?: string;
                    current_period_end?: string | null;
                    current_period_start?: string | null;
                    id?: string;
                    plan_id?: string;
                    status?: string;
                    stripe_customer_id: string;
                    stripe_subscription_id: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    cancel_at_period_end?: boolean;
                    created_at?: string;
                    current_period_end?: string | null;
                    current_period_start?: string | null;
                    id?: string;
                    plan_id?: string;
                    status?: string;
                    stripe_customer_id?: string;
                    stripe_subscription_id?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            body_issue_history: {
                Row: {
                    id: string;
                    issue_id: string;
                    notes: string | null;
                    recorded_at: string;
                    severity: number;
                    status: string;
                };
                Insert: {
                    id?: string;
                    issue_id: string;
                    notes?: string | null;
                    recorded_at?: string;
                    severity: number;
                    status: string;
                };
                Update: {
                    id?: string;
                    issue_id?: string;
                    notes?: string | null;
                    recorded_at?: string;
                    severity?: number;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'body_issue_history_issue_id_fkey';
                        columns: ['issue_id'];
                        isOneToOne: false;
                        referencedRelation: 'body_issues';
                        referencedColumns: ['id'];
                    },
                ];
            };
            body_issues: {
                Row: {
                    created_at: string;
                    duration_type: string;
                    id: string;
                    issue_type: string;
                    notes: string | null;
                    onset_date: string;
                    region_id: string;
                    region_type: string;
                    severity: number;
                    skin_x: number | null;
                    skin_y: number | null;
                    status: string;
                    tooth_number: number | null;
                    triggers: string[];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    duration_type?: string;
                    id?: string;
                    issue_type?: string;
                    notes?: string | null;
                    onset_date?: string;
                    region_id: string;
                    region_type?: string;
                    severity: number;
                    skin_x?: number | null;
                    skin_y?: number | null;
                    status?: string;
                    tooth_number?: number | null;
                    triggers?: string[];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    duration_type?: string;
                    id?: string;
                    issue_type?: string;
                    notes?: string | null;
                    onset_date?: string;
                    region_id?: string;
                    region_type?: string;
                    severity?: number;
                    skin_x?: number | null;
                    skin_y?: number | null;
                    status?: string;
                    tooth_number?: number | null;
                    triggers?: string[];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            candidate_actions: {
                Row: {
                    action_id: string;
                    confidence: number;
                    content_cleared_at: string | null;
                    created_at: string;
                    expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string;
                    insight_id: string;
                    metadata: Json;
                    payload: Json;
                    payload_hash: string;
                    payload_version: number;
                    policy_version: string;
                    state: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    action_id: string;
                    confidence: number;
                    content_cleared_at?: string | null;
                    created_at?: string;
                    expires_at: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key: string;
                    insight_id: string;
                    metadata?: Json;
                    payload?: Json;
                    payload_hash: string;
                    payload_version?: number;
                    policy_version: string;
                    state?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    action_id?: string;
                    confidence?: number;
                    content_cleared_at?: string | null;
                    created_at?: string;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string;
                    insight_id?: string;
                    metadata?: Json;
                    payload?: Json;
                    payload_hash?: string;
                    payload_version?: number;
                    policy_version?: string;
                    state?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'candidate_actions_insight_owner_fk';
                        columns: ['insight_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'insights';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            chat_conversations: {
                Row: {
                    created_at: string;
                    id: string;
                    model: string;
                    provider: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    model?: string;
                    provider?: string;
                    title?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    model?: string;
                    provider?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            chat_messages: {
                Row: {
                    content: string;
                    conversation_id: string;
                    created_at: string;
                    id: string;
                    model: string | null;
                    role: string;
                    user_id: string;
                };
                Insert: {
                    content: string;
                    conversation_id: string;
                    created_at?: string;
                    id?: string;
                    model?: string | null;
                    role: string;
                    user_id: string;
                };
                Update: {
                    content?: string;
                    conversation_id?: string;
                    created_at?: string;
                    id?: string;
                    model?: string | null;
                    role?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'chat_messages_conversation_id_fkey';
                        columns: ['conversation_id'];
                        isOneToOne: false;
                        referencedRelation: 'chat_conversations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            chess_games: {
                Row: {
                    black: string;
                    created_at: string;
                    current_move_index: number;
                    event: string | null;
                    id: string;
                    last_viewed_at: string | null;
                    pgn: string;
                    played_at: string | null;
                    result: string | null;
                    site: string | null;
                    title: string | null;
                    updated_at: string;
                    user_id: string;
                    white: string;
                };
                Insert: {
                    black?: string;
                    created_at?: string;
                    current_move_index?: number;
                    event?: string | null;
                    id?: string;
                    last_viewed_at?: string | null;
                    pgn: string;
                    played_at?: string | null;
                    result?: string | null;
                    site?: string | null;
                    title?: string | null;
                    updated_at?: string;
                    user_id: string;
                    white?: string;
                };
                Update: {
                    black?: string;
                    created_at?: string;
                    current_move_index?: number;
                    event?: string | null;
                    id?: string;
                    last_viewed_at?: string | null;
                    pgn?: string;
                    played_at?: string | null;
                    result?: string | null;
                    site?: string | null;
                    title?: string | null;
                    updated_at?: string;
                    user_id?: string;
                    white?: string;
                };
                Relationships: [];
            };
            chess_studies: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            chess_variations: {
                Row: {
                    annotation: string | null;
                    branch_move_index: number | null;
                    created_at: string;
                    game_id: string | null;
                    id: string;
                    last_practiced: string | null;
                    pgn: string;
                    practiced_count: number;
                    start_fen: string;
                    study_id: string | null;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    annotation?: string | null;
                    branch_move_index?: number | null;
                    created_at?: string;
                    game_id?: string | null;
                    id?: string;
                    last_practiced?: string | null;
                    pgn: string;
                    practiced_count?: number;
                    start_fen?: string;
                    study_id?: string | null;
                    title?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    annotation?: string | null;
                    branch_move_index?: number | null;
                    created_at?: string;
                    game_id?: string | null;
                    id?: string;
                    last_practiced?: string | null;
                    pgn?: string;
                    practiced_count?: number;
                    start_fen?: string;
                    study_id?: string | null;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'chess_variations_game_id_fkey';
                        columns: ['game_id'];
                        isOneToOne: false;
                        referencedRelation: 'chess_games';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'chess_variations_study_id_fkey';
                        columns: ['study_id'];
                        isOneToOne: false;
                        referencedRelation: 'chess_studies';
                        referencedColumns: ['id'];
                    },
                ];
            };
            collaboration_handoffs: {
                Row: {
                    complete: boolean;
                    created_at: string;
                    due: string | null;
                    id: string;
                    owner: string | null;
                    priority: string;
                    scope: string;
                    title: string;
                    user_id: string;
                    workspace_id: string | null;
                };
                Insert: {
                    complete?: boolean;
                    created_at?: string;
                    due?: string | null;
                    id?: string;
                    owner?: string | null;
                    priority?: string;
                    scope?: string;
                    title: string;
                    user_id: string;
                    workspace_id?: string | null;
                };
                Update: {
                    complete?: boolean;
                    created_at?: string;
                    due?: string | null;
                    id?: string;
                    owner?: string | null;
                    priority?: string;
                    scope?: string;
                    title?: string;
                    user_id?: string;
                    workspace_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'collaboration_handoffs_workspace_id_fkey';
                        columns: ['workspace_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_workspaces';
                        referencedColumns: ['id'];
                    },
                ];
            };
            collaboration_workspaces: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: string;
                    name: string;
                    scope: string;
                    status: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    name: string;
                    scope?: string;
                    status?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    name?: string;
                    scope?: string;
                    status?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            command_workstreams: {
                Row: {
                    automations: number;
                    blockers: number;
                    confidence: number;
                    created_at: string;
                    domain: string;
                    due: string | null;
                    id: string;
                    next_step: string | null;
                    owner: string | null;
                    priority: string;
                    progress: number;
                    status: string;
                    title: string;
                    user_id: string;
                };
                Insert: {
                    automations?: number;
                    blockers?: number;
                    confidence?: number;
                    created_at?: string;
                    domain?: string;
                    due?: string | null;
                    id?: string;
                    next_step?: string | null;
                    owner?: string | null;
                    priority?: string;
                    progress?: number;
                    status?: string;
                    title: string;
                    user_id: string;
                };
                Update: {
                    automations?: number;
                    blockers?: number;
                    confidence?: number;
                    created_at?: string;
                    domain?: string;
                    due?: string | null;
                    id?: string;
                    next_step?: string | null;
                    owner?: string | null;
                    priority?: string;
                    progress?: number;
                    status?: string;
                    title?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            companies: {
                Row: {
                    created_at: string;
                    id: string;
                    name: string;
                    owner_id: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    name: string;
                    owner_id: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    name?: string;
                    owner_id?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            company_memberships: {
                Row: {
                    company_id: string;
                    created_at: string;
                    email: string | null;
                    id: string;
                    role: string;
                    status: string;
                    updated_at: string;
                    user_id: string | null;
                };
                Insert: {
                    company_id: string;
                    created_at?: string;
                    email?: string | null;
                    id?: string;
                    role?: string;
                    status?: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Update: {
                    company_id?: string;
                    created_at?: string;
                    email?: string | null;
                    id?: string;
                    role?: string;
                    status?: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'company_memberships_company_id_fkey';
                        columns: ['company_id'];
                        isOneToOne: false;
                        referencedRelation: 'companies';
                        referencedColumns: ['id'];
                    },
                ];
            };
            company_timeclock_entries: {
                Row: {
                    clock_in_at: string;
                    clock_out_at: string | null;
                    company_id: string;
                    created_at: string;
                    id: string;
                    notes: string | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    clock_in_at?: string;
                    clock_out_at?: string | null;
                    company_id: string;
                    created_at?: string;
                    id?: string;
                    notes?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    clock_in_at?: string;
                    clock_out_at?: string | null;
                    company_id?: string;
                    created_at?: string;
                    id?: string;
                    notes?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'company_timeclock_entries_company_id_fkey';
                        columns: ['company_id'];
                        isOneToOne: false;
                        referencedRelation: 'companies';
                        referencedColumns: ['id'];
                    },
                ];
            };
            consent_records: {
                Row: {
                    category: string;
                    created_at: string;
                    granted_at: string | null;
                    id: string;
                    revoked_at: string | null;
                    scope: string;
                    state: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    category: string;
                    created_at?: string;
                    granted_at?: string | null;
                    id?: string;
                    revoked_at?: string | null;
                    scope: string;
                    state?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    category?: string;
                    created_at?: string;
                    granted_at?: string | null;
                    id?: string;
                    revoked_at?: string | null;
                    scope?: string;
                    state?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            context_edges: {
                Row: {
                    confidence: number;
                    created_at: string;
                    created_by: string | null;
                    created_by_type: string;
                    from_entity_id: string;
                    id: string;
                    kind: string;
                    label: string | null;
                    metadata: Json;
                    source_id: string | null;
                    source_type: string;
                    to_entity_id: string;
                    updated_at: string;
                    user_id: string;
                    weight: number;
                };
                Insert: {
                    confidence?: number;
                    created_at?: string;
                    created_by?: string | null;
                    created_by_type?: string;
                    from_entity_id: string;
                    id?: string;
                    kind: string;
                    label?: string | null;
                    metadata?: Json;
                    source_id?: string | null;
                    source_type?: string;
                    to_entity_id: string;
                    updated_at?: string;
                    user_id: string;
                    weight?: number;
                };
                Update: {
                    confidence?: number;
                    created_at?: string;
                    created_by?: string | null;
                    created_by_type?: string;
                    from_entity_id?: string;
                    id?: string;
                    kind?: string;
                    label?: string | null;
                    metadata?: Json;
                    source_id?: string | null;
                    source_type?: string;
                    to_entity_id?: string;
                    updated_at?: string;
                    user_id?: string;
                    weight?: number;
                };
                Relationships: [];
            };
            context_entries: {
                Row: {
                    confidence: number;
                    created_at: string;
                    created_by: string | null;
                    created_by_type: string;
                    data: Json;
                    entity_id: string;
                    entry_type: string;
                    id: string;
                    label: string;
                    last_observed_at: string | null;
                    last_verified_at: string | null;
                    linked_to: string[];
                    metadata: Json;
                    permissions: string[];
                    source_collection: string | null;
                    source_id: string | null;
                    source_table: string | null;
                    source_type: string;
                    status: string;
                    summary: string | null;
                    tags: string[];
                    updated_at: string;
                    user_id: string;
                    visibility: string;
                };
                Insert: {
                    confidence?: number;
                    created_at?: string;
                    created_by?: string | null;
                    created_by_type?: string;
                    data?: Json;
                    entity_id: string;
                    entry_type: string;
                    id?: string;
                    label: string;
                    last_observed_at?: string | null;
                    last_verified_at?: string | null;
                    linked_to?: string[];
                    metadata?: Json;
                    permissions?: string[];
                    source_collection?: string | null;
                    source_id?: string | null;
                    source_table?: string | null;
                    source_type?: string;
                    status?: string;
                    summary?: string | null;
                    tags?: string[];
                    updated_at?: string;
                    user_id: string;
                    visibility?: string;
                };
                Update: {
                    confidence?: number;
                    created_at?: string;
                    created_by?: string | null;
                    created_by_type?: string;
                    data?: Json;
                    entity_id?: string;
                    entry_type?: string;
                    id?: string;
                    label?: string;
                    last_observed_at?: string | null;
                    last_verified_at?: string | null;
                    linked_to?: string[];
                    metadata?: Json;
                    permissions?: string[];
                    source_collection?: string | null;
                    source_id?: string | null;
                    source_table?: string | null;
                    source_type?: string;
                    status?: string;
                    summary?: string | null;
                    tags?: string[];
                    updated_at?: string;
                    user_id?: string;
                    visibility?: string;
                };
                Relationships: [];
            };
            context_exports: {
                Row: {
                    available_sources: number;
                    created_at: string;
                    errors: string[];
                    expires_at: string;
                    id: string;
                    scope: string;
                    sources: Json;
                    status: string;
                    system_prompt_content: string | null;
                    unavailable_sources: number;
                    user_id: string;
                    warnings: string[];
                };
                Insert: {
                    available_sources?: number;
                    created_at?: string;
                    errors?: string[];
                    expires_at?: string;
                    id?: string;
                    scope?: string;
                    sources?: Json;
                    status?: string;
                    system_prompt_content?: string | null;
                    unavailable_sources?: number;
                    user_id: string;
                    warnings?: string[];
                };
                Update: {
                    available_sources?: number;
                    created_at?: string;
                    errors?: string[];
                    expires_at?: string;
                    id?: string;
                    scope?: string;
                    sources?: Json;
                    status?: string;
                    system_prompt_content?: string | null;
                    unavailable_sources?: number;
                    user_id?: string;
                    warnings?: string[];
                };
                Relationships: [];
            };
            context_permissions: {
                Row: {
                    allow_ai_personalization: boolean;
                    allow_automation_context_access: boolean;
                    allow_cross_widget_context: boolean;
                    allow_inferred_relationships: boolean;
                    capture_chat_memory: boolean;
                    capture_documents: boolean;
                    capture_files: boolean;
                    capture_integrations: boolean;
                    capture_widget_interactions: boolean;
                    created_at: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    allow_ai_personalization?: boolean;
                    allow_automation_context_access?: boolean;
                    allow_cross_widget_context?: boolean;
                    allow_inferred_relationships?: boolean;
                    capture_chat_memory?: boolean;
                    capture_documents?: boolean;
                    capture_files?: boolean;
                    capture_integrations?: boolean;
                    capture_widget_interactions?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    allow_ai_personalization?: boolean;
                    allow_automation_context_access?: boolean;
                    allow_cross_widget_context?: boolean;
                    allow_inferred_relationships?: boolean;
                    capture_chat_memory?: boolean;
                    capture_documents?: boolean;
                    capture_files?: boolean;
                    capture_integrations?: boolean;
                    capture_widget_interactions?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            context_saved_views: {
                Row: {
                    created_at: string;
                    filters: Json;
                    focus_node: string | null;
                    id: string;
                    layout_mode: string;
                    name: string;
                    updated_at: string;
                    user_id: string;
                    viewport: Json;
                    visible_edge_kinds: string[];
                    visible_node_types: string[];
                };
                Insert: {
                    created_at?: string;
                    filters?: Json;
                    focus_node?: string | null;
                    id?: string;
                    layout_mode?: string;
                    name: string;
                    updated_at?: string;
                    user_id: string;
                    viewport?: Json;
                    visible_edge_kinds?: string[];
                    visible_node_types?: string[];
                };
                Update: {
                    created_at?: string;
                    filters?: Json;
                    focus_node?: string | null;
                    id?: string;
                    layout_mode?: string;
                    name?: string;
                    updated_at?: string;
                    user_id?: string;
                    viewport?: Json;
                    visible_edge_kinds?: string[];
                    visible_node_types?: string[];
                };
                Relationships: [];
            };
            conversion_jobs: {
                Row: {
                    created_at: string;
                    error_message: string | null;
                    file_size_bytes: number;
                    id: string;
                    input_object_key: string;
                    kind: string;
                    original_file_name: string;
                    output_object_key: string | null;
                    source_extension: string;
                    source_mime: string;
                    status: string;
                    target_extension: string;
                    updated_at: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    error_message?: string | null;
                    file_size_bytes: number;
                    id?: string;
                    input_object_key: string;
                    kind?: string;
                    original_file_name: string;
                    output_object_key?: string | null;
                    source_extension: string;
                    source_mime: string;
                    status?: string;
                    target_extension: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    error_message?: string | null;
                    file_size_bytes?: number;
                    id?: string;
                    input_object_key?: string;
                    kind?: string;
                    original_file_name?: string;
                    output_object_key?: string | null;
                    source_extension?: string;
                    source_mime?: string;
                    status?: string;
                    target_extension?: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            cost_events: {
                Row: {
                    cost_usd: number | null;
                    created_at: string;
                    feature: string;
                    id: string;
                    metadata: Json | null;
                    provider: string;
                    units: number | null;
                    user_id: string | null;
                };
                Insert: {
                    cost_usd?: number | null;
                    created_at?: string;
                    feature: string;
                    id?: string;
                    metadata?: Json | null;
                    provider: string;
                    units?: number | null;
                    user_id?: string | null;
                };
                Update: {
                    cost_usd?: number | null;
                    created_at?: string;
                    feature?: string;
                    id?: string;
                    metadata?: Json | null;
                    provider?: string;
                    units?: number | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            countdowns: {
                Row: {
                    created_at: string;
                    emoji: string;
                    id: string;
                    name: string;
                    target_date: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name: string;
                    target_date: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name?: string;
                    target_date?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            creative_layers: {
                Row: {
                    color: string | null;
                    created_at: string;
                    height: number;
                    id: string;
                    layer_order: number;
                    layer_type: string;
                    locked: boolean;
                    name: string;
                    project_id: string;
                    user_id: string;
                    visible: boolean;
                    width: number;
                    x: number;
                    y: number;
                };
                Insert: {
                    color?: string | null;
                    created_at?: string;
                    height?: number;
                    id?: string;
                    layer_order?: number;
                    layer_type?: string;
                    locked?: boolean;
                    name: string;
                    project_id: string;
                    user_id: string;
                    visible?: boolean;
                    width?: number;
                    x?: number;
                    y?: number;
                };
                Update: {
                    color?: string | null;
                    created_at?: string;
                    height?: number;
                    id?: string;
                    layer_order?: number;
                    layer_type?: string;
                    locked?: boolean;
                    name?: string;
                    project_id?: string;
                    user_id?: string;
                    visible?: boolean;
                    width?: number;
                    x?: number;
                    y?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'creative_layers_project_id_fkey';
                        columns: ['project_id'];
                        isOneToOne: false;
                        referencedRelation: 'creative_projects';
                        referencedColumns: ['id'];
                    },
                ];
            };
            creative_projects: {
                Row: {
                    created_at: string;
                    description: string | null;
                    format: string;
                    id: string;
                    title: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    format?: string;
                    id?: string;
                    title: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    format?: string;
                    id?: string;
                    title?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            currency_rates: {
                Row: {
                    base: string;
                    date: string;
                    fetched_at: string;
                    rates: Json;
                };
                Insert: {
                    base: string;
                    date: string;
                    fetched_at?: string;
                    rates: Json;
                };
                Update: {
                    base?: string;
                    date?: string;
                    fetched_at?: string;
                    rates?: Json;
                };
                Relationships: [];
            };
            dashboard_layouts: {
                Row: {
                    id: string;
                    layout: Json;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    layout?: Json;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    layout?: Json;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            documents: {
                Row: {
                    archived_at: string | null;
                    content: string;
                    created_at: string;
                    deleted_at: string | null;
                    folder_id: string | null;
                    format: string;
                    id: string;
                    metadata: Json;
                    source_artifact_id: string | null;
                    source_file_id: string | null;
                    tags: string[];
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    archived_at?: string | null;
                    content?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    folder_id?: string | null;
                    format?: string;
                    id?: string;
                    metadata?: Json;
                    source_artifact_id?: string | null;
                    source_file_id?: string | null;
                    tags?: string[];
                    title?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    archived_at?: string | null;
                    content?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    folder_id?: string | null;
                    format?: string;
                    id?: string;
                    metadata?: Json;
                    source_artifact_id?: string | null;
                    source_file_id?: string | null;
                    tags?: string[];
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'documents_source_file_id_fkey';
                        columns: ['source_file_id'];
                        isOneToOne: false;
                        referencedRelation: 'file_uploads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            email_actions: {
                Row: {
                    action_url: string | null;
                    completed: boolean;
                    created_at: string;
                    description: string | null;
                    due_date: string | null;
                    email_id: string;
                    id: string;
                    synced: boolean;
                    title: string;
                    type: string;
                    user_id: string;
                };
                Insert: {
                    action_url?: string | null;
                    completed?: boolean;
                    created_at?: string;
                    description?: string | null;
                    due_date?: string | null;
                    email_id: string;
                    id?: string;
                    synced?: boolean;
                    title: string;
                    type: string;
                    user_id: string;
                };
                Update: {
                    action_url?: string | null;
                    completed?: boolean;
                    created_at?: string;
                    description?: string | null;
                    due_date?: string | null;
                    email_id?: string;
                    id?: string;
                    synced?: boolean;
                    title?: string;
                    type?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            email_classifications: {
                Row: {
                    category: string;
                    classified_at: string;
                    email_id: string;
                    id: string;
                    is_manual: boolean;
                    sender: string;
                    subject: string | null;
                    user_id: string;
                };
                Insert: {
                    category: string;
                    classified_at?: string;
                    email_id: string;
                    id?: string;
                    is_manual?: boolean;
                    sender: string;
                    subject?: string | null;
                    user_id: string;
                };
                Update: {
                    category?: string;
                    classified_at?: string;
                    email_id?: string;
                    id?: string;
                    is_manual?: boolean;
                    sender?: string;
                    subject?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            email_processing_log: {
                Row: {
                    email_id: string;
                    processed_at: string;
                    user_id: string;
                };
                Insert: {
                    email_id: string;
                    processed_at?: string;
                    user_id: string;
                };
                Update: {
                    email_id?: string;
                    processed_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            email_queue: {
                Row: {
                    attempts: number;
                    created_at: string;
                    history_id: string | null;
                    id: string;
                    last_error: string | null;
                    message_id: string;
                    payload: Json | null;
                    priority: number;
                    stage: string;
                    status: string;
                    thread_id: string | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    attempts?: number;
                    created_at?: string;
                    history_id?: string | null;
                    id?: string;
                    last_error?: string | null;
                    message_id: string;
                    payload?: Json | null;
                    priority?: number;
                    stage?: string;
                    status?: string;
                    thread_id?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    attempts?: number;
                    created_at?: string;
                    history_id?: string | null;
                    id?: string;
                    last_error?: string | null;
                    message_id?: string;
                    payload?: Json | null;
                    priority?: number;
                    stage?: string;
                    status?: string;
                    thread_id?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            email_snapshots: {
                Row: {
                    account_email: string;
                    body_text: string | null;
                    id: string;
                    provider: string;
                    raw_date: string;
                    received_at: string;
                    sender_email: string;
                    sender_name: string;
                    snippet: string;
                    subject: string;
                    synced_at: string;
                    user_id: string;
                };
                Insert: {
                    account_email: string;
                    body_text?: string | null;
                    id: string;
                    provider: string;
                    raw_date?: string;
                    received_at: string;
                    sender_email?: string;
                    sender_name?: string;
                    snippet?: string;
                    subject?: string;
                    synced_at?: string;
                    user_id: string;
                };
                Update: {
                    account_email?: string;
                    body_text?: string | null;
                    id?: string;
                    provider?: string;
                    raw_date?: string;
                    received_at?: string;
                    sender_email?: string;
                    sender_name?: string;
                    snippet?: string;
                    subject?: string;
                    synced_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            export_job_logs: {
                Row: {
                    created_at: string;
                    export_job_id: string;
                    id: string;
                    level: string;
                    message: string;
                    metadata: Json;
                };
                Insert: {
                    created_at?: string;
                    export_job_id: string;
                    id?: string;
                    level?: string;
                    message: string;
                    metadata?: Json;
                };
                Update: {
                    created_at?: string;
                    export_job_id?: string;
                    id?: string;
                    level?: string;
                    message?: string;
                    metadata?: Json;
                };
                Relationships: [
                    {
                        foreignKeyName: 'export_job_logs_export_job_id_fkey';
                        columns: ['export_job_id'];
                        isOneToOne: false;
                        referencedRelation: 'export_jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            export_jobs: {
                Row: {
                    completed_at: string | null;
                    created_at: string;
                    error: string | null;
                    format: string;
                    id: string;
                    metadata: Json;
                    output_expires_at: string | null;
                    output_size_bytes: number | null;
                    output_url: string | null;
                    row_count: number | null;
                    source_type: string;
                    status: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    completed_at?: string | null;
                    created_at?: string;
                    error?: string | null;
                    format: string;
                    id?: string;
                    metadata?: Json;
                    output_expires_at?: string | null;
                    output_size_bytes?: number | null;
                    output_url?: string | null;
                    row_count?: number | null;
                    source_type: string;
                    status?: string;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    completed_at?: string | null;
                    created_at?: string;
                    error?: string | null;
                    format?: string;
                    id?: string;
                    metadata?: Json;
                    output_expires_at?: string | null;
                    output_size_bytes?: number | null;
                    output_url?: string | null;
                    row_count?: number | null;
                    source_type?: string;
                    status?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            feature_flags: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    description: string;
                    enabled: boolean;
                    id: string;
                    key: string;
                    rollout_pct: number;
                    updated_at: string;
                    updated_by: string | null;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string;
                    enabled?: boolean;
                    id?: string;
                    key: string;
                    rollout_pct?: number;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string;
                    enabled?: boolean;
                    id?: string;
                    key?: string;
                    rollout_pct?: number;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Relationships: [];
            };
            feature_settings: {
                Row: {
                    feature_id: string;
                    id: string;
                    settings: Json;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    feature_id: string;
                    id?: string;
                    settings?: Json;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    feature_id?: string;
                    id?: string;
                    settings?: Json;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            file_folders: {
                Row: {
                    created_at: string;
                    id: string;
                    name: string;
                    parent_id: string | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    name: string;
                    parent_id?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    name?: string;
                    parent_id?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'file_folders_parent_id_fkey';
                        columns: ['parent_id'];
                        isOneToOne: false;
                        referencedRelation: 'file_folders';
                        referencedColumns: ['id'];
                    },
                ];
            };
            file_metadata: {
                Row: {
                    archived: boolean;
                    favorite: boolean;
                    file_id: string;
                    id: string;
                    notes: string | null;
                    tags: string[];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    archived?: boolean;
                    favorite?: boolean;
                    file_id: string;
                    id?: string;
                    notes?: string | null;
                    tags?: string[];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    archived?: boolean;
                    favorite?: boolean;
                    file_id?: string;
                    id?: string;
                    notes?: string | null;
                    tags?: string[];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'file_metadata_file_id_fkey';
                        columns: ['file_id'];
                        isOneToOne: false;
                        referencedRelation: 'file_uploads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            file_text_extractions: {
                Row: {
                    character_count: number;
                    conversion_id: string | null;
                    created_at: string;
                    extracted_text: string;
                    extraction_error: string | null;
                    extraction_status: string;
                    file_id: string;
                    id: string;
                    source_storage_path: string;
                    text_format: string;
                    token_estimate: number | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    character_count?: number;
                    conversion_id?: string | null;
                    created_at?: string;
                    extracted_text?: string;
                    extraction_error?: string | null;
                    extraction_status?: string;
                    file_id: string;
                    id?: string;
                    source_storage_path: string;
                    text_format?: string;
                    token_estimate?: number | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    character_count?: number;
                    conversion_id?: string | null;
                    created_at?: string;
                    extracted_text?: string;
                    extraction_error?: string | null;
                    extraction_status?: string;
                    file_id?: string;
                    id?: string;
                    source_storage_path?: string;
                    text_format?: string;
                    token_estimate?: number | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'file_text_extractions_file_id_fkey';
                        columns: ['file_id'];
                        isOneToOne: true;
                        referencedRelation: 'file_uploads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            file_uploads: {
                Row: {
                    created_at: string;
                    folder_id: string | null;
                    id: string;
                    mime_type: string;
                    original_name: string;
                    s3_key: string;
                    size_bytes: number;
                    status: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    folder_id?: string | null;
                    id?: string;
                    mime_type?: string;
                    original_name: string;
                    s3_key: string;
                    size_bytes?: number;
                    status?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    folder_id?: string | null;
                    id?: string;
                    mime_type?: string;
                    original_name?: string;
                    s3_key?: string;
                    size_bytes?: number;
                    status?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'file_uploads_folder_id_fkey';
                        columns: ['folder_id'];
                        isOneToOne: false;
                        referencedRelation: 'file_folders';
                        referencedColumns: ['id'];
                    },
                ];
            };
            finance_accounts: {
                Row: {
                    balance: number;
                    created_at: string;
                    currency: string;
                    id: string;
                    institution: string | null;
                    metadata: Json;
                    name: string;
                    type: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    balance?: number;
                    created_at?: string;
                    currency?: string;
                    id?: string;
                    institution?: string | null;
                    metadata?: Json;
                    name: string;
                    type: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    balance?: number;
                    created_at?: string;
                    currency?: string;
                    id?: string;
                    institution?: string | null;
                    metadata?: Json;
                    name?: string;
                    type?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            finance_subscriptions: {
                Row: {
                    active: boolean;
                    amount: number;
                    billing_cycle: string | null;
                    cadence: string;
                    category: string;
                    created_at: string;
                    id: string;
                    metadata: Json;
                    name: string;
                    next_billing_date: string | null;
                    next_charge_on: string | null;
                    source: string;
                    user_id: string;
                };
                Insert: {
                    active?: boolean;
                    amount: number;
                    billing_cycle?: string | null;
                    cadence: string;
                    category?: string;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    name: string;
                    next_billing_date?: string | null;
                    next_charge_on?: string | null;
                    source?: string;
                    user_id: string;
                };
                Update: {
                    active?: boolean;
                    amount?: number;
                    billing_cycle?: string | null;
                    cadence?: string;
                    category?: string;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    name?: string;
                    next_billing_date?: string | null;
                    next_charge_on?: string | null;
                    source?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            finance_transactions: {
                Row: {
                    account_id: string | null;
                    amount: number;
                    category: string;
                    created_at: string;
                    id: string;
                    merchant: string | null;
                    metadata: Json;
                    notes: string | null;
                    occurred_on: string;
                    recurring_candidate: boolean;
                    title: string | null;
                    type: string;
                    user_id: string;
                };
                Insert: {
                    account_id?: string | null;
                    amount: number;
                    category: string;
                    created_at?: string;
                    id?: string;
                    merchant?: string | null;
                    metadata?: Json;
                    notes?: string | null;
                    occurred_on: string;
                    recurring_candidate?: boolean;
                    title?: string | null;
                    type?: string;
                    user_id: string;
                };
                Update: {
                    account_id?: string | null;
                    amount?: number;
                    category?: string;
                    created_at?: string;
                    id?: string;
                    merchant?: string | null;
                    metadata?: Json;
                    notes?: string | null;
                    occurred_on?: string;
                    recurring_candidate?: boolean;
                    title?: string | null;
                    type?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'finance_transactions_account_id_fkey';
                        columns: ['account_id'];
                        isOneToOne: false;
                        referencedRelation: 'finance_accounts';
                        referencedColumns: ['id'];
                    },
                ];
            };
            form_filler_jobs: {
                Row: {
                    created_at: string;
                    error: string | null;
                    fields_filled: Json | null;
                    id: string;
                    profile_id: string | null;
                    screenshot: string | null;
                    status: string;
                    updated_at: string;
                    url: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    error?: string | null;
                    fields_filled?: Json | null;
                    id?: string;
                    profile_id?: string | null;
                    screenshot?: string | null;
                    status?: string;
                    updated_at?: string;
                    url: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    error?: string | null;
                    fields_filled?: Json | null;
                    id?: string;
                    profile_id?: string | null;
                    screenshot?: string | null;
                    status?: string;
                    updated_at?: string;
                    url?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'form_filler_jobs_profile_id_fkey';
                        columns: ['profile_id'];
                        isOneToOne: false;
                        referencedRelation: 'form_filler_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            form_filler_profiles: {
                Row: {
                    created_at: string;
                    fields: Json;
                    id: string;
                    name: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    fields?: Json;
                    id?: string;
                    name?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    fields?: Json;
                    id?: string;
                    name?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            habit_completions: {
                Row: {
                    completed_date: string;
                    habit_id: string;
                    id: string;
                    user_id: string;
                };
                Insert: {
                    completed_date?: string;
                    habit_id: string;
                    id?: string;
                    user_id: string;
                };
                Update: {
                    completed_date?: string;
                    habit_id?: string;
                    id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'habit_completions_habit_id_fkey';
                        columns: ['habit_id'];
                        isOneToOne: false;
                        referencedRelation: 'habits';
                        referencedColumns: ['id'];
                    },
                ];
            };
            habits: {
                Row: {
                    created_at: string;
                    emoji: string;
                    id: string;
                    name: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            import_export_audit_events: {
                Row: {
                    action: string;
                    created_at: string;
                    id: string;
                    metadata: Json;
                    resource_id: string | null;
                    resource_type: string;
                    user_id: string;
                };
                Insert: {
                    action: string;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    resource_id?: string | null;
                    resource_type: string;
                    user_id: string;
                };
                Update: {
                    action?: string;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    resource_id?: string | null;
                    resource_type?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            import_job_logs: {
                Row: {
                    created_at: string;
                    id: string;
                    import_job_id: string;
                    level: string;
                    message: string;
                    metadata: Json;
                    row_number: number | null;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    import_job_id: string;
                    level?: string;
                    message: string;
                    metadata?: Json;
                    row_number?: number | null;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    import_job_id?: string;
                    level?: string;
                    message?: string;
                    metadata?: Json;
                    row_number?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'import_job_logs_import_job_id_fkey';
                        columns: ['import_job_id'];
                        isOneToOne: false;
                        referencedRelation: 'import_jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            import_jobs: {
                Row: {
                    completed_at: string | null;
                    created_at: string;
                    destination_type: string | null;
                    duplicate_strategy: string;
                    error: string | null;
                    error_count: number | null;
                    file_upload_id: string | null;
                    format: string;
                    id: string;
                    mappings: Json;
                    row_count: number | null;
                    source_type: string | null;
                    status: string;
                    success_count: number | null;
                    title: string | null;
                    updated_at: string;
                    user_id: string;
                    validation_results: Json;
                    warning_count: number | null;
                };
                Insert: {
                    completed_at?: string | null;
                    created_at?: string;
                    destination_type?: string | null;
                    duplicate_strategy: string;
                    error?: string | null;
                    error_count?: number | null;
                    file_upload_id?: string | null;
                    format: string;
                    id?: string;
                    mappings?: Json;
                    row_count?: number | null;
                    source_type?: string | null;
                    status?: string;
                    success_count?: number | null;
                    title?: string | null;
                    updated_at?: string;
                    user_id: string;
                    validation_results?: Json;
                    warning_count?: number | null;
                };
                Update: {
                    completed_at?: string | null;
                    created_at?: string;
                    destination_type?: string | null;
                    duplicate_strategy?: string;
                    error?: string | null;
                    error_count?: number | null;
                    file_upload_id?: string | null;
                    format?: string;
                    id?: string;
                    mappings?: Json;
                    row_count?: number | null;
                    source_type?: string | null;
                    status?: string;
                    success_count?: number | null;
                    title?: string | null;
                    updated_at?: string;
                    user_id?: string;
                    validation_results?: Json;
                    warning_count?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'import_jobs_file_upload_id_fkey';
                        columns: ['file_upload_id'];
                        isOneToOne: false;
                        referencedRelation: 'file_uploads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            import_mappings: {
                Row: {
                    category: string | null;
                    created_at: string;
                    id: string;
                    import_job_id: string;
                    source_column: string;
                    target_field: string;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string;
                    id?: string;
                    import_job_id: string;
                    source_column: string;
                    target_field: string;
                };
                Update: {
                    category?: string | null;
                    created_at?: string;
                    id?: string;
                    import_job_id?: string;
                    source_column?: string;
                    target_field?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'import_mappings_import_job_id_fkey';
                        columns: ['import_job_id'];
                        isOneToOne: false;
                        referencedRelation: 'import_jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            insight_timeline_events: {
                Row: {
                    created_at: string;
                    evidence_role: string;
                    insight_id: string;
                    position: number;
                    timeline_event_id: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    evidence_role?: string;
                    insight_id: string;
                    position?: number;
                    timeline_event_id: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    evidence_role?: string;
                    insight_id?: string;
                    position?: number;
                    timeline_event_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'insight_timeline_events_event_owner_fk';
                        columns: ['timeline_event_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'timeline_events';
                        referencedColumns: ['id', 'user_id'];
                    },
                    {
                        foreignKeyName: 'insight_timeline_events_insight_owner_fk';
                        columns: ['insight_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'insights';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            insights: {
                Row: {
                    confidence: number;
                    content_cleared_at: string | null;
                    content_hash: string;
                    created_at: string;
                    expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string;
                    kind: string;
                    metadata: Json;
                    model_name: string;
                    model_provider: string;
                    model_version: string;
                    policy_version: string;
                    primary_timeline_event_id: string;
                    state: string;
                    summary: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    confidence: number;
                    content_cleared_at?: string | null;
                    content_hash: string;
                    created_at?: string;
                    expires_at: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key: string;
                    kind: string;
                    metadata?: Json;
                    model_name: string;
                    model_provider: string;
                    model_version: string;
                    policy_version: string;
                    primary_timeline_event_id: string;
                    state?: string;
                    summary: string;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    confidence?: number;
                    content_cleared_at?: string | null;
                    content_hash?: string;
                    created_at?: string;
                    expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string;
                    kind?: string;
                    metadata?: Json;
                    model_name?: string;
                    model_provider?: string;
                    model_version?: string;
                    policy_version?: string;
                    primary_timeline_event_id?: string;
                    state?: string;
                    summary?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'insights_primary_event_owner_fk';
                        columns: ['primary_timeline_event_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'timeline_events';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            integration_connections: {
                Row: {
                    consecutive_failures: number;
                    created_at: string;
                    disabled_at: string | null;
                    disconnected_at: string | null;
                    error_message: string | null;
                    external_account_id: string | null;
                    id: string;
                    last_checked_at: string | null;
                    last_sync_started_at: string | null;
                    last_sync_succeeded_at: string | null;
                    metadata: Json;
                    next_sync_at: string | null;
                    provider_id: string;
                    scopes: string[];
                    state: string;
                    sync_cursor: string | null;
                    sync_error_code: string | null;
                    sync_error_detail: string | null;
                    sync_status: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    consecutive_failures?: number;
                    created_at?: string;
                    disabled_at?: string | null;
                    disconnected_at?: string | null;
                    error_message?: string | null;
                    external_account_id?: string | null;
                    id?: string;
                    last_checked_at?: string | null;
                    last_sync_started_at?: string | null;
                    last_sync_succeeded_at?: string | null;
                    metadata?: Json;
                    next_sync_at?: string | null;
                    provider_id: string;
                    scopes?: string[];
                    state?: string;
                    sync_cursor?: string | null;
                    sync_error_code?: string | null;
                    sync_error_detail?: string | null;
                    sync_status?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    consecutive_failures?: number;
                    created_at?: string;
                    disabled_at?: string | null;
                    disconnected_at?: string | null;
                    error_message?: string | null;
                    external_account_id?: string | null;
                    id?: string;
                    last_checked_at?: string | null;
                    last_sync_started_at?: string | null;
                    last_sync_succeeded_at?: string | null;
                    metadata?: Json;
                    next_sync_at?: string | null;
                    provider_id?: string;
                    scopes?: string[];
                    state?: string;
                    sync_cursor?: string | null;
                    sync_error_code?: string | null;
                    sync_error_detail?: string | null;
                    sync_status?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            job_artifacts: {
                Row: {
                    artifact_type: string;
                    created_at: string;
                    id: string;
                    job_id: string;
                    metadata: Json;
                    storage_path: string | null;
                };
                Insert: {
                    artifact_type: string;
                    created_at?: string;
                    id?: string;
                    job_id: string;
                    metadata?: Json;
                    storage_path?: string | null;
                };
                Update: {
                    artifact_type?: string;
                    created_at?: string;
                    id?: string;
                    job_id?: string;
                    metadata?: Json;
                    storage_path?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'job_artifacts_job_id_fkey';
                        columns: ['job_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            job_logs: {
                Row: {
                    created_at: string;
                    id: string;
                    job_id: string;
                    level: string;
                    message: string;
                    metadata: Json;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    job_id: string;
                    level?: string;
                    message: string;
                    metadata?: Json;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    job_id?: string;
                    level?: string;
                    message?: string;
                    metadata?: Json;
                };
                Relationships: [
                    {
                        foreignKeyName: 'job_logs_job_id_fkey';
                        columns: ['job_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            job_steps: {
                Row: {
                    completed_at: string | null;
                    id: string;
                    job_id: string;
                    metadata: Json;
                    name: string;
                    started_at: string | null;
                    status: string;
                };
                Insert: {
                    completed_at?: string | null;
                    id?: string;
                    job_id: string;
                    metadata?: Json;
                    name: string;
                    started_at?: string | null;
                    status?: string;
                };
                Update: {
                    completed_at?: string | null;
                    id?: string;
                    job_id?: string;
                    metadata?: Json;
                    name?: string;
                    started_at?: string | null;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'job_steps_job_id_fkey';
                        columns: ['job_id'];
                        isOneToOne: false;
                        referencedRelation: 'jobs';
                        referencedColumns: ['id'];
                    },
                ];
            };
            jobs: {
                Row: {
                    available_at: string | null;
                    completed_at: string | null;
                    confidence: number | null;
                    correlation_id: string | null;
                    created_at: string;
                    dead_lettered_at: string | null;
                    diagnostics_expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    failure_reason: string | null;
                    id: string;
                    idempotency_key: string | null;
                    max_attempts: number;
                    metadata: Json;
                    queue_job_id: string | null;
                    queue_name: string | null;
                    retry_count: number;
                    source_references: Json;
                    started_at: string | null;
                    status: string;
                    type: string;
                    updated_at: string;
                    user_id: string;
                    user_visible_result: Json | null;
                };
                Insert: {
                    available_at?: string | null;
                    completed_at?: string | null;
                    confidence?: number | null;
                    correlation_id?: string | null;
                    created_at?: string;
                    dead_lettered_at?: string | null;
                    diagnostics_expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    failure_reason?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    max_attempts?: number;
                    metadata?: Json;
                    queue_job_id?: string | null;
                    queue_name?: string | null;
                    retry_count?: number;
                    source_references?: Json;
                    started_at?: string | null;
                    status?: string;
                    type: string;
                    updated_at?: string;
                    user_id: string;
                    user_visible_result?: Json | null;
                };
                Update: {
                    available_at?: string | null;
                    completed_at?: string | null;
                    confidence?: number | null;
                    correlation_id?: string | null;
                    created_at?: string;
                    dead_lettered_at?: string | null;
                    diagnostics_expires_at?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    failure_reason?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    max_attempts?: number;
                    metadata?: Json;
                    queue_job_id?: string | null;
                    queue_name?: string | null;
                    retry_count?: number;
                    source_references?: Json;
                    started_at?: string | null;
                    status?: string;
                    type?: string;
                    updated_at?: string;
                    user_id?: string;
                    user_visible_result?: Json | null;
                };
                Relationships: [];
            };
            journals: {
                Row: {
                    content: string;
                    created_at: string;
                    deleted_at: string | null;
                    id: string;
                    image_url: string | null;
                    metadata: Json | null;
                    title: string;
                    type: string;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    content: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    image_url?: string | null;
                    metadata?: Json | null;
                    title: string;
                    type?: string;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    content?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    image_url?: string | null;
                    metadata?: Json | null;
                    title?: string;
                    type?: string;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            knowledge_items: {
                Row: {
                    body: string;
                    collection_ids: string[];
                    created_at: string;
                    id: string;
                    kind: string;
                    metadata: Json;
                    sources: Json;
                    tags: string[];
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    body?: string;
                    collection_ids?: string[];
                    created_at?: string;
                    id?: string;
                    kind: string;
                    metadata?: Json;
                    sources?: Json;
                    tags?: string[];
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    body?: string;
                    collection_ids?: string[];
                    created_at?: string;
                    id?: string;
                    kind?: string;
                    metadata?: Json;
                    sources?: Json;
                    tags?: string[];
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            memory_cards: {
                Row: {
                    back: string;
                    created_at: string;
                    deck_id: string;
                    due_date: string;
                    front: string;
                    id: string;
                    interval_days: number;
                    status: string;
                    user_id: string;
                };
                Insert: {
                    back: string;
                    created_at?: string;
                    deck_id: string;
                    due_date?: string;
                    front: string;
                    id?: string;
                    interval_days?: number;
                    status?: string;
                    user_id: string;
                };
                Update: {
                    back?: string;
                    created_at?: string;
                    deck_id?: string;
                    due_date?: string;
                    front?: string;
                    id?: string;
                    interval_days?: number;
                    status?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'memory_cards_deck_id_fkey';
                        columns: ['deck_id'];
                        isOneToOne: false;
                        referencedRelation: 'memory_decks';
                        referencedColumns: ['id'];
                    },
                ];
            };
            memory_decks: {
                Row: {
                    created_at: string;
                    description: string | null;
                    domain: string;
                    id: string;
                    source: string | null;
                    status: string;
                    title: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    domain?: string;
                    id?: string;
                    source?: string | null;
                    status?: string;
                    title: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    domain?: string;
                    id?: string;
                    source?: string | null;
                    status?: string;
                    title?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            memory_routines: {
                Row: {
                    created_at: string;
                    description: string | null;
                    domain: string;
                    enabled: boolean;
                    id: string;
                    minutes: number;
                    title: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    domain?: string;
                    enabled?: boolean;
                    id?: string;
                    minutes?: number;
                    title: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    domain?: string;
                    enabled?: boolean;
                    id?: string;
                    minutes?: number;
                    title?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            metric_snapshots: {
                Row: {
                    created_at: string;
                    dimensions: Json | null;
                    id: string;
                    key: string;
                    value: number;
                };
                Insert: {
                    created_at?: string;
                    dimensions?: Json | null;
                    id?: string;
                    key: string;
                    value: number;
                };
                Update: {
                    created_at?: string;
                    dimensions?: Json | null;
                    id?: string;
                    key?: string;
                    value?: number;
                };
                Relationships: [];
            };
            mood_logs: {
                Row: {
                    id: string;
                    logged_at: string;
                    logged_date: string;
                    mood: number;
                    note: string | null;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    logged_at?: string;
                    logged_date?: string;
                    mood: number;
                    note?: string | null;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    logged_at?: string;
                    logged_date?: string;
                    mood?: number;
                    note?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            notifications: {
                Row: {
                    body: string | null;
                    created_at: string;
                    entity_id: string | null;
                    entity_type: string | null;
                    href: string | null;
                    id: string;
                    read: boolean;
                    title: string;
                    type: string;
                    user_id: string;
                };
                Insert: {
                    body?: string | null;
                    created_at?: string;
                    entity_id?: string | null;
                    entity_type?: string | null;
                    href?: string | null;
                    id?: string;
                    read?: boolean;
                    title: string;
                    type: string;
                    user_id: string;
                };
                Update: {
                    body?: string | null;
                    created_at?: string;
                    entity_id?: string | null;
                    entity_type?: string | null;
                    href?: string | null;
                    id?: string;
                    read?: boolean;
                    title?: string;
                    type?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            onboarding_profiles: {
                Row: {
                    created_at: string;
                    current_step: string;
                    id: string;
                    profile: Json;
                    status: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    current_step?: string;
                    id?: string;
                    profile?: Json;
                    status?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    current_step?: string;
                    id?: string;
                    profile?: Json;
                    status?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            performance_events: {
                Row: {
                    created_at: string;
                    duration_ms: number;
                    id: string;
                    metadata: Json | null;
                    route: string | null;
                    source: string | null;
                    status: string | null;
                };
                Insert: {
                    created_at?: string;
                    duration_ms: number;
                    id?: string;
                    metadata?: Json | null;
                    route?: string | null;
                    source?: string | null;
                    status?: string | null;
                };
                Update: {
                    created_at?: string;
                    duration_ms?: number;
                    id?: string;
                    metadata?: Json | null;
                    route?: string | null;
                    source?: string | null;
                    status?: string | null;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    anthropic_api_key: string | null;
                    created_at: string | null;
                    full_name: string | null;
                    id: string;
                    role: string;
                    updated_at: string | null;
                    use_ai_email: boolean;
                };
                Insert: {
                    anthropic_api_key?: string | null;
                    created_at?: string | null;
                    full_name?: string | null;
                    id: string;
                    role?: string;
                    updated_at?: string | null;
                    use_ai_email?: boolean;
                };
                Update: {
                    anthropic_api_key?: string | null;
                    created_at?: string | null;
                    full_name?: string | null;
                    id?: string;
                    role?: string;
                    updated_at?: string | null;
                    use_ai_email?: boolean;
                };
                Relationships: [];
            };
            quick_notes: {
                Row: {
                    content: string;
                    id: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    content?: string;
                    id?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    content?: string;
                    id?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            raw_observations: {
                Row: {
                    event_type: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string;
                    ingested_at: string;
                    integration_connection_id: string | null;
                    metadata: Json;
                    normalization_version: string | null;
                    normalized_at: string | null;
                    occurred_at: string;
                    payload: Json;
                    payload_cleared_at: string | null;
                    payload_expires_at: string;
                    payload_hash: string;
                    provider_object_id: string;
                    provider_version: string;
                    source_key: string;
                    source_type: string;
                    status: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    event_type: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key: string;
                    ingested_at?: string;
                    integration_connection_id?: string | null;
                    metadata?: Json;
                    normalization_version?: string | null;
                    normalized_at?: string | null;
                    occurred_at: string;
                    payload?: Json;
                    payload_cleared_at?: string | null;
                    payload_expires_at?: string;
                    payload_hash: string;
                    provider_object_id: string;
                    provider_version: string;
                    source_key: string;
                    source_type: string;
                    status?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    event_type?: string;
                    failure_code?: string | null;
                    failure_detail?: string | null;
                    id?: string;
                    idempotency_key?: string;
                    ingested_at?: string;
                    integration_connection_id?: string | null;
                    metadata?: Json;
                    normalization_version?: string | null;
                    normalized_at?: string | null;
                    occurred_at?: string;
                    payload?: Json;
                    payload_cleared_at?: string | null;
                    payload_expires_at?: string;
                    payload_hash?: string;
                    provider_object_id?: string;
                    provider_version?: string;
                    source_key?: string;
                    source_type?: string;
                    status?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'raw_observations_connection_owner_fk';
                        columns: ['integration_connection_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'integration_connections';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            reading_bookmarks: {
                Row: {
                    citation: string | null;
                    color: string;
                    created_at: string;
                    document_id: string;
                    id: string;
                    label: string | null;
                    position: Json;
                    user_id: string;
                };
                Insert: {
                    citation?: string | null;
                    color?: string;
                    created_at?: string;
                    document_id: string;
                    id?: string;
                    label?: string | null;
                    position?: Json;
                    user_id: string;
                };
                Update: {
                    citation?: string | null;
                    color?: string;
                    created_at?: string;
                    document_id?: string;
                    id?: string;
                    label?: string | null;
                    position?: Json;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reading_bookmarks_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'reading_documents';
                        referencedColumns: ['id'];
                    },
                ];
            };
            reading_documents: {
                Row: {
                    author: string | null;
                    created_at: string;
                    description: string | null;
                    external_id: string | null;
                    id: string;
                    language: string;
                    metadata: Json;
                    permissions: string[];
                    provider_id: string;
                    source: Json;
                    subtitle: string | null;
                    thumbnail_url: string | null;
                    title: string;
                    total_pages: number | null;
                    type: string;
                    user_id: string | null;
                };
                Insert: {
                    author?: string | null;
                    created_at?: string;
                    description?: string | null;
                    external_id?: string | null;
                    id?: string;
                    language?: string;
                    metadata?: Json;
                    permissions?: string[];
                    provider_id: string;
                    source?: Json;
                    subtitle?: string | null;
                    thumbnail_url?: string | null;
                    title: string;
                    total_pages?: number | null;
                    type: string;
                    user_id?: string | null;
                };
                Update: {
                    author?: string | null;
                    created_at?: string;
                    description?: string | null;
                    external_id?: string | null;
                    id?: string;
                    language?: string;
                    metadata?: Json;
                    permissions?: string[];
                    provider_id?: string;
                    source?: Json;
                    subtitle?: string | null;
                    thumbnail_url?: string | null;
                    title?: string;
                    total_pages?: number | null;
                    type?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            reading_highlights: {
                Row: {
                    citation: string | null;
                    color: string;
                    created_at: string;
                    document_id: string;
                    id: string;
                    note: string | null;
                    position_end: Json;
                    position_start: Json;
                    text_snippet: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    citation?: string | null;
                    color?: string;
                    created_at?: string;
                    document_id: string;
                    id?: string;
                    note?: string | null;
                    position_end?: Json;
                    position_start?: Json;
                    text_snippet: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    citation?: string | null;
                    color?: string;
                    created_at?: string;
                    document_id?: string;
                    id?: string;
                    note?: string | null;
                    position_end?: Json;
                    position_start?: Json;
                    text_snippet?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reading_highlights_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'reading_documents';
                        referencedColumns: ['id'];
                    },
                ];
            };
            reading_notes: {
                Row: {
                    citation: string | null;
                    content: string;
                    created_at: string;
                    document_id: string;
                    id: string;
                    position: Json;
                    position_end: Json | null;
                    tags: string[];
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    citation?: string | null;
                    content: string;
                    created_at?: string;
                    document_id: string;
                    id?: string;
                    position?: Json;
                    position_end?: Json | null;
                    tags?: string[];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    citation?: string | null;
                    content?: string;
                    created_at?: string;
                    document_id?: string;
                    id?: string;
                    position?: Json;
                    position_end?: Json | null;
                    tags?: string[];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reading_notes_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'reading_documents';
                        referencedColumns: ['id'];
                    },
                ];
            };
            reading_plans: {
                Row: {
                    created_at: string;
                    current_day: number;
                    description: string | null;
                    entries: Json;
                    id: string;
                    is_active: boolean;
                    start_date: string | null;
                    streak: number;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    current_day?: number;
                    description?: string | null;
                    entries?: Json;
                    id?: string;
                    is_active?: boolean;
                    start_date?: string | null;
                    streak?: number;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    current_day?: number;
                    description?: string | null;
                    entries?: Json;
                    id?: string;
                    is_active?: boolean;
                    start_date?: string | null;
                    streak?: number;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            reading_positions: {
                Row: {
                    completed_at: string | null;
                    document_id: string;
                    id: string;
                    percent_complete: number;
                    position: Json;
                    time_spent_minutes: number;
                    updated_at: string;
                    user_id: string;
                    version_id: string | null;
                };
                Insert: {
                    completed_at?: string | null;
                    document_id: string;
                    id?: string;
                    percent_complete?: number;
                    position?: Json;
                    time_spent_minutes?: number;
                    updated_at?: string;
                    user_id: string;
                    version_id?: string | null;
                };
                Update: {
                    completed_at?: string | null;
                    document_id?: string;
                    id?: string;
                    percent_complete?: number;
                    position?: Json;
                    time_spent_minutes?: number;
                    updated_at?: string;
                    user_id?: string;
                    version_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reading_positions_document_id_fkey';
                        columns: ['document_id'];
                        isOneToOne: false;
                        referencedRelation: 'reading_documents';
                        referencedColumns: ['id'];
                    },
                ];
            };
            recovery_profiles: {
                Row: {
                    addiction: string | null;
                    created_at: string | null;
                    id: string;
                    start_time: string | null;
                    user_id: string | null;
                };
                Insert: {
                    addiction?: string | null;
                    created_at?: string | null;
                    id?: string;
                    start_time?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    addiction?: string | null;
                    created_at?: string | null;
                    id?: string;
                    start_time?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            relapses: {
                Row: {
                    id: string;
                    relapsed_at: string | null;
                    tracker_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    id?: string;
                    relapsed_at?: string | null;
                    tracker_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    id?: string;
                    relapsed_at?: string | null;
                    tracker_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'relapses_tracker_id_fkey';
                        columns: ['tracker_id'];
                        isOneToOne: false;
                        referencedRelation: 'recovery_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            study_chapters: {
                Row: {
                    created_at: string;
                    id: string;
                    pgn: string;
                    position: number;
                    study_id: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    pgn?: string;
                    position?: number;
                    study_id: string;
                    title?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    pgn?: string;
                    position?: number;
                    study_id?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'study_chapters_study_id_fkey';
                        columns: ['study_id'];
                        isOneToOne: false;
                        referencedRelation: 'chess_studies';
                        referencedColumns: ['id'];
                    },
                ];
            };
            supplements: {
                Row: {
                    active: boolean;
                    created_at: string;
                    dose: string | null;
                    id: string;
                    name: string;
                    schedule_end: string | null;
                    schedule_start: string;
                    schedule_type: string;
                    user_id: string;
                };
                Insert: {
                    active?: boolean;
                    created_at?: string;
                    dose?: string | null;
                    id?: string;
                    name: string;
                    schedule_end?: string | null;
                    schedule_start: string;
                    schedule_type: string;
                    user_id: string;
                };
                Update: {
                    active?: boolean;
                    created_at?: string;
                    dose?: string | null;
                    id?: string;
                    name?: string;
                    schedule_end?: string | null;
                    schedule_start?: string;
                    schedule_type?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            timeline_events: {
                Row: {
                    content_hash: string;
                    deleted_at: string | null;
                    event_type: string;
                    expires_at: string;
                    id: string;
                    idempotency_key: string;
                    ingested_at: string;
                    metadata: Json;
                    normalization_version: string;
                    observation_id: string;
                    occurred_at: string;
                    revision: number;
                    source_record_id: string | null;
                    source_record_table: string | null;
                    source_type: string;
                    state: string;
                    summary: string | null;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    content_hash: string;
                    deleted_at?: string | null;
                    event_type: string;
                    expires_at?: string;
                    id?: string;
                    idempotency_key: string;
                    ingested_at?: string;
                    metadata?: Json;
                    normalization_version: string;
                    observation_id: string;
                    occurred_at: string;
                    revision?: number;
                    source_record_id?: string | null;
                    source_record_table?: string | null;
                    source_type: string;
                    state?: string;
                    summary?: string | null;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    content_hash?: string;
                    deleted_at?: string | null;
                    event_type?: string;
                    expires_at?: string;
                    id?: string;
                    idempotency_key?: string;
                    ingested_at?: string;
                    metadata?: Json;
                    normalization_version?: string;
                    observation_id?: string;
                    occurred_at?: string;
                    revision?: number;
                    source_record_id?: string | null;
                    source_record_table?: string | null;
                    source_type?: string;
                    state?: string;
                    summary?: string | null;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'timeline_events_observation_owner_fk';
                        columns: ['observation_id', 'user_id'];
                        isOneToOne: false;
                        referencedRelation: 'raw_observations';
                        referencedColumns: ['id', 'user_id'];
                    },
                ];
            };
            todos: {
                Row: {
                    completed: boolean;
                    completed_at: string | null;
                    created_at: string;
                    id: string;
                    text: string;
                    user_id: string;
                };
                Insert: {
                    completed?: boolean;
                    completed_at?: string | null;
                    created_at?: string;
                    id?: string;
                    text: string;
                    user_id: string;
                };
                Update: {
                    completed?: boolean;
                    completed_at?: string | null;
                    created_at?: string;
                    id?: string;
                    text?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            tracking_entries: {
                Row: {
                    category: string;
                    created_at: string;
                    entry_date: string;
                    id: string;
                    logged_at: string;
                    metadata: Json;
                    notes: string | null;
                    source: string;
                    tags: string[];
                    user_id: string;
                };
                Insert: {
                    category: string;
                    created_at?: string;
                    entry_date: string;
                    id?: string;
                    logged_at?: string;
                    metadata?: Json;
                    notes?: string | null;
                    source?: string;
                    tags?: string[];
                    user_id: string;
                };
                Update: {
                    category?: string;
                    created_at?: string;
                    entry_date?: string;
                    id?: string;
                    logged_at?: string;
                    metadata?: Json;
                    notes?: string | null;
                    source?: string;
                    tags?: string[];
                    user_id?: string;
                };
                Relationships: [];
            };
            tracking_goals: {
                Row: {
                    active: boolean;
                    category: string;
                    created_at: string;
                    id: string;
                    metric_key: string | null;
                    target_type: string;
                    target_value: number;
                    user_id: string;
                };
                Insert: {
                    active?: boolean;
                    category: string;
                    created_at?: string;
                    id?: string;
                    metric_key?: string | null;
                    target_type: string;
                    target_value: number;
                    user_id: string;
                };
                Update: {
                    active?: boolean;
                    category?: string;
                    created_at?: string;
                    id?: string;
                    metric_key?: string | null;
                    target_type?: string;
                    target_value?: number;
                    user_id?: string;
                };
                Relationships: [];
            };
            urges: {
                Row: {
                    created_at: string | null;
                    id: string;
                    intensity: number | null;
                    tracker_id: string | null;
                    trigger: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    intensity?: number | null;
                    tracker_id?: string | null;
                    trigger?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    intensity?: number | null;
                    tracker_id?: string | null;
                    trigger?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'urges_tracker_id_fkey';
                        columns: ['tracker_id'];
                        isOneToOne: false;
                        referencedRelation: 'recovery_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_email_accounts: {
                Row: {
                    access_token: string;
                    created_at: string;
                    display_name: string | null;
                    email: string;
                    expires_at: number | null;
                    id: string;
                    last_synced_at: string | null;
                    provider: string;
                    refresh_token: string | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    access_token: string;
                    created_at?: string;
                    display_name?: string | null;
                    email: string;
                    expires_at?: number | null;
                    id?: string;
                    last_synced_at?: string | null;
                    provider: string;
                    refresh_token?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    access_token?: string;
                    created_at?: string;
                    display_name?: string | null;
                    email?: string;
                    expires_at?: number | null;
                    id?: string;
                    last_synced_at?: string | null;
                    provider?: string;
                    refresh_token?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            user_feedback: {
                Row: {
                    bugs_found: string | null;
                    created_at: string;
                    feature_area: string | null;
                    feedback_type: string | null;
                    general_comment: string | null;
                    how_heard: string | null;
                    id: string;
                    satisfaction_rating: number | null;
                    user_id: string | null;
                    want_to_see: string | null;
                    what_confused: string | null;
                    what_i_did: string | null;
                    what_i_wanted: string | null;
                };
                Insert: {
                    bugs_found?: string | null;
                    created_at?: string;
                    feature_area?: string | null;
                    feedback_type?: string | null;
                    general_comment?: string | null;
                    how_heard?: string | null;
                    id?: string;
                    satisfaction_rating?: number | null;
                    user_id?: string | null;
                    want_to_see?: string | null;
                    what_confused?: string | null;
                    what_i_did?: string | null;
                    what_i_wanted?: string | null;
                };
                Update: {
                    bugs_found?: string | null;
                    created_at?: string;
                    feature_area?: string | null;
                    feedback_type?: string | null;
                    general_comment?: string | null;
                    how_heard?: string | null;
                    id?: string;
                    satisfaction_rating?: number | null;
                    user_id?: string | null;
                    want_to_see?: string | null;
                    what_confused?: string | null;
                    what_i_did?: string | null;
                    what_i_wanted?: string | null;
                };
                Relationships: [];
            };
            user_integration_keys: {
                Row: {
                    api_key: string;
                    created_at: string;
                    id: string;
                    label: string | null;
                    provider: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    api_key: string;
                    created_at?: string;
                    id?: string;
                    label?: string | null;
                    provider: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    api_key?: string;
                    created_at?: string;
                    id?: string;
                    label?: string | null;
                    provider?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            user_model_keys: {
                Row: {
                    api_key_encrypted: string;
                    created_at: string;
                    id: string;
                    provider: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    api_key_encrypted: string;
                    created_at?: string;
                    id?: string;
                    provider: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    api_key_encrypted?: string;
                    created_at?: string;
                    id?: string;
                    provider?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            user_preferences: {
                Row: {
                    preferences: Json;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    preferences?: Json;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    preferences?: Json;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            user_tokens: {
                Row: {
                    access_token: string;
                    expires_at: number | null;
                    gmail_email: string | null;
                    has_calendar: boolean;
                    has_drive: boolean;
                    has_gmail: boolean;
                    has_microsoft: boolean;
                    last_history_id: string | null;
                    microsoft_access_token: string | null;
                    microsoft_refresh_token: string | null;
                    provider: string | null;
                    refresh_token: string | null;
                    updated_at: string;
                    user_id: string;
                    watch_expiry: string | null;
                };
                Insert: {
                    access_token: string;
                    expires_at?: number | null;
                    gmail_email?: string | null;
                    has_calendar?: boolean;
                    has_drive?: boolean;
                    has_gmail?: boolean;
                    has_microsoft?: boolean;
                    last_history_id?: string | null;
                    microsoft_access_token?: string | null;
                    microsoft_refresh_token?: string | null;
                    provider?: string | null;
                    refresh_token?: string | null;
                    updated_at?: string;
                    user_id: string;
                    watch_expiry?: string | null;
                };
                Update: {
                    access_token?: string;
                    expires_at?: number | null;
                    gmail_email?: string | null;
                    has_calendar?: boolean;
                    has_drive?: boolean;
                    has_gmail?: boolean;
                    has_microsoft?: boolean;
                    last_history_id?: string | null;
                    microsoft_access_token?: string | null;
                    microsoft_refresh_token?: string | null;
                    provider?: string | null;
                    refresh_token?: string | null;
                    updated_at?: string;
                    user_id?: string;
                    watch_expiry?: string | null;
                };
                Relationships: [];
            };
            watchlist_items: {
                Row: {
                    asset_type: string;
                    config: Json;
                    created_at: string;
                    currency: string;
                    display_name: string;
                    id: string;
                    symbol: string;
                    user_id: string;
                };
                Insert: {
                    asset_type: string;
                    config?: Json;
                    created_at?: string;
                    currency?: string;
                    display_name: string;
                    id?: string;
                    symbol: string;
                    user_id: string;
                };
                Update: {
                    asset_type?: string;
                    config?: Json;
                    created_at?: string;
                    currency?: string;
                    display_name?: string;
                    id?: string;
                    symbol?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            watchlist_readings: {
                Row: {
                    fetched_at: string;
                    id: string;
                    item_id: string;
                    metadata: Json;
                    source: string;
                    user_id: string;
                    value: number;
                };
                Insert: {
                    fetched_at?: string;
                    id?: string;
                    item_id: string;
                    metadata?: Json;
                    source?: string;
                    user_id: string;
                    value: number;
                };
                Update: {
                    fetched_at?: string;
                    id?: string;
                    item_id?: string;
                    metadata?: Json;
                    source?: string;
                    user_id?: string;
                    value?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'watchlist_readings_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: false;
                        referencedRelation: 'watchlist_items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            widget_instances: {
                Row: {
                    active: boolean;
                    config: Json;
                    created_at: string;
                    feature_id: string;
                    id: string;
                    updated_at: string;
                    user_id: string;
                    widget_id: string;
                };
                Insert: {
                    active?: boolean;
                    config?: Json;
                    created_at?: string;
                    feature_id: string;
                    id?: string;
                    updated_at?: string;
                    user_id: string;
                    widget_id: string;
                };
                Update: {
                    active?: boolean;
                    config?: Json;
                    created_at?: string;
                    feature_id?: string;
                    id?: string;
                    updated_at?: string;
                    user_id?: string;
                    widget_id?: string;
                };
                Relationships: [];
            };
            widget_settings: {
                Row: {
                    id: string;
                    settings: Json;
                    updated_at: string;
                    user_id: string;
                    widget_id: string;
                };
                Insert: {
                    id?: string;
                    settings?: Json;
                    updated_at?: string;
                    user_id: string;
                    widget_id: string;
                };
                Update: {
                    id?: string;
                    settings?: Json;
                    updated_at?: string;
                    user_id?: string;
                    widget_id?: string;
                };
                Relationships: [];
            };
            workspace_activity: {
                Row: {
                    action: string;
                    actor_email: string | null;
                    actor_id: string | null;
                    created_at: string;
                    id: string;
                    metadata: Json;
                    target_id: string | null;
                    target_type: string | null;
                    workspace_id: string;
                };
                Insert: {
                    action: string;
                    actor_email?: string | null;
                    actor_id?: string | null;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    target_id?: string | null;
                    target_type?: string | null;
                    workspace_id: string;
                };
                Update: {
                    action?: string;
                    actor_email?: string | null;
                    actor_id?: string | null;
                    created_at?: string;
                    id?: string;
                    metadata?: Json;
                    target_id?: string | null;
                    target_type?: string | null;
                    workspace_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workspace_activity_workspace_id_fkey';
                        columns: ['workspace_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_workspaces';
                        referencedColumns: ['id'];
                    },
                ];
            };
            workspace_approvals: {
                Row: {
                    approvals_received: number;
                    approvals_required: number;
                    created_at: string;
                    description: string | null;
                    handoff_id: string | null;
                    id: string;
                    requester_id: string;
                    resolved_at: string | null;
                    status: string;
                    title: string;
                    updated_at: string;
                    workspace_id: string;
                };
                Insert: {
                    approvals_received?: number;
                    approvals_required?: number;
                    created_at?: string;
                    description?: string | null;
                    handoff_id?: string | null;
                    id?: string;
                    requester_id: string;
                    resolved_at?: string | null;
                    status?: string;
                    title: string;
                    updated_at?: string;
                    workspace_id: string;
                };
                Update: {
                    approvals_received?: number;
                    approvals_required?: number;
                    created_at?: string;
                    description?: string | null;
                    handoff_id?: string | null;
                    id?: string;
                    requester_id?: string;
                    resolved_at?: string | null;
                    status?: string;
                    title?: string;
                    updated_at?: string;
                    workspace_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workspace_approvals_handoff_id_fkey';
                        columns: ['handoff_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_handoffs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'workspace_approvals_workspace_id_fkey';
                        columns: ['workspace_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_workspaces';
                        referencedColumns: ['id'];
                    },
                ];
            };
            workspace_comments: {
                Row: {
                    author_id: string;
                    body: string;
                    created_at: string;
                    edited: boolean;
                    handoff_id: string | null;
                    id: string;
                    parent_id: string | null;
                    updated_at: string;
                    workspace_id: string;
                };
                Insert: {
                    author_id: string;
                    body: string;
                    created_at?: string;
                    edited?: boolean;
                    handoff_id?: string | null;
                    id?: string;
                    parent_id?: string | null;
                    updated_at?: string;
                    workspace_id: string;
                };
                Update: {
                    author_id?: string;
                    body?: string;
                    created_at?: string;
                    edited?: boolean;
                    handoff_id?: string | null;
                    id?: string;
                    parent_id?: string | null;
                    updated_at?: string;
                    workspace_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workspace_comments_handoff_id_fkey';
                        columns: ['handoff_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_handoffs';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'workspace_comments_parent_id_fkey';
                        columns: ['parent_id'];
                        isOneToOne: false;
                        referencedRelation: 'workspace_comments';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'workspace_comments_workspace_id_fkey';
                        columns: ['workspace_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_workspaces';
                        referencedColumns: ['id'];
                    },
                ];
            };
            workspace_invites: {
                Row: {
                    created_at: string;
                    email: string;
                    expires_at: string;
                    id: string;
                    inviter_id: string;
                    role: string;
                    status: string;
                    token: string;
                    workspace_id: string;
                };
                Insert: {
                    created_at?: string;
                    email: string;
                    expires_at?: string;
                    id?: string;
                    inviter_id: string;
                    role?: string;
                    status?: string;
                    token: string;
                    workspace_id: string;
                };
                Update: {
                    created_at?: string;
                    email?: string;
                    expires_at?: string;
                    id?: string;
                    inviter_id?: string;
                    role?: string;
                    status?: string;
                    token?: string;
                    workspace_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workspace_invites_workspace_id_fkey';
                        columns: ['workspace_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_workspaces';
                        referencedColumns: ['id'];
                    },
                ];
            };
            workspace_members: {
                Row: {
                    created_at: string;
                    email: string | null;
                    id: string;
                    joined_at: string | null;
                    role: string;
                    status: string;
                    updated_at: string;
                    user_id: string | null;
                    workspace_id: string;
                };
                Insert: {
                    created_at?: string;
                    email?: string | null;
                    id?: string;
                    joined_at?: string | null;
                    role?: string;
                    status?: string;
                    updated_at?: string;
                    user_id?: string | null;
                    workspace_id: string;
                };
                Update: {
                    created_at?: string;
                    email?: string | null;
                    id?: string;
                    joined_at?: string | null;
                    role?: string;
                    status?: string;
                    updated_at?: string;
                    user_id?: string | null;
                    workspace_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workspace_members_workspace_id_fkey';
                        columns: ['workspace_id'];
                        isOneToOne: false;
                        referencedRelation: 'collaboration_workspaces';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            decide_action_request: {
                Args: {
                    p_action_request_id: string;
                    p_decided_at?: string;
                    p_decision: string;
                    p_payload: Json;
                    p_payload_hash: string;
                    p_payload_version: number;
                    p_permission_snapshot_hash: string;
                };
                Returns: {
                    action_id: string;
                    approval_state: string;
                    approved_at: string | null;
                    approved_payload: Json | null;
                    approved_payload_hash: string | null;
                    approved_payload_version: number | null;
                    automation_run_id: string | null;
                    candidate_action_id: string | null;
                    confidence: number | null;
                    created_at: string;
                    decided_at: string | null;
                    denied_at: string | null;
                    execution_completed_at: string | null;
                    execution_started_at: string | null;
                    expires_at: string;
                    failure_code: string | null;
                    failure_detail: string | null;
                    id: string;
                    idempotency_key: string | null;
                    job_id: string | null;
                    payload: Json;
                    payload_hash: string | null;
                    payload_version: number;
                    permission_snapshot_hash: string | null;
                    policy_version: string | null;
                    requested_at: string;
                    source_widget_id: string | null;
                    state_version: number;
                    status: string;
                    updated_at: string;
                    user_id: string;
                }[];
                SetofOptions: {
                    from: '*';
                    to: 'action_requests';
                    isOneToOne: false;
                    isSetofReturn: true;
                };
            };
            get_month_day: { Args: { ts: string }; Returns: string };
            grant_admin: { Args: { target_email: string }; Returns: undefined };
            is_company_leader: {
                Args: { allowed_roles?: string[]; target_company_id: string };
                Returns: boolean;
            };
            is_company_member: {
                Args: { target_company_id: string };
                Returns: boolean;
            };
            is_workspace_editor_or_owner: {
                Args: { p_workspace_id: string };
                Returns: boolean;
            };
            is_workspace_member: {
                Args: { p_workspace_id: string };
                Returns: boolean;
            };
            purge_expired_v1_lifecycle: {
                Args: { p_now?: string };
                Returns: Json;
            };
            restore_journal: {
                Args: { p_entry_id: string };
                Returns: undefined;
            };
            soft_delete_journal: {
                Args: { p_entry_id: string };
                Returns: undefined;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    'public'
>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {},
    },
} as const;
