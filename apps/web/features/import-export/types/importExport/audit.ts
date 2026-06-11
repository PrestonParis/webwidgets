// ── Audit event ───────────────────────────────────────────────────────────────
export interface AuditEvent {
    id: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}
