export type N8nErrorCode =
    | 'N8N_TIMEOUT'
    | 'N8N_UNAUTHORIZED'
    | 'N8N_BAD_RESPONSE'
    | 'N8N_WEBHOOK_INVALID'
    | 'WORKFLOW_TRIGGER_FAILED'
    | 'N8N_NOT_CONFIGURED';

export type N8nNormalizedError = {
    code: N8nErrorCode;
    message: string;
};

export class N8nError extends Error {
    readonly code: N8nErrorCode;
    readonly statusCode?: number;

    constructor(code: N8nErrorCode, message: string, statusCode?: number) {
        super(message);
        this.name = 'N8nError';
        this.code = code;
        if (statusCode !== undefined) this.statusCode = statusCode;
    }
}

export function toN8nError(err: unknown): N8nNormalizedError {
    if (err instanceof N8nError) {
        return { code: err.code, message: err.message };
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
        return { code: 'N8N_TIMEOUT', message: 'Workflow service timed out.' };
    }
    if (err instanceof Error && err.name === 'AbortError') {
        return { code: 'N8N_TIMEOUT', message: 'Workflow service timed out.' };
    }
    return {
        code: 'WORKFLOW_TRIGGER_FAILED',
        message: 'Workflow could not be started.',
    };
}
