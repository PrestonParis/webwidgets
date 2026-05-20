import type {
    NormalizedViewDocument,
    ViewLayer,
} from '@/features/view/schemas/viewSchemas';
import type { ViewAnalysisResult } from '@/features/view/types/view';

const ENTITY_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
const DATE_PATTERN =
    /\b(?:\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/g;

export function analyzeViewDocument(
    document: NormalizedViewDocument,
): ViewAnalysisResult {
    const text = document.searchableText;
    const entities = [...new Set(text.match(ENTITY_PATTERN) ?? [])].slice(
        0,
        20,
    );
    const timelines = [...text.matchAll(DATE_PATTERN)]
        .slice(0, 12)
        .map((match) => ({
            label: match[0],
            date: new Date(match[0]).toISOString(),
        }))
        .filter((item) => item.date !== 'Invalid Date');
    const overlays: ViewLayer[] = [
        {
            id: 'analysis-entities',
            type: 'analysis',
            name: 'Detected entities',
            visible: true,
            locked: true,
            opacity: 0.9,
            zIndex: 20,
            objects: entities.map((entity, index) => ({ entity, index })),
        },
    ];

    return {
        fileId: document.file.id,
        entities,
        stats: {
            characters: text.length,
            words: text.trim() ? text.trim().split(/\s+/).length : 0,
            annotations: 0,
            metadataKeys: Object.keys(document.metadata).length,
        },
        timelines,
        warnings: document.security.warnings,
        overlays,
    };
}
