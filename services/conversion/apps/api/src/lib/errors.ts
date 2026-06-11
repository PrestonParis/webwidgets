import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export class HttpError extends Error {
    constructor(
        message: string,
        public readonly statusCode = 400,
    ) {
        super(message);
    }
}

export function sendError(reply: FastifyReply, error: unknown) {
    if (error instanceof HttpError) {
        return reply.status(error.statusCode).send({ error: error.message });
    }

    if (error instanceof ZodError) {
        return reply.status(400).send({
            error: 'Invalid request payload.',
            issues: error.issues,
        });
    }

    return reply
        .status(500)
        .send({ error: 'Internal conversion service error.' });
}
