import { z } from 'zod';

// ── Mood log record ───────────────────────────────────────────────────────────
export const moodLogSchema = z.object({
    id: z.string().optional(),
    mood: z.number(),
    note: z.string().optional(),
    logged_date: z.string().optional(),
    logged_at: z.string(),
});
export type MoodLog = z.infer<typeof moodLogSchema>;

// ── Journal entry record ──────────────────────────────────────────────────────
export const journalEntrySchema = z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    content: z.string(),
    type: z.string().optional(),
    created_at: z.string(),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

// ── Habit record ──────────────────────────────────────────────────────────────
export const habitSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    emoji: z.string().optional(),
    completion_count: z.number().optional(),
    created_at: z.string().optional(),
});
export type HabitRecord = z.infer<typeof habitSchema>;

// ── Finance record ────────────────────────────────────────────────────────────
export const financeRecordSchema = z.object({
    id: z.string().optional(),
    record_type: z.enum(['account', 'transaction'] as const),
    name: z.string().optional(),
    type: z.string().optional(),
    balance: z.number().optional(),
    currency: z.string().optional(),
    amount: z.number().optional(),
    transaction_type: z.string().optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
    created_at: z.string().optional(),
});
export type FinanceRecord = z.infer<typeof financeRecordSchema>;

// ── Countdown record ──────────────────────────────────────────────────────────
export const countdownSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    target_date: z.string(),
    emoji: z.string().optional(),
});
export type CountdownRecord = z.infer<typeof countdownSchema>;

// ── Recovery record ───────────────────────────────────────────────────────────
export const recoveryRecordSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    start_time: z.string(),
    category: z.string().optional(),
    created_at: z.string().optional(),
});
export type RecoveryRecord = z.infer<typeof recoveryRecordSchema>;

// ── Calendar event record ─────────────────────────────────────────────────────
export const calendarEventSchema = z.object({
    id: z.string(),
    provider: z.enum(['google', 'outlook', 'teams'] as const).optional(),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    htmlLink: z.string().optional(),
    status: z.enum(['confirmed', 'tentative', 'cancelled'] as const).optional(),
});
export type NormalizedCalendarEvent = z.infer<typeof calendarEventSchema>;

// ── Memory deck record ────────────────────────────────────────────────────────
export const memoryDeckSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    card_count: z.number().optional(),
    created_at: z.string().optional(),
});
export type NormalizedMemoryDeck = z.infer<typeof memoryDeckSchema>;

// ── Generic record (catch-all for unknown data types) ─────────────────────────
export const genericRecordSchema = z.object({
    id: z.string().optional(),
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
    source: z.string().optional(),
    created_at: z.string().optional(),
});
export type GenericRecord = z.infer<typeof genericRecordSchema>;

// ── Task / Todo record ────────────────────────────────────────────────────────
export const taskRecordSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    done: z.boolean().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});
export type TaskRecord = z.infer<typeof taskRecordSchema>;

// ── Tracking entry record ─────────────────────────────────────────────────────
export const trackingEntrySchema = z.object({
    id: z.string().optional(),
    category: z.string(),
    entry_date: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});
export type TrackingEntry = z.infer<typeof trackingEntrySchema>;

// ── Handoff record ────────────────────────────────────────────────────────────
export const handoffRecordSchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    owner: z.string().optional(),
    priority: z.string().optional(),
    due: z.string().optional(),
    complete: z.boolean().optional(),
    scope: z.string().optional(),
});
export type HandoffRecord = z.infer<typeof handoffRecordSchema>;

// ── Workspace record ──────────────────────────────────────────────────────────
export const workspaceRecordSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    scope: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
});
export type WorkspaceRecord = z.infer<typeof workspaceRecordSchema>;
