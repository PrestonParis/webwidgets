import { z } from 'zod';

export const developerPRSchema = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.enum(['open', 'closed']),
    draft: z.boolean(),
    url: z.string(),
    repo: z.string(),
    author: z.string().optional(),
    updatedAt: z.string(),
});

export const developerIssueSchema = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    url: z.string(),
    repo: z.string(),
    labels: z.array(z.string()),
    updatedAt: z.string(),
});

export const developerSnapshotSchema = z.object({
    pullRequests: z.array(developerPRSchema),
    issues: z.array(developerIssueSchema),
    connectedProviders: z.array(z.string()),
});

export type DeveloperPR = z.infer<typeof developerPRSchema>;
export type DeveloperIssue = z.infer<typeof developerIssueSchema>;
export type DeveloperSnapshot = z.infer<typeof developerSnapshotSchema>;
