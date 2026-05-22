import type { ViewTransform } from '@/features/view/schemas/viewSchemas';

export const VIEW_TRANSFORMS: ViewTransform[] = [
    {
        id: 'extract-text',
        label: 'Extract Text',
        kind: 'extract',
        inputStrategies: [
            'pdf_canvas',
            'markdown_html',
            'plain_text',
            'code_block',
        ],
        outputFormat: 'txt',
        safe: true,
    },
    {
        id: 'snapshot-image',
        label: 'Create Snapshot',
        kind: 'snapshot',
        inputStrategies: [
            'pdf_canvas',
            'image',
            'svg_sandbox',
            'canvas_layers',
        ],
        outputFormat: 'png',
        safe: true,
    },
    {
        id: 'sanitize-rich-text',
        label: 'Sanitize Rich Text',
        kind: 'sanitize',
        inputStrategies: ['markdown_html', 'svg_sandbox'],
        outputFormat: 'html',
        safe: true,
    },
    {
        id: 'summarize-draft',
        label: 'AI Summary Draft',
        kind: 'summarize',
        inputStrategies: [
            'pdf_canvas',
            'markdown_html',
            'plain_text',
            'json_tree',
        ],
        outputFormat: 'markdown',
        safe: true,
    },
    {
        id: 'annotate-highlight',
        label: 'Add Highlight',
        kind: 'annotate',
        inputStrategies: [
            'pdf_canvas',
            'markdown_html',
            'plain_text',
            'code_block',
        ],
        outputFormat: 'annotation',
        safe: true,
    },
];

export function getTransformsForStrategy(
    strategy: ViewTransform['inputStrategies'][number],
) {
    return VIEW_TRANSFORMS.filter((transform) =>
        transform.inputStrategies.includes(strategy),
    );
}
