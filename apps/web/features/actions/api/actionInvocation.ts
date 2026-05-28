import superjson from 'superjson';
import { z } from 'zod';
import {
    actionRequestEnvelopeSchema,
    type ActionRequestEnvelope,
} from '@/features/actions/schemas/actionPayloadSchemas';

const maybeSerializedSchema = z.union([
    z.string(),
    z.object({ json: z.unknown(), meta: z.unknown().optional() }),
    z.record(z.string(), z.unknown()),
]);

export async function parseActionInvocationRequest(
    request: Request,
): Promise<ActionRequestEnvelope> {
    const body = maybeSerializedSchema.parse(await request.json());
    const deserialized =
        typeof body === 'string'
            ? superjson.parse(body)
            : 'json' in body
              ? superjson.deserialize(
                    body as Parameters<typeof superjson.deserialize>[0],
                )
              : body;

    return actionRequestEnvelopeSchema.parse(deserialized);
}
