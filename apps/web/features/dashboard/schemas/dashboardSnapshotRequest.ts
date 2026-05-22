import { z } from 'zod';

export const dashboardSnapshotRequestSchema = z.object({
    widgets: z
        .array(
            z.object({
                id: z.string(),
                type: z.string(),
                visible: z.boolean().optional(),
                containerId: z.string().optional(),
                unpresented: z.boolean().optional(),
            }),
        )
        .optional(),
});
