import { err, ok, type Result } from 'neverthrow';
import type {
    SynthesizedWidgetDefinition,
    WidgetPreviewState,
    WidgetValidationIssue,
} from '@/features/widgets/synthesis/widgetDefinitionSchema';
import { assembleDraftWidget } from '@/features/widgets/synthesis/widgetAssemblyEngine';
import { getComponent } from '@/features/widgets/synthesis/componentRegistry';
import { getDataSource } from '@/features/widgets/synthesis/dataSourceRegistry';

function issue(
    field: string,
    message: string,
    severity: WidgetValidationIssue['severity'],
): WidgetValidationIssue {
    return { field, message, severity };
}

function sampleValue(type: string, field: string) {
    if (type === 'number')
        return field.toLowerCase().includes('amount') ? 1240 : 72;
    if (type === 'boolean') return true;
    if (type === 'string[]') return ['sample', 'preview'];
    if (
        field.toLowerCase().includes('date') ||
        field.toLowerCase().includes('at')
    )
        return new Date().toISOString();
    return `Sample ${field}`;
}

export function generateWidgetPreview(
    definition: SynthesizedWidgetDefinition,
): Result<WidgetPreviewState, WidgetValidationIssue[]> {
    const assembled = assembleDraftWidget(definition);
    const errors = assembled.issues.filter((item) => item.severity === 'error');
    if (errors.length > 0) return err(errors);

    const sampleData: Record<string, unknown> = {};
    for (const source of definition.dataSources) {
        const registrySource = getDataSource(source.id);
        const schema = registrySource?.schema ?? source.schema;
        sampleData[source.id] = [
            Object.fromEntries(
                Object.entries(schema).map(([field, type]) => [
                    field,
                    sampleValue(type, field),
                ]),
            ),
        ];
    }

    const layoutWarnings = definition.components.flatMap((component) => {
        const registryComponent = getComponent(component.registryId);
        return registryComponent
            ? []
            : [
                  issue(
                      'components',
                      `Cannot preview unknown component ${component.registryId}`,
                      'warning',
                  ),
              ];
    });

    return ok({
        mode: 'compact',
        sampleData,
        resolvedComponents: definition.components.map(
            (component) =>
                getComponent(component.registryId)?.name ??
                component.registryId,
        ),
        permissionSummary: [
            ...definition.permissions.map((permission) => permission.reason),
            ...layoutWarnings.map((warning) => warning.message),
        ],
    });
}
