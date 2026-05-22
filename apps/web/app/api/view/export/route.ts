import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    normalizedViewDocumentSchema,
    viewExportRequestSchema,
} from '@/features/view/schemas/viewSchemas';
import { planViewExport } from '@/features/view/exporters/exportRegistry';

const bodySchema = z.object({
    document: normalizedViewDocumentSchema,
    request: viewExportRequestSchema,
});

export async function POST(request: Request) {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success)
        return NextResponse.json(
            { error: 'Invalid export request' },
            { status: 400 },
        );
    return NextResponse.json({
        exportPlan: planViewExport(parsed.data.document, parsed.data.request),
    });
}
