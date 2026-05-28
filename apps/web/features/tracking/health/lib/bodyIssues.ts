// Types for the body_issues / body_issue_history Supabase tables.
// These are separate from the legacy InjuryLog system.

export type IssueType =
    | 'soreness'
    | 'injury'
    | 'rash'
    | 'bruise'
    | 'swelling'
    | 'numbness'
    | 'stiffness'
    | 'tightness'
    | 'weakness'
    | 'custom';

export type DurationType = 'acute' | 'chronic';
export type IssueStatus = 'active' | 'improving' | 'resolved';
export type IssueTrigger =
    | 'exercise'
    | 'sleep'
    | 'work'
    | 'weather'
    | 'unknown'
    | 'other';

export interface BodyIssue {
    id: string;
    userId: string;
    regionId: string;
    regionType: string;
    issueType: string;
    severity: number;
    onsetDate: string; // YYYY-MM-DD
    durationType: DurationType;
    status: IssueStatus;
    notes?: string;
    triggers: IssueTrigger[];
    skinX?: number;
    skinY?: number;
    skinDrawing?: string;
    toothNumber?: number;
    createdAt: string;
    updatedAt: string;
}

export interface BodyIssueHistory {
    id: string;
    issueId: string;
    severity: number;
    status: string;
    notes?: string;
    recordedAt: string;
}

export type BodyIssueDraft = Omit<
    BodyIssue,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

const DRAWING_PREFIX = '[[skinDrawing:';
const DRAWING_SUFFIX = ']]';

export function packIssueNotes(
    notes?: string,
    skinDrawing?: string,
): string | null {
    const trimmed = notes?.trim() ?? '';
    if (!skinDrawing) return trimmed || null;
    const encoded = `${DRAWING_PREFIX}${encodeURIComponent(skinDrawing)}${DRAWING_SUFFIX}`;
    return trimmed ? `${encoded}\n${trimmed}` : encoded;
}

export function unpackIssueNotes(raw: string | null | undefined): {
    notes?: string;
    skinDrawing?: string;
} {
    if (!raw) return {};
    const start = raw.indexOf(DRAWING_PREFIX);
    if (start < 0) return { notes: raw };
    const end = raw.indexOf(DRAWING_SUFFIX, start);
    if (end < 0) return { notes: raw };
    const encoded = raw.slice(start + DRAWING_PREFIX.length, end);
    const before = raw.slice(0, start);
    const after = raw.slice(end + DRAWING_SUFFIX.length);
    const notes = `${before}${after}`.trim();
    try {
        return {
            ...(notes && { notes }),
            skinDrawing: decodeURIComponent(encoded),
        };
    } catch {
        return { ...(notes && { notes }) };
    }
}

export const ISSUE_TYPES: { id: IssueType; label: string; emoji: string }[] = [
    { id: 'soreness', label: 'Soreness', emoji: '💢' },
    { id: 'injury', label: 'Injury', emoji: '🤕' },
    { id: 'rash', label: 'Rash', emoji: '🔴' },
    { id: 'bruise', label: 'Bruise', emoji: '🟣' },
    { id: 'swelling', label: 'Swelling', emoji: '🫧' },
    { id: 'numbness', label: 'Numbness', emoji: '⚡' },
    { id: 'stiffness', label: 'Stiffness', emoji: '🔒' },
    { id: 'tightness', label: 'Tightness', emoji: '🎯' },
    { id: 'weakness', label: 'Weakness', emoji: '📉' },
    { id: 'custom', label: 'Custom', emoji: '✏️' },
];

export const ISSUE_TRIGGERS: { id: IssueTrigger; label: string }[] = [
    { id: 'exercise', label: 'Exercise' },
    { id: 'sleep', label: 'Sleep' },
    { id: 'work', label: 'Work' },
    { id: 'weather', label: 'Weather' },
    { id: 'unknown', label: 'Unknown' },
    { id: 'other', label: 'Other' },
];

export const STATUS_STYLES: Record<IssueStatus, string> = {
    active: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    improving:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    resolved:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
};

export const SEVERITY_LABELS: Record<number, string> = {
    1: 'Barely noticeable',
    2: 'Very mild',
    3: 'Mild',
    4: 'Mild–moderate',
    5: 'Moderate',
    6: 'Moderate–strong',
    7: 'Strong',
    8: 'Very strong',
    9: 'Severe',
    10: 'Debilitating',
};

interface BodyIssueRow {
    id: string;
    user_id: string;
    region_id: string;
    region_type: string;
    issue_type: string;
    severity: number;
    onset_date: string;
    duration_type: DurationType;
    status: IssueStatus;
    notes?: string | null;
    triggers?: IssueTrigger[] | null;
    skin_x?: number | null;
    skin_y?: number | null;
    tooth_number?: number | null;
    created_at: string;
    updated_at: string;
}

interface BodyIssueHistoryRow {
    id: string;
    issue_id: string;
    severity: number;
    status: string;
    notes?: string | null;
    recorded_at: string;
}

/** Returns a hex color for a severity 1–10. */
export function severityColor(s: number): string {
    if (s <= 2) return '#22c55e';
    if (s <= 4) return '#eab308';
    if (s <= 6) return '#f97316';
    if (s <= 8) return '#ef4444';
    return '#991b1b';
}

/** Map from DB snake_case row to camelCase BodyIssue */
export function rowToIssue(row: BodyIssueRow): BodyIssue {
    const parsedNotes = unpackIssueNotes(row.notes);
    return {
        id: row.id,
        userId: row.user_id,
        regionId: row.region_id,
        regionType: row.region_type,
        issueType: row.issue_type,
        severity: row.severity,
        onsetDate: row.onset_date,
        durationType: row.duration_type,
        status: row.status,
        notes: parsedNotes.notes,
        triggers: row.triggers ?? [],
        skinX: row.skin_x ?? undefined,
        skinY: row.skin_y ?? undefined,
        skinDrawing: parsedNotes.skinDrawing,
        toothNumber: row.tooth_number ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function rowToHistory(row: BodyIssueHistoryRow): BodyIssueHistory {
    return {
        id: row.id,
        issueId: row.issue_id,
        severity: row.severity,
        status: row.status,
        notes: row.notes ?? undefined,
        recordedAt: row.recorded_at,
    };
}
