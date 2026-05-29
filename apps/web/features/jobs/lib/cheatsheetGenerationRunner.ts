import type { SupabaseClient } from '@supabase/supabase-js';
import { registerJobRunner } from '@/features/jobs/services/jobRunner';
import { updateJobStatus } from '@/features/jobs/services/jobService';
import { getExtraction } from '@/features/extraction/services/extractionService';
import { createArtifact } from '@/features/artifacts/services/artifactService';
import { createNotification } from '@/features/notifications/services/notificationService';
import { logEvent } from '@/features/events/lib/eventLogger';
import { generateCheatsheet } from '@/features/jobs/lib/cheatsheetGenerator';
import type { JobRecord } from '@/features/jobs/types/jobs';

// NOTE: BullMQ is used only in the conversion service.
// This runner executes synchronously in the API route handler for Stage 1.

registerJobRunner({
    canRun: (job: JobRecord) => job.type === 'cheatsheet_generation',

    async run(job: JobRecord, supabase: SupabaseClient): Promise<void> {
        await updateJobStatus(supabase, job.userId, job.id, 'running');

        try {
            const meta = job.metadata as Record<string, unknown>;
            const fileId = meta.fileId as string | undefined;
            const title =
                (meta.title as string | undefined) ?? 'Untitled Document';

            if (!fileId) {
                throw new Error(
                    'cheatsheet_generation job missing metadata.fileId',
                );
            }

            // Step 1: Load source text
            const extraction = await getExtraction(
                supabase,
                job.userId,
                fileId,
            );
            if (!extraction || extraction.extractionStatus !== 'ready') {
                throw new Error(
                    'Text extraction not ready. Extract text first.',
                );
            }

            // Step 2: Generate cheatsheet
            const result = await generateCheatsheet(supabase, {
                title,
                sourceText: extraction.extractedText,
                userId: job.userId,
                sourceFileId: fileId,
            });

            // Step 3: Save artifact
            const artifact = await createArtifact(supabase, job.userId, {
                type: 'cheatsheet',
                title: result.title,
                content: result.content,
                contentFormat: 'markdown',
                sourceFileId: fileId,
                sourceJobId: job.id,
                tags: ['auto-generated'],
            });

            // Step 4: Log event
            await logEvent(supabase, job.userId, 'artifact_created', {
                entityType: 'artifact',
                entityId: artifact.id,
                title: `Cheatsheet created: ${result.title}`,
                metadata: { jobId: job.id, fileId, artifactType: 'cheatsheet' },
            });

            // Step 5: Notify user
            await createNotification(supabase, job.userId, {
                type: 'cheatsheet_ready',
                title: 'Cheatsheet ready',
                body: result.title,
                entityType: 'artifact',
                entityId: artifact.id,
                href: `/artifacts/${artifact.id}`,
            });

            // Step 6: Mark job complete with result pointer
            const updateResult = await supabase
                .from('jobs')
                .update({
                    status: 'completed',
                    user_visible_result: {
                        artifactId: artifact.id,
                        artifactTitle: artifact.title,
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', job.id)
                .eq('user_id', job.userId);
            if (updateResult.error) throw updateResult.error;
        } catch (err) {
            const reason = err instanceof Error ? err.message : 'Unknown error';
            await updateJobStatus(
                supabase,
                job.userId,
                job.id,
                'failed',
                reason,
            );

            await logEvent(supabase, job.userId, 'job_failed', {
                entityType: 'job',
                entityId: job.id,
                title: `Cheatsheet generation failed`,
                description: reason,
            }).catch(() => void 0);

            throw err;
        }
    },
});
