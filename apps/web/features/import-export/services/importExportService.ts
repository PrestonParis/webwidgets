import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ImportJob,
    ExportJob,
    ContextExportRecord,
    AuditEvent,
    ImportJobLog,
} from '@/features/import-export/types/importExport';

// ── Row-to-domain helpers ─────────────────────────────────────────────────────

function rowToImportJob(row: Record<string, unknown>): ImportJob {
    return {
        id: row['id'] as string,
        userId: row['user_id'] as string,
        ...(row['title'] != null ? { title: row['title'] as string } : {}),
        format: row['format'] as ImportJob['format'],
        sourceType: (row['source_type'] as ImportJob['sourceType']) ?? 'file',
        destinationType:
            (row['destination_type'] as ImportJob['destinationType']) ??
            'tracking_entries',
        duplicateStrategy:
            (row['duplicate_strategy'] as ImportJob['duplicateStrategy']) ??
            'skip',
        mappings: (row['mappings'] as ImportJob['mappings']) ?? [],
        validationResults:
            (row['validation_results'] as ImportJob['validationResults']) ?? [],
        status: row['status'] as ImportJob['status'],
        ...(row['row_count'] != null
            ? { rowCount: row['row_count'] as number }
            : {}),
        successCount: (row['success_count'] as number) ?? 0,
        errorCount: (row['error_count'] as number) ?? 0,
        warningCount: (row['warning_count'] as number) ?? 0,
        ...(row['error'] != null ? { error: row['error'] as string } : {}),
        createdAt: row['created_at'] as string,
        ...(row['updated_at'] != null
            ? { updatedAt: row['updated_at'] as string }
            : {}),
        ...(row['completed_at'] != null
            ? { completedAt: row['completed_at'] as string }
            : {}),
    };
}

function rowToExportJob(row: Record<string, unknown>): ExportJob {
    return {
        id: row['id'] as string,
        userId: row['user_id'] as string,
        title: row['title'] as string,
        sourceType: row['source_type'] as ExportJob['sourceType'],
        format: row['format'] as ExportJob['format'],
        status: row['status'] as ExportJob['status'],
        ...(row['row_count'] != null
            ? { rowCount: row['row_count'] as number }
            : {}),
        ...(row['output_url'] != null
            ? { outputUrl: row['output_url'] as string }
            : {}),
        ...(row['output_size_bytes'] != null
            ? { outputSizeBytes: row['output_size_bytes'] as number }
            : {}),
        ...(row['output_expires_at'] != null
            ? { outputExpiresAt: row['output_expires_at'] as string }
            : {}),
        ...(row['error'] != null ? { error: row['error'] as string } : {}),
        metadata: (row['metadata'] as Record<string, unknown>) ?? {},
        createdAt: row['created_at'] as string,
        updatedAt: row['updated_at'] as string,
        ...(row['completed_at'] != null
            ? { completedAt: row['completed_at'] as string }
            : {}),
    };
}

function rowToContextExport(row: Record<string, unknown>): ContextExportRecord {
    return {
        id: row['id'] as string,
        userId: row['user_id'] as string,
        scope: (row['scope'] as string) ?? 'personal',
        status: row['status'] as ContextExportRecord['status'],
        sources: (row['sources'] as unknown[]) ?? [],
        ...(row['system_prompt_content'] != null
            ? { systemPromptContent: row['system_prompt_content'] as string }
            : {}),
        warnings: (row['warnings'] as string[]) ?? [],
        errors: (row['errors'] as string[]) ?? [],
        availableSources: (row['available_sources'] as number) ?? 0,
        unavailableSources: (row['unavailable_sources'] as number) ?? 0,
        expiresAt: row['expires_at'] as string,
        createdAt: row['created_at'] as string,
    };
}

function rowToAuditEvent(row: Record<string, unknown>): AuditEvent {
    return {
        id: row['id'] as string,
        userId: row['user_id'] as string,
        action: row['action'] as string,
        resourceType: row['resource_type'] as string,
        ...(row['resource_id'] != null
            ? { resourceId: row['resource_id'] as string }
            : {}),
        metadata: (row['metadata'] as Record<string, unknown>) ?? {},
        createdAt: row['created_at'] as string,
    };
}

// ── Import jobs ───────────────────────────────────────────────────────────────

export async function createImportJob(
    supabase: SupabaseClient,
    userId: string,
    data: {
        title?: string;
        format: string;
        source_type?: string;
        destination_type?: string;
        duplicate_strategy?: string;
    },
): Promise<ImportJob> {
    const { data: row, error } = await supabase
        .from('import_jobs')
        .insert({
            user_id: userId,
            title: data.title ?? null,
            format: data.format,
            source_type: data.source_type ?? 'file',
            destination_type: data.destination_type ?? 'tracking_entries',
            duplicate_strategy: data.duplicate_strategy ?? 'skip',
            status: 'draft',
            mappings: [],
            validation_results: [],
            success_count: 0,
            error_count: 0,
            warning_count: 0,
        })
        .select('*')
        .single();
    if (error) throw error;
    return rowToImportJob(row as Record<string, unknown>);
}

export async function getImportJob(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<ImportJob | null> {
    const { data: row, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (error) return null;
    return rowToImportJob(row as Record<string, unknown>);
}

export async function listImportJobs(
    supabase: SupabaseClient,
    userId: string,
): Promise<ImportJob[]> {
    const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) throw error;
    return (data ?? []).map((r) =>
        rowToImportJob(r as Record<string, unknown>),
    );
}

// Keep backward-compat alias
export const listImportJobsForUser = listImportJobs;

export async function updateImportJob(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    patch: Record<string, unknown>,
): Promise<ImportJob> {
    const { data: row, error } = await supabase
        .from('import_jobs')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();
    if (error) throw error;
    return rowToImportJob(row as Record<string, unknown>);
}

export async function addImportJobLog(
    supabase: SupabaseClient,
    jobId: string,
    level: ImportJobLog['level'],
    message: string,
    rowNumber?: number,
    metadata?: Record<string, unknown>,
): Promise<void> {
    void supabase.from('import_job_logs').insert({
        import_job_id: jobId,
        level,
        message,
        row_number: rowNumber ?? null,
        metadata: metadata ?? {},
    });
}

// ── Export jobs ───────────────────────────────────────────────────────────────

export async function createExportJob(
    supabase: SupabaseClient,
    userId: string,
    data: {
        title: string;
        source_type: string;
        format: string;
        metadata?: Record<string, unknown>;
    },
): Promise<ExportJob> {
    const { data: row, error } = await supabase
        .from('export_jobs')
        .insert({
            user_id: userId,
            title: data.title,
            source_type: data.source_type,
            format: data.format,
            status: 'requested',
            metadata: data.metadata ?? {},
        })
        .select('*')
        .single();
    if (error) throw error;
    return rowToExportJob(row as Record<string, unknown>);
}

export async function getExportJob(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<ExportJob | null> {
    const { data: row, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (error) return null;
    return rowToExportJob(row as Record<string, unknown>);
}

export async function listExportJobs(
    supabase: SupabaseClient,
    userId: string,
): Promise<ExportJob[]> {
    const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) throw error;
    return (data ?? []).map((r) =>
        rowToExportJob(r as Record<string, unknown>),
    );
}

export async function updateExportJob(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    patch: Record<string, unknown>,
): Promise<ExportJob> {
    const { data: row, error } = await supabase
        .from('export_jobs')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();
    if (error) throw error;
    return rowToExportJob(row as Record<string, unknown>);
}

// ── Context exports ───────────────────────────────────────────────────────────

export async function createContextExport(
    supabase: SupabaseClient,
    userId: string,
    data: {
        scope?: string;
        status?: ContextExportRecord['status'];
        sources?: unknown[];
        system_prompt_content?: string;
        warnings?: string[];
        errors?: string[];
        available_sources?: number;
        unavailable_sources?: number;
    },
): Promise<ContextExportRecord> {
    const { data: row, error } = await supabase
        .from('context_exports')
        .insert({
            user_id: userId,
            scope: data.scope ?? 'personal',
            status: data.status ?? 'requested',
            sources: data.sources ?? [],
            system_prompt_content: data.system_prompt_content ?? null,
            warnings: data.warnings ?? [],
            errors: data.errors ?? [],
            available_sources: data.available_sources ?? 0,
            unavailable_sources: data.unavailable_sources ?? 0,
        })
        .select('*')
        .single();
    if (error) throw error;
    return rowToContextExport(row as Record<string, unknown>);
}

export async function getContextExport(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<ContextExportRecord | null> {
    const { data: row, error } = await supabase
        .from('context_exports')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (error) return null;
    return rowToContextExport(row as Record<string, unknown>);
}

export async function listContextExports(
    supabase: SupabaseClient,
    userId: string,
): Promise<ContextExportRecord[]> {
    const { data, error } = await supabase
        .from('context_exports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
    if (error) throw error;
    return (data ?? []).map((r) =>
        rowToContextExport(r as Record<string, unknown>),
    );
}

// ── Audit events ──────────────────────────────────────────────────────────────

export async function addAuditEvent(
    supabase: SupabaseClient,
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>,
): Promise<void> {
    // Fire and forget — never block the main operation on audit logging
    void supabase.from('import_export_audit_events').insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId ?? null,
        metadata: metadata ?? {},
    });
}

export async function listAuditEvents(
    supabase: SupabaseClient,
    userId: string,
    limit = 50,
): Promise<AuditEvent[]> {
    const { data, error } = await supabase
        .from('import_export_audit_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) =>
        rowToAuditEvent(r as Record<string, unknown>),
    );
}
