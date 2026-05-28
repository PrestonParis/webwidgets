import { z } from 'zod';

const severitySchema = z.number().int().min(1).max(10);

export const bodyZoneEntrySchema = z.object({
    type: z.enum(['soreness', 'injury']),
    intensity: severitySchema,
    timestamp: z
        .string()
        .datetime({ offset: true })
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/)),
    notes: z.string().max(500).optional(),
});

export const allergyLogSchema = z.object({
    trigger: z.enum([
        'pollen',
        'dust',
        'pet',
        'food',
        'mold',
        'medication',
        'insect',
        'other',
    ]),
    severity: z.enum(['mild', 'moderate', 'severe']),
    symptoms: z.string().min(1).max(500),
    timestamp: z.string(),
});

export const sicknessLogSchema = z.object({
    type: z.enum([
        'cold',
        'flu',
        'gi',
        'migraine',
        'allergy',
        'headache',
        'fatigue',
        'other',
    ]),
    medicationTaken: z.boolean(),
    temperature: z.number().min(90).max(108).optional(), // °F range; convert before validating
    temperatureUnit: z.enum(['F', 'C']),
    notes: z.string().max(500).optional(),
    timestamp: z.string(),
});

export const healthLogSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    energyLevel: severitySchema.optional(),
    sleepQuality: severitySchema.optional(),
    notes: z.string().max(1000).optional(),
});

export type BodyZoneEntryInput = z.infer<typeof bodyZoneEntrySchema>;
export type AllergyLogInput = z.infer<typeof allergyLogSchema>;
export type SicknessLogInput = z.infer<typeof sicknessLogSchema>;
export type HealthLogInput = z.infer<typeof healthLogSchema>;
