import type {
    ViewExportRequest,
    NormalizedViewDocument,
} from '@/features/view/schemas/viewSchemas';

export interface ViewExportPlan {
    request: ViewExportRequest;
    label: string;
    safe: boolean;
    actionId?: string;
    warnings: string[];
}

export function planViewExport(
    document: NormalizedViewDocument,
    request: ViewExportRequest,
): ViewExportPlan {
    const warnings: string[] = [];
    if (request.destination !== 'download')
        warnings.push(
            `${request.destination} export is queued through the action engine.`,
        );
    if (request.format === 'pdf' && document.strategy !== 'pdf_canvas')
        warnings.push(
            'PDF export will use a generated document pipeline in a future iteration.',
        );
    const safe =
        request.destination === 'download' ||
        request.destination === 'notes' ||
        request.destination === 'research_vault';
    return {
        request,
        label: `${document.file.name} -> ${request.format}`,
        safe,
        ...(request.destination !== 'download' && { actionId: 'workflow.trigger' }),
        warnings,
    };
}
