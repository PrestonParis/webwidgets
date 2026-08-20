import { z } from 'zod';

const sourceItemSchema = z.object({
    id: z.string().min(1).max(200),
    title: z.string().max(500).optional(),
    text: z.string().min(1).max(4_000),
    occurredAt: z.iso.datetime().optional(),
    sourceType: z.string().max(100).optional(),
});

export const summarizationInputSchema = z.object({
    items: z.array(sourceItemSchema).min(1).max(40),
    focus: z.string().max(500).optional(),
});

export const researchSynthesisInputSchema = z.object({
    items: z.array(sourceItemSchema).min(1).max(40),
    objective: z.string().max(500).optional(),
});

export const summarizationOutputSchema = z.object({
    summary: z.string().min(1).max(4_000),
    keyPoints: z.array(z.string().min(1).max(500)).max(12),
    evidenceIds: z.array(z.string().min(1).max(200)).min(1).max(40),
});

const candidateSchema = z.object({
    title: z.string().min(1).max(300),
    rationale: z.string().min(1).max(1_000),
    evidenceIds: z.array(z.string().min(1).max(200)).min(1).max(20),
    confidence: z.number().min(0).max(1),
});

export const researchSynthesisOutputSchema = z.object({
    synthesis: z.string().min(1).max(4_000),
    candidates: z.array(candidateSchema).max(12),
});

export type SummarizationInput = z.infer<typeof summarizationInputSchema>;
export type SummarizationOutput = z.infer<typeof summarizationOutputSchema>;
export type ResearchSynthesisInput = z.infer<
    typeof researchSynthesisInputSchema
>;
export type ResearchSynthesisOutput = z.infer<
    typeof researchSynthesisOutputSchema
>;
