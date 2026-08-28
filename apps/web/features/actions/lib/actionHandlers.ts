import { err, ok, ResultAsync, type Result } from 'neverthrow';
import { extractRssContent } from '@/features/actions/lib/contentExtractionProvider';
import type { ActionDefinition } from '@/features/actions/lib/schemas/definitionSchemas';
import type { ActionExecutionContext } from '@/features/actions/lib/schemas/actionPayloadSchemas';

export type ActionHandlerError = {
    code: 'ExecutionFault';
    message: string;
    cause?: unknown;
};

export interface ActionHandlerInput {
    definition: ActionDefinition;
    context: ActionExecutionContext;
    input: unknown;
}

export type ActionHandler = (
    input: ActionHandlerInput,
) => Promise<Result<unknown, ActionHandlerError>>;

const localEchoHandler: ActionHandler = ({ definition, input }) =>
    Promise.resolve(
        ok({
            accepted: true,
            message: `${definition.label} accepted`,
            data: input,
        }),
    );

const canonicalProviderRequired: ActionHandler = () =>
    Promise.resolve(
        err({
            code: 'ExecutionFault' as const,
            message:
                'Provider execution requires a canonical approved request and a configured durable executor. No provider action was performed.',
        }),
    );

const parseRssHandler: ActionHandler = async ({ context, input }) => {
    const parsed = input as { providerId: string; url: string };
    return ResultAsync.fromPromise(
        extractRssContent({
            userId: context.userId,
            providerId: parsed.providerId,
            url: parsed.url,
        }),
        (cause) => ({
            code: 'ExecutionFault' as const,
            message: 'RSS extraction failed',
            cause,
        }),
    ).map((items) => ({
        accepted: true,
        message: `Extracted ${items.length} RSS items`,
        data: { items },
    }));
};

const handlers = new Map<string, ActionHandler>([
    ['local.echo', localEchoHandler],
    ['provider.email.draftReply', canonicalProviderRequired],
    ['provider.calendar.createEvent', canonicalProviderRequired],
    ['provider.automation.run', canonicalProviderRequired],
    ['provider.news.parseRss', parseRssHandler],
]);

export async function executeActionHandler(input: ActionHandlerInput) {
    const handler = handlers.get(input.definition.handlerId);
    if (!handler) {
        return err({
            code: 'ExecutionFault' as const,
            message: `No action handler registered for ${input.definition.handlerId}`,
        });
    }

    return handler(input);
}
