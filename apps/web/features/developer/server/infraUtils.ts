import fs from 'node:fs/promises';
import type {
    DiagnosticStatus,
    EnvironmentVariable,
} from '@/features/developer/schemas/infrastructureSchemas';

export const checkedAt = () => new Date().toISOString();

export function statusFromOk(ok: boolean): DiagnosticStatus {
    return ok ? 'healthy' : 'unhealthy';
}

export function envConfigured(name: string): boolean {
    return Boolean(process.env[name]?.trim());
}

export function envCheck(
    name: string,
    required: boolean,
    scope: EnvironmentVariable['scope'],
    provider?: string,
): EnvironmentVariable {
    const configured = envConfigured(name);
    const value = process.env[name];
    const malformed =
        configured &&
        ((name.endsWith('_URL') &&
            value !== undefined &&
            !/^https?:\/\//.test(value)) ||
            (name.includes('PERCENT') &&
                value !== undefined &&
                Number.isNaN(Number(value))));
    return {
        name,
        required,
        configured,
        malformed,
        scope,
        ...(provider ? { provider } : {}),
    };
}

export async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}
