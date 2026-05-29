import { z } from 'zod';

export const viewFileCategorySchema = z.enum([
    'document',
    'image',
    'code',
    'data',
    'media',
    'canvas',
    'unknown',
]);

export const viewRenderStrategySchema = z.enum([
    'pdf_canvas',
    'markdown_html',
    'plain_text',
    'code_block',
    'image',
    'svg_sandbox',
    'csv_table',
    'json_tree',
    'yaml_text',
    'media_placeholder',
    'canvas_layers',
    'unsupported',
]);

export type ViewFileCategory = z.infer<typeof viewFileCategorySchema>;
export type ViewRenderStrategy = z.infer<typeof viewRenderStrategySchema>;
