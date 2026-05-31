import type { FastifyInstance } from 'fastify';
import { createBatchJobRequestSchema } from '@webwidgets/conversion-shared';
import { z } from 'zod';
import { sendError, HttpError } from '../lib/errors.js';
import { assertJobAllowed } from '../lib/filePolicy.js';
import { enqueueJob } from '../services/queue.js';
import { createUploadUrl } from '../services/storage.js';
import {
    createBatch,
    getBatch,
    markBatchJobsQueued,
} from '../services/batchRepository.js';

const BATCH_MAX = 30;

const batchParamsSchema = z.object({
    batchId: z.string().uuid(),
});

export async function batchRoutes(app: FastifyInstance) {
    /**
     * POST /v1/jobs/batch
     *
     * Creates up to 30 conversion jobs atomically under a single batch.
     * Returns the batchId, per-job presigned upload URLs, and statusUrls.
     * Clients upload files to each uploadUrl (HTTP PUT), then call
     * POST /v1/batches/:batchId/start to enqueue all jobs.
     */
    app.post('/v1/jobs/batch', async (request, reply) => {
        try {
            const body = createBatchJobRequestSchema.parse(request.body);

            if (body.jobs.length > BATCH_MAX) {
                throw new HttpError(
                    `Batch limit is ${BATCH_MAX} jobs per request.`,
                    400,
                );
            }

            // Validate all jobs before creating any.
            for (const job of body.jobs) {
                assertJobAllowed(job);
            }

            const userId =
                typeof request.body === 'object' &&
                request.body !== null &&
                'userId' in request.body &&
                typeof (request.body as Record<string, unknown>).userId ===
                    'string'
                    ? ((request.body as Record<string, unknown>)
                          .userId as string)
                    : undefined;

            const { batch, jobs } = await createBatch(
                body.jobs,
                createUploadUrl,
                userId,
            );

            request.log.info(
                { batchId: batch.id, jobCount: jobs.length },
                'batch created',
            );

            return reply.status(201).send({
                batchId: batch.id,
                status: batch.status,
                totalJobs: batch.totalJobs,
                statusUrl: `/v1/batches/${batch.id}`,
                startUrl: `/v1/batches/${batch.id}/start`,
                jobs: jobs.map(({ job, uploadUrl }) => ({
                    jobId: job.id,
                    originalFileName: job.originalFileName,
                    sourceExtension: job.sourceExtension,
                    targetExtension: job.targetExtension,
                    uploadUrl,
                    uploadMethod: 'PUT',
                    statusUrl: `/v1/jobs/${job.id}`,
                })),
            });
        } catch (error) {
            return sendError(reply, error);
        }
    });

    /**
     * GET /v1/batches/:batchId
     *
     * Returns the batch summary and per-job status.
     * Poll this endpoint to track batch completion.
     */
    app.get('/v1/batches/:batchId', async (request, reply) => {
        try {
            const { batchId } = batchParamsSchema.parse(request.params);
            const result = await getBatch(batchId);
            if (!result) throw new HttpError('Batch not found.', 404);

            return {
                batchId: result.batch.id,
                status: result.batch.status,
                totalJobs: result.batch.totalJobs,
                completedJobs: result.batch.completedJobs,
                failedJobs: result.batch.failedJobs,
                jobs: result.jobs.map((job) => ({
                    jobId: job.id,
                    originalFileName: job.originalFileName,
                    sourceExtension: job.sourceExtension,
                    targetExtension: job.targetExtension,
                    status: job.status,
                    ...(job.outputObjectKey
                        ? { downloadUrl: `/v1/jobs/${job.id}/download` }
                        : {}),
                    ...(job.errorMessage
                        ? { errorMessage: job.errorMessage }
                        : {}),
                })),
            };
        } catch (error) {
            return sendError(reply, error);
        }
    });

    /**
     * POST /v1/batches/:batchId/start
     *
     * Enqueues all pending jobs in the batch after files have been uploaded
     * to their presigned URLs. Call this once per batch after all uploads
     * are complete.
     */
    app.post('/v1/batches/:batchId/start', async (request, reply) => {
        try {
            const { batchId } = batchParamsSchema.parse(request.params);
            const result = await getBatch(batchId);
            if (!result) throw new HttpError('Batch not found.', 404);

            if (result.batch.status !== 'pending') {
                throw new HttpError(
                    `Batch is already ${result.batch.status} and cannot be started again.`,
                    409,
                );
            }

            const jobs = await markBatchJobsQueued(batchId);

            await Promise.all(jobs.map((job) => enqueueJob(job.id, job.kind)));

            request.log.info(
                { batchId, jobCount: jobs.length },
                'batch enqueued',
            );

            return reply.status(202).send({
                batchId,
                status: 'processing',
                enqueuedJobs: jobs.length,
            });
        } catch (error) {
            return sendError(reply, error);
        }
    });
}
