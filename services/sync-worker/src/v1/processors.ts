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
        'runtime.probe': async ({ envelope, dryRun }) => ({
            acknowledged: true,
            correlationId: envelope.correlationId,
            dryRun,
            runtimeContractVersion: 1,
        }),
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
