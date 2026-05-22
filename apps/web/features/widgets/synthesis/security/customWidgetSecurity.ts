import { err, ok, type Result } from 'neverthrow';
import {
    customApiSourceConfigSchema,
    type CustomApiSourceConfigInput,
} from '@/features/widgets/synthesis/schemas/widgetSynthesisSchemas';
import type { WidgetValidationIssue } from '@/features/widgets/synthesis/widgetDefinitionSchema';

const BLOCKED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254',
    'metadata.google.internal',
];
const BLOCKED_HEADER_NAMES = [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
];
const MAX_SAMPLE_BYTES = 200_000;

function issue(
    field: string,
    message: string,
    severity: WidgetValidationIssue['severity'] = 'error',
): WidgetValidationIssue {
    return { field, message, severity };
}

export function validateCustomApiSource(
    raw: unknown,
): Result<CustomApiSourceConfigInput, WidgetValidationIssue[]> {
    const parsed = customApiSourceConfigSchema.safeParse(raw);
    if (!parsed.success) {
        return err(
            parsed.error.issues.map((zodIssue) =>
                issue(zodIssue.path.join('.') || 'api', zodIssue.message),
            ),
        );
    }

    const config = parsed.data;
    const issues: WidgetValidationIssue[] = [];
    const base = new URL(config.baseUrl);
    if (base.protocol !== 'https:')
        issues.push(issue('baseUrl', 'Custom API sources must use HTTPS.'));
    if (BLOCKED_HOSTS.some((host) => base.hostname.includes(host))) {
        issues.push(
            issue(
                'baseUrl',
                'Custom API source targets a blocked internal host.',
            ),
        );
    }
    if (config.endpoint.includes('..'))
        issues.push(
            issue('endpoint', 'Endpoint paths cannot traverse directories.'),
        );
    if (config.auth.type !== 'none' && !config.auth.secretRef) {
        issues.push(
            issue(
                'auth.secretRef',
                'Secrets must be referenced server-side, not stored in widget state.',
            ),
        );
    }

    for (const header of Object.keys(config.headers)) {
        if (BLOCKED_HEADER_NAMES.includes(header.toLowerCase())) {
            issues.push(
                issue(
                    'headers',
                    `Header ${header} must be managed as a server-side secret.`,
                ),
            );
        }
    }

    const sampleSize = new TextEncoder().encode(
        JSON.stringify(config.sampleResponse ?? null),
    ).length;
    if (sampleSize > MAX_SAMPLE_BYTES)
        issues.push(
            issue(
                'sampleResponse',
                'Sample payload is too large for preview storage.',
            ),
        );

    return issues.length > 0 ? err(issues) : ok(config);
}

export function buildSafePreviewUrl(config: CustomApiSourceConfigInput) {
    const url = new URL(config.endpoint, config.baseUrl);
    for (const [key, value] of Object.entries(config.queryParams))
        url.searchParams.set(key, value);
    return url.toString();
}
