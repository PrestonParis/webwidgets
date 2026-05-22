import type { WidgetTransformationType } from './widgetDefinitionSchema';

export interface TransformationRegistryEntry {
    id: WidgetTransformationType;
    label: string;
    description: string;
    inputShape: string;
    outputShape: string;
    configSchema: Record<string, string>;
    safe: boolean;
    example: string;
    compatibleComponents: string[];
    complexity: 'simple' | 'moderate' | 'advanced';
    previewSupport: boolean;
}

function tr(
    id: WidgetTransformationType,
    label: string,
    desc: string,
    input: string,
    output: string,
    schema: Record<string, string>,
    example: string,
    components: string[] = ['list', 'data-table'],
    complexity: TransformationRegistryEntry['complexity'] = 'simple',
): TransformationRegistryEntry {
    return {
        id,
        label,
        description: desc,
        inputShape: input,
        outputShape: output,
        configSchema: schema,
        safe: true,
        example,
        compatibleComponents: components,
        complexity,
        previewSupport: complexity !== 'advanced',
    };
}

export const TRANSFORMATION_REGISTRY: TransformationRegistryEntry[] = [
    tr(
        'pick_fields',
        'Pick Fields',
        'Select only the fields you need from each row',
        'object[]',
        'object[]',
        { fields: 'string[]' },
        'Keep only [date, amount] from transactions',
    ),
    tr(
        'rename_fields',
        'Rename Fields',
        'Give fields more readable names',
        'object[]',
        'object[]',
        { from: 'string', to: 'string' },
        'Rename occurredOn → date',
    ),
    tr(
        'filter_rows',
        'Filter Rows',
        'Include only rows that match a condition',
        'object[]',
        'object[]',
        {
            field: 'string',
            operator: 'eq|gt|lt|contains|exists',
            value: 'string',
        },
        'Keep rows where type = expense',
    ),
    tr(
        'sort_rows',
        'Sort Rows',
        'Order rows by a field ascending or descending',
        'object[]',
        'object[]',
        { field: 'string', direction: 'asc|desc' },
        'Sort by date descending',
    ),
    tr(
        'group_by_time',
        'Group by Time',
        'Bucket rows into day, week, or month groups',
        'object[]',
        'object[]',
        {
            dateField: 'string',
            unit: 'day|week|month|year',
            aggregation: 'sum|avg|count|min|max',
        },
        'Monthly sum of transaction amounts',
    ),
    tr(
        'aggregate',
        'Aggregate',
        'Compute sum, average, count, min, or max',
        'object[]',
        'scalar',
        { field: 'string', fn: 'sum|avg|count|min|max' },
        'Total balance across all accounts',
    ),
    tr(
        'convert_dates',
        'Format Dates',
        'Convert ISO strings to display-friendly date formats',
        'object[]',
        'object[]',
        { field: 'string', format: 'relative|short|long|iso' },
        'Format date as "Jan 15, 2025"',
    ),
    tr(
        'convert_currency',
        'Convert Currency',
        'Normalize amounts to a target currency',
        'object[]',
        'object[]',
        { amountField: 'string', targetCurrency: 'string' },
        'Convert all balances to USD',
    ),
    tr(
        'calc_derived',
        'Calculate Derived Field',
        'Compute a new field from existing fields',
        'object[]',
        'object[]',
        {
            outputField: 'string',
            expression: 'sum|diff|ratio|percent',
            inputFields: 'string[]',
        },
        'Calculate savings rate from income and expenses',
    ),
    tr(
        'map_to_categories',
        'Map to Categories',
        'Assign rows to named buckets based on field values',
        'object[]',
        'object[]',
        { field: 'string', map: 'Record<string,string>', fallback: 'string' },
        'Map transaction categories to display labels',
    ),
    tr(
        'join_sources',
        'Join Sources',
        'Join rows from two data sources on a shared key',
        'object[][]',
        'object[]',
        { leftKey: 'string', rightKey: 'string', strategy: 'inner|left' },
        'Join invoices to customers',
        ['data-table'],
        'moderate',
    ),
    tr(
        'normalize_records',
        'Normalize Records',
        'Normalize external records into a stable widget shape',
        'unknown[]',
        'object[]',
        { fields: 'Record<string,string>' },
        'Map API fields to display rows',
        ['data-table', 'list'],
        'moderate',
    ),
    tr(
        'deduplicate',
        'Deduplicate',
        'Remove duplicate records by key or fingerprint',
        'object[]',
        'object[]',
        { key: 'string' },
        'Deduplicate news articles by URL',
        ['feed', 'list'],
    ),
    tr(
        'rank',
        'Rank',
        'Sort and score records by weighted signals',
        'object[]',
        'object[]',
        { signals: 'string[]' },
        'Rank follow-up emails by urgency',
        ['feed', 'list', 'data-table'],
        'moderate',
    ),
    tr(
        'score',
        'Score',
        'Compute a numeric health, risk, or priority score',
        'object[]',
        'object[]',
        { outputField: 'string', factors: 'string[]' },
        'Score subscription risk',
        ['metric-card', 'alert-card'],
        'moderate',
    ),
    tr(
        'bucket',
        'Bucket',
        'Bucket values into named ranges',
        'object[]',
        'object[]',
        { field: 'string', buckets: 'Record<string,number>' },
        'Bucket invoice aging',
        ['bar-chart', 'data-table'],
    ),
    tr(
        'time_window',
        'Time Window',
        'Restrict data to a rolling time window',
        'object[]',
        'object[]',
        { dateField: 'string', window: 'day|week|month|quarter|year' },
        'Last 30 days of transactions',
        ['line-chart', 'feed'],
    ),
    tr(
        'rolling_average',
        'Rolling Average',
        'Compute rolling average over time series values',
        'timeseries',
        'timeseries',
        { field: 'string', windowSize: 'number' },
        '7-day rolling mood average',
        ['line-chart'],
        'moderate',
    ),
    tr(
        'threshold_detection',
        'Threshold Detection',
        'Flag values crossing configured thresholds',
        'object[]',
        'object[]',
        { field: 'string', operator: 'gt|lt', value: 'number' },
        'Flag portfolio drawdown > 10%',
        ['alert-card', 'badge'],
    ),
    tr(
        'anomaly_placeholder',
        'Anomaly Detection',
        'Placeholder for future anomaly model output',
        'object[]',
        'object[]',
        { sensitivity: 'low|medium|high' },
        'Detect unusual spending',
        ['alert-card', 'feed'],
        'advanced',
    ),
    tr(
        'correlation_placeholder',
        'Correlation',
        'Placeholder for relationship analysis between metrics',
        'object[][]',
        'object',
        { leftMetric: 'string', rightMetric: 'string' },
        'Habit and energy correlation',
        ['scatter-chart', 'insight-card'],
        'advanced',
    ),
    tr(
        'entity_extraction_placeholder',
        'Entity Extraction',
        'Placeholder for extracting entities from text',
        'object[]',
        'object[]',
        { textField: 'string' },
        'Extract people and organizations from news',
        ['entity-card', 'feed'],
        'advanced',
    ),
    tr(
        'summarization_placeholder',
        'Summarization',
        'Placeholder for AI summary generation',
        'object[]',
        'object',
        { textField: 'string', mode: 'brief|detailed' },
        'Summarize research queue',
        ['markdown-block', 'insight-card'],
        'advanced',
    ),
    tr(
        'format_percentage',
        'Format Percentage',
        'Format numeric ratios as percentages',
        'object[]',
        'object[]',
        { field: 'string' },
        'Format completion rate',
        ['metric-card', 'progress-bar'],
    ),
    tr(
        'merge_timelines',
        'Merge Timelines',
        'Merge heterogeneous dated records into a single timeline',
        'object[][]',
        'object[]',
        { dateFields: 'string[]' },
        'Political event timeline',
        ['timeline-chart', 'feed'],
        'moderate',
    ),
];

export function getTransformation(
    id: WidgetTransformationType,
): TransformationRegistryEntry | undefined {
    return TRANSFORMATION_REGISTRY.find((t) => t.id === id);
}

export function getTransformationsForShape(
    inputShape: string,
): TransformationRegistryEntry[] {
    return TRANSFORMATION_REGISTRY.filter(
        (t) => t.inputShape === inputShape || t.inputShape === 'any',
    );
}

export function validateTransformationConfig(
    id: WidgetTransformationType,
    config: Record<string, unknown>,
): string[] {
    const entry = getTransformation(id);
    if (!entry) return [`Unknown transformation: ${id}`];
    const missing: string[] = [];
    for (const key of Object.keys(entry.configSchema)) {
        if (!(key in config))
            missing.push(`Missing required config field: ${key}`);
    }
    return missing;
}
