import type { ViewParseInput } from '@/features/view/types/view';
import { normalizedDocument } from '@/features/view/parsers/parserUtils';

function schemaOf(value: unknown): unknown {
    if (Array.isArray(value))
        return {
            type: 'array',
            items: value[0] ? schemaOf(value[0]) : 'unknown',
        };
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, schemaOf(item)]),
        );
    }
    return typeof value;
}

export async function parseJsonFile(input: ViewParseInput) {
    const text = input.text ?? '{}';
    const parsed = JSON.parse(text) as unknown;

    return normalizedDocument({
        file: input.file,
        strategy: 'json_tree',
        searchableText: text,
        renderable: { value: parsed, schema: schemaOf(parsed) },
        metadata: { rootType: Array.isArray(parsed) ? 'array' : typeof parsed },
        analysisHints: ['schema-extraction', 'source-inspection'],
        sanitized: true,
    });
}
