import type { FastifyInstance } from 'fastify';
import {
    createConversionJobRequestSchema,
    supportedConversions,
} from '@webwidgets/conversion-shared';
import { z } from 'zod';
import { sendError, HttpError } from '../lib/errors.js';
import { assertJobAllowed } from '../lib/filePolicy.js';
import { enqueueJob } from '../services/queue.js';
import { createDownloadUrl, createUploadUrl } from '../services/storage.js';
import {
    createJob,
    getJob,
    markJobQueued,
} from '../services/jobsRepository.js';

const paramsSchema = z.object({
    jobId: z.string().uuid(),
});

export async function jobRoutes(app: FastifyInstance) {
    app.get('/v1/conversions', async () => ({
        conversions: supportedConversions,
    }));

    app.post('/v1/jobs', async (request, reply) => {
        try {
            const body = createConversionJobRequestSchema.parse(request.body);
            assertJobAllowed(body);
            const job = await createJob(body);
            const uploadUrl = await createUploadUrl(job.inputObjectKey);

            request.log.info(
                {
                    jobId: job.id,
                    sourceExtension: body.sourceExtension,
                    targetExtension: body.targetExtension,
                    fileSizeBytes: body.fileSizeBytes,
                },
                'conversion job created',
            );

            return reply.status(201).send({
                jobId: job.id,
                inputObjectKey: job.inputObjectKey,
                uploadUrl,
                uploadMethod: 'PUT',
                statusUrl: `/v1/jobs/${job.id}`,
            });
        } catch (error) {
            return sendError(reply, error);
        }
    });

    app.get('/v1/jobs/:jobId', async (request, reply) => {
        try {
            const { jobId } = paramsSchema.parse(request.params);
            const job = await getJob(jobId);
            if (!job) throw new HttpError('Conversion job not found.', 404);
            return job;
        } catch (error) {
            return sendError(reply, error);
        }
    });

    app.post('/v1/jobs/:jobId/start', async (request, reply) => {
        try {
            const { jobId } = paramsSchema.parse(request.params);
            const job = await markJobQueued(jobId);
            if (!job) throw new HttpError('Conversion job not found.', 404);
            await enqueueJob(jobId, job.kind);
            request.log.info({ jobId }, 'conversion job enqueued');
            return reply.status(202).send(job);
        } catch (error) {
            return sendError(reply, error);
        }
    });

    app.get('/v1/jobs/:jobId/download', async (request, reply) => {
        try {
            const { jobId } = paramsSchema.parse(request.params);
            const job = await getJob(jobId);
            if (!job) throw new HttpError('Conversion job not found.', 404);
            if (job.status !== 'completed' || !job.outputObjectKey) {
                throw new HttpError('Conversion output is not ready.', 409);
            }
            return {
                downloadUrl: await createDownloadUrl(job.outputObjectKey),
            };
        } catch (error) {
            return sendError(reply, error);
        }
    });
}
