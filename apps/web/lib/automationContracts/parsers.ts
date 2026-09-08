import { z } from 'zod';
import {
    AUTOMATION_CONTRACT_VERSION,
    jsonValueSchema,
    serializeJson,
} from './primitives';

type ContractBoundary = 'database' | 'api' | 'queue' | 'provider';
type ContractErrorCode =
    | 'invalid_contract'
    | 'unsupported_version'
    | 'unknown_capability';

interface ContractIssue {
    code: string;
    path: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorCode(
    value: unknown,
    issues: z.core.$ZodIssue[],
): ContractErrorCode {
    if (
        isRecord(value) &&
        'contractVersion' in value &&
        value.contractVersion !== AUTOMATION_CONTRACT_VERSION
    ) {
        return 'unsupported_version';
    }
    const unknownCapability = issues.some(
        (issue) =>
            (issue.path.join('.') === 'capability.name' &&
                issue.message.startsWith('Unknown capability:')) ||
            issue.message === 'Plan step references an unknown capability',
    );
    return unknownCapability ? 'unknown_capability' : 'invalid_contract';
}

function safeIssues(issues: z.core.$ZodIssue[]): ContractIssue[] {
    return issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join('.'),
    }));
}

export class AutomationContractValidationError extends Error {
    readonly code: ContractErrorCode;
    readonly boundary: ContractBoundary;
    readonly issues: ContractIssue[];

    constructor(
        code: ContractErrorCode,
        boundary: ContractBoundary,
        issues: ContractIssue[],
    ) {
        super(`Automation ${boundary} contract rejected: ${code}`);
        this.name = 'AutomationContractValidationError';
        this.code = code;
        this.boundary = boundary;
        this.issues = issues;
    }
}

function parseAtBoundary<T>(
    schema: z.ZodType<T>,
    value: unknown,
    boundary: ContractBoundary,
): T {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    throw new AutomationContractValidationError(
        errorCode(value, result.error.issues),
        boundary,
        safeIssues(result.error.issues),
    );
}

export function parseDatabaseRow<T>(schema: z.ZodType<T>, value: unknown): T {
    return parseAtBoundary(schema, value, 'database');
}

export function parseApiRequest<T>(schema: z.ZodType<T>, value: unknown): T {
    return parseAtBoundary(schema, value, 'api');
}

export function parseQueuePayload<T>(schema: z.ZodType<T>, value: unknown): T {
    return parseAtBoundary(schema, value, 'queue');
}

export function parseProviderResult<T>(
    schema: z.ZodType<T>,
    value: unknown,
): T {
    return parseAtBoundary(schema, value, 'provider');
}

export function serializeContract<T>(schema: z.ZodType<T>, value: unknown) {
    const parsed = parseAtBoundary(schema, value, 'queue');
    return serializeJson(jsonValueSchema.parse(parsed));
}

export function deserializeContract<T>(
    schema: z.ZodType<T>,
    serialized: string,
): T {
    let value: unknown;
    try {
        value = JSON.parse(serialized) as unknown;
    } catch {
        throw new AutomationContractValidationError(
            'invalid_contract',
            'queue',
            [{ code: 'invalid_json', path: '' }],
        );
    }
    return parseAtBoundary(schema, value, 'queue');
}
