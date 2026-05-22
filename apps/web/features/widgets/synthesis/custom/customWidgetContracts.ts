import type {
    CustomApiSourceConfig,
    SynthesizedDataSourceDef,
    SynthesizedWidgetDefinition,
} from '@/features/widgets/synthesis/widgetDefinitionSchema';

export function customApiConfigToDataSource(
    config: CustomApiSourceConfig,
): SynthesizedDataSourceDef {
    return {
        id: `custom.api.${
            config.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || 'source'
        }`,
        type: 'api',
        label: config.name,
        schema: config.responseSchema,
        transformations: [
            'pick_fields',
            'rename_fields',
            'filter_rows',
            'normalize_records',
        ],
        config: config as unknown as Record<string, unknown>,
    };
}

export function attachCustomApiSource(
    definition: SynthesizedWidgetDefinition,
    config: CustomApiSourceConfig,
): SynthesizedWidgetDefinition {
    const dataSource = customApiConfigToDataSource(config);
    return {
        ...definition,
        dataSources: [
            ...definition.dataSources.filter(
                (source) => source.id !== dataSource.id,
            ),
            dataSource,
        ],
        metadata: {
            ...definition.metadata,
            tags: [...new Set([...definition.metadata.tags, 'custom-api'])],
        },
    };
}
