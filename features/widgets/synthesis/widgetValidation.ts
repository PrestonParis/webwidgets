import type {
    SynthesizedWidgetDefinition,
    WidgetValidationIssue,
    SynthesizedDataSourceDef,
    SynthesizedComponentDef,
    SynthesizedPermissionDef,
} from './widgetDefinitionSchema';
import { getDataSource } from './dataSourceRegistry';
import { getComponent } from './componentRegistry';
import { getAction } from './actionRegistry';
import { validateTransformationConfig } from './transformationRegistry';
import { validateCustomApiSource } from '@/features/widgets/synthesis/security/customWidgetSecurity';

const BLOCKED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'internal',
    'metadata.google',
];
const ALLOWED_API_METHODS = ['GET', 'POST'];
const MAX_AUTOMATIONS = 10;
const MAX_COMPONENTS = 20;

function issue(
    field: string,
    message: string,
    severity: WidgetValidationIssue['severity'],
): WidgetValidationIssue {
    return { field, message, severity };
}

export function validateIdentity(
    def: Partial<SynthesizedWidgetDefinition>,
): WidgetValidationIssue[] {
    const issues: WidgetValidationIssue[] = [];
    if (!def.name?.trim())
        issues.push(issue('name', 'Widget name is required', 'error'));
    else if (def.name.length > 60)
        issues.push(
            issue(
                'name',
                'Widget name must be 60 characters or fewer',
                'error',
            ),
        );
    if (!def.purpose)
        issues.push(issue('purpose', 'Widget purpose is required', 'error'));
    if (!def.category?.trim())
        issues.push(
            issue('category', 'Widget category is required', 'warning'),
        );
    return issues;
}

export function validateDataSources(
    sources: SynthesizedDataSourceDef[] | undefined,
): WidgetValidationIssue[] {
    if (!sources || sources.length === 0)
        return [
            issue(
                'dataSources',
                'At least one data source is recommended',
                'warning',
            ),
        ];
    const issues: WidgetValidationIssue[] = [];
    for (const src of sources) {
        const registered = getDataSource(src.id);
        if (
            !registered &&
            src.id !== 'api.custom' &&
            src.id !== 'manual.input'
        ) {
            issues.push(
                issue('dataSources', `Unknown data source: ${src.id}`, 'error'),
            );
        }
        if (src.type === 'api' && src.config) {
            const apiIssues = validateApiConfig(src.config);
            issues.push(...apiIssues);
            const safeConfig = validateCustomApiSource(src.config);
            if (safeConfig.isErr()) issues.push(...safeConfig.error);
        }
    }
    return issues;
}

export function validateApiConfig(
    config: Record<string, unknown>,
): WidgetValidationIssue[] {
    const issues: WidgetValidationIssue[] = [];
    const url = config['url'];
    const method = config['method'];

    if (typeof url !== 'string' || !url.trim()) {
        issues.push(
            issue('dataSources.api.url', 'API URL is required', 'error'),
        );
    } else {
        try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'https:')
                issues.push(
                    issue(
                        'dataSources.api.url',
                        'API URL must use HTTPS',
                        'error',
                    ),
                );
            for (const blocked of BLOCKED_DOMAINS) {
                if (parsed.hostname.includes(blocked)) {
                    issues.push(
                        issue(
                            'dataSources.api.url',
                            `URL targets blocked domain: ${blocked}`,
                            'error',
                        ),
                    );
                }
            }
        } catch {
            issues.push(
                issue(
                    'dataSources.api.url',
                    'API URL is not a valid URL',
                    'error',
                ),
            );
        }
    }

    if (
        typeof method === 'string' &&
        !ALLOWED_API_METHODS.includes(method.toUpperCase())
    ) {
        issues.push(
            issue(
                'dataSources.api.method',
                `HTTP method ${method} is not allowed`,
                'error',
            ),
        );
    }

    return issues;
}

export function validateComponents(
    components: SynthesizedComponentDef[] | undefined,
): WidgetValidationIssue[] {
    if (!components || components.length === 0)
        return [
            issue(
                'components',
                'At least one UI component is required',
                'error',
            ),
        ];
    if (components.length > MAX_COMPONENTS)
        return [
            issue(
                'components',
                `Maximum ${MAX_COMPONENTS} components allowed`,
                'error',
            ),
        ];
    const issues: WidgetValidationIssue[] = [];
    for (const comp of components) {
        const registered = getComponent(comp.registryId);
        if (!registered) {
            issues.push(
                issue(
                    'components',
                    `Unknown component: ${comp.registryId}`,
                    'error',
                ),
            );
            continue;
        }
        for (const req of registered.requiredProps) {
            if (!(req in comp.props)) {
                issues.push(
                    issue(
                        'components',
                        `Component ${comp.registryId} missing required prop: ${req}`,
                        'warning',
                    ),
                );
            }
        }
    }
    return issues;
}

export function validateActions(
    actions: SynthesizedWidgetDefinition['actions'] | undefined,
): WidgetValidationIssue[] {
    const issues: WidgetValidationIssue[] = [];
    for (const action of actions ?? []) {
        const registered = getAction(action.registryId);
        if (!registered)
            issues.push(
                issue(
                    'actions',
                    `Unknown action: ${action.registryId}`,
                    'error',
                ),
            );
        else if (!registered.safe)
            issues.push(
                issue(
                    'actions',
                    `Action ${registered.label} requires explicit user confirmation`,
                    'warning',
                ),
            );
    }
    return issues;
}

export function validateAutomations(
    automations: SynthesizedWidgetDefinition['automations'] | undefined,
): WidgetValidationIssue[] {
    if (!automations) return [];
    const issues: WidgetValidationIssue[] = [];
    if (automations.length > MAX_AUTOMATIONS)
        issues.push(
            issue(
                'automations',
                `Maximum ${MAX_AUTOMATIONS} automations allowed`,
                'error',
            ),
        );
    return issues;
}

export function validateTransformations(
    def: Partial<SynthesizedWidgetDefinition>,
): WidgetValidationIssue[] {
    const issues: WidgetValidationIssue[] = [];
    for (const tx of def.transformations ?? []) {
        const errors = validateTransformationConfig(tx.type, tx.config);
        for (const msg of errors)
            issues.push(issue('transformations', msg, 'error'));
    }
    return issues;
}

export function validatePermissions(
    permissions: SynthesizedPermissionDef[] | undefined,
): WidgetValidationIssue[] {
    if (!permissions || permissions.length === 0) return [];
    const issues: WidgetValidationIssue[] = [];
    const required = permissions.filter((p) => p.required);
    if (required.length > 0 && required.some((p) => !p.reason?.trim())) {
        issues.push(
            issue(
                'permissions',
                'All required permissions must include a reason',
                'warning',
            ),
        );
    }
    return issues;
}

export function validateWidgetDefinition(
    def: Partial<SynthesizedWidgetDefinition>,
): WidgetValidationIssue[] {
    return [
        ...validateIdentity(def),
        ...validateDataSources(def.dataSources),
        ...validateComponents(def.components),
        ...validateActions(def.actions),
        ...validateAutomations(def.automations),
        ...validateTransformations(def),
        ...validatePermissions(def.permissions),
    ];
}

export function hasErrors(issues: WidgetValidationIssue[]): boolean {
    return issues.some((i) => i.severity === 'error');
}
