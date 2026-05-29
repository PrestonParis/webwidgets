import type { SupabaseClient } from '@supabase/supabase-js';
import { registerJobRunner } from '@/features/jobs/services/jobRunner';
import { updateJobStatus } from '@/features/jobs/services/jobService';
import { getExtraction } from '@/features/extraction/services/extractionService';
import { logEvent } from '@/features/events/lib/eventLogger';
import type { JobRecord } from '@/features/jobs/types/jobs';

// NOTE: BullMQ is used only in the conversion service.
// This runner executes synchronously in the API route handler for Stage 1.

registerJobRunner({
    canRun: (job: JobRecord) => job.type === 'document_parsing',

    async run(job: JobRecord, supabase: SupabaseClient): Promise<void> {
        await updateJobStatus(supabase, job.userId, job.id, 'running');

        try {
            const meta = job.metadata as Record<string, unknown>;
            const fileId = meta.fileId as string | undefined;

            if (!fileId) {
                throw new Error('document_parsing job missing metadata.fileId');
            }

            // Check if extraction already exists
            const extraction = await getExtraction(
                supabase,
                job.userId,
                fileId,
            );

            if (!extraction || extraction.extractionStatus !== 'ready') {
                throw new Error(
                    'Text extraction not ready. Call POST /api/uploads/[fileId]/extract first.',
                );
            }

            await logEvent(supabase, job.userId, 'file_text_extracted', {
                entityType: 'file',
                entityId: fileId,
                title: `Document parsed: ${extraction.characterCount} characters`,
                metadata: {
                    jobId: job.id,
                    charCount: extraction.characterCount,
                },
            });

            // Log completion step
            await supabase
                .from('job_logs')
                .insert({
                    job_id: job.id,
                    level: 'info',
                    message: `Document parsed successfully. Chars: ${extraction.characterCount}`,
                    metadata: { fileId },
                })
                .then(() => void 0);

            await updateJobStatus(supabase, job.userId, job.id, 'completed');
        } catch (err) {
            const reason = err instanceof Error ? err.message : 'Unknown error';
            await updateJobStatus(
                supabase,
                job.userId,
                job.id,
                'failed',
                reason,
            );
            throw err;
        }
    },
});
