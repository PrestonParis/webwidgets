import type { JsonValue, V1JobEnvelope, V1Task } from './contracts.js';

export interface ProcessorContext {
    envelope: V1JobEnvelope;
    dryRun: boolean;
}

export type TaskProcessor = (context: ProcessorContext) => Promise<JsonValue>;

export class WorkerTaskError extends Error {
    constructor(
        readonly code: string,
        readonly safeDetail: string,
        readonly retryable: boolean,
    ) {
        super(safeDetail);
        this.name = 'WorkerTaskError';
    }
}

export interface ProcessorRegistry {
    execute(task: V1Task, context: ProcessorContext): Promise<JsonValue>;
}

export function createProcessorRegistry(
    overrides: Partial<Record<V1Task['kind'], TaskProcessor>> = {},
): ProcessorRegistry {
    const processors: Record<V1Task['kind'], TaskProcessor> = {
        'runtime.probe': ({ envelope, dryRun }) =>
            Promise.resolve({
                acknowledged: true,
                correlationId: envelope.correlationId,
                dryRun,
                runtimeContractVersion: 1,
            }),
        'action.execute': () =>
            Promise.reject(
                new WorkerTaskError(
                    'task_action_processor_unavailable',
                    'Task action execution is not configured in this runtime.',
                    false,
                ),
            ),
        'rss.fetch': () =>
            Promise.reject(
                new WorkerTaskError(
                    'rss_processor_unavailable',
                    'RSS ingestion is not configured in this runtime.',
                    false,
                ),
            ),
        'provider.sync': () =>
            Promise.reject(
                new WorkerTaskError(
                    'provider_processor_unavailable',
                    'Provider ingestion is not configured in this runtime.',
                    false,
                ),
            ),
        'briefing.generate': () =>
            Promise.reject(
                new WorkerTaskError(
                    'briefing_processor_unavailable',
                    'Briefing generation is not configured in this runtime.',
                    false,
                ),
            ),
        ...overrides,
    };
    return {
        async execute(task, context) {
            const processor = processors[task.kind];
            if (!processor) {
                throw new WorkerTaskError(
                    'unsupported_task',
                    'No processor is registered for this task.',
                    false,
                );
            }
            return processor(context);
        },
    };
}

export function safeFailure(error: unknown) {
    if (error instanceof WorkerTaskError) {
        return {
            code: error.code,
            detail: error.safeDetail.slice(0, 500),
            retryable: error.retryable,
        };
    }
    return {
        code: 'worker_internal_error',
        detail: 'Processor failed without a safe diagnostic.',
        retryable: true,
    };
}
