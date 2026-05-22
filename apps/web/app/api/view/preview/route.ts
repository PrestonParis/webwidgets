import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizedViewDocumentSchema } from '@/features/view/schemas/viewSchemas';
import { analyzeViewDocument } from '@/features/view/analyzers/viewAnalyzer';

const bodySchema = z.object({ document: normalizedViewDocumentSchema });

export async function POST(request: Request) {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success)
        return NextResponse.json(
            { error: 'Invalid document' },
            { status: 400 },
        );
    return NextResponse.json({ analysis: analyzeViewDocument(parsed.data.document) });
}
