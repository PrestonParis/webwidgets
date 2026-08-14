import type { z } from 'zod';
import type {
    candidateActionInputSchema,
    candidateActionSchema,
    insightInputSchema,
    insightSchema,
    rawObservationInputSchema,
    rawObservationSchema,
    timelineEventInputSchema,
    timelineEventSchema,
} from './coreSchemas';
import type {
    actionRequestInputSchema,
    actionResultInputSchema,
    approvalDecisionInputSchema,
    lifecycleTraceQuerySchema,
} from './actionSchemas';

export type RawObservation = z.infer<typeof rawObservationSchema>;
export type RawObservationInput = z.infer<typeof rawObservationInputSchema>;
export type CanonicalTimelineEvent = z.infer<typeof timelineEventSchema>;
export type TimelineEventInput = z.infer<typeof timelineEventInputSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type InsightInput = z.infer<typeof insightInputSchema>;
export type CandidateAction = z.infer<typeof candidateActionSchema>;
export type CandidateActionInput = z.infer<typeof candidateActionInputSchema>;
export type ActionRequestInput = z.infer<typeof actionRequestInputSchema>;
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionInputSchema>;
export type ActionResultInput = z.infer<typeof actionResultInputSchema>;
export type LifecycleTraceQuery = z.infer<typeof lifecycleTraceQuerySchema>;
