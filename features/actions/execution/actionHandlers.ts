import { err, ok, ResultAsync, type Result } from 'neverthrow';
import { getLogger } from '@/lib/observability/logger';
import { extractRssContent } from '@/features/actions/providers/contentExtractionProvider';
import type { ActionDefinition } from '@/features/actions/schemas/definitionSchemas';
import type { ActionExecutionContext } from '@/features/actions/schemas/actionSchemas';

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

const localEchoHandler: ActionHandler = async ({ definition, input }) =>
    ok({
        accepted: true,
        message: `${definition.label} accepted`,
        data: input,
    });

const providerPlaceholderHandler: ActionHandler = async ({
    definition,
    context,
    input,
}) => {
    getLogger({
        component: 'action-provider-placeholder',
        actionId: definition.id,
        userId: context.userId,
    }).info('provider placeholder executed');

    return ok({
        accepted: true,
        message: `${definition.providerScope} provider action accepted`,
        data: input,
    });
};

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
    ['provider.email.draftReply', providerPlaceholderHandler],
    ['provider.calendar.createEvent', providerPlaceholderHandler],
    ['provider.automation.run', providerPlaceholderHandler],
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
