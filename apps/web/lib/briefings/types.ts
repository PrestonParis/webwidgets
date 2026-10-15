export type BriefingStatus =
    | 'queued'
    | 'generating'
    | 'ready'
    | 'partial'
    | 'empty'
    | 'stale'
    | 'failed';

export type BriefingSection = 'changed' | 'matters' | 'due' | 'review';
export type BriefingTrigger = 'daily' | 'on_demand';
export type BriefingFeedbackRating = 'useful' | 'not_useful' | 'incorrect';

export interface BriefingEvidence {
    eventId: string;
    title: string;
    occurredAt: string;
    sourceType: string;
}

export interface BriefingItem {
    id: string;
    section: BriefingSection;
    title: string;
    summary: string;
    confidence: number;
    evidence: BriefingEvidence[];
    feedback: BriefingFeedbackRating | null;
}

export interface BriefingRecord {
    id: string;
    status: BriefingStatus;
    trigger: BriefingTrigger;
    coveredFrom: string;
    coveredTo: string;
    generatedAt: string | null;
    expiresAt: string;
    modelProvider: string;
    modelName: string;
    modelVersion: string;
    ruleVersion: string;
    warnings: string[];
    inputEventCount: number;
    latencyMs: number | null;
    estimatedCostUsd: number | null;
    failureCode: string | null;
    items: BriefingItem[];
}

export interface BriefingPreferences {
    dailyEnabled: boolean;
    localTime: string;
    timezone: string;
    windowHours: number;
}

export interface BriefingResponse {
    briefing: BriefingRecord | null;
    preferences: BriefingPreferences;
    activeJobId: string | null;
}

export interface BriefingSourceEvent {
    id: string;
    eventType: string;
    sourceType: string;
    title: string;
    summary: string | null;
    contentHash: string;
    occurredAt: string;
    updatedAt: string;
    state: string;
    sourceRecordTable: string | null;
    sourceRecordId: string | null;
    metadata: Record<string, unknown>;
}

export interface RankedBriefingEvent extends BriefingSourceEvent {
    section: BriefingSection;
    relevance: number;
    novelty: number;
    urgency: number;
    importance: number;
    score: number;
}

export interface BriefingSynthesisItem {
    title: string;
    summary: string;
    evidenceIds: string[];
    confidence: number;
}

export interface BriefingSynthesisResult {
    status: 'success' | 'abstained' | 'failed';
    items: BriefingSynthesisItem[];
    provider: string;
    model: string;
    modelVersion: string;
    estimatedCostUsd: number | null;
    warning?: string;
}
